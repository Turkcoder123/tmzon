import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as api from '../api/client';

export default function PhoneLoginScreen({ navigation }) {
  const [countryCode, setCountryCode] = useState('+90');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSendOTP() {
    if (!phone.trim()) {
      setError('Please enter your phone number');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const fullPhone = countryCode + phone.trim();
      await api.sendPhoneOTP(fullPhone);
      navigation.navigate('OTPVerification', { phone: fullPhone });
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
        >
          {/* Back Button */}
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#14171A" />
          </TouchableOpacity>

          {/* Header */}
          <Text style={styles.title}>Phone Login</Text>
          <Text style={styles.subtitle}>
            Enter your phone number to receive a verification code
          </Text>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          {/* Phone Input */}
          <View style={styles.phoneRow}>
            <TouchableOpacity style={styles.countryCodeBox}>
              <Text style={styles.flag}>🇹🇷</Text>
              <Text style={styles.countryCodeText}>{countryCode}</Text>
              <Ionicons name="chevron-down" size={16} color="#657786" />
            </TouchableOpacity>
            <View style={styles.phoneInputContainer}>
              <TextInput
                style={styles.phoneInput}
                placeholder="Phone number"
                placeholderTextColor="#AAB8C2"
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                maxLength={15}
              />
            </View>
          </View>

          {/* Continue Button */}
          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleSendOTP}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Continue</Text>
            )}
          </TouchableOpacity>

          {/* Divider */}
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Back to email login */}
          <TouchableOpacity
            style={styles.emailLoginButton}
            onPress={() => navigation.navigate('Login')}
          >
            <Ionicons name="mail-outline" size={20} color="#1DA1F2" />
            <Text style={styles.emailLoginText}>Login with Email</Text>
          </TouchableOpacity>

          <View style={styles.spacer} />

          {/* Bottom link */}
          <View style={styles.bottomLink}>
            <Text style={styles.bottomText}>New to tmzon? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
              <Text style={styles.bottomLinkText}>Sign Up</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FFFFFF' },
  flex: { flex: 1 },
  container: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F7F9FA',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#14171A',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#657786',
    lineHeight: 24,
    marginBottom: 32,
  },
  error: {
    color: '#E0245E',
    fontSize: 14,
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  phoneRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  countryCodeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F7F9FA',
    borderWidth: 1,
    borderColor: '#E1E8ED',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 16,
    gap: 6,
  },
  flag: {
    fontSize: 20,
  },
  countryCodeText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#14171A',
  },
  phoneInputContainer: {
    flex: 1,
  },
  phoneInput: {
    backgroundColor: '#F7F9FA',
    borderWidth: 1,
    borderColor: '#E1E8ED',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 16,
    color: '#14171A',
  },
  button: {
    backgroundColor: '#1DA1F2',
    borderRadius: 14,
    paddingVertical: 18,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#FFFFFF', fontSize: 17, fontWeight: '700' },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 28,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E1E8ED',
  },
  dividerText: {
    color: '#AAB8C2',
    fontSize: 14,
    marginHorizontal: 16,
  },
  emailLoginButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F7F9FA',
    borderWidth: 1,
    borderColor: '#E1E8ED',
    borderRadius: 14,
    paddingVertical: 16,
    gap: 10,
  },
  emailLoginText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1DA1F2',
  },
  spacer: { flex: 1 },
  bottomLink: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
  },
  bottomText: {
    fontSize: 15,
    color: '#657786',
  },
  bottomLinkText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1DA1F2',
  },
});
