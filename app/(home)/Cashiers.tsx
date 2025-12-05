import { Feather } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { rootApi } from '../(utils)/axiosInstance';

const Cashiers = () => {
  const [modalVisible, setModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');

  // Dummy data for now (Since Get API is not ready)
  const [cashiers, setCashiers] = useState([
    { id: '1', name: 'Raju Clerk', email: 'raju@store.com', phone: '9876543210' },
    { id: '2', name: 'Sita Cashier', email: 'sita@store.com', phone: '9123456780' },
  ]);

  const handleAddCashier = async () => {
    if (!name || !email || !phone || !password) {
      Alert.alert("Error", "Please fill all fields");
      return;
    }

    setLoading(true);
    const payload = {
      name,
      email,
      phone,
      password
    };

    try {
        // NOTE: rootApi base url is 192.168.0.217:8080 according to your axiosInstance
        // So we just need to append /auth/register
        const response = await rootApi.post('/auth/register', payload);
        
        console.log("Register Response:", response.data);
        Alert.alert("Success", "Cashier added successfully!");
        setModalVisible(false);
        
        // Reset Form
        setName(''); setEmail(''); setPhone(''); setPassword('');
        
        // Todo: Call get API here to refresh list when it is ready
        
    } catch (error) {
        console.log("Add Cashier Error:", error);
        Alert.alert("Failed", "Could not add cashier. Check console.");
    } finally {
        setLoading(false);
    }
  };

  const renderCashier = ({ item }) => (
    <View className="bg-white p-4 mb-3 rounded-xl border border-gray-100 flex-row items-center justify-between mx-4 shadow-sm">
      <View className="flex-row items-center">
        <View className="w-12 h-12 bg-blue-100 rounded-full items-center justify-center mr-4">
            <Feather name="user" size={24} color="#2563EB" />
        </View>
        <View>
            <Text className="text-lg font-bold text-gray-800">{item.name}</Text>
            <Text className="text-sm text-gray-500">{item.email}</Text>
            <Text className="text-xs text-gray-400 mt-1">{item.phone}</Text>
        </View>
      </View>
      <TouchableOpacity>
        <Feather name="more-vertical" size={24} color="gray" />
      </TouchableOpacity>
    </View>
  );

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white pt-12 pb-4 px-6 shadow-sm mb-4">
        <Text className="text-2xl font-bold text-gray-800">Cashier Management</Text>
        <Text className="text-gray-500">Manage your store staff</Text>
      </View>

      {/* Cashier List */}
      <FlatList
        data={cashiers}
        keyExtractor={(item) => item.id}
        renderItem={renderCashier}
        contentContainerStyle={{ paddingBottom: 100 }}
        ListEmptyComponent={<Text className="text-center mt-10 text-gray-500">No cashiers found.</Text>}
      />

      {/* Floating Add Button */}
      <TouchableOpacity 
        onPress={() => setModalVisible(true)}
        className="absolute bottom-6 right-6 bg-blue-600 w-14 h-14 rounded-full items-center justify-center shadow-lg elevation-5"
      >
        <Feather name="plus" size={30} color="white" />
      </TouchableOpacity>

      {/* Add Cashier Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View className="flex-1 justify-end bg-black/50">
            <View className="bg-white rounded-t-[30px] p-6 h-[70%]">
                <View className="flex-row justify-between items-center mb-6">
                    <Text className="text-xl font-bold text-gray-800">Add New Cashier</Text>
                    <TouchableOpacity onPress={() => setModalVisible(false)}>
                        <Feather name="x-circle" size={28} color="gray" />
                    </TouchableOpacity>
                </View>

                {/* Form Inputs */}
                <View className="space-y-4">
                    <TextInput 
                        placeholder="Full Name" 
                        value={name} onChangeText={setName}
                        className="bg-gray-100 p-4 rounded-xl text-gray-800 border border-gray-200"
                    />
                    <TextInput 
                        placeholder="Email Address" 
                        value={email} onChangeText={setEmail}
                        keyboardType="email-address"
                        className="bg-gray-100 p-4 rounded-xl text-gray-800 border border-gray-200"
                    />
                    <TextInput 
                        placeholder="Phone Number" 
                        value={phone} onChangeText={setPhone}
                        keyboardType="phone-pad"
                        className="bg-gray-100 p-4 rounded-xl text-gray-800 border border-gray-200"
                    />
                    <TextInput 
                        placeholder="Password" 
                        value={password} onChangeText={setPassword}
                        secureTextEntry
                        className="bg-gray-100 p-4 rounded-xl text-gray-800 border border-gray-200"
                    />
                </View>

                {/* Submit Button */}
                <TouchableOpacity 
                    onPress={handleAddCashier}
                    disabled={loading}
                    className={`mt-8 py-4 rounded-xl items-center ${loading ? 'bg-blue-400' : 'bg-blue-600'}`}
                >
                    {loading ? (
                        <ActivityIndicator color="white" />
                    ) : (
                        <Text className="text-white text-lg font-bold">Register Cashier</Text>
                    )}
                </TouchableOpacity>
            </View>
        </View>
      </Modal>
    </View>
  );
}

export default Cashiers