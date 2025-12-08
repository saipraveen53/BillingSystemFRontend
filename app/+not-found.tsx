import { Link, Stack } from 'expo-router';
import React from 'react';
import { Text, View } from 'react-native';

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Oops! Not Found' }} />
      <View className="flex-1 items-center justify-center bg-gray-100 p-5">
        <Text className="text-2xl font-bold text-gray-800 mb-2">
          Oops!
        </Text>
        <Text className="text-base text-gray-600 mb-6 text-center">
          This screen doesn't exist.
        </Text>

        <Link href="/" className="bg-blue-600 py-3 px-6 rounded-xl">
          <Text className="text-white font-bold text-lg">
            Go to Home
          </Text>
        </Link>
      </View>
    </>
  );
}