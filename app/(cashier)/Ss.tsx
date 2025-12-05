import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

const Ss = () => {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await AsyncStorage.clear();   // remove all stored keys
      router.replace('/');   // navigate to loginn
    } catch (err) {
      console.log("Logout Error:", err);
    }
  };

  return (
    <View className="flex-1 items-center justify-center">
      <Text className="text-xl mb-4">Ss</Text>

      {/* Logout Button */}
      <TouchableOpacity
        onPress={handleLogout}
        className="bg-red-600 px-6 py-3 rounded-lg"
      >
        <Text className="text-white text-lg font-semibold">Logout</Text>
      </TouchableOpacity>
    </View>
  );
};

export default Ss;
