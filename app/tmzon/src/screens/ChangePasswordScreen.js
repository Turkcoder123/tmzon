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

export default function ChangePasswordScreen({ navigation }) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleChangePassword() {
    if (!currentPassword || !newPassword || !confirmPassword) {
      setError('Lütfen tüm alanları doldurun');
      return;
    }
    if (newPassword.length < 6) {
      setError('Yeni şifre en az 6 karakter olmalıdır');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Yeni şifreler eşleşmiyor');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await api.changePassword(currentPassword, newPassword);
      Alert.alert('Başarılı', 'Şifreniz başarıyla değiştirildi', [
        { text: 'Tamam', onPress: () => navigation.goBack() },
      ]);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
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
          <Text style={styles.title}>Şifre Değiştir</Text>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Text style={styles.label}>Mevcut Şifre</Text>
          <TextInput
            style={styles.input}
            placeholder="Mevcut şifreniz"
            placeholderTextColor="#657786"
            value={currentPassword}
            onChangeText={setCurrentPassword}
            secureTextEntry
          />

          <Text style={styles.label}>Yeni Şifre</Text>
          <TextInput
            style={styles.input}
            placeholder="Yeni şifreniz (en az 6 karakter)"
            placeholderTextColor="#657786"
            value={newPassword}
            onChangeText={setNewPassword}
            secureTextEntry
          />

          <Text style={styles.label}>Yeni Şifre (Tekrar)</Text>
          <TextInput
            style={styles.input}
            placeholder="Yeni şifrenizi tekrar girin"
            placeholderTextColor="#657786"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
          />

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleChangePassword}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Şifreyi Değiştir</Text>
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
  container: { padding: 24 },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#14171A',
    marginBottom: 24,
  },
  error: {
    color: '#E0245E',
    fontSize: 14,
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#657786',
    marginBottom: 6,
    marginTop: 12,
  },
  input: {
    backgroundColor: '#F7F9FA',
    borderWidth: 1,
    borderColor: '#E1E8ED',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#14171A',
  },
  button: {
    backgroundColor: '#1DA1F2',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 28,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#FFFFFF', fontSize: 17, fontWeight: '700' },
});
