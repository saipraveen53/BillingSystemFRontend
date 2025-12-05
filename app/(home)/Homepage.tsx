import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useContext, useEffect, useState } from 'react';
import { FlatList, Text, TouchableOpacity, View } from 'react-native';
import { BillContext } from '../(utils)/BillingContext';
import { rootApi } from '../(utils)/axiosInstance';

const Homepage = () => {
  const { sai, setSai } = useContext(BillContext);
  const router = useRouter();
  const [products, setProducts] = useState([]);

  useEffect(() => {
    const fetch = async () => {
      try {
        let response = await rootApi.get(`http://192.168.0.110:8085/api/billing/all`);
        setProducts(response.data);
        console.log("Response of all products From Homepage :", response.data);
      } catch (error) {
        console.log("Fetch Error:", error);
      }
    };
    fetch();
  }, []);

  const handleLogout = async () => {
    try {
      await AsyncStorage.clear();
      router.replace('/');
    } catch (error) {
      console.log("Logout Error:", error);
    }
  };

  const renderProduct = ({ item }) => (
    <View className="bg-white p-4 mb-3 rounded-lg shadow-md border border-gray-200 w-full max-w-lg mx-auto">
      <View className="flex-row justify-between items-center pb-2 border-b border-gray-100 mb-2">
        <Text className="text-lg font-extrabold text-blue-800">{item.name}</Text>
        <Text className="text-sm font-semibold text-gray-600">ID: {item.id}</Text>
      </View>

      <View className="space-y-1">
        <View className="flex-row justify-between">
          <Text className="text-base font-medium text-gray-700">Price:</Text>
          <Text className="text-base font-bold text-gray-900">₹{item.price}</Text>
        </View>

        <View className="flex-row justify-between">
          <Text className="text-base font-medium text-gray-700">Stock Qty:</Text>
          <Text className="text-base font-bold text-gray-900">{item.stockQty}</Text>
        </View>

        <View className="flex-row justify-between">
          <Text className="text-base font-medium text-gray-700">HSN Code:</Text>
          <Text className="text-base font-bold text-gray-900">{item.hsnCode}</Text>
        </View>

        <View className="flex-row justify-between">
          <Text className="text-base font-medium text-gray-700">GST %:</Text>
          <Text className="text-base font-bold text-gray-900">{item.gstPercent}%</Text>
        </View>

        <View className="flex-row justify-between">
          <Text className="text-base font-medium text-gray-700">Status:</Text>
          <Text className={`text-base font-bold ${item.active ? 'text-green-600' : 'text-red-600'}`}>
            {item.active ? 'ACTIVE' : 'INACTIVE'}
          </Text>
        </View>
      </View>
    </View>
  );

  return (
    <View className="flex-1 p-4 bg-gray-50">
      <Text className="text-2xl font-bold mb-6 text-center text-gray-800 pt-8">Product Catalog</Text>
      
      <FlatList
        data={products}
        keyExtractor={(item) => item.id}
        renderItem={renderProduct}
        contentContainerStyle={{ paddingBottom: 20 }}
        ListEmptyComponent={<Text className="text-center text-gray-500 mt-10 text-lg">Loading products...</Text>}
      />

      {/* Logout Button */}
      <TouchableOpacity
        onPress={handleLogout}
        className="bg-red-600 px-6 py-3 rounded-lg mt-4 w-full max-w-lg mx-auto"
      >
        <Text className="text-white text-lg font-semibold text-center">Logout</Text>
      </TouchableOpacity>
    </View>
  );
};

export default Homepage;