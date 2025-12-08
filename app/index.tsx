import { Ionicons } from '@expo/vector-icons'; // Close icon kosam
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { Link, router } from 'expo-router';
import { jwtDecode } from "jwt-decode";
import React, { useContext, useState } from 'react';
import {
  Alert,
  ImageBackground,
  KeyboardAvoidingView,
  Modal,
  Platform, ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { BillContext } from './(utils)/BillingContext';
import { rootApi } from './(utils)/axiosInstance';

const LoginScreen = () => {
  const {isAuthenticated,setAuthenticated,decoded,setDecoded,role,setRole}=useContext(BillContext);
  const [emaill, setEmail] = useState('');
  const [passwordd, setPassword] = useState('');
  
  // --- Forgot Password States ---
  const [forgotPasswordModalVisible, setForgotPasswordModalVisible] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');

  const handleLogin = async() => {
    const dto ={
      email:emaill,
      password:passwordd
    }

    try {
      let response = await axios.post(`http://192.168.0.217:8080/api/auth/login`,dto);
      console.log(response.data);
      await AsyncStorage.setItem("userToken",response.data)
      setAuthenticated(true);
      const tokendata=jwtDecode(response.data);
      console.log(tokendata);
      setDecoded(tokendata);
      const role = await AsyncStorage.setItem("role",tokendata?.roles[0]);
      const isAdmin =await AsyncStorage.getItem("role");
      setRole(role);
      {isAdmin =="ROLE_ADMIN"?(router.replace('/(home)/Homepage')):(router.replace('/(cashier)/Ss'))} 
    } catch (error) {
      console.log("Login Error", error);
      Alert.alert("Login Failed", "Invalid credentials or server error");
    }
  };

  // --- Send OTP Handler ---
  const handleSendOtp = async() => {
    if(!forgotEmail) {
        Alert.alert("Error", "Please enter your email address");
        return;
    }

    console.log("Entered Forgot Password Email:", forgotEmail);
    
    const forgotDto = {
      email: forgotEmail
    };

    try {
      // API Call
      const response = await rootApi.post(`/api/auth/forgot-password`, forgotDto);
      console.log("OTP API Response:", response.data);
      
      // Success Logic
      setForgotPasswordModalVisible(false); // Modal close chestunnam
      setForgotEmail(''); // Reset email field
      Alert.alert("Success", "OTP has been sent to your email.");

    } catch (error) {
      console.log("Forgot Password Error:", error);
      Alert.alert("Error", "Failed to send OTP. Please check the email or try again later.");
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
    >
      <ImageBackground
        source={require('../assets/images/Billingbg2.jpg')}
        resizeMode="cover"
        style={{
          flex: 1,
          width: '100%',
          height: '100%',   
        }}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
        >
          <View
            style={{
              flex: 1,
              justifyContent: 'center',
              alignItems: 'center',
              padding: 24,
              backgroundColor: 'rgba(0,0,0,0.4)',
              width: '100%',
              height: '100%',  
            }}
          >
            <View
              style={{
                width: '100%',
                maxWidth: 380,
                backgroundColor: 'rgba(255,255,255,0.65)',
                padding: 24,
                borderRadius: 20,
              }}
            >
              <Text
                style={{
                  fontSize: 30,
                  fontWeight: 'bold',
                  textAlign: 'center',
                  color: '#111',
                  marginBottom: 30,
                }}
              >
                Login
              </Text>

              <Text
                style={{
                  fontSize: 14,
                  textAlign: 'center',
                  color: '#333',
                  marginBottom: 20,
                }}
              >
                Smart Billing for Smart Businesses
              </Text>

              {/* Email Input */}
              <View style={{ marginBottom: 16 }}>
                <TextInput
                  placeholder="Email"
                  value={emaill}
                  onChangeText={(e)=>{setEmail(e)}}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  style={{
                    width: '100%',
                    padding: 16,
                    backgroundColor: '#fff',
                    borderRadius: 10,
                    borderWidth: 1,
                    borderColor: '#ccc',
                  }}
                />
              </View>

              {/* Password Input */}
              <View style={{ marginBottom: 10 }}>
                <TextInput
                  placeholder="Password"
                  value={passwordd}
                  onChangeText={(e)=>setPassword(e)}
                  secureTextEntry
                  style={{
                    width: '100%',
                    padding: 16,
                    backgroundColor: '#fff',
                    borderRadius: 10,
                    borderWidth: 1,
                    borderColor: '#ccc',
                  }}
                />
              </View>

              {/* --- Forgot Password Link (Opens Modal) --- */}
              <TouchableOpacity 
                onPress={() => setForgotPasswordModalVisible(true)} 
                style={{ alignSelf: 'flex-end', marginBottom: 20 }}
              >
                <Text style={{ color: '#0056ff', fontWeight: '600' }}>
                  Forgot Password?
                </Text>
              </TouchableOpacity>
              {/* ---------------------------------- */}

              {/* Login Button */}
              <TouchableOpacity
                onPress={handleLogin}
                style={{
                  width: '100%',
                  paddingVertical: 16,
                  backgroundColor: '#0066ff',
                  borderRadius: 10,
                  alignItems: 'center',
                }}
              >
                <Text
                  style={{
                    color: 'white',
                    fontWeight: '600',
                    fontSize: 18,
                  }}
                >
                  Login
                </Text>
              </TouchableOpacity>

              {/* Sign Up Link */}
              <View
                style={{
                  marginTop: 24,
                  flexDirection: 'row',
                  justifyContent: 'center',
                }}
              >
                <Text style={{ color: '#444' }}>Don't have an account? </Text>
                <Link href="/(auth)/signup">
                  <Text style={{ color: '#0056ff', fontWeight: 'bold' }}>
                    Sign Up
                  </Text>
                </Link>
              </View>
            </View>
          </View>
        </ScrollView>
      </ImageBackground>

      {/* --------------------- FORGOT PASSWORD MODAL --------------------- */}
      <Modal
        visible={forgotPasswordModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setForgotPasswordModalVisible(false)}
      >
        <View style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: 'rgba(0,0,0,0.5)', // Dim background
        }}>
          <View style={{
            width: '85%',
            backgroundColor: 'white',
            borderRadius: 20,
            padding: 24,
            elevation: 5,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.25,
            shadowRadius: 4,
          }}>
            {/* Close Button */}
            <TouchableOpacity 
              onPress={() => setForgotPasswordModalVisible(false)}
              style={{ alignSelf: 'flex-end' }}
            >
              <Ionicons name="close" size={24} color="gray" />
            </TouchableOpacity>

            <Text style={{ fontSize: 22, fontWeight: 'bold', marginBottom: 10, textAlign: 'center' }}>
              Reset Password
            </Text>
            <Text style={{ textAlign: 'center', color: '#666', marginBottom: 20 }}>
              Enter your email to receive an OTP.
            </Text>

            {/* Modal Email Input */}
            <TextInput
              placeholder="Enter your email"
              value={forgotEmail}
              onChangeText={setForgotEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              style={{
                width: '100%',
                padding: 14,
                backgroundColor: '#f9f9f9',
                borderRadius: 10,
                borderWidth: 1,
                borderColor: '#ddd',
                marginBottom: 20,
              }}
            />

            {/* Send OTP Button */}
            <TouchableOpacity
              onPress={handleSendOtp}
              style={{
                width: '100%',
                paddingVertical: 14,
                backgroundColor: '#0066ff',
                borderRadius: 10,
                alignItems: 'center',
              }}
            >
              <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 16 }}>
                Send OTP
              </Text>
            </TouchableOpacity>

          </View>
        </View>
      </Modal>
      {/* ------------------------------------------------------------------ */}

    </KeyboardAvoidingView>
  );
};

export default LoginScreen;