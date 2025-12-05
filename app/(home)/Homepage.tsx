import { Feather, FontAwesome5, Ionicons, MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Platform,
  ScrollView,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View
} from 'react-native';
import { rootApi } from '../(utils)/axiosInstance';

// Initial state for adding a new product
const initialNewProductState = {
  id: '',
  name: '',
  barcode: '',
  price: '',
  discountType: 'PERCENTAGE',
  discountValue: '0',
  stockQty: '0',
  categoryId: '',
};

// Initial state for adding a new category
const initialNewCategoryState = {
  name: '',
  defaultHsn: '',
  defaultGst: '0',
  active: true,
};

// Initial state for Change Password form
const initialPasswordFormData = {
  oldPassword: '',
  newPassword: '',
  confirmNewPassword: '',
};


const Homepage = () => {
  const router = useRouter();
  const { width } = useWindowDimensions();

  const numColumns = width > 900 ? 3 : 1;
  const isWeb = width > 900;

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [addProductModalVisible, setAddProductModalVisible] = useState(false);
  const [addCategoryModalVisible, setAddCategoryModalVisible] = useState(false);
  const [userMenuModalVisible, setUserMenuModalVisible] = useState(false);
  const [changePasswordModalVisible, setChangePasswordModalVisible] = useState(false); // New state for Change Password Modal
  
  const [newProductData, setNewProductData] = useState(initialNewProductState);
  const [newCategoryData, setNewCategoryData] = useState(initialNewCategoryState);
  const [passwordFormData, setPasswordFormData] = useState(initialPasswordFormData); // New state for password form

  // --- NEW STATES FOR PASSWORD VISIBILITY ---
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [editData, setEditData] = useState({
    id: '',
    name: '',
    barcode: '',
    price: '',
    discountType: '',
    discountValue: '',
    stockQty: '',
    categoryId: '',
    active: false,
  });

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      let response = await rootApi.get(`http://192.168.0.110:8085/api/billing/all`);
      setProducts(response.data);
    } catch (error) {
      console.log('Fetch Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter((item) =>
    (item.name && item.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (item.barcode && item.barcode.includes(searchQuery))
  );

  const toggleProductStatus = async (item) => {
    try {
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
      fetchProducts();
    }
  };

  const openEditModal = (item) => {
    setEditData({
      id: item.id + '',
      name: item.name,
      barcode: item.barcode,
      price: item.price + '',
      discountType: item.discountType,
      discountValue: item.discountValue + '',
      stockQty: item.stockQty + '',
      categoryId: item.categoryId + '',
      active: item.active,
    });
    setEditModalVisible(true);
  };

  const handleUpdateProduct = async () => {
    try {
      const dto = {
        id: editData.id,
        name: editData.name,
        barcode: editData.barcode,
        price: parseFloat(editData.price),
        discountType: editData.discountType,
        discountValue: parseFloat(editData.discountValue),
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
      setEditModalVisible(false);
      Alert.alert("Success", "Product details updated!");
    } catch (error) {
      console.log("Update Error:", error);
      Alert.alert("Error", "Failed to update product");
    }
  };

  const handleAddProduct = async () => {
    try {
      if (!newProductData.name || !newProductData.price || !newProductData.categoryId || !newProductData.stockQty) {
        Alert.alert("Error", "Please fill in Name, Price, Category ID, and Stock Quantity.");
        return;
      }

      const dto = {
        id: newProductData.id || undefined,
        name: newProductData.name,
        barcode: newProductData.barcode,
        price: parseFloat(newProductData.price),
        discountType: newProductData.discountType,
        discountValue: parseFloat(newProductData.discountValue),
        stockQty: parseInt(newProductData.stockQty),
        categoryId: parseInt(newProductData.categoryId),
        active: true,
      };

      let response = await rootApi.post(
        `http://192.168.0.110:8085/api/billing/create/product`,
        dto
      );

      setProducts((prev) => [response.data, ...prev]);
      setNewProductData(initialNewProductState);
      setAddProductModalVisible(false);
      Alert.alert("Success", "New product added successfully!");
    } catch (error) {
      console.log("Add Product Error:", error);
      Alert.alert("Error", "Failed to add product. Check if the server is running and data is valid.");
    }
  };

  const handleAddCategory = async () => {
    try {
      if (!newCategoryData.name) {
        Alert.alert("Error", "Category name is required.");
        return;
      }

      const dto = {
        name: newCategoryData.name,
        defaultHsn: newCategoryData.defaultHsn,
        defaultGst: parseFloat(newCategoryData.defaultGst),
        active: newCategoryData.active,
      };

      await rootApi.post(`http://192.168.0.110:8085/api/billing/category/create`, dto);
      setNewCategoryData(initialNewCategoryState);
      setAddCategoryModalVisible(false);
      Alert.alert("Success", "Category added successfully!");
    } catch (error) {
      console.log("Add Category Error:", error);
      Alert.alert("Error", "Failed to add category.");
    }
  };

  const handlePrintPayload = () => {
    const payloadToPrint = {
      id: newProductData.id || null,
      name: newProductData.name,
      barcode: newProductData.barcode,
      price: parseFloat(newProductData.price) || 0,
      discountType: newProductData.discountType,
      discountValue: parseFloat(newProductData.discountValue) || 0,
      stockQty: parseInt(newProductData.stockQty) || 0,
      categoryId: parseInt(newProductData.categoryId) || 0,
      active: true,
    };

    console.log("--- DEBUG: New Product Payload ---");
    console.log(JSON.stringify(payloadToPrint, null, 2));
    console.log("----------------------------------");
    Alert.alert("Debug Info", "Product payload printed to console.");
  };

  const handleLogout = () => {
    setUserMenuModalVisible(false);
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

  // --- Change Password Handlers ---
  const handleChangePassword = () => {
    setUserMenuModalVisible(false); // Close the menu modal
    setPasswordFormData(initialPasswordFormData); // Reset form
    
    // Reset Visibility
    setShowOldPassword(false);
    setShowNewPassword(false);
    setShowConfirmPassword(false);

    setChangePasswordModalVisible(true); // Open the Change Password modal
  };

  const handleChangePasswordSubmit = async () => {
    const { oldPassword, newPassword, confirmNewPassword } = passwordFormData;

    if (!oldPassword || !newPassword || !confirmNewPassword) {
      Alert.alert("Error", "All fields are required.");
      return;
    }

    if (newPassword !== confirmNewPassword) {
      Alert.alert("Error", "New password and confirmation do not match.");
      return;
    }

    // Client-side validation for simple password strength can be added here
    if (newPassword.length < 6) {
        Alert.alert("Error", "New password must be at least 6 characters long.");
        return;
    }

    try {
      const dto = {
        oldPassword,
        newPassword,
        confirmNewPassword, // Sending all fields as per request, even if the backend only uses two
      };

      // API call to change password
      let response = await rootApi.post(
        `http://192.168.0.217:8080/api/auth/change-password`,
        dto
      );

      console.log("Password Change Response:", response.data);

      Alert.alert("Success", "Your password has been changed successfully!");
      setChangePasswordModalVisible(false);
      setPasswordFormData(initialPasswordFormData);

    } catch (error) {
      console.log("Change Password Error:", error);
      const errorMessage = error.response?.data?.message || "Failed to change password. Check your old password.";
      Alert.alert("Error", errorMessage);
    }
  };
  // --- END Change Password Handlers ---


  // Memoized FormInput component to prevent unnecessary re-renders
  const FormInput = useMemo(() => React.memo(({ label, value, onChangeText, keyboardType = 'default', isDropdown = false }) => (
    <View className="mb-3">
      <Text className="text-xs text-gray-500 uppercase font-bold mb-1">
        {label.replace(/([A-Z])/g, ' $1').trim()}
      </Text>
      {isDropdown ? (
        <View className="border border-gray-300 rounded-lg p-3 text-gray-800 bg-gray-50 focus:border-blue-500 focus:bg-white">
          <Text className="text-gray-800">{value}</Text>
        </View>
      ) : (
        <TextInput
          value={value?.toString()}
          onChangeText={onChangeText}
          className="border border-gray-300 rounded-lg p-3 text-gray-800 bg-gray-50 focus:border-blue-500 focus:bg-white"
          keyboardType={keyboardType}
          style={Platform.OS === 'web' ? { outline: 'none' } : undefined}
        />
      )}
    </View>
  )), []);

  const renderProduct = ({ item }) => (
    <View
      style={{
        flex: 1,
        margin: 8,
        maxWidth: isWeb ? `${(100 / numColumns) - 2}%` : '100%',
        minWidth: isWeb ? '30%' : '100%',
      }}
      className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden"
    >
      <View className={`h-2 w-full ${item.active ? 'bg-green-500' : 'bg-red-500'}`} />

      <View className="p-4">
        <View className="flex-row justify-between items-start mb-3">
          <View className="flex-1 pr-2">
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

        <View className="bg-gray-50 p-3 rounded-lg mb-4">
          <View className="flex-row justify-between mb-2">
            <View>
              <Text className="text-xs text-gray-400">ID</Text>
              <Text className="text-sm font-semibold text-gray-700">{item.id}</Text>
            </View>
            <View>
              <Text className="text-xs text-gray-400">Category</Text>
              <Text className="text-sm font-semibold text-gray-700">{item.categoryId}</Text>
            </View>
          </View>
          <View className="h-[1px] bg-gray-200 my-2" />

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

          {(item.discountValue > 0) && (
            <View className="mt-2 pt-2 border-t border-dashed border-gray-300">
              <Text className="text-xs text-orange-600 font-bold">
                Offer: {item.discountValue} {item.discountType === 'PERCENTAGE' ? '%' : 'Rs'} OFF
              </Text>
            </View>
          )}
        </View>

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

        <Text className={`text-center text-xs mt-2 font-bold ${item.active ? 'text-green-600' : 'text-red-400'}`}>
          Currently: {item.active ? 'Active' : 'Inactive'}
        </Text>
      </View>
    </View>
  );

  return (
    <View className="flex-1 bg-gray-100">
      <StatusBar barStyle="light-content" backgroundColor="#1E3A8A" />

      <View className="bg-blue-900 pb-6 pt-10 px-6 rounded-b-[30px] shadow-lg z-10">
        <View className="flex-row justify-between items-center mb-4">
          <View>
            <Text className="text-white text-2xl font-bold tracking-wide">Store Inventory</Text>
            <Text className="text-blue-200 text-sm">Total Products: {products.length}</Text>
          </View>
          
          {/* --- User Icon to open Menu Modal --- */}
          <TouchableOpacity 
            onPress={() => setUserMenuModalVisible(true)} 
            className="bg-blue-800 p-2 rounded-full border border-blue-700"
          >
            <FontAwesome5 name="user-circle" size={22} color="white" />
          </TouchableOpacity>
        </View>

        <View className="flex-row items-center bg-white rounded-full px-4 h-12 shadow-md mb-4">
          <Ionicons name="search" size={20} color="#9CA3AF" />
          <TextInput
            placeholder="Search Item Name or Barcode..."
            className="flex-1 ml-3 text-base text-gray-800 h-full"
            placeholderTextColor="#9CA3AF"
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={Platform.OS === 'web' ? { outline: 'none' } : undefined}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color="#9CA3AF" />
            </TouchableOpacity>
          )}
        </View>

        {/* ADD PRODUCT BUTTON */}
        <TouchableOpacity
          onPress={() => setAddProductModalVisible(true)}
          className="bg-green-500 py-3 rounded-xl shadow-lg flex-row items-center justify-center"
        >
          <Ionicons name="add-circle" size={24} color="white" />
          <Text className="text-white text-lg font-bold ml-2">Add New Product</Text>
        </TouchableOpacity>

        {/* ADD CATEGORY BUTTON */}
        <TouchableOpacity
          onPress={() => setAddCategoryModalVisible(true)}
          className="bg-purple-500 py-3 rounded-xl shadow-lg flex-row items-center justify-center mt-2"
        >
          <Ionicons name="add-circle" size={24} color="white" />
          <Text className="text-white text-lg font-bold ml-2">Add Category</Text>
        </TouchableOpacity>
      </View>

      <View className="flex-1 p-2">
        {loading ? (
          <ActivityIndicator size="large" color="#1E3A8A" className="mt-10" />
        ) : (
          <FlatList
            key={numColumns}
            data={filteredProducts}
            numColumns={numColumns}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderProduct}
            contentContainerStyle={{ paddingBottom: 100, paddingHorizontal: isWeb ? 10 : 0 }}
            columnWrapperStyle={isWeb ? { justifyContent: 'flex-start' } : undefined}
            ListEmptyComponent={
              <View className="items-center mt-20">
                <Feather name="box" size={50} color="#CBD5E1" />
                <Text className="text-gray-400 mt-4 text-lg">No products found</Text>
              </View>
            }
          />
        )}
      </View>

      {/* --------------------- EDIT MODAL --------------------- */}
      <Modal visible={editModalVisible} animationType="slide" transparent>
        <View className="flex-1 bg-black/50 justify-center items-center p-4">
          <View className="bg-white w-full max-w-lg rounded-2xl p-6 shadow-2xl max-h-[90%]">
            <Text className="text-xl font-bold text-center mb-4 text-gray-800">Edit Product Details</Text>
            <ScrollView showsVerticalScrollIndicator={false}>
              {Object.keys(editData).map(key => {
                // HSN and GST are hidden here for simplicity
                if(['active', 'discountType', 'hsnCode', 'gstPercent'].includes(key)) return null;

                let keyboard = ['id', 'price', 'discountValue', 'stockQty', 'categoryId'].includes(key) ? 'numeric' : 'default';

                return (
                  <FormInput
                    key={key}
                    label={key}
                    value={editData[key]?.toString()}
                    onChangeText={(val) => setEditData(prev => ({ ...prev, [key]: val }))}
                    keyboardType={keyboard}
                  />
                );
              })}
            </ScrollView>
            <View className="mt-4 gap-2">
              <TouchableOpacity onPress={handleUpdateProduct} className="bg-blue-600 py-3 rounded-lg">
                <Text className="text-white text-center font-bold text-lg">Update Item</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setEditModalVisible(false)} className="bg-gray-200 py-3 rounded-lg">
                <Text className="text-gray-700 text-center font-bold text-lg">Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* --------------------- ADD PRODUCT MODAL --------------------- */}
      <Modal visible={addProductModalVisible} animationType="slide" transparent>
        <View className="flex-1 bg-black/50 justify-center items-center p-4">
          <View className="bg-white w-full max-w-lg rounded-2xl p-6 shadow-2xl max-h-[90%]">
            <Text className="text-xl font-bold text-center mb-4 text-gray-800">Add New Product</Text>
            <ScrollView showsVerticalScrollIndicator={false}>
              {Object.keys(initialNewProductState).map(key => {
                // HSN and GST are hidden here for simplicity
                if(['hsnCode', 'gstPercent'].includes(key)) return null;

                let keyboard = ['price', 'discountValue', 'stockQty', 'categoryId'].includes(key) ? 'numeric' : 'default';
                const isDropdown = key === 'discountType';

                return (
                  <FormInput
                    key={key}
                    label={key}
                    value={newProductData[key]?.toString()}
                    onChangeText={(val) => setNewProductData(prev => ({ ...prev, [key]: val }))}
                    keyboardType={keyboard}
                    isDropdown={isDropdown}
                  />
                );
              })}
            </ScrollView>
            <View className="mt-4 gap-2">
              <TouchableOpacity onPress={handlePrintPayload} className="bg-yellow-500 py-3 rounded-lg flex-row items-center justify-center">
                <Feather name="code" size={20} color="white" />
                <Text className="text-white text-center font-bold text-lg ml-2">Print Payload to Console</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleAddProduct} className="bg-green-600 py-3 rounded-lg">
                <Text className="text-white text-center font-bold text-lg">Add Product</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => { setAddProductModalVisible(false); setNewProductData(initialNewProductState); }} className="bg-gray-200 py-3 rounded-lg">
                <Text className="text-gray-700 text-center font-bold text-lg">Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* --------------------- ADD CATEGORY MODAL --------------------- */}
      <Modal visible={addCategoryModalVisible} animationType="slide" transparent>
        <View className="flex-1 bg-black/50 justify-center items-center p-4">
          <View className="bg-white w-full max-w-lg rounded-2xl p-6 shadow-2xl max-h-[90%]">
            <Text className="text-xl font-bold text-center mb-4 text-gray-800">Add New Category</Text>
            <ScrollView showsVerticalScrollIndicator={false}>
              <View className="mb-3">
                <Text className="text-xs text-gray-500 uppercase font-bold mb-1">Name</Text>
                <TextInput
                  value={newCategoryData.name}
                  onChangeText={(text) => setNewCategoryData(prev => ({ ...prev, name: text }))}
                  className="border border-gray-300 rounded-lg p-3 text-gray-800 bg-gray-50 focus:border-blue-500 focus:bg-white"
                />
              </View>
              <View className="mb-3">
                <Text className="text-xs text-gray-500 uppercase font-bold mb-1">Default HSN</Text>
                <TextInput
                  value={newCategoryData.defaultHsn}
                  onChangeText={(text) => setNewCategoryData(prev => ({ ...prev, defaultHsn: text }))}
                  className="border border-gray-300 rounded-lg p-3 text-gray-800 bg-gray-50 focus:border-blue-500 focus:bg-white"
                />
              </View>
              <View className="mb-3">
                <Text className="text-xs text-gray-500 uppercase font-bold mb-1">Default GST</Text>
                <TextInput
                  value={newCategoryData.defaultGst}
                  onChangeText={(text) => setNewCategoryData(prev => ({ ...prev, defaultGst: text }))}
                  keyboardType="numeric"
                  className="border border-gray-300 rounded-lg p-3 text-gray-800 bg-gray-50 focus:border-blue-500 focus:bg-white"
                />
              </View>
              <View className="mb-3">
                <Text className="text-xs text-gray-500 uppercase font-bold mb-1">Active</Text>
                <TouchableOpacity
                  onPress={() => setNewCategoryData(prev => ({ ...prev, active: !prev.active }))}
                  className={`p-3 rounded-lg ${newCategoryData.active ? 'bg-green-100' : 'bg-red-100'}`}
                >
                  <Text className={`font-bold ${newCategoryData.active ? 'text-green-700' : 'text-red-700'}`}>
                    {newCategoryData.active ? 'Active' : 'Inactive'}
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
            <View className="mt-4 gap-2">
              <TouchableOpacity onPress={handleAddCategory} className="bg-green-600 py-3 rounded-lg">
                <Text className="text-white text-center font-bold text-lg">Add Category</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => { setAddCategoryModalVisible(false); setNewCategoryData(initialNewCategoryState); }} className="bg-gray-200 py-3 rounded-lg">
                <Text className="text-gray-700 text-center font-bold text-lg">Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      
      {/* --------------------- USER MENU MODAL --------------------- */}
      <Modal visible={userMenuModalVisible} animationType="fade" transparent>
          <TouchableOpacity 
              className="flex-1 bg-black/30 items-end justify-start pt-10" 
              onPress={() => setUserMenuModalVisible(false)} 
              activeOpacity={1}
          >
              <View className="bg-white w-56 rounded-lg shadow-xl overflow-hidden mt-6 mr-3">
                  
                  <Text className="p-3 text-sm text-gray-500 border-b border-gray-100 font-semibold">User Actions</Text>

                  {/* Change Password Option - Calls new handler */}
                  <TouchableOpacity 
                      onPress={handleChangePassword} 
                      className="flex-row items-center p-3 active:bg-gray-50"
                  >
                      <MaterialIcons name="lock-outline" size={20} color="#2563EB" />
                      <Text className="text-gray-700 ml-3 font-medium">Change Password</Text>
                  </TouchableOpacity>

                  {/* Logout Option */}
                  <TouchableOpacity 
                      onPress={handleLogout}
                      className="flex-row items-center p-3 border-t border-gray-200 active:bg-gray-50"
                  >
                      <MaterialIcons name="logout" size={20} color="#DC2626" />
                      <Text className="text-red-600 ml-3 font-medium">Logout</Text>
                  </TouchableOpacity>
              </View>
          </TouchableOpacity>
      </Modal>
      
      {/* --------------------- NEW: CHANGE PASSWORD MODAL --------------------- */}
      <Modal visible={changePasswordModalVisible} animationType="slide" transparent>
        <View className="flex-1 bg-black/50 justify-center items-center p-4">
          <View className="bg-white w-full max-w-sm rounded-2xl p-6 shadow-2xl">
            <Text className="text-xl font-bold text-center mb-6 text-gray-800">Change Password</Text>
            
            <View className="gap-4">
              {/* Old Password */}
              <View>
                <Text className="text-xs text-gray-500 uppercase font-bold mb-1">Old Password</Text>
                <View className="relative justify-center">
                  <TextInput
                    value={passwordFormData.oldPassword}
                    onChangeText={(text) => setPasswordFormData(prev => ({ ...prev, oldPassword: text }))}
                    secureTextEntry={!showOldPassword}
                    placeholder="Enter old password"
                    className="border border-gray-300 rounded-lg p-3 text-gray-800 bg-gray-50 pr-10"
                  />
                  <TouchableOpacity 
                    onPress={() => setShowOldPassword(!showOldPassword)}
                    className="absolute right-3"
                  >
                    <Ionicons 
                      name={showOldPassword ? "eye" : "eye-off"} 
                      size={20} 
                      color="gray" 
                    />
                  </TouchableOpacity>
                </View>
              </View>

              {/* New Password */}
              <View>
                <Text className="text-xs text-gray-500 uppercase font-bold mb-1">New Password</Text>
                <View className="relative justify-center">
                  <TextInput
                    value={passwordFormData.newPassword}
                    onChangeText={(text) => setPasswordFormData(prev => ({ ...prev, newPassword: text }))}
                    secureTextEntry={!showNewPassword}
                    placeholder="Enter new password"
                    className="border border-gray-300 rounded-lg p-3 text-gray-800 bg-gray-50 pr-10"
                  />
                  <TouchableOpacity 
                    onPress={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3"
                  >
                    <Ionicons 
                      name={showNewPassword ? "eye" : "eye-off"} 
                      size={20} 
                      color="gray" 
                    />
                  </TouchableOpacity>
                </View>
              </View>
              
              {/* Confirm New Password */}
              <View>
                <Text className="text-xs text-gray-500 uppercase font-bold mb-1">Confirm New Password</Text>
                <View className="relative justify-center">
                  <TextInput
                    value={passwordFormData.confirmNewPassword}
                    onChangeText={(text) => setPasswordFormData(prev => ({ ...prev, confirmNewPassword: text }))}
                    secureTextEntry={!showConfirmPassword}
                    placeholder="Confirm new password"
                    className="border border-gray-300 rounded-lg p-3 text-gray-800 bg-gray-50 pr-10"
                  />
                   <TouchableOpacity 
                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3"
                  >
                    <Ionicons 
                      name={showConfirmPassword ? "eye" : "eye-off"} 
                      size={20} 
                      color="gray" 
                    />
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            <View className="mt-6 gap-3">
              <TouchableOpacity onPress={handleChangePasswordSubmit} className="bg-blue-600 py-3 rounded-lg">
                <Text className="text-white text-center font-bold text-lg">Save New Password</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                onPress={() => setChangePasswordModalVisible(false)} 
                className="bg-gray-200 py-3 rounded-lg"
              >
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