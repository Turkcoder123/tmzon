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

export default function PhoneLoginScreen({ navigation }) {
  const [countryCode] = useState('+90');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSendOtp() {
    if (!phone.trim()) {
      setError('Please enter your phone number');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const fullPhone = countryCode + phone.trim();
      navigation.navigate('OtpVerification', { phone: fullPhone });
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
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#14171A" />
          </TouchableOpacity>

          <Text style={styles.title}>Phone Login</Text>
          <Text style={styles.subtitle}>
            Enter your phone number to receive a verification code
          </Text>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <View style={styles.phoneRow}>
            <TouchableOpacity style={styles.countryCodeBox}>
              <Text style={styles.countryFlag}>{'\uD83C\uDDF9\uD83C\uDDF7'}</Text>
              <Text style={styles.countryCodeText}>{countryCode}</Text>
              <Ionicons name="chevron-down" size={16} color="#657786" />
            </TouchableOpacity>
            <TextInput
              style={styles.phoneInput}
              placeholder="Phone number"
              placeholderTextColor="#657786"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              maxLength={15}
            />
          </View>

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleSendOtp}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Continue</Text>
            )}
          </TouchableOpacity>

          <View style={styles.dividerContainer}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or continue with</Text>
            <View style={styles.dividerLine} />
          </View>

          <TouchableOpacity
            style={styles.altButton}
            onPress={() => navigation.navigate('Login')}
          >
            <Ionicons name="mail-outline" size={20} color="#14171A" />
            <Text style={styles.altButtonText}>Login with Email</Text>
          </TouchableOpacity>

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
    paddingTop: 12,
    paddingBottom: 24,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F7F9FA',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#14171A',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: '#657786',
    lineHeight: 22,
    marginBottom: 32,
  },
  error: {
    color: '#E0245E',
    fontSize: 14,
    marginBottom: 16,
  },
  phoneRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  countryCodeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F7F9FA',
    borderWidth: 1,
    borderColor: '#E1E8ED',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 14,
    gap: 6,
  },
  countryFlag: {
    fontSize: 20,
  },
  countryCodeText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#14171A',
  },
  phoneInput: {
    flex: 1,
    backgroundColor: '#F7F9FA',
    borderWidth: 1,
    borderColor: '#E1E8ED',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#14171A',
  },
  button: {
    backgroundColor: '#1DA1F2',
    borderRadius: 28,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 4,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#FFFFFF', fontSize: 17, fontWeight: '700' },
  dividerContainer: {
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
    marginHorizontal: 16,
    fontSize: 14,
    color: '#657786',
  },
  altButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E1E8ED',
    borderRadius: 28,
    paddingVertical: 14,
    gap: 10,
  },
  altButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#14171A',
  },
  bottomLink: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 32,
  },
  bottomText: {
    fontSize: 15,
    color: '#657786',
  },
  bottomLinkText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1DA1F2',
  },
});
