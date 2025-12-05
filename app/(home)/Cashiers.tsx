import axios from 'axios';
import React, { useState } from 'react';
import { Modal, Text, TextInput, TouchableOpacity, View } from 'react-native';
 
const Cashiers = () => {
  const [modalVisible, setModalVisible] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
 
  const handleAddCashier = async () => {
    const payload = {
      name,
      email,
      phone,
      password,
    };
 
    try {
      let response = await axios.post(
        "http://192.168.0.217:8080/api/auth/register",
        payload
      );
 
      console.log("Cashier Registered:", response.data);
      alert("Cashier Added Successfully!");
 
      setName("");
      setEmail("");
      setPhone("");
      setPassword("");
 
      setModalVisible(false);
    } catch (error) {
      console.log("Register Error:", error);
      alert("Failed to register cashier");
    }
  };
 
  return (
    <View className="flex-1 bg-gray-100 p-4">
      <Text className="text-2xl font-bold text-center mb-6">Cashiers</Text>
 
      {/* Add Cashier Button */}
      <TouchableOpacity
        className="bg-blue-600 px-6 py-3 rounded-xl w-full max-w-md mx-auto"
        onPress={() => setModalVisible(true)}
      >
        <Text className="text-white text-center text-lg font-semibold">
          Add Cashier
        </Text>
      </TouchableOpacity>
 
      {/* Modal */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View className="flex-1 justify-center items-center bg-black/40">
          <View className="bg-white w-11/12 p-6 rounded-2xl">
 
            <Text className="text-xl font-bold mb-4 text-center">
              Add Cashier
            </Text>
 
            {/* Name */}
            <TextInput
              placeholder="Enter Name"
              value={name}
              onChangeText={setName}
              className="border p-3 rounded-lg mb-3 bg-gray-50"
            />
 
            {/* Email */}
            <TextInput
              placeholder="Enter Email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              className="border p-3 rounded-lg mb-3 bg-gray-50"
            />
 
            {/* Phone */}
            <TextInput
              placeholder="Enter Phone"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              className="border p-3 rounded-lg mb-3 bg-gray-50"
            />
 
            {/* Password */}
            <TextInput
              placeholder="Enter Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              className="border p-3 rounded-lg mb-3 bg-gray-50"
            />
 
            {/* Buttons */}
            <View className="flex-row justify-between mt-4">
              <TouchableOpacity
                className="bg-gray-400 px-5 py-3 rounded-xl"
                onPress={() => setModalVisible(false)}
              >
                <Text className="text-white font-semibold">Cancel</Text>
              </TouchableOpacity>
 
              <TouchableOpacity
                className="bg-green-600 px-6 py-3 rounded-xl"
                onPress={handleAddCashier}
              >
                <Text className="text-white font-semibold">Submit</Text>
              </TouchableOpacity>
            </View>
 
          </View>
        </View>
      </Modal>
    </View>
  );
};
 
export default Cashiers;