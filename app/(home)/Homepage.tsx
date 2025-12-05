import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { useRouter } from 'expo-router';
import React, { useContext, useEffect, useState } from 'react';
import {
  FlatList,
  Modal,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { BillContext } from '../(utils)/BillingContext';
import { rootApi } from '../(utils)/axiosInstance';

const Homepage = () => {
  const { sai, setSai } = useContext(BillContext);
  const router = useRouter();
  const [products, setProducts] = useState([]);

  const [modalVisible, setModalVisible] = useState(false);
  
  // 1. Added categoryId to state
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
    categoryId: '', // Added field
    active: false,
  });

  // Fetch All Products
  useEffect(() => {
    const fetch = async () => {
      try {
        let response = await rootApi.get(
          `http://192.168.0.110:8085/api/billing/all`
        );
        setProducts(response.data);
        console.log('Products Loaded:', response.data);
      } catch (error) {
        console.log('Fetch Error:', error);
      }
    };
    fetch();
  }, []);

  // 🔥 Toggle Active/Inactive
  const toggleProductStatus = async (item) => {
    try {
      const url = item.active
        ? `http://192.168.0.110:8085/api/billing/${item.id}/deactivate`
        : `http://192.168.0.110:8085/api/billing/${item.id}/activate`;

      await axios.patch(url);

      setProducts((prev) =>
        prev.map((product) =>
          product.id === item.id
            ? { ...product, active: !product.active }
            : product
        )
      );
    } catch (error) {
      console.log('Toggle Error:', error);
    }
  };

  // 🟦 Open Edit Modal With Data
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
      categoryId: item.categoryId + '', // 2. Populate categoryId from item
      active: item.active,
    });

    setModalVisible(true);
  };

  // 🟧 Update Product (PUT)
  const handleUpdateProduct = async () => {
    try {
      const dto = {
        id: editData.id,
        name: editData.name,
        barcode: editData.barcode,
        price: parseFloat(editData.price),
        hsnCode: editData.hsnCode,
        discountType: editData.discountType,
        discountValue: parseFloat(editData.discountValue),
        gstPercent: parseFloat(editData.gstPercent),
        stockQty: parseInt(editData.stockQty),
        categoryId: parseInt(editData.categoryId), // 3. Send categoryId to backend
        active: editData.active,
      };

      let response = await rootApi.put(
        `http://192.168.0.110:8085/api/billing/product/${editData.id}`,
        dto
      );

      console.log("UPDATED:", response.data);

      setProducts((prev) =>
        prev.map((p) => (p.id === editData.id ? response.data : p))
      );

      setModalVisible(false);
    } catch (error) {
      console.log("Update Error:", error);
    }
  };

  // Logout Function
  const handleLogout = async () => {
    try {
      await AsyncStorage.clear();
      router.replace('/');
    } catch (error) {
      console.log('Logout Error:', error);
    }
  };

  // Product Card
  const renderProduct = ({ item }) => (
    <View className="bg-white p-4 mb-3 rounded-lg shadow-md border border-gray-200 w-full max-w-lg mx-auto">

      {/* Title + Edit Icon */}
      <View className="flex-row justify-between items-center pb-2 border-b border-gray-100 mb-2">
        <Text className="text-lg font-extrabold text-blue-800">{item.name}</Text>

        <TouchableOpacity onPress={() => openEditModal(item)}>
          <MaterialIcons name="edit" size={26} color="black" />
        </TouchableOpacity>
      </View>

      <TouchableOpacity onPress={() => toggleProductStatus(item)}>
        <View className="space-y-1">
          <View className="flex-row justify-between">
            <Text className="text-base font-medium text-gray-700">Price:</Text>
            <Text className="text-base font-bold text-gray-900">₹{item.price}</Text>
          </View>

          <View className="flex-row justify-between">
            <Text className="text-base font-medium text-gray-700">Stock Qty:</Text>
            <Text className="text-base font-bold text-gray-900">{item.stockQty}</Text>
          </View>

          {/* You might want to remove HSN/GST from card display too if strictly not needed, 
              but keeping them here for info as requested changes were for the "Form" */}
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
            <Text
              className={`text-base font-bold ${
                item.active ? 'text-green-600' : 'text-red-600'
              }`}>
              {item.active ? 'ACTIVE (Tap to Deactivate)' : 'INACTIVE (Tap to Activate)'}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    </View>
  );

  return (
    <View className="flex-1 p-4 bg-gray-50">

      <Text className="text-2xl font-bold mb-6 text-center text-gray-800 pt-8">
        Product Catalog
      </Text>

      <FlatList
        data={products}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderProduct}
        contentContainerStyle={{ paddingBottom: 20 }}
      />

      {/* Logout */}
      <TouchableOpacity
        onPress={handleLogout}
        className="bg-red-600 px-6 py-3 rounded-lg mt-4 w-full max-w-lg mx-auto"
      >
        <Text className="text-white text-lg font-semibold text-center">Logout</Text>
      </TouchableOpacity>

      {/* EDIT MODAL */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View className="flex-1 bg-black/40 justify-center items-center">
          <View className="bg-white w-11/12 p-5 rounded-xl max-h-[80%]">
            <ScrollView>

              <Text className="text-xl font-bold mb-4 text-center">Edit Product</Text>

              {Object.keys(editData).map((key) => {
                 // 4. Hide specific fields from the form UI
                 if (
                   key === 'active' || 
                   key === 'hsnCode' || 
                   key === 'gstPercent'
                  ) {
                   return null; 
                 }
                 
                 return (
                  <View key={key} className="mb-3">
                    <Text className="text-gray-700 mb-1 capitalize">{key}</Text>
                    <TextInput
                      value={editData[key]?.toString()}
                      onChangeText={(text) =>
                        setEditData({ ...editData, [key]: text })
                      }
                      className="border border-gray-300 rounded px-3 py-2"
                    />
                  </View>
                );
              })}

              <TouchableOpacity
                onPress={handleUpdateProduct}
                className="bg-blue-600 py-3 rounded-lg mt-3"
              >
                <Text className="text-white text-center text-lg font-semibold">
                  Save Changes
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                className="bg-gray-400 py-3 rounded-lg mt-3"
              >
                <Text className="text-white text-center text-lg font-semibold">
                  Cancel
                </Text>
              </TouchableOpacity>

            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default Homepage;