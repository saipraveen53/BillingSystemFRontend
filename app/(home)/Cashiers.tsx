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

// --- REUSABLE MODERN INPUT COMPONENT (Outside to fix focus issue) ---
const ModernFormInput = ({ label, value, onChangeText, keyboardType = 'default', secureTextEntry = false, icon, placeholder }) => (
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
        secureTextEntry={secureTextEntry}
        placeholder={placeholder}
        placeholderTextColor="#9CA3AF"
        style={Platform.OS === 'web' ? { outline: 'none' } : undefined}
      />
    </View>
  </View>
);

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

  // --- FETCH CASHIERS ---
  useEffect(() => {
    fetchCashiers();
  }, []);

  const fetchCashiers = async () => {
    try {
      setDataLoading(true);
      const response = await rootApi.get("api/user/allCashiers");
      console.log("Fetched Cashiers:", response.data);
      setCashiers(response.data);
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

  // Filter Logic
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

      // Refresh the list after adding
      fetchCashiers();

    } catch (error) {
      console.log("Register Error:", error);
      Alert.alert("Error", "Failed to register cashier. Please check network/server.");
    } finally {
      setLoading(false);
    }
  };

  // --- CASHIER ID CARD RENDER ---
  const renderCashierItem = ({ item }) => (
    <View
      style={{
        flex: 1,
        margin: 8,
        maxWidth: isWeb ? `${(100 / numColumns) - 2}%` : '100%',
        minWidth: isWeb ? '30%' : '100%',
      }}
      className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 items-center relative"
    >
      {/* Active Status - Top Right */}
      <View className="absolute top-4 right-4 bg-green-100 px-2 py-1 rounded-md">
        <Text className="text-green-700 text-[10px] font-bold uppercase">Active</Text>
      </View>

      {/* Avatar / Initial - Centered & Large */}
      <View className="h-24 w-24 rounded-full bg-blue-50 items-center justify-center border-4 border-blue-100 mb-4 mt-2 shadow-inner">
        <Text className="text-blue-600 text-4xl font-bold">
          {item.name ? item.name.charAt(0).toUpperCase() : "U"}
        </Text>
      </View>

      {/* Details - Centered */}
      <Text className="text-xl font-bold text-gray-800 mb-1 text-center" numberOfLines={1}>
        {item.name}
      </Text>

      <View className="flex-row items-center mt-2 bg-gray-50 px-3 py-1 rounded-full">
        <MaterialIcons name="email" size={14} color="#6B7280" />
        <Text className="text-gray-500 text-xs ml-2 font-medium">{item.email}</Text>
      </View>

      <View className="flex-row items-center mt-2 bg-gray-50 px-3 py-1 rounded-full">
        <MaterialIcons name="phone" size={14} color="#6B7280" />
        <Text className="text-gray-500 text-xs ml-2 font-medium">{item.phone}</Text>
      </View>
    </View>
  );

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
          
          {/* ADD BUTTON WITH TOOLTIP */}
          <View className="relative z-50">
            <TouchableOpacity
              onPress={() => setModalVisible(true)}
              onMouseEnter={() => setHoveredButton('add')}
              onMouseLeave={() => setHoveredButton(null)}
              className="bg-blue-800 p-2 rounded-full border border-blue-700"
            >
              <Ionicons name="person-add" size={20} color="white" />
            </TouchableOpacity>
            
            {/* CHANGED: Tooltip Position fixed (Left side: right-12) to avoid overlapping search bar */}
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

              {/* Row 3: Password */}
              <ModernFormInput
                label="Password"
                placeholder="******"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
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