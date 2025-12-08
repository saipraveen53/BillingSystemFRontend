import { FontAwesome5, Ionicons, MaterialIcons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React from 'react';
import { View } from 'react-native';

const Homelayout = () => {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        // --- 1. Tab Bar Styling (Floating/Raised) ---
        tabBarStyle: {
          position: 'absolute', // Makes it float
          bottom: 25,           // Raises it from the bottom
          left: 20,             // Margin from left
          right: 20,            // Margin from right
          elevation: 5,         // Shadow for Android
          backgroundColor: '#ffffff',
          borderRadius: 15,     // Rounded corners
          height: 70,           // Taller height for floating look
          paddingBottom: 0,     // Remove default padding to center items
          borderTopWidth: 0,    // Remove top border
          shadowColor: '#000',  // Shadow for iOS
          shadowOffset: { width: 0, height: 10 },
          shadowOpacity: 0.1,
          shadowRadius: 10,
        },
        // --- 2. Label Styling ---
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: 'bold',
          marginBottom: 10, // Adjust label position
        },
        tabBarActiveTintColor: '#1E3A8A', // Active Label Color
        tabBarInactiveTintColor: '#9CA3AF', // Inactive Label Color
        tabBarHideOnKeyboard: true,
      }}
    >
      <Tabs.Screen
        name="Homepage"
        options={{
          tabBarLabel: 'Inventory', // Explicit Name
          tabBarIcon: ({ color, focused }) => (
            // --- 3. Active Background (Circle) ---
            <View className={`items-center justify-center w-12 h-12 rounded-full ${focused ? 'bg-blue-100' : ''} mt-2`}>
               <Ionicons name={focused ? "cube" : "cube-outline"} size={24} color={focused ? '#1E3A8A' : color} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="Categories"
        options={{
          tabBarLabel: 'Categories', // Explicit Name
          tabBarIcon: ({ color, focused }) => (
             <View className={`items-center justify-center w-12 h-12 rounded-full ${focused ? 'bg-purple-100' : ''} mt-2`}>
                <MaterialIcons name="category" size={24} color={focused ? '#7C3AED' : color} />
             </View>
          ),
          tabBarActiveTintColor: '#7C3AED', // Custom color for this tab
        }}
      />
      <Tabs.Screen
        name="Cashiers"
        options={{
          tabBarLabel: 'Staff', // Explicit Name
          tabBarIcon: ({ color, focused }) => (
             <View className={`items-center justify-center w-12 h-12 rounded-full ${focused ? 'bg-green-100' : ''} mt-2`}>
               <FontAwesome5 name="users" size={20} color={focused ? '#059669' : color} />
             </View>
          ),
          tabBarActiveTintColor: '#059669', // Custom color for this tab
        }}
      />
    </Tabs>
  );
};

export default Homelayout;