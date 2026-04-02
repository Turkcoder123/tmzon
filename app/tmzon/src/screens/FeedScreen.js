import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import * as api from '../api/client';
import PostCard from '../components/PostCard';
import CreatePostModal from '../components/CreatePostModal';

export default function FeedScreen({ navigation }) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('explore');
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);

  const fetchPosts = useCallback(async (tab) => {
    try {
      const data =
        (tab || activeTab) === 'following'
          ? await api.getFeed()
          : await api.getAllPosts();
      const list = Array.isArray(data) ? data : data.posts || [];
      setPosts(list);
    } catch (e) {
      console.warn('Feed fetch error:', e.message);
      setPosts([]);
    }
  }, [activeTab]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchPosts().finally(() => setLoading(false));
    }, [fetchPosts])
  );

  async function onRefresh() {
    setRefreshing(true);
    await fetchPosts();
    setRefreshing(false);
  }

  function switchTab(tab) {
    setActiveTab(tab);
    setLoading(true);
    fetchPosts(tab).finally(() => setLoading(false));
  }

  async function handleLike(post) {
    try {
      const data = await api.toggleLike(post._id || post.id);
      setPosts((prev) =>
        prev.map((p) =>
          (p._id || p.id) === (post._id || post.id)
            ? {
                ...p,
                liked: data.liked,
                likes: data.likes,
              }
            : p
        )
      );
    } catch (e) {
      Alert.alert('Hata', e.message || 'Beğeni işlemi başarısız');
    }
  }

  async function handleDelete(post) {
    Alert.alert('Sil', 'Bu gönderiyi silmek istediğine emin misin?', [
      { text: 'İptal', style: 'cancel' },
      {
        text: 'Sil',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.deletePost(post._id || post.id);
            setPosts((prev) =>
              prev.filter(
                (p) => (p._id || p.id) !== (post._id || post.id)
              )
            );
          } catch (e) {
            Alert.alert('Hata', e.message || 'Silme işlemi başarısız');
          }
        },
      },
    ]);
  }

  function renderItem({ item }) {
    return (
      <PostCard
        post={item}
        currentUserId={user?.userId}
        onPress={(p) =>
          navigation.navigate('PostDetail', { postId: p._id || p.id })
        }
        onLike={handleLike}
        onDelete={handleDelete}
        onAuthorPress={(username) =>
          navigation.navigate('ProfileView', { username })
        }
      />
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Tab Bar */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'explore' && styles.tabActive]}
          onPress={() => switchTab('explore')}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === 'explore' && styles.tabTextActive,
            ]}
          >
            Keşfet
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'following' && styles.tabActive]}
          onPress={() => switchTab('following')}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === 'following' && styles.tabTextActive,
            ]}
          >
            Takip Edilenler
          </Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#1DA1F2" />
          <Text style={styles.loadingText}>Yükleniyor...</Text>
        </View>
      ) : (
        <FlatList
          data={posts}
          keyExtractor={(item) => item._id || item.id || String(Math.random())}
          renderItem={renderItem}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#1DA1F2"
            />
          }
          ListEmptyComponent={
            <View style={styles.center}>
              <Text style={styles.emptyText}>Henüz gönderi yok</Text>
            </View>
          }
          contentContainerStyle={posts.length === 0 && styles.emptyContainer}
        />
      )}

      {/* FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => setModalVisible(true)}
      >
        <Ionicons name="add" size={28} color="#FFFFFF" />
      </TouchableOpacity>

      <CreatePostModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onCreated={onRefresh}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FFFFFF' },
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#E1E8ED',
    backgroundColor: '#FFFFFF',
  },
  tab: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
  },
  tabActive: {
    borderBottomWidth: 3,
    borderBottomColor: '#1DA1F2',
  },
  tabText: { fontSize: 15, fontWeight: '600', color: '#657786' },
  tabTextActive: { color: '#1DA1F2' },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 60,
  },
  loadingText: { marginTop: 10, fontSize: 14, color: '#657786' },
  emptyText: { fontSize: 16, color: '#657786' },
  emptyContainer: { flexGrow: 1 },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#1DA1F2',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
});
