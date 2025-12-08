import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  Share,
  Text,
  TextInput,
  useWindowDimensions,
  View
} from 'react-native';

// --- Types defined based on your Backend API ---

type Product = {
  id: string; // Acts as Item Code/ID
  qty: number;
};

// 1. Existing Request Body (for Generate Bill)
type ApiRequest = {
  paymentMethod: string;
  items: {
    barcode: string;
    quantity: number;
  }[];
};

// 2. NEW Request Body (for Create Invoice / WhatsApp)
type InvoiceRequest = {
  customerName: string;
  phoneNumber: string;
  items: {
    name: string;
    quantity: number;
    unitPrice: number;
    discountAmount: number;
    gstPercent: number;
  }[];
};

// Response Body from API
type ApiItem = {
  itemName: string;
  hsnCode: string;
  quantity: number;
  unitPrice: number;
  discountAmount: number;
  priceAfterDiscount: number;
  gstPercent: number;
  gstAmount: number;
  lineTotal: number;
};

type ApiResponse = {
  billNumber: string;
  billTime: string;
  paymentMethod: string;
  subtotalAmount: number;
  totalDiscount: number;
  totalGst: number;
  grandTotal: number;
  items: ApiItem[];
};

// --- Helper Functions ---

const emptyProduct = (id: string): Product => ({
  id,
  qty: 1,
});

/**
 * Generates the receipt string matching the Image Template exactly.
 * Width: 42 Characters (Standard Thermal)
 */
const generateThermalReceipt = (data: ApiResponse): string => {
  const width = 42; 
  const line = '-'.repeat(width);
   
  const padLeft = (str: string, len: number) => {
    return (' '.repeat(len) + str).slice(-len);
  };

  const padRight = (str: string, len: number) => {
    return (str + ' '.repeat(len)).slice(0, len);
  };
   
  let txt = '';
  
  // 1. HEADER
  txt += `Bill No : ${data.billNumber}\n`;
  txt += `Date    : ${data.billTime}\n`;
  txt += `Payment : ${data.paymentMethod}\n`;
  txt += `${line}\n`;
   
  // 2. TABLE HEADERS
  txt += `Item                  Qty    Rate   Amount\n`;
  txt += `${line}\n`;

  // 3. ITEMS
  data.items.forEach((item) => {
    const name = item.itemName;
    const nameWidth = 19; 
    
    let printName = name;
    let remainderName = "";
    
    if (name.length > nameWidth) {
      printName = name.substring(0, nameWidth); 
      remainderName = name.substring(nameWidth);
    }

    const qtyStr = padLeft(item.quantity.toString(), 4);
    const rateStr = padLeft(item.unitPrice.toFixed(2), 8); 
    const amtStr = padLeft(item.lineTotal.toFixed(2), 9);  
    
    txt += `${padRight(printName, nameWidth)} ${qtyStr} ${rateStr} ${amtStr}\n`;
    
    if (remainderName) {
      txt += `${remainderName}\n`;
    }

    const hsn = `HSN: ${item.hsnCode}`;
    const gstPct = `GST @ ${item.gstPercent} %`;
    const gstAmt = `GST: ${item.gstAmount.toFixed(2)}`;
    
    txt += `${hsn}   ${gstPct}   ${gstAmt}\n`;
  });

  // 4. FOOTER / TOTALS
  txt += `${line}\n`;
  txt += `${padRight("Subtotal", 20)}${padLeft(data.subtotalAmount.toFixed(2), 22)}\n`;
  
  if (data.totalDiscount > 0) {
    txt += `${padRight("Discount", 20)}${padLeft(data.totalDiscount.toFixed(2), 22)}\n`;
  }
  
  txt += `${padRight("GST Total", 20)}${padLeft(data.totalGst.toFixed(2), 22)}\n`;
  txt += `${line}\n`;
  txt += `${padRight("Grand Total", 20)}${padLeft(data.grandTotal.toFixed(2), 22)}\n`;
   
  return txt;
};


// --- Main Component ---

