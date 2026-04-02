import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as api from '../api/client';

const DEVICE_ICONS = {
  mobile: 'phone-portrait-outline',
  web: 'globe-outline',
  desktop: 'desktop-outline',
  unknown: 'hardware-chip-outline',
};

function formatDate(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleString('tr-TR');
}

export default function SessionsScreen({ navigation }) {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [revoking, setRevoking] = useState(null);

  useEffect(() => {
    loadSessions();
  }, []);

  async function loadSessions() {
    try {
      const data = await api.getSessions();
      const list = Array.isArray(data) ? data : data.sessions || [];
      setSessions(list);
    } catch (e) {
      Alert.alert('Hata', e.message || 'Oturumlar yüklenemedi');
    } finally {
      setLoading(false);
    }
  }

  async function handleRevoke(sessionId) {
    Alert.alert(
      'Oturumu Sonlandır',
      'Bu cihazdaki oturumu sonlandırmak istediğine emin misin?',
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Sonlandır',
          style: 'destructive',
          onPress: async () => {
            setRevoking(sessionId);
            try {
              await api.revokeSession(sessionId);
              setSessions((prev) => prev.filter((s) => (s._id || s.id) !== sessionId));
            } catch (e) {
              Alert.alert('Hata', e.message || 'Oturum sonlandırılamadı');
            } finally {
              setRevoking(null);
            }
          },
        },
      ]
    );
  }

  async function handleLogoutAll() {
    Alert.alert(
      'Tüm Oturumları Sonlandır',
      'Tüm cihazlardaki oturumlarınız sonlandırılacak. Tekrar giriş yapmanız gerekecek.',
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Tümünü Sonlandır',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.logoutAll();
              Alert.alert('Başarılı', 'Tüm oturumlar sonlandırıldı');
              loadSessions();
            } catch (e) {
              Alert.alert('Hata', e.message || 'İşlem başarısız');
            }
          },
        },
      ]
    );
  }

  function renderSession({ item }) {
    const icon = DEVICE_ICONS[item.deviceType] || DEVICE_ICONS.unknown;
    const isCurrent = item.isCurrent;

    return (
      <View style={[styles.sessionCard, isCurrent && styles.currentSession]}>
        <View style={styles.sessionIcon}>
          <Ionicons name={icon} size={24} color={isCurrent ? '#1DA1F2' : '#657786'} />
        </View>
        <View style={styles.sessionInfo}>
          <View style={styles.sessionHeader}>
            <Text style={styles.deviceName}>
              {item.deviceName || item.deviceType || 'Bilinmeyen Cihaz'}
            </Text>
            {isCurrent && (
              <View style={styles.currentBadge}>
                <Text style={styles.currentBadgeText}>Bu Cihaz</Text>
              </View>
            )}
          </View>
          {item.ipAddress ? (
            <Text style={styles.sessionDetail}>IP: {item.ipAddress}</Text>
          ) : null}
          <Text style={styles.sessionDetail}>
            Son Kullanım: {formatDate(item.lastUsedAt || item.updatedAt)}
          </Text>
          <Text style={styles.sessionDetail}>
            Oluşturulma: {formatDate(item.createdAt)}
          </Text>
        </View>
        {!isCurrent && (
          <TouchableOpacity
            onPress={() => handleRevoke(item._id || item.id)}
            disabled={revoking === (item._id || item.id)}
            style={styles.revokeBtn}
          >
            {revoking === (item._id || item.id) ? (
              <ActivityIndicator size="small" color="#E0245E" />
            ) : (
              <Ionicons name="close-circle-outline" size={24} color="#E0245E" />
            )}
          </TouchableOpacity>
        )}
      </View>
    );
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.safe} edges={['bottom']}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#1DA1F2" />
          <Text style={styles.loadingText}>Yükleniyor...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <FlatList
        data={sessions}
        keyExtractor={(item) => item._id || item.id || String(Math.random())}
        renderItem={renderSession}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <View style={styles.headerContainer}>
            <Text style={styles.headerTitle}>Aktif Oturumlar</Text>
            <Text style={styles.headerDesc}>
              Hesabınızda aktif olan tüm cihaz oturumları aşağıda listelenmiştir.
            </Text>
          </View>
        }
        ListFooterComponent={
          sessions.length > 1 ? (
            <TouchableOpacity style={styles.logoutAllBtn} onPress={handleLogoutAll}>
              <Ionicons name="log-out-outline" size={20} color="#E0245E" />
              <Text style={styles.logoutAllText}>Tüm Oturumları Sonlandır</Text>
            </TouchableOpacity>
          ) : null
        }
        ListEmptyComponent={
          <View style={styles.center}>
            <Text style={styles.emptyText}>Aktif oturum bulunamadı</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FFFFFF' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 40 },
  loadingText: { marginTop: 10, fontSize: 14, color: '#657786' },
  emptyText: { fontSize: 15, color: '#657786' },
  listContent: { paddingBottom: 24 },
  headerContainer: { padding: 16, borderBottomWidth: 1, borderBottomColor: '#E1E8ED' },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#14171A', marginBottom: 8 },
  headerDesc: { fontSize: 14, color: '#657786', lineHeight: 20 },
  sessionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E1E8ED',
  },
  currentSession: { backgroundColor: '#F0F8FF' },
  sessionIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F7F9FA',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  sessionInfo: { flex: 1 },
  sessionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  deviceName: { fontSize: 15, fontWeight: '600', color: '#14171A' },
  currentBadge: {
    backgroundColor: '#1DA1F2',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginLeft: 8,
  },
  currentBadgeText: { color: '#FFFFFF', fontSize: 11, fontWeight: '600' },
  sessionDetail: { fontSize: 13, color: '#657786', marginTop: 2 },
  revokeBtn: { paddingLeft: 12 },
  logoutAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    marginTop: 8,
    marginHorizontal: 16,
    borderWidth: 1.5,
    borderColor: '#E0245E',
    borderRadius: 12,
  },
  logoutAllText: {
    color: '#E0245E',
    fontSize: 15,
    fontWeight: '600',
    marginLeft: 8,
  },
});
