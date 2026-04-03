import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { getAvatarColor, formatTimeAgo } from '../utils/helpers';
import * as api from '../api/client';

function StoryItem({ item, onPress }) {
  if (item.type === 'add') {
    return (
      <TouchableOpacity style={styles.storyItem} onPress={onPress}>
        <View style={styles.addStoryCircle}>
          <Ionicons name="add" size={28} color="#1DA1F2" />
        </View>
        <Text style={styles.storyName}>Hikaye</Text>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity style={styles.storyItem} onPress={onPress}>
      <View style={[
        styles.storyRing,
        item.hasNew ? { borderColor: '#1DA1F2' } : { borderColor: '#E1E8ED' },
      ]}>
        <View style={[styles.storyAvatar, { backgroundColor: getAvatarColor(item.user?.username) }]}>
          <Text style={styles.storyAvatarText}>
            {item.user?.username?.charAt(0)?.toUpperCase() || '?'}
          </Text>
        </View>
      </View>
      <Text style={styles.storyName} numberOfLines={1}>
        {item.user?.username || 'User'}
      </Text>
    </TouchableOpacity>
  );
}

function ChatItem({ item, onPress, currentUserId }) {
  const other = item.participants?.find((p) => p._id !== currentUserId);
  const name = other?.username || 'User';
  const color = getAvatarColor(name);

  return (
    <TouchableOpacity style={styles.chatItem} activeOpacity={0.7} onPress={onPress}>
      <View style={styles.chatAvatarContainer}>
        <View style={[styles.chatAvatar, { backgroundColor: color }]}>
          <Text style={styles.chatAvatarText}>
            {name.charAt(0).toUpperCase()}
          </Text>
        </View>
      </View>

      <View style={styles.chatContent}>
        <View style={styles.chatHeader}>
          <Text style={styles.chatName}>{name}</Text>
          <Text style={styles.chatTime}>
            {formatTimeAgo(item.lastMessage?.createdAt || item.updatedAt)}
          </Text>
        </View>
        <View style={styles.chatFooter}>
          <Text style={styles.chatMessage} numberOfLines={1}>
            {item.lastMessage?.content || 'Sohbete başla...'}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default function MessagesScreen({ navigation }) {
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [storyGroups, setStoryGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [convData, storyData] = await Promise.all([
        api.getConversations().catch(() => []),
        api.getStories().catch(() => []),
      ]);
      setConversations(convData);
      setStoryGroups(storyData);
    } catch {
      // ignore
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const handleRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const storyListData = [
    { id: 'add', type: 'add' },
    ...storyGroups.map((g, i) => ({ ...g, id: `story-${i}` })),
  ];

  const handleStoryPress = (item, index) => {
    if (item.type === 'add') {
      navigation.navigate('CreateStory');
      return;
    }
    // Navigate to story viewer
    const groupIndex = index - 1; // subtract 1 for the "add" button
    navigation.navigate('StoryView', {
      storyGroups,
      initialGroupIndex: groupIndex,
    });
  };

  const handleChatPress = (conv) => {
    const other = conv.participants?.find((p) => p._id !== user?.userId);
    navigation.navigate('Chat', {
      conversationId: conv._id,
      participantName: other?.username || 'User',
      participantColor: getAvatarColor(other?.username),
    });
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.toolbar}>
          <Text style={styles.toolbarTitle}>Mesajlar</Text>
        </View>
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#1DA1F2" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      {/* Toolbar */}
      <View style={styles.toolbar}>
        <Text style={styles.toolbarTitle}>Mesajlar</Text>
        <View style={styles.toolbarActions}>
          <TouchableOpacity style={styles.toolbarButton}>
            <Ionicons name="search-outline" size={24} color="#14171A" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Story List */}
      <View style={styles.storySection}>
        <FlatList
          data={storyListData}
          renderItem={({ item, index }) => (
            <StoryItem item={item} onPress={() => handleStoryPress(item, index)} />
          )}
          keyExtractor={(item) => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.storyList}
        />
      </View>

      {/* Divider */}
      <View style={styles.sectionDivider} />

      {/* Chat List */}
      <FlatList
        data={conversations}
        renderItem={({ item }) => (
          <ChatItem
            item={item}
            onPress={() => handleChatPress(item)}
            currentUserId={user?.userId}
          />
        )}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.chatList}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#1DA1F2" />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="chatbubbles-outline" size={48} color="#E1E8ED" />
            <Text style={styles.emptyTitle}>Henüz mesaj yok</Text>
            <Text style={styles.emptySubtitle}>
              Birini takip edip sohbet başlatın
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  toolbarTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#14171A',
    fontFamily: Platform.OS === 'ios' ? 'InriaSans-Bold' : undefined,
  },
  toolbarActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  toolbarButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  storySection: {
    paddingVertical: 8,
  },
  storyList: {
    paddingHorizontal: 16,
    gap: 16,
  },
  storyItem: {
    alignItems: 'center',
    width: 68,
  },
  addStoryCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: '#1DA1F2',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E8F5FE',
  },
  storyRing: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  storyAvatar: {
    width: 54,
    height: 54,
    borderRadius: 27,
    alignItems: 'center',
    justifyContent: 'center',
  },
  storyAvatarText: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  storyName: {
    fontSize: 12,
    color: '#657786',
    marginTop: 6,
    textAlign: 'center',
  },
  sectionDivider: {
    height: 1,
    backgroundColor: '#F0F3F5',
    marginHorizontal: 20,
  },
  chatList: {
    paddingVertical: 4,
    flexGrow: 1,
  },
  chatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  chatAvatarContainer: {
    position: 'relative',
    marginRight: 14,
  },
  chatAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chatAvatarText: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  chatContent: {
    flex: 1,
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  chatName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#14171A',
  },
  chatTime: {
    fontSize: 13,
    color: '#AAB8C2',
  },
  chatFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  chatMessage: {
    fontSize: 14,
    color: '#AAB8C2',
    flex: 1,
    marginRight: 8,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#657786',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#AAB8C2',
    marginTop: 4,
    textAlign: 'center',
  },
});
