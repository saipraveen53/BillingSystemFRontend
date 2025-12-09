import { Feather, Ionicons, MaterialIcons } from '@expo/vector-icons';
import axios from 'axios';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Platform,
  RefreshControl,
  ScrollView,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useWindowDimensions
} from 'react-native';
import { rootApi } from '../(utils)/axiosInstance';

// --- REUSABLE MODERN INPUT COMPONENT (Updated with Eye Icon Logic) ---
const ModernFormInput = ({ label, value, onChangeText, keyboardType = 'default', isPassword = false, icon, placeholder }) => {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <View className="mb-4 flex-1">
      <Text className="text-xs text-gray-500 font-bold mb-1.5 uppercase tracking-wider">
        {label}
      </Text>
      <View className="flex-row items-center border border-gray-300 rounded-xl bg-gray-50 focus:border-blue-500 focus:bg-white overflow-hidden h-12">
        {icon && (
          <View className="pl-3 pr-2 border-r border-gray-200">
            <Ionicons name={icon} size={20} color="#6B7280" />
          </View>
        )}
        <TextInput
          value={value}
          onChangeText={onChangeText}
          className="flex-1 px-3 text-gray-800 text-base"
          keyboardType={keyboardType}
          secureTextEntry={isPassword && !showPassword} // Toggle logic
          placeholder={placeholder}
          placeholderTextColor="#9CA3AF"
          style={Platform.OS === 'web' ? { outline: 'none' } : undefined}
        />
        {/* Eye Icon for Password Fields */}
        {isPassword && (
          <TouchableOpacity onPress={() => setShowPassword(!showPassword)} className="px-3">
             <Ionicons name={showPassword ? "eye" : "eye-off"} size={20} color="#6B7280" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const Cashiers = () => {
  const { width } = useWindowDimensions();
  const isWeb = width > 900;
  // Grid Layout: 3 columns for web, 1 for mobile
  const numColumns = isWeb ? 3 : 1;

  const [modalVisible, setModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);
  const [cashiers, setCashiers] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  
  // Search State
  const [searchQuery, setSearchQuery] = useState('');
  // Tooltip State
  const [hoveredButton, setHoveredButton] = useState(null);

  // Form States
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");

  // --- 1. FETCH CASHIERS ---
  useEffect(() => {
    fetchCashiers();
  }, []);

  const fetchCashiers = async () => {
    try {
      setDataLoading(true);
      const response = await rootApi.get("api/user/allCashiers");
      console.log("Fetched Cashiers Data:", response.data);
      // FIX 1: Sort by ID Ascending
      const sortedCashiers = response.data.sort((a, b) => a.id - b.id);
      setCashiers(sortedCashiers);
    } catch (error) {
      console.log("Fetch Error:", error);
    } finally {
      setDataLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchCashiers();
  };

  // --- 2. TOGGLE STATUS LOGIC (FIXED) ---
  const toggleCashierStatus = async (item) => {
    // FIX: Check both 'active' and 'isActive' properties
    const currentStatus = item.active === true || item.isActive === true;
    const newStatus = !currentStatus;

    // Optimistic Update
    const updatedCashiers = cashiers.map((c) =>
      c.id === item.id ? { ...c, active: newStatus, isActive: newStatus } : c
    );
    setCashiers(updatedCashiers);

    try {
      console.log(`Updating Cashier ID: ${item.id} from ${currentStatus} to ${newStatus}`);
      
      await rootApi.put(`/api/user/statusUpdate/${item.id}?status=${newStatus}`);
      
      console.log("Status Updated Successfully on Server");
    } catch (error) {
      console.error("Status Update Error:", error);
      Alert.alert("Error", "Failed to update status. Reverting changes.");
      fetchCashiers();
    }
  };

  // --- Filter Logic ---
  const filteredCashiers = cashiers.filter((item) => {
    const query = searchQuery.toLowerCase();
    return (
      (item.name && item.name.toLowerCase().includes(query)) ||
      (item.email && item.email.toLowerCase().includes(query)) ||
      (item.phone && item.phone.includes(query))
    );
  });

  const handleAddCashier = async () => {
    if (!name || !email || !phone || !password) {
      Alert.alert("Error", "All fields are required!");
      return;
    }

    const payload = {
      name,
      email,
      phone,
      password,
    };

    try {
      setLoading(true);
      let response = await axios.post(
        "http://192.168.0.217:8080/api/auth/register",
        payload
      );

      console.log("Cashier Registered:", response.data);
      Alert.alert("Success", "Cashier Added Successfully!");

      // Reset Form
      setName("");
      setEmail("");
      setPhone("");
      setPassword("");
      setModalVisible(false);

      fetchCashiers();

    } catch (error) {
      console.log("Register Error:", error);
      Alert.alert("Error", "Failed to register cashier. Please check network/server.");
    } finally {
      setLoading(false);
    }
  };

  // --- CASHIER CARD RENDER (ID CARD STYLE) ---
  const renderCashierItem = ({ item }) => {
    // FIX: Check both properties to ensure UI updates correctly
    const isActive = item.active === true || item.isActive === true;

    return (
      <View
        style={{
            flex: 1,
            margin: 8,
            maxWidth: isWeb ? `${(100 / numColumns) - 2}%` : '100%',
            minWidth: isWeb ? '30%' : '100%',
        }}
        className={`bg-white rounded-3xl p-6 shadow-sm border items-center relative ${isActive ? 'border-gray-100' : 'border-red-100 bg-red-50/10'}`}
      >
        {/* Active Status - Top Right */}
        <View className={`absolute top-4 right-4 px-2 py-1 rounded-md ${isActive ? 'bg-green-100' : 'bg-red-100'}`}>
          <Text className={`text-[10px] font-bold uppercase ${isActive ? 'text-green-700' : 'text-red-700'}`}>
            {isActive ? 'Active' : 'Inactive'}
          </Text>
        </View>

        {/* Removed 3 dots from Left side as requested */}

        {/* Avatar / Initial - Centered & Large */}
        <View className={`h-24 w-24 rounded-full items-center justify-center border-4 mb-4 mt-2 shadow-inner ${isActive ? 'bg-blue-50 border-blue-100' : 'bg-gray-100 border-gray-200'}`}>
          <Text className={`text-4xl font-bold ${isActive ? 'text-blue-600' : 'text-gray-400'}`}>
            {item.name ? item.name.charAt(0).toUpperCase() : "U"}
          </Text>
        </View>

        {/* Details - Centered */}
        <Text className={`text-xl font-bold mb-1 text-center ${isActive ? 'text-gray-800' : 'text-gray-500'}`} numberOfLines={1}>
          {item.name}
        </Text>
        
        {/* Display ID for reference */}
        <Text className="text-xs text-gray-400 font-mono mb-2">ID: {item.id}</Text>

        <View className="flex-row items-center mt-2 bg-gray-50 px-3 py-1 rounded-full">
          <MaterialIcons name="email" size={14} color={isActive ? "#6B7280" : "#9CA3AF"} />
          <Text className={`text-xs ml-2 font-medium ${isActive ? 'text-gray-500' : 'text-gray-400'}`}>{item.email}</Text>
        </View>

        <View className="flex-row items-center mt-2 bg-gray-50 px-3 py-1 rounded-full">
          <MaterialIcons name="phone" size={14} color={isActive ? "#6B7280" : "#9CA3AF"} />
          <Text className={`text-xs ml-2 font-medium ${isActive ? 'text-gray-500' : 'text-gray-400'}`}>{item.phone}</Text>
        </View>
        
        {/* FIX 2: Specific Button for Status Toggle */}
        <TouchableOpacity 
            onPress={() => toggleCashierStatus(item)}
            className={`mt-6 px-5 py-2 rounded-xl border ${isActive ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'}`}
        >
            <Text className={`font-bold text-xs ${isActive ? 'text-red-600' : 'text-green-600'}`}>
                {isActive ? "Deactivate User" : "Activate User"}
            </Text>
        </TouchableOpacity>

      </View>
    );
  };

  return (
    <View className="flex-1 bg-gray-100">
      <StatusBar barStyle="light-content" backgroundColor="#1E3A8A" />

      {/* --- HEADER --- */}
      <View className="bg-blue-900 pt-10 pb-4 px-4 rounded-b-3xl shadow-lg z-10">
        <View className="flex-row justify-between items-center mb-3">
          <View>
            <Text className="text-white text-xl font-bold tracking-wide">Staff Management</Text>
            <Text className="text-blue-200 text-xs mt-1">Total Cashiers: {cashiers.length}</Text>
          </View>
          
          {/* Add Button with Tooltip */}
          <View className="relative z-50">
            <TouchableOpacity
              onPress={() => setModalVisible(true)}
              onMouseEnter={() => setHoveredButton('add')}
              onMouseLeave={() => setHoveredButton(null)}
              className="bg-blue-800 p-2 rounded-full border border-blue-700"
            >
              <Ionicons name="person-add" size={20} color="white" />
            </TouchableOpacity>
            
            {/* Tooltip positioned to the LEFT (right-12) */}
            {hoveredButton === 'add' && (
              <View className="absolute top-2 right-12 bg-gray-800 px-2 py-1 rounded shadow-lg z-50 whitespace-nowrap">
                <Text className="text-white text-xs font-bold">Add Cashier</Text>
              </View>
            )}
          </View>
        </View>

        {/* Search Bar */}
        <View className="flex-row items-center bg-white rounded-full px-3 h-10 shadow-sm">
          <Ionicons name="search" size={18} color="#9CA3AF" />
          <TextInput
            placeholder="Search Cashiers..."
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

      {/* --- MAIN CONTENT --- */}
      <View className="flex-1 px-2 mt-4">
        {dataLoading ? (
          <ActivityIndicator size="large" color="#1E3A8A" className="mt-10" />
        ) : (
          <FlatList
            key={numColumns}
            data={filteredCashiers}
            keyExtractor={(item, index) => item.id ? item.id.toString() : index.toString()}
            renderItem={renderCashierItem}
            numColumns={numColumns}
            contentContainerStyle={{ paddingBottom: 100, paddingHorizontal: isWeb ? 10 : 0 }}
            columnWrapperStyle={isWeb ? { justifyContent: 'flex-start' } : undefined}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#1E3A8A"]} />
            }
            ListEmptyComponent={
              <View className="flex-1 justify-center items-center mt-10 opacity-60">
                <View className="bg-gray-200 p-6 rounded-full mb-4">
                  <Feather name="users" size={60} color="#9CA3AF" />
                </View>
                <Text className="text-xl font-bold text-gray-500">No Cashiers Found</Text>
                <Text className="text-gray-400 text-center mt-2 px-10">
                  Start by adding a new cashier using the button above.
                </Text>
              </View>
            }
          />
        )}
      </View>

      {/* --- ADD CASHIER MODAL --- */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View className="flex-1 justify-center items-center bg-black/60 p-4 backdrop-blur-sm">
          <View className="bg-white w-full max-w-lg rounded-3xl p-8 shadow-2xl border border-gray-100">

            {/* Modal Header */}
            <View className="items-center mb-8">
              <View className="bg-blue-100 p-4 rounded-full mb-3">
                <Ionicons name="person-add" size={32} color="#2563EB" />
              </View>
              <Text className="text-2xl font-bold text-gray-800">Register Cashier</Text>
              <Text className="text-gray-500 text-sm">Create credentials for new staff</Text>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Row 1: Name & Phone */}
              <View className="flex-row gap-3">
                <ModernFormInput
                  label="Full Name"
                  placeholder="John Doe"
                  value={name}
                  onChangeText={setName}
                  icon="person-outline"
                />
                <ModernFormInput
                  label="Phone"
                  placeholder="9876543210"
                  value={phone}
                  onChangeText={setPhone}
                  keyboardType="phone-pad"
                  icon="call-outline"
                />
              </View>

              {/* Row 2: Email */}
              <ModernFormInput
                label="Email Address"
                placeholder="cashier@store.com"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                icon="mail-outline"
              />

              {/* Row 3: Password with Eye Icon (FIX 3) */}
              <ModernFormInput
                label="Password"
                placeholder="******"
                value={password}
                onChangeText={setPassword}
                isPassword={true} // Enabled Eye Toggle
                icon="lock-closed-outline"
              />
            </ScrollView>

            {/* Buttons */}
            <View className="flex-row gap-3 mt-6">
              <TouchableOpacity
                className="flex-1 bg-gray-100 py-4 rounded-xl border border-gray-200"
                onPress={() => setModalVisible(false)}
              >
                <Text className="text-gray-600 font-bold text-center text-lg">Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                className="flex-1 bg-blue-600 py-4 rounded-xl shadow-md flex-row justify-center items-center"
                onPress={handleAddCashier}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="white" size="small" />
                ) : (
                  <>
                    <Text className="text-white font-bold text-center text-lg mr-2">Register</Text>
                    <Ionicons name="arrow-forward" size={20} color="white" />
                  </>
                )}
              </TouchableOpacity>
            </View>

          </View>
        </View>
      </Modal>
    </View>
  );
};

export default Cashiers;