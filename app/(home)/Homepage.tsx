import { Feather, FontAwesome5, Ionicons, MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
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
  const [selectedCategory, setSelectedCategory] = useState('All');

  const [editModalVisible, setEditModalVisible] = useState(false);
  const [addProductModalVisible, setAddProductModalVisible] = useState(false);
  const [userMenuModalVisible, setUserMenuModalVisible] = useState(false);
  const [changePasswordModalVisible, setChangePasswordModalVisible] = useState(false);
  const [categoryDropdownVisible, setCategoryDropdownVisible] = useState(false); 

  const [hoveredButton, setHoveredButton] = useState(null); 

  const [newProductData, setNewProductData] = useState(initialNewProductState);
  const [passwordFormData, setPasswordFormData] = useState(initialPasswordFormData);

  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // Custom Dropdown State
  const [showDiscountDropdown, setShowDiscountDropdown] = useState(false);

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
      let response = await rootApi.get(`api/billing/all`);
      // SORT BY ID ASCENDING
      const sortedProducts = response.data.sort((a, b) => a.id - b.id);
      setProducts(sortedProducts);
    } catch (error) {
      console.log('Fetch Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const categories = useMemo(() => {
    const cats = products.map(p => p.categoryId?.toString()).filter(Boolean);
    return ['All', ...new Set(cats)];
  }, [products]);

  const filteredProducts = products.filter((item) => {
    const matchesSearch = (item.name && item.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (item.barcode && item.barcode.includes(searchQuery));

    const matchesCategory = selectedCategory === 'All' || item.categoryId?.toString() === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  const toggleProductStatus = async (item) => {
    try {
      // Optimistic update
      const updatedProducts = products.map((p) =>
        p.id === item.id ? { ...p, active: !p.active } : p
      );
      setProducts(updatedProducts);

      const url = item.active
        ? `/api/billing/status/${item.id}?status=${false}`
        : `/api/billing/status/${item.id}?status=${true}`;

      console.log("Toggling Status for ID:", item.id, "URL:", url);

      await rootApi.put(url);
    } catch (error) {
      console.log('Toggle Error:', error);
      Alert.alert("Error", "Status update failed. Reverting changes.");
      fetchProducts();
    }
  };

  const openEditModal = (item) => {
    setEditData({
      id: item.id + '',
      name: item.name,
      barcode: item.barcode,
      price: item.price + '',
      discountType: item.discountType || 'PERCENTAGE',
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
        `http://192.168.0.217:8080/api/billing/product/${editData.id}`,
        dto
      );

      // --- BUG FIX HERE: Ensure ID comparison uses toString() to match types ---
      setProducts((prev) =>
        prev.map((p) => (p.id.toString() === editData.id.toString() ? response.data : p)).sort((a, b) => a.id - b.id)
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
        `http://192.168.0.217:8080/api/billing/create/product`,
        dto
      );

      setProducts((prev) => [...prev, response.data].sort((a, b) => a.id - b.id));
      
      setNewProductData(initialNewProductState);
      setAddProductModalVisible(false);
      Alert.alert("Success", "New product added successfully!");
    } catch (error) {
      console.log("Add Product Error:", error);
      Alert.alert("Error", "Failed to add product. Check if the server is running and data is valid.");
    }
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

  const handleChangePassword = () => {
    setUserMenuModalVisible(false);
    setPasswordFormData(initialPasswordFormData);
    setShowOldPassword(false);
    setShowNewPassword(false);
    setShowConfirmPassword(false);
    setChangePasswordModalVisible(true);
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

    if (newPassword.length < 6) {
      Alert.alert("Error", "New password must be at least 6 characters long.");
      return;
    }

    try {
      const dto = {
        oldPassword,
        newPassword,
        confirmNewPassword,
      };

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

  const ModernFormInput = useCallback(({ label, value, onChangeText, keyboardType = 'default', isDropdown = false, icon, placeholder }) => (
    <View className="mb-4 flex-1">
      <Text className="text-xs text-gray-500 font-bold mb-1.5 uppercase tracking-wider">
        {label.replace(/([A-Z])/g, ' $1').trim()}
      </Text>
      <View className="flex-row items-center border border-gray-300 rounded-xl bg-gray-50 focus:border-blue-500 focus:bg-white overflow-hidden h-12">
        {icon && (
          <View className="pl-3 pr-2 border-r border-gray-200">
            <Ionicons name={icon} size={20} color="#6B7280" />
          </View>
        )}
        {isDropdown ? (
          <View className="flex-1 justify-center px-3">
            <Text className="text-gray-800">{value}</Text>
          </View>
        ) : (
          <TextInput
            value={value?.toString()}
            onChangeText={onChangeText}
            className="flex-1 px-3 text-gray-800 text-base"
            keyboardType={keyboardType}
            placeholder={placeholder}
            placeholderTextColor="#9CA3AF"
            style={Platform.OS === 'web' ? { outline: 'none' } : undefined}
          />
        )}
      </View>
    </View>
  ), []);

  // --- UPDATED MODAL DROPDOWN COMPONENT ---
  const DiscountTypeSelector = ({ value, onSelect }) => {
    const [modalVisible, setModalVisible] = useState(false);
    
    const getLabel = (val) => {
        if(val === 'PERCENTAGE') return '% Percentage';
        if(val === 'FLAT') return '₹ Flat Amount'; 
        return 'Select Type';
    };

    const handleSelect = (val) => {
        onSelect(val);
        setModalVisible(false);
    };

    return (
      <View className="mb-4 flex-1">
        <Text className="text-xs text-gray-500 font-bold mb-1.5 uppercase tracking-wider">Discount Type</Text>
        <TouchableOpacity 
          onPress={() => setModalVisible(true)}
          className="flex-row items-center border border-gray-300 rounded-xl bg-gray-50 h-12 px-3 justify-between active:bg-gray-100"
        >
           <View className="flex-row items-center">
              <View className="pr-2 border-r border-gray-200 mr-2">
                 <Ionicons name="pricetag" size={20} color="#6B7280" />
              </View>
              <Text className="text-gray-800 text-base">{getLabel(value)}</Text>
           </View>
           <Ionicons name="chevron-down" size={20} color="#6B7280" />
        </TouchableOpacity>
        
        {/* Modal for Selection */}
        <Modal visible={modalVisible} transparent animationType="fade">
            <TouchableOpacity 
                className="flex-1 bg-black/50 justify-center items-center p-4"
                activeOpacity={1}
                onPress={() => setModalVisible(false)}
            >
                <View className="bg-white w-full max-w-xs rounded-2xl overflow-hidden shadow-xl p-4">
                    <Text className="text-lg font-bold text-gray-800 mb-4 text-center">Select Discount Type</Text>
                    
                    <TouchableOpacity 
                        onPress={() => handleSelect('PERCENTAGE')}
                        className={`p-4 border border-gray-200 rounded-xl mb-3 flex-row items-center ${value === 'PERCENTAGE' ? 'bg-blue-50 border-blue-500' : 'bg-gray-50'}`}
                    >
                        <Ionicons name="pricetag-outline" size={20} color={value === 'PERCENTAGE' ? '#2563EB' : 'gray'} />
                        <Text className={`ml-3 text-base font-semibold ${value === 'PERCENTAGE' ? 'text-blue-700' : 'text-gray-700'}`}>% Percentage</Text>
                    </TouchableOpacity>

                    <TouchableOpacity 
                        onPress={() => handleSelect('FLAT')}
                        className={`p-4 border border-gray-200 rounded-xl flex-row items-center ${value === 'FLAT' ? 'bg-blue-50 border-blue-500' : 'bg-gray-50'}`}
                    >
                        <Ionicons name="cash-outline" size={20} color={value === 'FLAT' ? '#2563EB' : 'gray'} />
                        <Text className={`ml-3 text-base font-semibold ${value === 'FLAT' ? 'text-blue-700' : 'text-gray-700'}`}>₹ Flat Amount</Text>
                    </TouchableOpacity>

                </View>
            </TouchableOpacity>
        </Modal>
      </View>
    );
  };

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

      <View className="bg-blue-900 pt-10 pb-4 px-4 rounded-b-3xl shadow-lg z-10">
        <View className="flex-row justify-between items-center mb-3">
          <View>
            <Text className="text-white text-xl font-bold tracking-wide">Store Inventory</Text>
            <Text className="text-blue-200 text-xs">Total Products: {products.length}</Text>
          </View>

          <TouchableOpacity
            onPress={() => setUserMenuModalVisible(true)}
            className="bg-blue-800 p-2 rounded-full border border-blue-700"
          >
            <FontAwesome5 name="user-circle" size={20} color="white" />
          </TouchableOpacity>
        </View>

        <View className="flex-row items-center bg-white rounded-full px-3 h-10 shadow-sm">
          <Ionicons name="search" size={18} color="#9CA3AF" />
          <TextInput
            placeholder="Search Products..."
            className="flex-1 ml-2 text-base text-gray-800 h-full"
            placeholderTextColor="#9CA3AF"
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={Platform.OS === 'web' ? { outline: 'none' } : undefined}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={18} color="#9CA3AF" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* --- DROPDOWN TRIGGER --- */}
      <View className="flex-row items-center justify-between px-4 py-3 bg-gray-100 z-0">
        <View className="w-64 mr-4">
          <TouchableOpacity
            onPress={() => setCategoryDropdownVisible(true)}
            className="flex-row items-center justify-between bg-white px-4 py-3 rounded-xl border border-gray-200"
          >
            <Text className="text-gray-700 font-bold">
              {selectedCategory === 'All' ? 'All Items' : `Category: ${selectedCategory}`}
            </Text>
            <Ionicons name="chevron-down" size={20} color="#6B7280" />
          </TouchableOpacity>
        </View>

        <View className="flex-row gap-2 relative z-50">
          <View>
            <TouchableOpacity
              onPress={() => setAddProductModalVisible(true)}
              onMouseEnter={() => setHoveredButton('product')}
              onMouseLeave={() => setHoveredButton(null)}
              className="bg-green-600 w-10 h-10 rounded-full items-center justify-center shadow-md"
            >
              <Ionicons name="add" size={24} color="white" />
            </TouchableOpacity>
            {hoveredButton === 'product' && (
              <View className="absolute top-2 right-12 bg-gray-800 px-2 py-1 rounded shadow-lg z-50 whitespace-nowrap">
                <Text className="text-white text-xs font-bold">Add Product</Text>
              </View>
            )}
          </View>
        </View>
      </View>

      <View className="flex-1 px-2">
        {loading ? (
          <ActivityIndicator size="large" color="#1E3A8A" className="mt-10" />
        ) : (
          <FlatList
            key={numColumns}
            data={filteredProducts}
            numColumns={numColumns}
            keyExtractor={(item, index) => item.id ? item.id.toString() : index.toString()}
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

      {/* --- EDIT MODAL --- */}
      <Modal visible={editModalVisible} animationType="slide" transparent>
        <View className="flex-1 bg-black/60 justify-center items-center p-4 backdrop-blur-sm">
          <View className="bg-white w-full max-w-2xl rounded-3xl p-6 shadow-2xl max-h-[90%] border border-gray-100">
            <Text className="text-2xl font-bold text-center mb-6 text-gray-800 border-b pb-4 border-gray-100">Edit Product</Text>

            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              <View className="flex-row gap-4">
                <ModernFormInput label="Name" value={editData.name} onChangeText={(t) => setEditData({...editData, name: t})} icon="pricetag" />
                <ModernFormInput label="Barcode" value={editData.barcode} onChangeText={(t) => setEditData({...editData, barcode: t})} icon="qr-code" />
              </View>

              <View className="flex-row gap-4">
                <ModernFormInput label="Price" value={editData.price} onChangeText={(t) => setEditData({...editData, price: t})} keyboardType="numeric" icon="cash" />
                <ModernFormInput label="Stock" value={editData.stockQty} onChangeText={(t) => setEditData({...editData, stockQty: t})} keyboardType="numeric" icon="layers" />
              </View>

              <View className="flex-row gap-4">
                <ModernFormInput label="Category ID" value={editData.categoryId} onChangeText={(t) => setEditData({...editData, categoryId: t})} keyboardType="numeric" icon="list" />
                {/* MODAL Discount Selector */}
                <DiscountTypeSelector 
                    value={editData.discountType} 
                    onSelect={(val) => setEditData({...editData, discountType: val})} 
                />
              </View>
              
              <View className="flex-row gap-4">
                <ModernFormInput label="Discount Value" value={editData.discountValue} onChangeText={(t) => setEditData({...editData, discountValue: t})} keyboardType="numeric" icon="trending-down" />
                <View className="flex-1" />
              </View>
            </ScrollView>

            <View className="mt-6 flex-row gap-4">
              <TouchableOpacity onPress={() => setEditModalVisible(false)} className="flex-1 bg-gray-100 py-4 rounded-xl border border-gray-200">
                <Text className="text-gray-600 text-center font-bold text-lg">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleUpdateProduct} className="flex-1 bg-blue-600 py-4 rounded-xl shadow-lg">
                <Text className="text-white text-center font-bold text-lg">Save Changes</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* --- ADD PRODUCT MODAL --- */}
      <Modal visible={addProductModalVisible} animationType="fade" transparent>
        <View className="flex-1 bg-black/60 justify-center items-center p-4">
          <View className="bg-white w-full max-w-2xl rounded-3xl p-8 shadow-2xl max-h-[90%] border border-gray-100">
            <View className="flex-row items-center justify-center mb-6 pb-4 border-b border-gray-100">
              <View className="bg-green-100 p-3 rounded-full mr-3">
                <Ionicons name="add" size={24} color="green" />
              </View>
              <Text className="text-2xl font-bold text-gray-800">Add New Product</Text>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              <Text className="text-gray-400 font-bold mb-3 text-xs uppercase">Basic Information</Text>
              
              <ModernFormInput
                label="Product ID (Optional)"
                placeholder="Auto-generated if empty"
                value={newProductData.id}
                onChangeText={(t) => setNewProductData(prev => ({ ...prev, id: t }))}
                keyboardType="numeric"
                icon="key-outline"
              />

              <View className="flex-row gap-3">
                <ModernFormInput
                  label="Product Name"
                  placeholder="Ex: Milk 1L"
                  value={newProductData.name}
                  onChangeText={(t) => setNewProductData(prev => ({ ...prev, name: t }))}
                  icon="pricetag-outline"
                />
                <ModernFormInput
                  label="Barcode"
                  placeholder="Scan or Type"
                  value={newProductData.barcode}
                  onChangeText={(t) => setNewProductData(prev => ({ ...prev, barcode: t }))}
                  icon="qr-code-outline"
                />
              </View>

              <Text className="text-gray-400 font-bold mb-3 mt-2 text-xs uppercase">Pricing & Inventory</Text>
              <View className="flex-row gap-3">
                <ModernFormInput
                  label="Price (MRP)"
                  placeholder="0.00"
                  value={newProductData.price}
                  onChangeText={(t) => setNewProductData(prev => ({ ...prev, price: t }))}
                  keyboardType="numeric"
                  icon="cash-outline"
                />
                <ModernFormInput
                  label="Stock Qty"
                  placeholder="0"
                  value={newProductData.stockQty}
                  onChangeText={(t) => setNewProductData(prev => ({ ...prev, stockQty: t }))}
                  keyboardType="numeric"
                  icon="cube-outline"
                />
              </View>

              <View className="flex-row gap-3">
                <ModernFormInput
                  label="Category ID"
                  placeholder="ID"
                  value={newProductData.categoryId}
                  onChangeText={(t) => setNewProductData(prev => ({ ...prev, categoryId: t }))}
                  keyboardType="numeric"
                  icon="list-outline"
                />
                {/* MODAL Discount Selector */}
                <DiscountTypeSelector 
                    value={newProductData.discountType} 
                    onSelect={(val) => setNewProductData(prev => ({...prev, discountType: val}))} 
                />
              </View>
              
              <View className="flex-row gap-3">
                  <ModernFormInput
                    label="Discount Value"
                    placeholder="0"
                    value={newProductData.discountValue}
                    onChangeText={(t) => setNewProductData(prev => ({ ...prev, discountValue: t }))}
                    keyboardType="numeric"
                    icon="trending-down-outline"
                  />
                  <View className="flex-1"/>
              </View>
            </ScrollView>

            <View className="mt-6 flex-row gap-3">
              <TouchableOpacity onPress={() => { setAddProductModalVisible(false); setNewProductData(initialNewProductState); }} className="flex-1 bg-gray-100 py-4 rounded-xl">
                <Text className="text-gray-600 text-center font-bold text-lg">Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity onPress={handleAddProduct} className="flex-1 bg-green-600 py-4 rounded-xl shadow-md">
                <Text className="text-white text-center font-bold text-lg">Save Product</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* --- USER MENU MODAL --- */}
      <Modal visible={userMenuModalVisible} animationType="fade" transparent>
        <TouchableOpacity
          className="flex-1 bg-black/30 items-end justify-start pt-10"
          onPress={() => setUserMenuModalVisible(false)}
          activeOpacity={1}
        >
          <View className="bg-white w-56 rounded-lg shadow-xl overflow-hidden mt-6 mr-3">
            <Text className="p-3 text-sm text-gray-500 border-b border-gray-100 font-semibold">User Actions</Text>
            <TouchableOpacity
              onPress={handleChangePassword}
              className="flex-row items-center p-3 active:bg-gray-50"
            >
              <MaterialIcons name="lock-outline" size={20} color="#2563EB" />
              <Text className="text-gray-700 ml-3 font-medium">Change Password</Text>
            </TouchableOpacity>
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

      {/* --- CHANGE PASSWORD MODAL --- */}
      <Modal visible={changePasswordModalVisible} animationType="slide" transparent>
        <View className="flex-1 bg-black/50 justify-center items-center p-4">
          <View className="bg-white w-full max-w-sm rounded-2xl p-6 shadow-2xl">
            <Text className="text-xl font-bold text-center mb-6 text-gray-800">Change Password</Text>
            <View className="gap-4">
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
                  <TouchableOpacity onPress={() => setShowOldPassword(!showOldPassword)} className="absolute right-3">
                    <Ionicons name={showOldPassword ? "eye" : "eye-off"} size={20} color="gray" />
                  </TouchableOpacity>
                </View>
              </View>
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
                  <TouchableOpacity onPress={() => setShowNewPassword(!showNewPassword)} className="absolute right-3">
                    <Ionicons name={showNewPassword ? "eye" : "eye-off"} size={20} color="gray" />
                  </TouchableOpacity>
                </View>
              </View>
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
                  <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3">
                    <Ionicons name={showConfirmPassword ? "eye" : "eye-off"} size={20} color="gray" />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
            <View className="mt-6 gap-3">
              <TouchableOpacity onPress={handleChangePasswordSubmit} className="bg-blue-600 py-3 rounded-lg">
                <Text className="text-white text-center font-bold text-lg">Save New Password</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setChangePasswordModalVisible(false)} className="bg-gray-200 py-3 rounded-lg">
                <Text className="text-gray-700 text-center font-bold text-lg">Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* --- NEW CATEGORY DROPDOWN MODAL --- */}
      <Modal visible={categoryDropdownVisible} transparent animationType="fade">
        <TouchableOpacity
          className="flex-1 bg-black/50 justify-center items-center p-4"
          activeOpacity={1}
          onPress={() => setCategoryDropdownVisible(false)}
        >
          <View className="bg-white w-full max-w-sm rounded-2xl overflow-hidden shadow-xl">
            <View className="p-4 border-b border-gray-100 flex-row justify-between items-center bg-gray-50">
              <Text className="font-bold text-lg text-gray-800">Select Category</Text>
              <TouchableOpacity onPress={() => setCategoryDropdownVisible(false)}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>
            <ScrollView style={{ maxHeight: 300 }}>
              {categories.map((cat, index) => (
                <TouchableOpacity
                  key={index}
                  onPress={() => {
                    setSelectedCategory(cat);
                    setCategoryDropdownVisible(false);
                  }}
                  className={`p-4 border-b border-gray-100 flex-row justify-between items-center ${selectedCategory === cat ? 'bg-blue-50' : ''}`}
                >
                  <Text className={`text-base ${selectedCategory === cat ? 'text-blue-600 font-bold' : 'text-gray-700'}`}>
                    {cat === 'All' ? 'All Items' : `Category: ${cat}`}
                  </Text>
                  {selectedCategory === cat && <Ionicons name="checkmark" size={20} color="#2563EB" />}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

    </View>
  );
};

export default Homepage;