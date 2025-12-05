import { Feather } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useContext, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { BillContext } from '../(utils)/BillingContext';
import { rootApi } from '../(utils)/axiosInstance';

// TypeScript Errors Fix Cheyadaniki Interface
interface Product {
  id: string | number;
  name: string;
  price: number;
  stockQty: number;
  hsnCode: string;
  gstPercent: number;
  active: boolean;
}

const Homepage = () => {
  const { sai, setSai } = useContext(BillContext);
  const router = useRouter();
  
  // FIX: Type definition added to remove red lines
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        let response = await rootApi.get(`http://192.168.0.110:8085/api/billing/all`);
        setProducts(response.data);
        setFilteredProducts(response.data);
        console.log("Response:", response.data);
      } catch (error) {
        console.log("Fetch Error:", error);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  // Search Logic with Type Safety
  const handleSearch = (text: string) => {
    setSearch(text);
    if (text) {
      const newData = products.filter((item) => {
        const itemData = item.name ? item.name.toUpperCase() : ''.toUpperCase();
        const textData = text.toUpperCase();
        return itemData.indexOf(textData) > -1;
      });
      setFilteredProducts(newData);
    } else {
      setFilteredProducts(products);
    }
  };

  // Logout with Confirmation Logic
  const handleLogoutConfirm = () => {
    if (Platform.OS === 'web') {
      const confirm = window.confirm("Are you sure you want to logout?");
      if (confirm) performLogout();
    } else {
      Alert.alert(
        "Logout",
        "Are you sure you want to logout?",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Logout", onPress: performLogout, style: 'destructive' }
        ]
      );
    }
  };

  const performLogout = async () => {
    try {
      await AsyncStorage.clear();
      router.replace('/');
    } catch (error) {
      console.log("Logout Error:", error);
    }
  };

  // UI Helper for Stock Color
  const getStockStatusColor = (qty: number) => {
    if (qty < 20) return "text-red-600"; // Low Stock (Warning)
    if (qty < 50) return "text-orange-500"; // Medium
    return "text-green-700"; // Good Stock
  };

  const renderProduct = ({ item }: { item: Product }) => (
    <View className="bg-white p-4 mb-4 rounded-2xl shadow-sm border border-gray-100 mx-4">
      {/* Top Row: Name and Status */}
      <View className="flex-row justify-between items-start mb-3">
        <View className="flex-1 pr-2">
            {/* Name Styling Improved */}
            <Text className="text-lg font-extrabold text-gray-800 tracking-wide capitalize">
              {item.name}
            </Text>
            <Text className="text-xs text-gray-400 mt-1 font-medium">
              ID: {item.id} | HSN: {item.hsnCode}
            </Text>
        </View>
        <View className={`px-3 py-1 rounded-full ${item.active ? 'bg-green-50' : 'bg-red-50'}`}>
            <Text className={`text-[10px] font-bold tracking-wider ${item.active ? 'text-green-700' : 'text-red-700'}`}>
                {item.active ? 'ACTIVE' : 'INACTIVE'}
            </Text>
        </View>
      </View>

      {/* Divider */}
      <View className="h-[1px] bg-gray-100 mb-3 w-full" />

      {/* Bottom Row: Stock, GST, Price */}
      <View className="flex-row justify-between items-center">
        <View>
            <Text className="text-gray-400 text-[10px] font-bold uppercase tracking-widest mb-1">Stock Availability</Text>
            <View className="flex-row items-baseline">
              <Text className={`text-xl font-black ${getStockStatusColor(item.stockQty)}`}>
                {item.stockQty}
              </Text>
              <Text className="text-xs text-gray-500 ml-1 font-medium">Units</Text>
            </View>
            {item.stockQty < 20 && (
              <Text className="text-[10px] text-red-500 font-bold mt-1">⚠️ Low Stock Alert</Text>
            )}
        </View>

        <View className="items-end">
            <Text className="text-gray-400 text-[10px] font-bold uppercase tracking-widest mb-1">Price (inc. GST)</Text>
            <Text className="text-blue-700 text-2xl font-black">₹{item.price}</Text>
            <Text className="text-[10px] text-gray-400 font-medium">GST: {item.gstPercent}%</Text>
        </View>
      </View>
    </View>
  );

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header Section */}
      <View className="bg-blue-600 pt-12 pb-6 px-6 rounded-b-[30px] shadow-lg mb-4">
        <View className="flex-row justify-between items-center mb-6">
            <View>
              <Text className="text-blue-100 text-sm font-medium">Welcome back,</Text>
              <Text className="text-white text-2xl font-bold">Product Catalog</Text>
            </View>
            <TouchableOpacity 
              onPress={handleLogoutConfirm} 
              className="bg-white/20 p-3 rounded-full active:bg-white/30"
            >
                <Feather name="log-out" size={20} color="white" />
            </TouchableOpacity>
        </View>
        
        {/* Search Bar - Fixed Outline Issue */}
        <View className="bg-white flex-row items-center px-4 py-3 rounded-2xl shadow-sm">
            <Feather name="search" size={20} color="#9CA3AF" />
            <TextInput 
                placeholder="Search products by name..." 
                placeholderTextColor="#9CA3AF"
                className="flex-1 ml-3 text-gray-800 text-base font-medium h-full"
                value={search}
                onChangeText={handleSearch}
                // Web specific style to remove outline
                style={Platform.OS === 'web' ? { outline: 'none' } : {}}
            />
            {search.length > 0 && (
              <TouchableOpacity onPress={() => handleSearch('')}>
                <Feather name="x" size={18} color="#9CA3AF" />
              </TouchableOpacity>
            )}
        </View>
      </View>

      {/* Product List */}
      {loading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#2563EB" />
          <Text className="text-gray-500 mt-4 font-medium">Loading Inventory...</Text>
        </View>
      ) : (
        <FlatList
            data={filteredProducts}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderProduct}
            contentContainerStyle={{ paddingBottom: 100 }}
            ListEmptyComponent={
              <View className="items-center justify-center mt-20">
                <Feather name="box" size={50} color="#D1D5DB" />
                <Text className="text-center text-gray-400 mt-4 text-lg font-medium">No products found</Text>
              </View>
            }
        />
      )}
    </View>
  );
};

export default Homepage;