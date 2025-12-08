import { Feather, FontAwesome5, Ionicons, MaterialIcons } from '@expo/vector-icons';
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
  View
} from 'react-native';
import { rootApi } from '../(utils)/axiosInstance';

// --- REUSABLE MODERN INPUT COMPONENT (Moved Outside to fix Focus Issue) ---
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
  const [modalVisible, setModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(true); // Loading state for fetching list
  const [cashiers, setCashiers] = useState([]); // State to store cashier list
  const [refreshing, setRefreshing] = useState(false);

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
      // Endpoint provided by you
      const response = await rootApi.get("api/user/allCashiers");
      console.log("Fetched Cashiers:", response.data);
      setCashiers(response.data);
    } catch (error) {
      console.log("Fetch Error:", error);
      // Optional: Alert.alert("Error", "Failed to fetch cashiers list.");
    } finally {
      setDataLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchCashiers();
  };

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

  // --- CASHIER CARD RENDER ---
  const renderCashierItem = ({ item }) => (
    <View className="bg-white rounded-2xl p-4 mb-3 mx-1 shadow-sm border border-gray-100 flex-row items-center">
      {/* Avatar / Initial */}
      <View className="h-14 w-14 rounded-full bg-blue-50 items-center justify-center border border-blue-100 mr-4">
        <Text className="text-blue-600 text-xl font-bold">
          {item.name ? item.name.charAt(0).toUpperCase() : "U"}
        </Text>
      </View>

      {/* Details */}
      <View className="flex-1">
        <Text className="text-lg font-bold text-gray-800 mb-1">{item.name}</Text>

        <View className="flex-row items-center mb-1">
          <MaterialIcons name="email" size={14} color="#6B7280" />
          <Text className="text-gray-500 text-xs ml-1.5">{item.email}</Text>
        </View>

        <View className="flex-row items-center">
          <MaterialIcons name="phone" size={14} color="#6B7280" />
          <Text className="text-gray-500 text-xs ml-1.5">{item.phone}</Text>
        </View>
      </View>

      {/* Status / Action Placeholder (Optional) */}
      <View className="items-end">
        <View className="bg-green-100 px-2 py-1 rounded-md mb-2">
          <Text className="text-green-700 text-[10px] font-bold uppercase">Active</Text>
        </View>
        {/* You can add Edit/Delete buttons here later */}
        <TouchableOpacity className="p-1">
          <Feather name="more-horizontal" size={20} color="#9CA3AF" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View className="flex-1 bg-gray-100">
      <StatusBar barStyle="light-content" backgroundColor="#1E3A8A" />

      {/* --- HEADER --- */}
      <View className="bg-blue-900 pt-12 pb-8 px-6 rounded-b-[30px] shadow-lg z-10">
        <View className="flex-row justify-between items-center">
          <View>
            <Text className="text-white text-3xl font-bold tracking-wide">Staff Management</Text>
            <Text className="text-blue-200 text-sm mt-1">Manage your cashiers and permissions</Text>
          </View>
          <View className="bg-blue-800 p-3 rounded-full border border-blue-700">
            <FontAwesome5 name="users" size={24} color="white" />
          </View>
        </View>
      </View>

      {/* --- MAIN CONTENT --- */}
      <View className="flex-1 px-4 mt-4">
        {/* Add Cashier Card */}
        <View className="bg-white p-6 rounded-2xl shadow-md border border-gray-100 items-center justify-between flex-row mb-6">
          <View className="flex-1 mr-4">
            <Text className="text-lg font-bold text-gray-800">Add New Cashier</Text>
            <Text className="text-gray-500 text-xs mt-1">Register a new staff member to handle billing.</Text>
          </View>
          <TouchableOpacity
            onPress={() => setModalVisible(true)}
            className="bg-blue-600 px-5 py-3 rounded-xl shadow-lg flex-row items-center"
          >
            <Ionicons name="person-add" size={18} color="white" />
            <Text className="text-white font-bold ml-2">Add</Text>
          </TouchableOpacity>
        </View>

        {/* --- CASHIERS LIST --- */}
        <Text className="text-gray-500 font-bold uppercase text-xs mb-3 ml-1 tracking-wider">Registered Cashiers ({cashiers.length})</Text>

        {dataLoading ? (
          <ActivityIndicator size="large" color="#1E3A8A" className="mt-10" />
        ) : (
          <FlatList
            data={cashiers}
            keyExtractor={(item, index) => item.id ? item.id.toString() : index.toString()}
            renderItem={renderCashierItem}
            contentContainerStyle={{ paddingBottom: 100 }}
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