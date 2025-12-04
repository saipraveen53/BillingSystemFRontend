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

const Signup = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleSignup = () => {
    console.log('Name:', name);
    console.log('Email:', email);
    console.log('Password:', password);
    console.log('Confirm Password:', confirmPassword);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
    >
      <ImageBackground
        source={require('../../assets/images/Billingbg2.jpg')}
        resizeMode="cover"
        style={{
          flex: 1,
          width: '100%',
          height: '100%', // ⭐ Needed for Web
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
              height: '100%', // ⭐ Web full height fix
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
                Sign Up
              </Text>

              {/* Full Name */}
              <View style={{ marginBottom: 16 }}>
                <TextInput
                  placeholder="Full Name"
                  value={name}
                  onChangeText={setName}
                  autoCapitalize="words"
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

              {/* Email */}
              <View style={{ marginBottom: 16 }}>
                <TextInput
                  placeholder="Email"
                  value={email}
                  onChangeText={setEmail}
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

              {/* Password */}
              <View style={{ marginBottom: 16 }}>
                <TextInput
                  placeholder="Password"
                  value={password}
                  onChangeText={setPassword}
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

              {/* Confirm Password */}
              <View style={{ marginBottom: 20 }}>
                <TextInput
                  placeholder="Confirm Password"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
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

              {/* Signup Button */}
              <TouchableOpacity
                onPress={handleSignup}
                style={{
                  width: '100%',
                  paddingVertical: 16,
                  backgroundColor: 'green',
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
                  Create Account
                </Text>
              </TouchableOpacity>

              {/* Login Link */}
              <View
                style={{
                  marginTop: 24,
                  flexDirection: 'row',
                  justifyContent: 'center',
                }}
              >
                <Text style={{ color: '#444' }}>Already have an account? </Text>
                <Link href="/">
                  <Text style={{ color: '#0056ff', fontWeight: 'bold' }}>
                    Log In
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

export default Signup;
