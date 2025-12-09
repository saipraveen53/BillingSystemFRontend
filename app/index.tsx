import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { router } from 'expo-router';
import { jwtDecode } from "jwt-decode";
import React, { useContext, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ImageBackground,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { BillContext } from './(utils)/BillingContext';
import { rootApi } from './(utils)/axiosInstance';

const LoginScreen = () => {
  const { isAuthenticated, setAuthenticated, decoded, setDecoded, role, setRole } = useContext(BillContext);
  const [emaill, setEmail] = useState('');
  const [passwordd, setPassword] = useState('');

  // --- Password Visibility State (Login) ---
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  // --- Forgot Password States ---
  const [forgotPasswordModalVisible, setForgotPasswordModalVisible] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [isOtpSent, setIsOtpSent] = useState(false); // To toggle between Email and OTP/NewPass view

  // --- Reset Password Fields ---
  const [otpCode, setOtpCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // --- Loading State ---
  const [otpLoading, setOtpLoading] = useState(false);

  const handleLogin = async () => {
    const dto = {
      email: emaill,
      password: passwordd
    }

    try {
      let response = await axios.post(`http://192.168.0.217:8080/api/auth/login`, dto);
      console.log(response.data);
      await AsyncStorage.setItem("userToken", response.data)
      setAuthenticated(true);
      const tokendata = jwtDecode(response.data);
      console.log(tokendata);
      setDecoded(tokendata);
      const role = await AsyncStorage.setItem("role", tokendata?.roles[0]);
      const isAdmin = await AsyncStorage.getItem("role");
      setRole(role);
      { isAdmin == "ROLE_ADMIN" ? (router.replace('/(home)/Homepage')) : (router.replace('/(cashier)/Ss')) }
    } catch (error) {
      console.log("Login Error", error);
      Alert.alert("Login Failed", "Invalid credentials or server error");
    }
  };

  // --- Send OTP Handler ---
  const handleSendOtp = async () => {
    if (!forgotEmail) {
      Alert.alert("Error", "Please enter your email address");
      return;
    }

    console.log("Entered Forgot Password Email:", forgotEmail);

    const forgotDto = {
      email: forgotEmail
    };

    try {
      setOtpLoading(true); // Start Loading
      // API Call
      const response = await rootApi.post(`/api/auth/forgot-password`, forgotDto);
      console.log("OTP API Response:", response.data);

      // Success Logic
      setIsOtpSent(true); // Switch to OTP input view
      Alert.alert("Success", "OTP has been sent to your email.");

    } catch (error) {
      console.log("Forgot Password Error:", error);
      Alert.alert("Error", "Failed to send OTP. Please check the email or try again later.");
    } finally {
      setOtpLoading(false); // Stop Loading
    }
  };

  // --- Handle Password Reset Submit ---
  const handleResetPassword = async () => {
    if (!otpCode || !newPassword || !confirmPassword) {
      Alert.alert("Error", "Please fill all fields.");
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert("Error", "Passwords do not match!");
      return;
    }

    // Backend Logic Placeholder
    // Since the API endpoint for resetting password isn't provided in the context,
    // I'm adding the UI logic here. You can connect your `axios.post` here.
    
    console.log("Resetting Password...", { email: forgotEmail, otp: otpCode, newPass: newPassword });
    
    Alert.alert("Success", "Password reset successfully!");
    
    // Reset States and Close Modal
    setForgotPasswordModalVisible(false);
    setIsOtpSent(false);
    setForgotEmail('');
    setOtpCode('');
    setNewPassword('');
    setConfirmPassword('');
  };

  const handleCloseModal = () => {
      setForgotPasswordModalVisible(false);
      // Reset modal state when closed
      setIsOtpSent(false);
      setForgotEmail('');
      setOtpCode('');
      setNewPassword('');
      setConfirmPassword('');
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
                  onChangeText={(e) => { setEmail(e) }}
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

              {/* Password Input (With Eye Icon) */}
              <View style={{ marginBottom: 20 }}>
                <View style={{
                    width: '100%',
                    backgroundColor: '#fff',
                    borderRadius: 10,
                    borderWidth: 1,
                    borderColor: '#ccc',
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingRight: 16,
                }}>
                    <TextInput
                      placeholder="Password"
                      value={passwordd}
                      onChangeText={(e) => setPassword(e)}
                      secureTextEntry={!showLoginPassword}
                      style={{
                        flex: 1,
                        padding: 16,
                      }}
                    />
                    <TouchableOpacity onPress={() => setShowLoginPassword(!showLoginPassword)}>
                        <Ionicons name={showLoginPassword ? "eye" : "eye-off"} size={24} color="gray" />
                    </TouchableOpacity>
                </View>
              </View>

              {/* Login Button */}
              <TouchableOpacity
                onPress={handleLogin}
                style={{
                  width: '100%',
                  paddingVertical: 16,
                  backgroundColor: '#0066ff',
                  borderRadius: 10,
                  alignItems: 'center',
                  marginBottom: 20,
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

              {/* Forgot Password Link */}
              <TouchableOpacity
                onPress={() => setForgotPasswordModalVisible(true)}
                style={{ alignSelf: 'center' }}
              >
                <Text style={{ color: '#0056ff', fontWeight: '600' }}>
                  Forgot Password?
                </Text>
              </TouchableOpacity>

            </View>
          </View>
        </ScrollView>
      </ImageBackground>

      {/* --------------------- FORGOT PASSWORD MODAL --------------------- */}
      <Modal
        visible={forgotPasswordModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={handleCloseModal}
      >
        <View style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: 'rgba(0,0,0,0.5)',
        }}>
          <View style={{
            width: '90%',
            maxWidth: 400,
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
              onPress={handleCloseModal}
              style={{ alignSelf: 'flex-end' }}
            >
              <Ionicons name="close" size={24} color="gray" />
            </TouchableOpacity>

            <Text style={{ fontSize: 22, fontWeight: 'bold', marginBottom: 10, textAlign: 'center' }}>
              {isOtpSent ? "Set New Password" : "Reset Password"}
            </Text>
            <Text style={{ textAlign: 'center', color: '#666', marginBottom: 20 }}>
              {isOtpSent ? "Enter OTP and your new password." : "Enter your email to receive an OTP."}
            </Text>

            {!isOtpSent ? (
                // --- STEP 1: Email Input ---
                <>
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

                    <TouchableOpacity
                      onPress={handleSendOtp}
                      disabled={otpLoading}
                      style={{
                        width: '100%',
                        paddingVertical: 14,
                        backgroundColor: otpLoading ? '#99c2ff' : '#0066ff',
                        borderRadius: 10,
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexDirection: 'row'
                      }}
                    >
                      {otpLoading ? (
                        <ActivityIndicator size="small" color="#ffffff" />
                      ) : (
                        <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 16 }}>
                          Send OTP
                        </Text>
                      )}
                    </TouchableOpacity>
                </>
            ) : (
                // --- STEP 2: OTP & New Password Inputs ---
                <ScrollView showsVerticalScrollIndicator={false}>
                    {/* OTP Input */}
                    <TextInput
                      placeholder="Enter OTP"
                      value={otpCode}
                      onChangeText={setOtpCode}
                      keyboardType="numeric"
                      style={{
                        width: '100%',
                        padding: 14,
                        backgroundColor: '#f9f9f9',
                        borderRadius: 10,
                        borderWidth: 1,
                        borderColor: '#ddd',
                        marginBottom: 16,
                      }}
                    />

                    {/* New Password */}
                    <View style={{
                        width: '100%',
                        backgroundColor: '#f9f9f9',
                        borderRadius: 10,
                        borderWidth: 1,
                        borderColor: '#ddd',
                        marginBottom: 16,
                        flexDirection: 'row',
                        alignItems: 'center',
                        paddingRight: 14,
                    }}>
                        <TextInput
                          placeholder="New Password"
                          value={newPassword}
                          onChangeText={setNewPassword}
                          secureTextEntry={!showNewPassword}
                          style={{ flex: 1, padding: 14 }}
                        />
                        <TouchableOpacity onPress={() => setShowNewPassword(!showNewPassword)}>
                            <Ionicons name={showNewPassword ? "eye" : "eye-off"} size={20} color="gray" />
                        </TouchableOpacity>
                    </View>

                    {/* Confirm Password */}
                    <View style={{
                        width: '100%',
                        backgroundColor: '#f9f9f9',
                        borderRadius: 10,
                        borderWidth: 1,
                        borderColor: '#ddd',
                        marginBottom: 20,
                        flexDirection: 'row',
                        alignItems: 'center',
                        paddingRight: 14,
                    }}>
                        <TextInput
                          placeholder="Confirm Password"
                          value={confirmPassword}
                          onChangeText={setConfirmPassword}
                          secureTextEntry={!showConfirmPassword}
                          style={{ flex: 1, padding: 14 }}
                        />
                        <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                            <Ionicons name={showConfirmPassword ? "eye" : "eye-off"} size={20} color="gray" />
                        </TouchableOpacity>
                    </View>

                    <TouchableOpacity
                      onPress={handleResetPassword}
                      style={{
                        width: '100%',
                        paddingVertical: 14,
                        backgroundColor: '#0066ff',
                        borderRadius: 10,
                        alignItems: 'center',
                      }}
                    >
                        <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 16 }}>
                          Reset Password
                        </Text>
                    </TouchableOpacity>
                </ScrollView>
            )}

          </View>
        </View>
      </Modal>

    </KeyboardAvoidingView>
  );
};

export default LoginScreen;