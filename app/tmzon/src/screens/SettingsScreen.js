import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import * as api from '../api/client';

export default function SettingsScreen({ navigation }) {
  const { logout } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    try {
      const data = await api.getMe();
      setProfile(data.user || data);
    } catch {
      // Ignore errors, show settings without profile info
    } finally {
      setLoading(false);
    }
  }

  function handleLogout() {
    Alert.alert('Çıkış Yap', 'Çıkış yapmak istediğine emin misin?', [
      { text: 'İptal', style: 'cancel' },
      { text: 'Çıkış Yap', style: 'destructive', onPress: () => logout() },
    ]);
  }

  function SettingsItem({ icon, title, subtitle, onPress, danger }) {
    return (
      <TouchableOpacity style={styles.settingsItem} onPress={onPress}>
        <View style={[styles.iconContainer, danger && styles.iconContainerDanger]}>
          <Ionicons
            name={icon}
            size={20}
            color={danger ? '#E0245E' : '#1DA1F2'}
          />
        </View>
        <View style={styles.itemContent}>
          <Text style={[styles.itemTitle, danger && styles.itemTitleDanger]}>
            {title}
          </Text>
          {subtitle ? <Text style={styles.itemSubtitle}>{subtitle}</Text> : null}
        </View>
        <Ionicons name="chevron-forward" size={20} color="#CCD6DD" />
      </TouchableOpacity>
    );
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.safe} edges={['bottom']}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#1DA1F2" />
        </View>
      </SafeAreaView>
    );
  }

  const emailVerified = profile?.emailVerified;

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.container}>
        {/* Account Section */}
        <Text style={styles.sectionTitle}>Hesap</Text>
        <View style={styles.section}>
          <SettingsItem
            icon="person-outline"
            title="Profili Düzenle"
            subtitle={profile?.username ? `@${profile.username}` : undefined}
            onPress={() => navigation.navigate('EditProfile')}
          />
          {!emailVerified && (
            <SettingsItem
              icon="mail-outline"
              title="E-posta Doğrulama"
              subtitle="E-postanız henüz doğrulanmadı"
              onPress={() => navigation.navigate('VerifyEmail')}
            />
          )}
        </View>

        {/* Security Section */}
        <Text style={styles.sectionTitle}>Güvenlik</Text>
        <View style={styles.section}>
          <SettingsItem
            icon="lock-closed-outline"
            title="Şifre Değiştir"
            subtitle="Hesap şifrenizi güncelleyin"
            onPress={() => navigation.navigate('ChangePassword')}
          />
          <SettingsItem
            icon="phone-portrait-outline"
            title="Aktif Oturumlar"
            subtitle="Cihaz oturumlarınızı yönetin"
            onPress={() => navigation.navigate('Sessions')}
          />
        </View>

        {/* Danger Zone */}
        <Text style={styles.sectionTitle}>Oturum</Text>
        <View style={styles.section}>
          <SettingsItem
            icon="log-out-outline"
            title="Çıkış Yap"
            danger
            onPress={handleLogout}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F7F9FA' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  container: { paddingBottom: 32 },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#657786',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 8,
  },
  section: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#E1E8ED',
  },
  settingsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F3F5',
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#EBF5FD',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  iconContainerDanger: {
    backgroundColor: '#FDE8ED',
  },
  itemContent: { flex: 1 },
  itemTitle: { fontSize: 16, fontWeight: '500', color: '#14171A' },
  itemTitleDanger: { color: '#E0245E' },
  itemSubtitle: { fontSize: 13, color: '#657786', marginTop: 2 },
});
