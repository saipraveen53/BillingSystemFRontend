import { Feather, FontAwesome5, Ionicons, MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Platform, // Added Platform import
  ScrollView,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View
} from 'react-native';
import { rootApi } from '../(utils)/axiosInstance';

const Homepage = () => {
  const router = useRouter();
  const { width } = useWindowDimensions(); // Screen width calculation
  
  // Logic for 3 columns on Web (width > 900px), else 1 column
  const numColumns = width > 900 ? 3 : 1;
  const isWeb = width > 900;

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  
  // Edit Form State
  const [editData, setEditData] = useState({
    id: '',
    name: '',
    barcode: '',
    price: '',
    hsnCode: '',
    discountType: '',
    discountValue: '',
    gstPercent: '',
    stockQty: '',
    categoryId: '',
    active: false,
  });

  // Fetch Products
  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      // Backend URL
      let response = await rootApi.get(`http://192.168.0.110:8085/api/billing/all`);
      setProducts(response.data);
    } catch (error) {
      console.log('Fetch Error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter Products
  const filteredProducts = products.filter((item) => 
    (item.name && item.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (item.barcode && item.barcode.includes(searchQuery))
  );

  // Toggle Status (Active/Inactive)
  const toggleProductStatus = async (item) => {
    try {
      // Optimistic update for fast UI feel
      const updatedProducts = products.map((p) => 
        p.id === item.id ? { ...p, active: !p.active } : p
      );
      setProducts(updatedProducts);

      const url = item.active
        ? `http://192.168.0.110:8085/api/billing/${item.id}/deactivate`
        : `http://192.168.0.110:8085/api/billing/${item.id}/activate`;

      await rootApi.patch(url);
      
    } catch (error) {
      console.log('Toggle Error:', error);
      Alert.alert("Error", "Status update failed");
      fetchProducts(); // Revert on error
    }
  };

  // Open Edit Modal
  const openEditModal = (item) => {
    setEditData({
      id: item.id,
      name: item.name,
      barcode: item.barcode,
      price: item.price + '',
      hsnCode: item.hsnCode,
      discountType: item.discountType,
      discountValue: item.discountValue + '',
      gstPercent: item.gstPercent + '',
      stockQty: item.stockQty + '',
      categoryId: item.categoryId + '',
      active: item.active,
    });
    setModalVisible(true);
  };

  // Update Product
  const handleUpdateProduct = async () => {
    try {
      const dto = {
        ...editData,
        price: parseFloat(editData.price),
        discountValue: parseFloat(editData.discountValue),
        gstPercent: parseFloat(editData.gstPercent),
        stockQty: parseInt(editData.stockQty),
        categoryId: parseInt(editData.categoryId),
      };

      let response = await rootApi.put(
        `http://192.168.0.110:8085/api/billing/product/${editData.id}`,
        dto
      );

      setProducts((prev) =>
        prev.map((p) => (p.id === editData.id ? response.data : p))
      );
      setModalVisible(false);
      Alert.alert("Success", "Product details updated!");
    } catch (error) {
      console.log("Update Error:", error);
      Alert.alert("Error", "Failed to update product");
    }
  };

  // --- LOGOUT LOGIC WITH CONFIRMATION ---
  const handleLogout = () => {
    if (Platform.OS === 'web') {
        const confirm = window.confirm("Are you sure you want to logout?");
        if (confirm) performLogout();
    } else {
        Alert.alert(
            "Logout",
            "Are you sure you want to log out?",
            [
                { text: "Cancel", style: "cancel" },
                { text: "Logout", style: "destructive", onPress: performLogout }
            ]
        );
    }
  };

  const performLogout = async () => {
    await AsyncStorage.clear();
    router.replace('/');
  };

  // --- CARD COMPONENT ---
  const renderProduct = ({ item }) => (
    <View 
      style={{ 
        flex: 1, 
        margin: 8,
        maxWidth: isWeb ? '32%' : '100%', // Strict width for grid
      }}
      className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
    >
      {/* 1. Status Strip (Visual Indicator) */}
      <View className={`h-2 w-full ${item.active ? 'bg-green-500' : 'bg-red-500'}`} />

      <View className="p-4">
        {/* Header: Name & Barcode */}
        <View className="flex-row justify-between items-start mb-3">
            <View className="flex-1">
                <Text className="text-xl font-bold text-gray-800" numberOfLines={2}>
                  {item.name}
                </Text>
                <View className="flex-row items-center mt-1">
                    <Ionicons name="barcode-outline" size={16} color="#64748B" />
                    <Text className="text-sm text-gray-500 ml-1 font-mono tracking-wider">
                        {item.barcode || 'NO BARCODE'}
                    </Text>
                </View>
            </View>
            <TouchableOpacity onPress={() => openEditModal(item)} className="p-2 bg-blue-50 rounded-full">
                <MaterialIcons name="edit" size={20} color="#2563EB" />
            </TouchableOpacity>
        </View>

        {/* Info Grid (All Data) */}
        <View className="bg-gray-50 p-3 rounded-lg mb-4">
            {/* Row 1: Price & Stock */}
            <View className="flex-row justify-between mb-2">
                <View>
                    <Text className="text-xs text-gray-500 uppercase font-bold">Price (MRP)</Text>
                    <Text className="text-lg font-extrabold text-blue-700">₹{item.price}</Text>
                </View>
                <View className="items-end">
                    <Text className="text-xs text-gray-500 uppercase font-bold">Stock</Text>
                    <Text className={`text-lg font-extrabold ${item.stockQty < 10 ? 'text-red-600' : 'text-gray-800'}`}>
                        {item.stockQty} <Text className="text-xs font-normal text-gray-500">units</Text>
                    </Text>
                </View>
            </View>

            {/* Separator */}
            <View className="h-[1px] bg-gray-200 my-2" />

            {/* Row 2: Tax & HSN */}
            <View className="flex-row justify-between">
                <View>
                    <Text className="text-xs text-gray-400">GST %</Text>
                    <Text className="text-sm font-semibold text-gray-700">{item.gstPercent}%</Text>
                </View>
                <View>
                    <Text className="text-xs text-gray-400">HSN Code</Text>
                    <Text className="text-sm font-semibold text-gray-700">{item.hsnCode || '-'}</Text>
                </View>
                <View>
                    <Text className="text-xs text-gray-400">Category</Text>
                    <Text className="text-sm font-semibold text-gray-700">{item.categoryId}</Text>
                </View>
            </View>

             {/* Discount Info if exists */}
             {(item.discountValue > 0) && (
                 <View className="mt-2 pt-2 border-t border-dashed border-gray-300">
                     <Text className="text-xs text-orange-600 font-bold">
                        Offer: {item.discountValue} {item.discountType === 'PERCENTAGE' ? '%' : 'Rs'} OFF
                     </Text>
                 </View>
             )}
        </View>

        {/* BIG ACTION BUTTONS - Simple for Staff */}
        <TouchableOpacity 
            onPress={() => toggleProductStatus(item)}
            className={`flex-row justify-center items-center py-3 rounded-lg border-2 
            ${item.active ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'}`}
        >
            <FontAwesome5 
                name={item.active ? "ban" : "check-circle"} 
                size={18} 
                color={item.active ? "#DC2626" : "#16A34A"} 
            />
            <Text 
                className={`ml-2 text-base font-bold 
                ${item.active ? 'text-red-700' : 'text-green-700'}`}
            >
                {item.active ? "STOP SELLING" : "START SELLING"}
            </Text>
        </TouchableOpacity>
        
        {/* Status Label */}
        <Text className={`text-center text-xs mt-2 font-bold ${item.active ? 'text-green-600' : 'text-red-400'}`}>
            Currently: {item.active ? 'Active' : 'Inactive'}
        </Text>

      </View>
    </View>
  );

  return (
    <View className="flex-1 bg-gray-100">
      <StatusBar barStyle="light-content" backgroundColor="#1E3A8A" />

      {/* Header */}
      <View className="bg-blue-900 pb-6 pt-10 px-6 rounded-b-[30px] shadow-lg z-10">
        <View className="flex-row justify-between items-center mb-4">
            <View>
                <Text className="text-white text-2xl font-bold tracking-wide">Store Inventory</Text>
                <Text className="text-blue-200 text-sm">Total Products: {products.length}</Text>
            </View>
            <TouchableOpacity onPress={handleLogout} className="bg-blue-800 p-2 rounded-lg border border-blue-700">
                <MaterialIcons name="logout" size={22} color="white" />
            </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View className="flex-row items-center bg-white rounded-full px-4 h-12 shadow-md">
            <Ionicons name="search" size={20} color="#9CA3AF" />
            <TextInput 
                placeholder="Search Item Name or Barcode..." 
                className="flex-1 ml-3 text-base text-gray-800 h-full"
                placeholderTextColor="#9CA3AF"
                value={searchQuery}
                onChangeText={setSearchQuery}
                // FIX FOR BLACK BOX ON WEB
                style={Platform.OS === 'web' ? { outline: 'none' } : undefined} 
            />
            {searchQuery.length > 0 && (
                <TouchableOpacity onPress={()=>setSearchQuery('')}>
                    <Ionicons name="close-circle" size={20} color="#9CA3AF" />
                </TouchableOpacity>
            )}
        </View>
      </View>

      {/* Grid Content */}
      <View className="flex-1 px-2 pt-2">
        {loading ? (
            <ActivityIndicator size="large" color="#1E3A8A" className="mt-10" />
        ) : (
            <FlatList
                key={numColumns} // Forces re-render when columns change (Web resizing)
                data={filteredProducts}
                numColumns={numColumns}
                keyExtractor={(item) => item.id.toString()}
                renderItem={renderProduct}
                contentContainerStyle={{ paddingBottom: 100 }}
                columnWrapperStyle={isWeb ? { justifyContent: 'flex-start' } : undefined} // Only for grid
                ListEmptyComponent={
                    <View className="items-center mt-20">
                        <Feather name="box" size={50} color="#CBD5E1" />
                        <Text className="text-gray-400 mt-4 text-lg">No products found</Text>
                    </View>
                }
            />
        )}
      </View>

      {/* Edit Modal (kept simple) */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View className="flex-1 bg-black/50 justify-center items-center p-4">
            <View className="bg-white w-full max-w-lg rounded-2xl p-6 shadow-2xl h-[80%]">
                <Text className="text-xl font-bold text-center mb-4 text-gray-800">Edit Product Details</Text>
                <ScrollView showsVerticalScrollIndicator={false}>
                    {Object.keys(editData).map(key => {
                        if(['id','active','discountType'].includes(key)) return null;
                        return (
                            <View key={key} className="mb-3">
                                <Text className="text-xs text-gray-500 uppercase font-bold mb-1">{key}</Text>
                                <TextInput 
                                    value={editData[key]?.toString()}
                                    onChangeText={(t)=>setEditData({...editData, [key]:t})}
                                    className="border border-gray-300 rounded-lg p-3 text-gray-800 bg-gray-50 focus:border-blue-500 focus:bg-white"
                                />
                            </View>
                        )
                    })}
                </ScrollView>
                <View className="mt-4 gap-2">
                    <TouchableOpacity onPress={handleUpdateProduct} className="bg-blue-600 py-3 rounded-lg">
                        <Text className="text-white text-center font-bold text-lg">Update Item</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={()=>setModalVisible(false)} className="bg-gray-200 py-3 rounded-lg">
                        <Text className="text-gray-700 text-center font-bold text-lg">Cancel</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
      </Modal>

    </View>
  );
};

export default Homepage;