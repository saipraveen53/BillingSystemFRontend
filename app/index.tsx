import { Link } from 'expo-router';
import React, { useState } from 'react';
import {
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

const LoginScreen = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = () => {
    console.log('Email:', email);
    console.log('Password:', password);
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
                  value={email}
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
              <View style={{ marginBottom: 20 }}>
                <TextInput
                  placeholder="Password"
                  value={password}
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
    </KeyboardAvoidingView>
  );
};

export default LoginScreen;
