import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import * as api from '../api/client';
import PostCard from '../components/PostCard';

export default function ProfileScreen({ route, navigation }) {
  const { user, logout } = useAuth();
  const paramUsername = route?.params?.username;
  const isOwnProfile = !paramUsername || paramUsername === user?.username;
  const targetUsername = isOwnProfile ? user?.username : paramUsername;

  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);

  const loadProfile = useCallback(async () => {
    try {
      let profileData;
      if (isOwnProfile) {
        profileData = await api.getMe();
      } else {
        profileData = await api.getUserProfile(targetUsername);
      }
      setProfile(profileData.user || profileData);

      const postsData = await api.getUserPosts(targetUsername);
      const list = Array.isArray(postsData) ? postsData : postsData.posts || [];
      setPosts(list);
    } catch {
      // Silently handle errors
    }
  }, [targetUsername, isOwnProfile]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      loadProfile().finally(() => setLoading(false));
    }, [loadProfile])
  );

  async function onRefresh() {
    setRefreshing(true);
    await loadProfile();
    setRefreshing(false);
  }

  async function handleFollow() {
    setFollowLoading(true);
    try {
      const data = await api.toggleFollow(targetUsername);
      setProfile((p) => ({
        ...p,
        following: data.following,
        followersCount: data.followersCount,
      }));
    } catch {}
    setFollowLoading(false);
  }

  async function handleLogout() {
    Alert.alert('Çıkış Yap', 'Çıkış yapmak istediğine emin misin?', [
      { text: 'İptal', style: 'cancel' },
      { text: 'Çıkış Yap', style: 'destructive', onPress: () => logout() },
    ]);
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
                likesCount: data.likes?.length ?? p.likesCount,
              }
            : p
        )
      );
    } catch {}
  }

  async function handleDeletePost(post) {
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
          } catch {}
        },
      },
    ]);
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#1DA1F2" />
          <Text style={styles.loadingText}>Yükleniyor...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const username = profile?.username || targetUsername || '';
  const firstLetter = username.charAt(0).toUpperCase();
  const bio = profile?.bio || '';
  const followersCount = profile?.followersCount ?? profile?.followers?.length ?? 0;
  const followingCount = profile?.followingCount ?? profile?.following?.length ?? 0;
  const isFollowing = profile?.following === true || profile?.isFollowing === true;

  function renderHeader() {
    return (
      <View style={styles.profileHeader}>
        <View style={styles.profileTop}>
          {profile?.avatar ? (
            <Image source={{ uri: profile.avatar }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarLetter}>{firstLetter}</Text>
            </View>
          )}

          <Text style={styles.profileUsername}>@{username}</Text>
          {bio ? <Text style={styles.bio}>{bio}</Text> : null}

          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <Text style={styles.statNumber}>{followersCount}</Text>
              <Text style={styles.statLabel}>Takipçi</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statNumber}>{followingCount}</Text>
              <Text style={styles.statLabel}>Takip Edilenler</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statNumber}>{posts.length}</Text>
              <Text style={styles.statLabel}>Gönderi</Text>
            </View>
          </View>

          {isOwnProfile ? (
            <View style={styles.ownActions}>
              <TouchableOpacity
                style={styles.editBtn}
                onPress={() => navigation.navigate('EditProfile')}
              >
                <Text style={styles.editBtnText}>Profili Düzenle</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.logoutBtn}
                onPress={handleLogout}
              >
                <Ionicons name="log-out-outline" size={20} color="#E0245E" />
                <Text style={styles.logoutText}>Çıkış Yap</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={[
                styles.followBtn,
                isFollowing && styles.followBtnActive,
              ]}
              onPress={handleFollow}
              disabled={followLoading}
            >
              {followLoading ? (
                <ActivityIndicator
                  color={isFollowing ? '#1DA1F2' : '#fff'}
                  size="small"
                />
              ) : (
                <Text
                  style={[
                    styles.followBtnText,
                    isFollowing && styles.followBtnTextActive,
                  ]}
                >
                  {isFollowing ? 'Takibi Bırak' : 'Takip Et'}
                </Text>
              )}
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.postsHeader}>
          <Text style={styles.postsTitle}>Gönderiler</Text>
        </View>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={isOwnProfile ? ['top'] : []}>
      <FlatList
        data={posts}
        keyExtractor={(item) => item._id || item.id || String(Math.random())}
        renderItem={({ item }) => (
          <PostCard
            post={item}
            currentUserId={user?.userId}
            onPress={(p) =>
              navigation.navigate('PostDetail', { postId: p._id || p.id })
            }
            onLike={handleLike}
            onDelete={handleDeletePost}
            onAuthorPress={(uname) =>
              navigation.push('ProfileView', { username: uname })
            }
          />
        )}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Henüz gönderi yok</Text>
          </View>
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#1DA1F2"
          />
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FFFFFF' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 10, fontSize: 14, color: '#657786' },
  profileHeader: { borderBottomWidth: 1, borderBottomColor: '#E1E8ED' },
  profileTop: { alignItems: 'center', paddingVertical: 24, paddingHorizontal: 16 },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 12,
    backgroundColor: '#E1E8ED',
  },
  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#1DA1F2',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarLetter: { color: '#FFFFFF', fontSize: 32, fontWeight: '700' },
  profileUsername: { fontSize: 20, fontWeight: '700', color: '#14171A', marginBottom: 6 },
  bio: {
    fontSize: 15,
    color: '#657786',
    textAlign: 'center',
    marginBottom: 16,
    paddingHorizontal: 24,
    lineHeight: 21,
  },
  statsRow: { flexDirection: 'row', marginBottom: 20 },
  stat: { alignItems: 'center', marginHorizontal: 20 },
  statNumber: { fontSize: 18, fontWeight: '700', color: '#14171A' },
  statLabel: { fontSize: 13, color: '#657786', marginTop: 2 },
  ownActions: { alignItems: 'center', width: '100%' },
  editBtn: {
    borderWidth: 1.5,
    borderColor: '#1DA1F2',
    borderRadius: 20,
    paddingHorizontal: 28,
    paddingVertical: 10,
    marginBottom: 12,
  },
  editBtnText: { color: '#1DA1F2', fontSize: 15, fontWeight: '600' },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoutText: { color: '#E0245E', fontSize: 14, fontWeight: '500', marginLeft: 6 },
  followBtn: {
    backgroundColor: '#1DA1F2',
    borderRadius: 20,
    paddingHorizontal: 32,
    paddingVertical: 10,
  },
  followBtnActive: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#1DA1F2',
  },
  followBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
  followBtnTextActive: { color: '#1DA1F2' },
  postsHeader: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#E1E8ED',
  },
  postsTitle: { fontSize: 16, fontWeight: '700', color: '#14171A' },
  emptyContainer: { paddingVertical: 40, alignItems: 'center' },
  emptyText: { fontSize: 15, color: '#657786' },
});
