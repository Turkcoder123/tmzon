import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  RefreshControl,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { getAvatarColor, formatTimeAgo } from '../utils/helpers';
import * as api from '../api/client';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const CARD_HEIGHT = SCREEN_HEIGHT - 200;

function ReelCard({ item, index, onLike, onComment, onProfile }) {
  const bgColor = getAvatarColor(item.author?.username);
  const likesCount = Array.isArray(item.likes) ? item.likes.length : (item.engagement || 0);
  const commentsCount = Array.isArray(item.comments) ? item.comments.length : 0;

  return (
    <View style={[styles.reelCard, { height: CARD_HEIGHT }]}>
      <View style={[styles.reelBackground, { backgroundColor: bgColor }]}>
        {/* Content */}
        <View style={styles.reelContent}>
          <Text style={styles.reelText} numberOfLines={8}>
            {item.content}
          </Text>
        </View>

        {/* Action sidebar */}
        <View style={styles.actionSidebar}>
          <TouchableOpacity style={styles.actionButton} onPress={() => onProfile?.(item.author?.username)}>
            <View style={styles.actionAvatar}>
              <Text style={styles.actionAvatarText}>
                {item.author?.username?.charAt(0)?.toUpperCase() || '?'}
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton} onPress={() => onLike?.(item._id)}>
            <Ionicons name="heart-outline" size={28} color="#FFFFFF" />
            <Text style={styles.actionCount}>{likesCount}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton} onPress={() => onComment?.(item._id)}>
            <Ionicons name="chatbubble-outline" size={26} color="#FFFFFF" />
            <Text style={styles.actionCount}>{commentsCount}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="share-social-outline" size={26} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Bottom info */}
        <View style={styles.reelFooter}>
          <TouchableOpacity
            style={styles.authorRow}
            onPress={() => onProfile?.(item.author?.username)}
          >
            <View style={styles.authorAvatar}>
              <Text style={styles.authorAvatarText}>
                {item.author?.username?.charAt(0)?.toUpperCase() || '?'}
              </Text>
            </View>
            <Text style={styles.authorName}>@{item.author?.username || 'user'}</Text>
            <Text style={styles.postTime}>· {formatTimeAgo(item.createdAt)}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

