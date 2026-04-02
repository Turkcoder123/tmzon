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
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as api from '../api/client';

export default function VerifyEmailScreen({ navigation }) {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState('');

  async function handleVerify() {
    if (!code.trim()) {
      setError('Lütfen doğrulama kodunu girin');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await api.verifyEmail(code.trim());
      Alert.alert('Başarılı', 'E-postanız başarıyla doğrulandı!', [
        { text: 'Tamam', onPress: () => navigation.goBack() },
      ]);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    setResending(true);
    setError('');
    try {
      await api.resendVerification();
      Alert.alert('Gönderildi', 'Yeni doğrulama kodu e-postanıza gönderildi.');
    } catch (e) {
      setError(e.message);
    } finally {
      setResending(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.title}>E-posta Doğrulama</Text>
          <Text style={styles.description}>
            E-posta adresinize gönderilen 6 haneli doğrulama kodunu girin.
          </Text>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <TextInput
            style={styles.input}
            placeholder="Doğrulama kodu"
            placeholderTextColor="#657786"
            value={code}
            onChangeText={setCode}
            keyboardType="number-pad"
            maxLength={6}
            textAlign="center"
          />

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleVerify}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Doğrula</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.resendBtn}
            onPress={handleResend}
            disabled={resending}
          >
            {resending ? (
              <ActivityIndicator size="small" color="#1DA1F2" />
            ) : (
              <Text style={styles.resendText}>Kodu Tekrar Gönder</Text>
            )}
          </TouchableOpacity>
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
    padding: 24,
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#14171A',
    textAlign: 'center',
    marginBottom: 12,
  },
  description: {
    fontSize: 15,
    color: '#657786',
    textAlign: 'center',
    marginBottom: 28,
    lineHeight: 22,
  },
  error: {
    color: '#E0245E',
    textAlign: 'center',
    marginBottom: 16,
    fontSize: 14,
  },
  input: {
    backgroundColor: '#F7F9FA',
    borderWidth: 1,
    borderColor: '#E1E8ED',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 24,
    color: '#14171A',
    letterSpacing: 8,
    fontWeight: '700',
  },
  button: {
    backgroundColor: '#1DA1F2',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 20,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#FFFFFF', fontSize: 17, fontWeight: '700' },
  resendBtn: {
    alignItems: 'center',
    paddingVertical: 16,
    marginTop: 8,
  },
  resendText: {
    color: '#1DA1F2',
    fontSize: 15,
    fontWeight: '600',
  },
});
