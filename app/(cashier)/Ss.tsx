import { Ionicons, MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { useRouter } from 'expo-router';
import { jwtDecode } from "jwt-decode";
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  Share,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { rootApi } from '../(utils)/axiosInstance';

// --- TYPES ---

type CartItem = {
  rowId: string; 
  id: string;    
  name: string;        
  barcode: string;
  price: number;       
  qty: number;
  gstPercent: number;  
  gstAmount: number;   
  discount: number;    
  total: number;       
};

type ScanResponse = {
  id?: number; 
  itemName: string;      
  hsnCode?: string;
  unitPrice: number;     
  gstPercent: number;
  discountAmount: number; // Mapping this field for discount
};

// --- HELPER FUNCTIONS ---

const generateReceiptText = (data: any): string => {
  let txt = `BILL NO: ${data.billNumber}\nDATE: ${data.billTime}\n--------------------------------\n`;
  data.items?.forEach((item: any) => {
    txt += `${item.itemName} x ${item.quantity}\n`;
    txt += `  Rate: ${item.unitPrice}  GST: ${item.gstPercent}%\n`;
    if(item.discountAmount > 0) txt += `  Disc: ${item.discountAmount}\n`;
    txt += `  Total: ${item.lineTotal}\n`;
  });
  txt += `--------------------------------\n`;
  txt += `GRAND TOTAL: ${data.grandTotal}\n`;
  return txt;
};

// --- SUB COMPONENTS ---

const POSInput = ({ 
  icon, 
  value, 
  onChange, 
  placeholder, 
  inputRef, 
  onSubmit, 
  autoFocus = false,
  keyboardType = 'default' 
}: any) => (
  <View className="flex-1 mb-0">
    <Text className="text-xs text-gray-500 font-bold mb-1.5 uppercase tracking-wider pl-1">
      {placeholder}
    </Text>
    <View className="flex-row items-center border border-gray-300 rounded-xl bg-gray-50 focus:border-blue-500 focus:bg-white h-12 overflow-hidden">
      <View className="pl-3 pr-2 border-r border-gray-200">
        <MaterialCommunityIcons name={icon} size={20} color="#6B7280" />
      </View>
      <TextInput
        ref={inputRef}
        value={value}
        onChangeText={onChange}
        onSubmitEditing={onSubmit}
        placeholder={placeholder}
        placeholderTextColor="#9CA3AF"
        autoFocus={autoFocus}
        keyboardType={keyboardType}
        className="flex-1 px-3 text-gray-800 text-base font-bold"
        style={Platform.OS === 'web' ? { outline: 'none' } : undefined} 
      />
      {value.length > (placeholder === "WhatsApp Number" ? 2 : 0) && (
         <TouchableOpacity onPress={() => onChange(placeholder === "WhatsApp Number" ? '91' : '')} className="pr-3">
           <Ionicons name="close-circle" size={18} color="#9CA3AF" />
         </TouchableOpacity>
      )}
    </View>
  </View>
);


// --- MAIN COMPONENT ---

const Ss: React.FC = () => {
  const router = useRouter();

  // --- STATE ---
  const [barcodeInput, setBarcodeInput] = useState('');
  const [cashierName, setCashierName] = useState('Cashier'); // Default Name
  
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);

  // Modals
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [receiptText, setReceiptText] = useState('');
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  
  // WhatsApp Input
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('91'); 

  // Refs
  const barcodeInputRef = useRef<TextInput>(null);

  // --- CALCULATIONS ---
  const totalQty = cart.reduce((acc, item) => acc + item.qty, 0);
  const totalGST = cart.reduce((acc, item) => acc + item.gstAmount, 0);
  const grandTotal = cart.reduce((acc, item) => acc + item.total, 0);

  // --- EFFECTS ---
  
  // Fetch Cashier Name on Mount
  useEffect(() => {
    const fetchUser = async () => {
        try {
            const token = await AsyncStorage.getItem("userToken");
            if(token) {
                const decoded: any = jwtDecode(token);
                // Adjust field based on your token structure (sub, name, username, etc.)
                const name = decoded.sub || decoded.name || decoded.username || "Cashier";
                setCashierName(name);
            }
        } catch (e) {
            console.log("Error decoding token", e);
        }
    };
    fetchUser();
  }, []);

  // --- ACTIONS ---

  const handleExit = () => {
    if (Platform.OS === 'web') {
      const confirm = window.confirm("Are you sure you want to exit?");
      if (confirm) router.replace('/');
    } else {
      Alert.alert(
        "Exit POS",
        "Are you sure you want to exit to the login screen?",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Exit", style: "destructive", onPress: () => router.replace('/') }
        ]
      );
    }
  };

  const handleAddItem = async () => {
    const trimmedBarcode = barcodeInput.trim();
    if (!trimmedBarcode) {
      Alert.alert("Input Error", "Please enter a barcode number.");
      return;
    }

    setLoading(true);
    try {
      // API Call
      const response = await rootApi.get<ScanResponse>(`api/billing/scan/${trimmedBarcode}`);
      const product = response.data;
      
      if (!product) {
        Alert.alert("Not Found", "Product not found.");
        setBarcodeInput('');
        return;
      }

      const inputQty = 1; 

      // Check if item exists
      const existingItemIndex = cart.findIndex(item => item.barcode === trimmedBarcode);

      if (existingItemIndex > -1) {
        // Update Existing
        const updatedCart = [...cart];
        const existingItem = updatedCart[existingItemIndex];
        
        const newQty = existingItem.qty + inputQty;
        
        const gstVal = (existingItem.price * newQty * existingItem.gstPercent) / 100;
        // Ensure we use the latest discount from scan if available
        const discountPerItem = product.discountAmount || existingItem.discount / existingItem.qty || 0;
        const discountVal = discountPerItem * newQty;
        
        const lineTotal = (existingItem.price * newQty) + gstVal - discountVal;

        updatedCart[existingItemIndex] = {
          ...existingItem,
          qty: newQty,
          gstAmount: gstVal,
          discount: discountVal,
          total: lineTotal
        };

        setCart(updatedCart);

      } else {
        // Add New (Bottom)
        const itemPrice = product.unitPrice;
        const gstPercent = product.gstPercent || 0;
        // Mapped discountAmount from API response
        const discountPerItem = product.discountAmount || 0;

        const gstVal = (itemPrice * inputQty * gstPercent) / 100;
        const discountVal = discountPerItem * inputQty;
        const lineTotal = (itemPrice * inputQty) + gstVal - discountVal;

        const newItem: CartItem = {
          rowId: Date.now().toString(),
          id: (product.id || Date.now()).toString(), 
          name: product.itemName,  
          barcode: trimmedBarcode,
          price: itemPrice,       
          qty: inputQty,
          gstPercent: gstPercent,
          gstAmount: gstVal,
          discount: discountVal,
          total: lineTotal
        };

        setCart(prev => [...prev, newItem]);
      }

      setBarcodeInput('');
      setTimeout(() => barcodeInputRef.current?.focus(), 100);

    } catch (error) {
      console.log("Scan Error:", error);
      Alert.alert("Error", "Product not found or Server Error.");
      setBarcodeInput('');
    } finally {
      setLoading(false);
    }
  };

  const removeItem = (rowId: string) => {
    setCart(prev => prev.filter(item => item.rowId !== rowId));
  };

  const handlePrintBill = async () => {
    if (cart.length === 0) {
      Alert.alert("Empty Cart", "Please add items before billing.");
      return;
    }

    setProcessing(true);
    const payload = {
      paymentMethod: "CASH",
      items: cart.map(item => ({
        barcode: item.barcode,
        quantity: item.qty
      }))
    };

    try {
      const response = await rootApi.post('api/billing/create-bill/print', payload);
      const data = response.data;
      const formattedText = typeof data === 'object' ? generateReceiptText(data) : String(data);
      setReceiptText(formattedText);
      setShowReceiptModal(true);
      setCart([]);
    } catch (error) {
      console.error("Billing Error:", error);
      Alert.alert("Failed", "Could not create bill.");
    } finally {
      setProcessing(false);
    }
  };

  const handleWhatsAppInvoice = async () => {
    if (!customerName || !customerPhone) {
        Alert.alert("Missing Details", "Please enter Customer Name and Phone Number.");
        return;
    }
    
    if(!customerPhone.startsWith('91')) {
         Alert.alert("Invalid Number", "Phone number must start with 91.");
         setCustomerPhone('91' + customerPhone.replace(/^91/, ''));
         return;
    }

    setProcessing(true);
    const payload = {
        customerName: customerName,
        phoneNumber: customerPhone,
        items: cart.map(item => ({
            name: item.name,
            quantity: item.qty,
            unitPrice: item.price,
            discountAmount: item.discount, // Sending total discount for line item
            gstPercent: item.gstPercent
        }))
    };
    try {
        await axios.post('http://192.168.0.232:8080/api/billing/generate', payload);
        
        setShowInvoiceModal(false);
        Alert.alert("Success", "Invoice sent via WhatsApp!");
        setCart([]);
        setCustomerName('');
        setCustomerPhone('91'); 
    } catch (error) {
        console.error("WhatsApp Error:", error);
        Alert.alert("Failed", "Could not send WhatsApp invoice.");
    } finally {
        setProcessing(false);
    }
  };


  return (
    <SafeAreaView className="flex-1 bg-gray-100">
        <StatusBar barStyle="light-content" backgroundColor="#1E3A8A" />
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} className="flex-1">
            
            {/* --- HEADER --- */}
            <View className="bg-blue-900 pt-10 pb-6 px-4 rounded-b-3xl shadow-lg z-20">
                <View className="flex-row justify-between items-center">
                    <View className="flex-row items-center gap-3">
                        {/* Profile / Cashier Name Display */}
                        <View className="bg-blue-800 p-2 rounded-lg border border-blue-700 flex-row items-center">
                             <MaterialCommunityIcons name="account-circle" size={24} color="white" />
                             <View className="ml-2">
                                <Text className="text-[10px] text-blue-200 font-medium uppercase">Logged in as</Text>
                                <Text className="text-white text-sm font-bold capitalize">{cashierName}</Text>
                             </View>
                        </View>
                        <View className="h-8 w-[1px] bg-blue-700 mx-1"></View>
                        <View>
                            <Text className="text-white text-xl font-bold tracking-wide">QuickBill POS</Text>
                            <Text className="text-blue-200 text-xs font-medium">Terminal #01</Text>
                        </View>
                    </View>
                    <TouchableOpacity 
                        onPress={handleExit} 
                        className="bg-red-500/20 px-3 py-2 rounded-full border border-red-400/30 flex-row items-center"
                    >
                        <MaterialIcons name="logout" size={16} color="white" />
                        <Text className="text-xs font-bold text-white ml-2">EXIT</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* --- INPUT SECTION --- */}
            <View className="px-4 -mt-4 z-30">
                <View className="bg-white p-4 rounded-2xl shadow-md border border-gray-100 flex-row gap-3 items-end">
                     <View className="flex-1">
                        <Text className="text-xs text-gray-500 font-bold mb-1.5 uppercase tracking-wider pl-1">
                            Scan Barcode
                        </Text>
                        <View className="flex-row items-center border border-blue-200 rounded-xl bg-blue-50 focus:border-blue-500 focus:bg-white h-12 overflow-hidden">
                            <View className="pl-3 pr-2 border-r border-blue-200">
                                <MaterialCommunityIcons name="barcode-scan" size={20} color="#2563EB" />
                            </View>
                            <TextInput
                                ref={barcodeInputRef}
                                value={barcodeInput}
                                onChangeText={setBarcodeInput}
                                onSubmitEditing={handleAddItem}
                                placeholder="Scan or Enter Barcode"
                                placeholderTextColor="#9CA3AF"
                                autoFocus
                                className="flex-1 px-3 text-gray-800 text-lg font-bold"
                                style={Platform.OS === 'web' ? { outline: 'none' } : undefined} 
                            />
                             {barcodeInput.length > 0 && (
                                <TouchableOpacity onPress={() => setBarcodeInput('')} className="pr-3">
                                    <Ionicons name="close-circle" size={18} color="#9CA3AF" />
                                </TouchableOpacity>
                            )}
                        </View>
                     </View>
                     
                     <TouchableOpacity 
                        onPress={handleAddItem}
                        disabled={loading}
                        className={`h-12 w-16 rounded-xl items-center justify-center shadow-sm ${loading ? 'bg-gray-300' : 'bg-blue-600 active:bg-blue-700'}`}
                     >
                        {loading ? <ActivityIndicator color="white" size="small" /> : <Ionicons name="add" size={30} color="white" />}
                     </TouchableOpacity>
                </View>
            </View>

            {/* --- TABLE HEADER --- */}
            <View className="mx-4 mt-4 flex-row bg-blue-50 py-3 px-4 rounded-t-xl border border-blue-100">
                <Text className="w-10 text-[10px] font-bold text-blue-800 uppercase">S.No</Text>
                <Text className="flex-1 text-[10px] font-bold text-blue-800 uppercase">Item Name</Text>
                <Text className="w-16 text-[10px] font-bold text-blue-800 text-right uppercase">Price</Text>
                <Text className="w-10 text-[10px] font-bold text-blue-800 text-center uppercase">Qty</Text>
                <Text className="w-12 text-[10px] font-bold text-blue-800 text-center uppercase">GST</Text>
                <Text className="w-12 text-[10px] font-bold text-blue-800 text-right uppercase">Disc</Text>
                <Text className="w-20 text-[10px] font-bold text-blue-800 text-right uppercase">Total</Text>
                <Text className="w-8"></Text>
            </View>

            {/* --- TABLE CONTENT --- */}
            <View className="flex-1 mx-4 bg-white border-x border-b border-gray-200 rounded-b-xl mb-24 overflow-hidden">
                <FlatList
                    data={cart}
                    keyExtractor={(item) => item.rowId}
                    contentContainerStyle={{ paddingBottom: 20 }}
                    renderItem={({ item, index }) => (
                        <View className={`flex-row items-center py-3 px-4 border-b border-gray-50 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                            <Text className="w-10 text-xs font-bold text-gray-400">{index + 1}</Text>
                            
                            <View className="flex-1 pr-2">
                                <Text className="text-sm font-bold text-gray-800" numberOfLines={1}>{item.name}</Text>
                                <Text className="text-[10px] text-gray-400">{item.barcode}</Text>
                            </View>
                            
                            <Text className="w-16 text-sm font-medium text-gray-600 text-right">₹{item.price}</Text>
                            
                            <Text className="w-10 text-sm font-bold text-gray-800 text-center">{item.qty}</Text>
                            
                            <View className="w-12 items-center">
                                <View className="bg-orange-50 px-1.5 py-0.5 rounded text-center border border-orange-100">
                                   <Text className="text-[10px] font-bold text-orange-600">{item.gstPercent}%</Text>
                                </View>
                            </View>

                            {/* Discount Display */}
                            <Text className="w-12 text-sm font-medium text-red-500 text-right">
                                {item.discount > 0 ? `₹${item.discount}` : '-'}
                            </Text>
                            
                            <Text className="w-20 text-sm font-bold text-blue-700 text-right">₹{item.total.toFixed(2)}</Text>
                            
                            <TouchableOpacity onPress={() => removeItem(item.rowId)} className="w-8 items-end">
                                <Ionicons name="trash-outline" size={18} color="#EF4444" />
                            </TouchableOpacity>
                        </View>
                    )}
                    ListEmptyComponent={
                        <View className="items-center justify-center py-16 opacity-40">
                             <MaterialCommunityIcons name="cart-off" size={64} color="#9CA3AF" />
                             <Text className="text-gray-400 mt-2 font-medium">No items in cart</Text>
                        </View>
                    }
                />
            </View>

            {/* --- BOTTOM FOOTER --- */}
            <View className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-[0_-4px_20px_-5px_rgba(0,0,0,0.1)] px-5 py-4 rounded-t-3xl">
                <View className="flex-row justify-between items-end mb-4">
                    <View>
                        <Text className="text-xs font-bold text-gray-400 uppercase tracking-widest">Grand Total</Text>
                        <Text className="text-3xl font-extrabold text-blue-900">₹{grandTotal.toFixed(2)}</Text>
                        <Text className="text-[10px] text-gray-400 font-medium">
                            Items: {totalQty} | Tax: ₹{totalGST.toFixed(2)}
                        </Text>
                    </View>
                    
                    <View className="flex-row gap-3">
                        <TouchableOpacity 
                            onPress={() => {
                                if(cart.length === 0) { Alert.alert("Empty", "Cart is empty"); return; }
                                setShowInvoiceModal(true);
                            }}
                            className="w-14 h-14 bg-green-100 rounded-2xl items-center justify-center border border-green-200"
                        >
                            <MaterialCommunityIcons name="whatsapp" size={28} color="#16A34A" />
                        </TouchableOpacity>

                        <TouchableOpacity 
                            onPress={handlePrintBill}
                            disabled={processing}
                            className="bg-blue-900 px-8 h-14 rounded-2xl flex-row items-center justify-center shadow-lg shadow-blue-200"
                        >
                            {processing ? (
                                <ActivityIndicator color="white" />
                            ) : (
                                <>
                                    <Text className="text-white font-bold text-lg mr-2">PAY & PRINT</Text>
                                    <Ionicons name="print-outline" size={24} color="white" />
                                </>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </View>

        </KeyboardAvoidingView>

        {/* --- MODALS --- */}
        
        {/* Receipt Modal */}
        <Modal visible={showReceiptModal} animationType="fade" transparent>
            <View className="flex-1 bg-black/60 justify-center items-center p-4">
                <View className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl">
                    <View className="flex-row justify-between items-center mb-4">
                        <Text className="text-lg font-bold text-gray-800">Bill Generated</Text>
                        <TouchableOpacity onPress={() => setShowReceiptModal(false)}>
                            <Ionicons name="close-circle" size={28} color="#9CA3AF" />
                        </TouchableOpacity>
                    </View>
                    <View className="bg-gray-50 p-4 rounded-xl mb-4 border border-gray-100 max-h-96">
                        <ScrollView nestedScrollEnabled>
                             <Text className="font-mono text-xs text-gray-600 leading-5">{receiptText}</Text>
                        </ScrollView>
                    </View>
                    <TouchableOpacity onPress={() => { Share.share({ message: receiptText }); setShowReceiptModal(false); }} className="bg-blue-600 py-3 rounded-xl items-center">
                        <Text className="text-white font-bold">Share Receipt</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>

        {/* --- INVOICE MODAL --- */}
        <Modal visible={showInvoiceModal} animationType="fade" transparent>
             <KeyboardAvoidingView 
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
                className="flex-1 bg-black/60 justify-center items-center p-4"
             >
                <View className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl overflow-hidden">
                     
                     <View className="flex-row justify-between items-center mb-6">
                        <View className="flex-row items-center">
                            <View className="bg-green-100 p-2 rounded-full mr-3">
                                <MaterialCommunityIcons name="whatsapp" size={24} color="#16A34A" />
                            </View>
                            <Text className="text-xl font-bold text-gray-800">Send Invoice</Text>
                        </View>
                        <TouchableOpacity onPress={() => setShowInvoiceModal(false)}>
                             <Ionicons name="close" size={24} color="#9CA3AF" />
                        </TouchableOpacity>
                    </View>

                    <View className="gap-4 mb-6">
                        <POSInput 
                            icon="account-outline" 
                            placeholder="Customer Name" 
                            value={customerName} 
                            onChange={setCustomerName} 
                        />
                        <POSInput 
                            icon="phone-outline" 
                            placeholder="WhatsApp Number" 
                            value={customerPhone} 
                            onChange={setCustomerPhone}
                            keyboardType="phone-pad" 
                        />
                    </View>

                    <TouchableOpacity 
                        onPress={handleWhatsAppInvoice} 
                        disabled={processing} 
                        className="bg-green-600 py-4 rounded-xl items-center shadow-lg shadow-green-200"
                    >
                         {processing ? (
                             <ActivityIndicator color="white" />
                         ) : (
                             <Text className="text-white font-bold text-lg">Send Message</Text>
                         )}
                    </TouchableOpacity>
                </View>
             </KeyboardAvoidingView>
        </Modal>

    </SafeAreaView>
  );
};

export default Ss;