export default function ExploreScreen({ navigation }) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchMode, setSearchMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [searching, setSearching] = useState(false);
  const flatListRef = useRef(null);

  const loadFeed = useCallback(async () => {
    try {
      const data = await api.getExploreFeed();
      setPosts(data);
    } catch {
      // Try trending as fallback
      try {
        const data = await api.getTrending();
        setPosts(data);
      } catch {
        // ignore
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadFeed();
    }, [loadFeed])
  );

  const handleRefresh = () => {
    setRefreshing(true);
    loadFeed();
  };

  const handleLike = async (postId) => {
    try {
      await api.toggleLike(postId);
      loadFeed();
    } catch {
      // ignore
    }
  };

  const handleComment = (postId) => {
    navigation.navigate('PostDetail', { postId });
  };

  const handleProfile = (username) => {
    if (username) {
      navigation.navigate('ProfileView', { username });
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setSearching(true);
    try {
      const results = await api.searchExplore(searchQuery.trim());
      setSearchResults(results);
    } catch {
      setSearchResults({ users: [], posts: [] });
    } finally {
      setSearching(false);
    }
  };

  const clearSearch = () => {
    setSearchMode(false);
    setSearchQuery('');
    setSearchResults(null);
  };

  // Search mode
  if (searchMode) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.searchHeader}>
          <TouchableOpacity onPress={clearSearch}>
            <Ionicons name="arrow-back" size={24} color="#14171A" />
          </TouchableOpacity>
          <TextInput
            style={styles.searchInput}
            placeholder="Ara..."
            placeholderTextColor="#AAB8C2"
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
            autoFocus
          />
          <TouchableOpacity onPress={handleSearch}>
            <Ionicons name="search" size={24} color="#1DA1F2" />
          </TouchableOpacity>
        </View>

        {searching ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color="#1DA1F2" />
          </View>
        ) : searchResults ? (
          <FlatList
            data={[
              ...(searchResults.users || []).map((u) => ({ ...u, _type: 'user' })),
              ...(searchResults.posts || []).map((p) => ({ ...p, _type: 'post' })),
            ]}
            renderItem={({ item }) => {
              if (item._type === 'user') {
                return (
                  <TouchableOpacity
                    style={styles.searchResultItem}
                    onPress={() => {
                      clearSearch();
                      handleProfile(item.username);
                    }}
                  >
                    <View style={[styles.searchAvatar, { backgroundColor: getAvatarColor(item.username) }]}>
                      <Text style={styles.searchAvatarText}>
                        {item.username?.charAt(0)?.toUpperCase()}
                      </Text>
                    </View>
                    <View>
                      <Text style={styles.searchName}>@{item.username}</Text>
                      {item.bio ? (
                        <Text style={styles.searchBio} numberOfLines={1}>{item.bio}</Text>
                      ) : null}
                    </View>
                  </TouchableOpacity>
                );
              }
              return (
                <TouchableOpacity
                  style={styles.searchResultItem}
                  onPress={() => {
                    clearSearch();
                    handleComment(item._id);
                  }}
                >
                  <View style={[styles.searchAvatar, { backgroundColor: getAvatarColor(item.author?.username) }]}>
                    <Ionicons name="document-text-outline" size={18} color="#FFFFFF" />
                  </View>
                  <View style={styles.searchPostContent}>
                    <Text style={styles.searchName}>@{item.author?.username}</Text>
                    <Text style={styles.searchPostText} numberOfLines={2}>{item.content}</Text>
                  </View>
                </TouchableOpacity>
              );
            }}
            keyExtractor={(item, i) => `${item._type}-${item._id || i}`}
            ListEmptyComponent={
              <View style={styles.center}>
                <Text style={styles.emptyText}>Sonuç bulunamadı</Text>
              </View>
            }
          />
        ) : (
          <View style={styles.center}>
            <Ionicons name="search-outline" size={48} color="#E1E8ED" />
            <Text style={styles.emptyText}>Kullanıcı veya içerik ara</Text>
          </View>
        )}
      </SafeAreaView>
    );
  }

  // Main reels view
  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#1DA1F2" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeReels}>
      {/* Top bar overlay */}
      <View style={styles.reelsHeader}>
        <Text style={styles.reelsTitle}>Keşfet</Text>
        <TouchableOpacity
          style={styles.searchButton}
          onPress={() => setSearchMode(true)}
        >
          <Ionicons name="search-outline" size={24} color="#14171A" />
        </TouchableOpacity>
      </View>

      {posts.length === 0 ? (
        <View style={styles.center}>
          <Ionicons name="compass-outline" size={64} color="#E1E8ED" />
          <Text style={styles.emptyTitle}>Keşfedilecek içerik yok</Text>
          <Text style={styles.emptySubtitle}>
            Daha fazla kullanıcı takip edin veya daha sonra tekrar deneyin
          </Text>
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={posts}
          renderItem={({ item, index }) => (
            <ReelCard
              item={item}
              index={index}
              onLike={handleLike}
              onComment={handleComment}
              onProfile={handleProfile}
            />
          )}
          keyExtractor={(item) => item._id}
          pagingEnabled
          showsVerticalScrollIndicator={false}
          snapToInterval={CARD_HEIGHT}
          decelerationRate="fast"
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#1DA1F2" />
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  safeReels: {
    flex: 1,
    backgroundColor: '#000000',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  reelsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 8,
    backgroundColor: '#FFFFFF',
  },
  reelsTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#14171A',
  },
  searchButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reelCard: {
    width: SCREEN_WIDTH,
  },
  reelBackground: {
    flex: 1,
    borderRadius: 0,
    overflow: 'hidden',
  },
  reelContent: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingRight: 70,
  },
  reelText: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
    lineHeight: 32,
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  actionSidebar: {
    position: 'absolute',
    right: 12,
    bottom: 80,
    alignItems: 'center',
    gap: 20,
  },
  actionButton: {
    alignItems: 'center',
  },
  actionAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    marginBottom: 4,
  },
  actionAvatarText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  actionCount: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
    marginTop: 2,
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  reelFooter: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  authorAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  authorAvatarText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  authorName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  postTime: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.7)',
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#657786',
    marginTop: 16,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#AAB8C2',
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20,
  },
  emptyText: {
    fontSize: 16,
    color: '#AAB8C2',
    marginTop: 12,
  },
  // Search
  searchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F3F5',
  },
  searchInput: {
    flex: 1,
    height: 40,
    backgroundColor: '#F0F3F5',
    borderRadius: 20,
    paddingHorizontal: 16,
    fontSize: 15,
    color: '#14171A',
  },
  searchResultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F3F5',
  },
  searchAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchAvatarText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  searchName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#14171A',
  },
  searchBio: {
    fontSize: 13,
    color: '#657786',
    marginTop: 2,
  },
  searchPostContent: {
    flex: 1,
  },
  searchPostText: {
    fontSize: 13,
    color: '#657786',
    marginTop: 2,
  },
});