const Ss: React.FC = () => {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 800; 

  // App State
  const [products, setProducts] = useState<Product[]>([emptyProduct('')]);
  const [isLoading, setIsLoading] = useState(false);

  // Bill & Receipt State
  const [receiptData, setReceiptData] = useState<ApiResponse | null>(null);
  const [receiptText, setReceiptText] = useState<string>('');
  const [showReceiptModal, setShowReceiptModal] = useState(false);

  // --- NEW: Invoice / WhatsApp State ---
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [invoiceLoading, setInvoiceLoading] = useState(false);
  const [customerName, setCustomerName] = useState("Ramya"); // Default based on prompt
  const [phoneNumber, setPhoneNumber] = useState("916302068029"); // Default based on prompt

  // --- Logic Helpers ---

  const updateProduct = (id: string, patch: Partial<Product>) => {
    setProducts((list) => list.map((p) => (p.id === id ? { ...p, ...patch } : p)));
  };

  const addProduct = () => {
    setProducts((list) => [emptyProduct(String(Date.now())), ...list]);
  };

  const removeProduct = (id: string) => {
    setProducts((list) => list.filter((p) => p.id !== id));
  };

  // --- API 1: GENERATE BILL (Existing) ---

  const handleGenerateBill = async () => {
    const validItems = products.filter(p => p.id && p.id.trim() !== '' && p.qty > 0);
    
    if (validItems.length === 0) {
      Alert.alert("Error", "Please add items with valid IDs before generating a bill.");
      return;
    }

    setIsLoading(true);

    const payload: ApiRequest = {
      paymentMethod: "CASH", 
      items: validItems.map(p => ({
        barcode: p.id, 
        quantity: p.qty
      }))
    };

    try {
      const response = await fetch('http://192.168.0.232:8080/api/billing/create-bill/print', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Server Error: ${response.status} - ${errText}`);
      }

      const contentType = response.headers.get('content-type') || '';

      if (contentType.includes('application/json')) {
        const data: ApiResponse = await response.json();
        const textFormatted = generateThermalReceipt(data);
        setReceiptData(data);
        setReceiptText(textFormatted);
        setShowReceiptModal(true);
        setProducts([emptyProduct(String(Date.now()))]);
      } else {
        const text = await response.text();
        try {
          const maybeJson = JSON.parse(text);
          if (maybeJson && maybeJson.items) {
            const data: ApiResponse = maybeJson;
            const textFormatted = generateThermalReceipt(data);
            setReceiptData(data);
            setReceiptText(textFormatted);
          } else {
            setReceiptData(null);
            setReceiptText(String(text));
          }
        } catch {
          setReceiptData(null);
          setReceiptText(text);
        }
        setShowReceiptModal(true);
        setProducts([emptyProduct(String(Date.now()))]);
      }
    } catch (error: any) {
      console.error(error);
      Alert.alert("Billing Failed", error.message || "Could not connect to backend.");
    } finally {
      setIsLoading(false);
    }
  };

  // --- API 2: CREATE INVOICE (New Feature) ---

  const handleCreateInvoiceClick = () => {
    const validItems = products.filter(p => p.id && p.id.trim() !== '' && p.qty > 0);
    if (validItems.length === 0) {
      Alert.alert("Error", "Please add items before creating an invoice.");
      return;
    }
    setShowInvoiceModal(true);
  };

  const handleSubmitInvoice = async () => {
    if (!customerName || !phoneNumber) {
        Alert.alert("Required", "Please fill in Name and Phone Number.");
        return;
    }

    setInvoiceLoading(true);
    
    // 1. Prepare Payload based on the requested JSON structure
    // We map the existing 'products' list to the 'items' structure.
    // NOTE: Since existing products only have ID/Qty, we use defaults for Price/GST 
    // or assume the backend handles lookup based on the Name field.
    const validItems = products.filter(p => p.id && p.qty > 0);
    
    const payload: InvoiceRequest = {
        customerName: customerName,
        phoneNumber: phoneNumber,
        items: validItems.map(p => ({
            name: p.id, // Using the Input ID as the Name
            quantity: p.qty,
            unitPrice: 0, // Defaulting to 0 as frontend doesn't have price yet
            discountAmount: 0,
            gstPercent: 0 // Default
        }))
    };

    try {
        const response = await fetch('http://192.168.0.232:8080/api/billing/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        // The prompt says we want a specific success message regardless of raw response text
        // assuming status 200 is success.
        if (response.ok) {
            setShowInvoiceModal(false);
            Alert.alert("Success", "The Invoice was send to the given Whatsup Number");
            // Optional: clear form
            setProducts([emptyProduct(String(Date.now()))]);
        } else {
            const err = await response.text();
            Alert.alert("Failed", "Server Error: " + err);
        }

    } catch (error: any) {
        console.error(error);
        Alert.alert("Error", error.message || "Connection failed");
    } finally {
        setInvoiceLoading(false);
    }
  };

  const handlePrintOrShare = async () => {
    if (!receiptText) return;
    try {
        await Share.share({
            message: receiptText,
            title: `Bill-${receiptData?.billNumber}`
        });
    } catch (e) {
        console.log(e);
    }
  };

  // --- Render Components ---

  const ProductRow: React.FC<{ p: Product; index: number }> = ({ p, index }) => {
    return (
      <View 
        key={p.id + index}
        className="bg-white rounded-lg p-4 mb-3 border border-gray-200 shadow-sm flex-row flex-wrap items-center"
      >
        <View className="mr-3 hidden md:flex">
             <Text className="text-gray-400 font-bold">#{index + 1}</Text>
        </View>

        <View className="flex-1 min-w-[150px] mr-4">
          <Text className="text-xs text-gray-500 font-medium mb-1 uppercase tracking-wider">Item ID / Barcode</Text>
          <TextInput
            value={p.id}
            onChangeText={(t) => updateProduct(p.id, { id: t })}
            className="bg-slate-50 border border-gray-300 px-3 py-2 rounded-md font-semibold text-gray-800"
            placeholder="Enter Item Code"
            placeholderTextColor="#94a3b8"
          />
        </View>

        <View className="w-32 mr-4">
            <Text className="text-xs text-gray-500 font-medium mb-1 uppercase tracking-wider">Qty</Text>
            <View className="flex-row items-center border border-gray-300 rounded-md bg-white overflow-hidden">
              <Pressable 
                onPress={() => updateProduct(p.id, { qty: Math.max(0, p.qty - 1) })}
                className="bg-gray-100 px-3 py-2 border-r border-gray-300 active:bg-gray-200"
              >
                <Text className="font-bold text-gray-600">-</Text>
              </Pressable>
              <TextInput
                value={String(p.qty)}
                onChangeText={(t) => updateProduct(p.id, { qty: Number(t) || 0 })}
                keyboardType="numeric"
                className="flex-1 text-center font-bold text-gray-800 py-1 w-2"
              />
              <Pressable 
                onPress={() => updateProduct(p.id, { qty: p.qty + 1 })}
                className="bg-gray-100 px-2 py-2 border-l border-gray-300 active:bg-gray-200"
              >
                <Text className="font-bold text-gray-600">+</Text>
              </Pressable>
            </View>
        </View>
        
        <View className="mt-5">
            <Pressable
                onPress={() => removeProduct(p.id)}
                className="p-2 bg-red-50 rounded-md border border-red-100 active:bg-red-100"
            >
                <Text className="text-red-600 text-xs font-bold px-2">REMOVE</Text>
            </Pressable>
        </View>
      </View>
    );
  };

  // --- Main Layout Render ---

  return (
    <SafeAreaView className="flex-1 bg-slate-100">
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        
        {/* Top Navbar */}
        <View className="bg-white px-6 py-4 border-b border-gray-200 flex-row justify-between items-center shadow-sm z-10">
            <View>
              <Text className="text-xl font-extrabold text-slate-800">🧾 QuickBill<Text className="text-indigo-600">POS</Text></Text>
              <Text className="text-xs text-gray-500 font-medium">Enterprise Billing Solution</Text>
            </View>
            <Pressable onPress={() => router.replace('/')} className="bg-gray-100 px-4 py-2 rounded-full border border-gray-200">
                <Text className="text-xs font-bold text-gray-600">EXIT</Text>
            </Pressable>
        </View>

        <View className={`flex-1 ${isDesktop ? 'flex-row' : 'flex-col'}`}>
            
            {/* LEFT COLUMN: Input Area */}
            <View className={`flex-1 p-4 ${isDesktop ? 'pr-2' : ''}`}>
                
                <View className="mb-4">
                      <Pressable
                        onPress={() => addProduct()}
                        className="w-full bg-slate-800 shadow-md shadow-gray-300 px-4 py-4 rounded-lg flex-row justify-center items-center active:bg-slate-900"
                      >
                        <Text className="text-white font-bold tracking-wide text-center">➕ ADD NEW ITEM ROW</Text>
                      </Pressable>
                </View>

                {isDesktop && (
                    <View className="flex-row px-4 mb-2">
                        <Text className="text-xs font-bold text-gray-400 w-[170px] mr-4">ITEM ID</Text>
                        <Text className="text-xs font-bold text-gray-400 w-32">QUANTITY</Text>
                    </View>
                )}

                <ScrollView 
                    contentContainerStyle={{ paddingBottom: 100 }} 
                    showsVerticalScrollIndicator={false}
                    className="flex-1"
                >
                    {products.length === 0 ? (
                        <View className="items-center justify-center py-20 opacity-50">
                            <Text className="text-4xl">🛒</Text>
                            <Text className="text-gray-500 mt-2 font-medium">No items added</Text>
                        </View>
                    ) : (
                        products.map((p, i) => <ProductRow p={p} index={i} key={p.id + '-' + i} />)
                    )}
                </ScrollView>
            </View>

            {/* RIGHT COLUMN / BOTTOM SUMMARY */}
            <View className={`
                ${isDesktop ? 'w-[350px] bg-white border-l border-gray-200 h-full' : 'absolute bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]'}
                z-20
            `}>
                <View className="p-6">
                    <Text className="text-lg font-bold text-slate-800 mb-4">Payment Summary</Text>
                    
                    <View className="space-y-3 mb-6">
                        <View className="flex-row justify-between">
                            <Text className="text-gray-500">Total Items</Text>
                            <Text className="font-bold text-slate-800">{products.reduce((acc, p) => acc + p.qty, 0)}</Text>
                        </View>
                        <View className="flex-row justify-between">
                            <Text className="text-gray-500">Payment Mode</Text>
                            <Text className="font-bold text-slate-800">CASH</Text>
                        </View>
                        <View className="h-[1px] bg-gray-100 my-2" />
                    </View>

                    {/* EXISTING BUTTON: GENERATE BILL */}
                    <Pressable
                        onPress={handleGenerateBill}
                        disabled={isLoading}
                        className={`w-full py-4 rounded-xl items-center shadow-lg mb-3 ${isLoading ? 'bg-slate-300 shadow-none' : 'bg-emerald-600 shadow-emerald-200 active:bg-emerald-700'}`}
                    >
                        {isLoading ? (
                            <ActivityIndicator color="white" />
                        ) : (
                            <Text className="text-white font-bold text-lg tracking-wider">GENERATE BILL</Text>
                        )}
                    </Pressable>

                    {/* NEW BUTTON: CREATE INVOICE */}
                    <Pressable
                        onPress={handleCreateInvoiceClick}
                        disabled={isLoading || invoiceLoading}
                        className="w-full py-4 rounded-xl items-center shadow-lg bg-indigo-600 shadow-indigo-200 active:bg-indigo-700"
                    >
                         <Text className="text-white font-bold text-lg tracking-wider">CREATE INVOICE</Text>
                    </Pressable>
                    
                    {!isDesktop && <View className="h-6" />} 
                </View>
            </View>

        </View>

        {/* ---------------- MODALS ---------------- */}

        {/* 1. Receipt Preview Modal (Existing) */}
        <Modal visible={showReceiptModal} animationType="fade" transparent>
            <View className="flex-1 bg-black/60 justify-center items-center p-4">
                <View className="bg-gray-100 w-full max-w-md rounded-lg overflow-hidden flex max-h-[85%]">
                    <View className="bg-slate-800 p-4 flex-row justify-between items-center">
                        <Text className="text-white font-bold text-lg">Bill Generated</Text>
                        <Pressable onPress={() => setShowReceiptModal(false)}>
                             <Text className="text-gray-400 font-bold">✕</Text>
                        </Pressable>
                    </View>
                    <View className="p-4 bg-gray-200 flex-1">
                        <ScrollView className="bg-white p-2">
                             <Text style={{ fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' }}>
                                 {receiptText}
                             </Text>
                        </ScrollView>
                    </View>
                    <View className="p-4 bg-white border-t border-gray-200 flex-row space-x-3">
                        <Pressable onPress={() => setShowReceiptModal(false)} className="flex-1 bg-white border border-gray-300 py-3 rounded-lg items-center">
                            <Text className="font-bold text-gray-700">Close</Text>
                        </Pressable>
                        <Pressable onPress={handlePrintOrShare} className="flex-1 bg-indigo-600 py-3 rounded-lg items-center">
                            <Text className="text-white font-bold">🖨️ Print / Share</Text>
                        </Pressable>
                    </View>
                </View>
            </View>
        </Modal>

        {/* 2. NEW: Invoice Form Modal */}
        <Modal visible={showInvoiceModal} animationType="slide" transparent>
            <View className="flex-1 bg-black/50 justify-end sm:justify-center items-center">
                <KeyboardAvoidingView 
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
                    className="w-full sm:w-[500px] bg-white rounded-t-2xl sm:rounded-xl overflow-hidden"
                >
                    {/* Header */}
                    <View className="bg-indigo-600 p-5 flex-row justify-between items-center">
                        <Text className="text-white text-xl font-bold">Create Invoice</Text>
                        <Pressable onPress={() => setShowInvoiceModal(false)}>
                             <Text className="text-white text-opacity-80 font-bold text-lg">✕</Text>
                        </Pressable>
                    </View>

                    {/* Form Body */}
                    <View className="p-6 space-y-4">
                        <Text className="text-gray-500 text-sm">
                            Enter customer details below. The invoice will be generated for the <Text className="font-bold text-black">{products.filter(p=>p.qty>0).length} items</Text> currently in your cart.
                        </Text>

                        {/* Customer Name */}
                        <View>
                            <Text className="text-slate-700 font-bold mb-2">Customer Name</Text>
                            <TextInput
                                value={customerName}
                                onChangeText={setCustomerName}
                                placeholder="e.g. Ramya"
                                className="border border-gray-300 rounded-lg p-3 bg-gray-50 text-gray-800"
                            />
                        </View>

                        {/* Phone Number */}
                        <View>
                            <Text className="text-slate-700 font-bold mb-2">WhatsApp Number</Text>
                            <TextInput
                                value={phoneNumber}
                                onChangeText={setPhoneNumber}
                                placeholder="e.g. 916302068029"
                                keyboardType="phone-pad"
                                className="border border-gray-300 rounded-lg p-3 bg-gray-50 text-gray-800"
                            />
                        </View>
                    </View>

                    {/* Footer Actions */}
                    <View className="p-6 border-t border-gray-100 bg-gray-50 flex-row gap-4">
                        <Pressable 
                            onPress={() => setShowInvoiceModal(false)}
                            className="flex-1 py-3 bg-white border border-gray-300 rounded-xl items-center"
                        >
                            <Text className="font-bold text-gray-600">Cancel</Text>
                        </Pressable>

                        <Pressable 
                            onPress={handleSubmitInvoice}
                            disabled={invoiceLoading}
                            className={`flex-1 py-3 rounded-xl items-center shadow-sm ${invoiceLoading ? 'bg-indigo-400' : 'bg-indigo-600 active:bg-indigo-700'}`}
                        >
                            {invoiceLoading ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <Text className="font-bold text-white">SEND INVOICE</Text>
                            )}
                        </Pressable>
                    </View>

                </KeyboardAvoidingView>
            </View>
        </Modal>

      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default Ss;