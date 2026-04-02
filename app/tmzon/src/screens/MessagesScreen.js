import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

const STORIES = [
  { id: 'add', type: 'add' },
  { id: '1', name: 'Alex', color: '#1DA1F2', hasNew: true },
  { id: '2', name: 'Sarah', color: '#17BF63', hasNew: true },
  { id: '3', name: 'Mike', color: '#794BC4', hasNew: false },
  { id: '4', name: 'Emma', color: '#F45D22', hasNew: true },
  { id: '5', name: 'John', color: '#E0245E', hasNew: false },
  { id: '6', name: 'Lisa', color: '#FFAD1F', hasNew: true },
];

const CHATS = [
  {
    id: '1',
    name: 'Alex Johnson',
    lastMessage: 'Hey! How are you doing?',
    time: '2m',
    unread: 3,
    color: '#1DA1F2',
    online: true,
  },
  {
    id: '2',
    name: 'Sarah Williams',
    lastMessage: 'Thanks for sharing that!',
    time: '15m',
    unread: 1,
    color: '#17BF63',
    online: true,
  },
  {
    id: '3',
    name: 'Mike Chen',
    lastMessage: 'See you tomorrow at 10',
    time: '1h',
    unread: 0,
    color: '#794BC4',
    online: false,
  },
  {
    id: '4',
    name: 'Emma Davis',
    lastMessage: 'The project looks great 🎉',
    time: '2h',
    unread: 0,
    color: '#F45D22',
    online: false,
  },
  {
    id: '5',
    name: 'John Smith',
    lastMessage: 'Can you send me the files?',
    time: '5h',
    unread: 0,
    color: '#E0245E',
    online: true,
  },
  {
    id: '6',
    name: 'Lisa Anderson',
    lastMessage: 'Happy birthday! 🎂',
    time: '1d',
    unread: 0,
    color: '#FFAD1F',
    online: false,
  },
  {
    id: '7',
    name: 'David Park',
    lastMessage: 'Lets catch up soon',
    time: '2d',
    unread: 0,
    color: '#1DA1F2',
    online: false,
  },
];

function StoryItem({ item }) {
  if (item.type === 'add') {
    return (
      <TouchableOpacity style={styles.storyItem}>
        <View style={styles.addStoryCircle}>
          <Ionicons name="add" size={28} color="#1DA1F2" />
        </View>
        <Text style={styles.storyName}>Your Story</Text>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity style={styles.storyItem}>
      <View style={[
        styles.storyRing,
        item.hasNew ? { borderColor: '#1DA1F2' } : { borderColor: '#E1E8ED' },
      ]}>
        <View style={[styles.storyAvatar, { backgroundColor: item.color }]}>
          <Text style={styles.storyAvatarText}>
            {item.name.charAt(0)}
          </Text>
        </View>
      </View>
      <Text style={styles.storyName} numberOfLines={1}>
        {item.name}
      </Text>
    </TouchableOpacity>
  );
}

function ChatItem({ item }) {
  return (
    <TouchableOpacity style={styles.chatItem} activeOpacity={0.7}>
      <View style={styles.chatAvatarContainer}>
        <View style={[styles.chatAvatar, { backgroundColor: item.color }]}>
          <Text style={styles.chatAvatarText}>
            {item.name.charAt(0)}
          </Text>
        </View>
        {item.online && <View style={styles.onlineDot} />}
      </View>

      <View style={styles.chatContent}>
        <View style={styles.chatHeader}>
          <Text style={[
            styles.chatName,
            item.unread > 0 && styles.chatNameBold,
          ]}>
            {item.name}
          </Text>
          <Text style={[
            styles.chatTime,
            item.unread > 0 && styles.chatTimeActive,
          ]}>
            {item.time}
          </Text>
        </View>
        <View style={styles.chatFooter}>
          <Text
            style={[
              styles.chatMessage,
              item.unread > 0 && styles.chatMessageBold,
            ]}
            numberOfLines={1}
          >
            {item.lastMessage}
          </Text>
          {item.unread > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadText}>{item.unread}</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default function MessagesScreen() {
  return (
    <SafeAreaView style={styles.safe}>
      {/* Toolbar */}
      <View style={styles.toolbar}>
        <Text style={styles.toolbarTitle}>Messages</Text>
        <View style={styles.toolbarActions}>
          <TouchableOpacity style={styles.toolbarButton}>
            <Ionicons name="create-outline" size={24} color="#14171A" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.toolbarButton}>
            <Ionicons name="search-outline" size={24} color="#14171A" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.toolbarButton}>
            <Ionicons name="ellipsis-horizontal" size={24} color="#14171A" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Story List */}
      <View style={styles.storySection}>
        <FlatList
          data={STORIES}
          renderItem={({ item }) => <StoryItem item={item} />}
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
        data={CHATS}
        renderItem={({ item }) => <ChatItem item={item} />}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.chatList}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#FFFFFF',
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
    fontFamily: Platform?.OS === 'ios' ? 'InriaSans-Bold' : undefined,
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
  onlineDot: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#17BF63',
    borderWidth: 2.5,
    borderColor: '#FFFFFF',
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
    fontWeight: '500',
    color: '#14171A',
  },
  chatNameBold: {
    fontWeight: '700',
  },
  chatTime: {
    fontSize: 13,
    color: '#AAB8C2',
  },
  chatTimeActive: {
    color: '#1DA1F2',
    fontWeight: '600',
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
  chatMessageBold: {
    color: '#657786',
    fontWeight: '500',
  },
  unreadBadge: {
    backgroundColor: '#1DA1F2',
    borderRadius: 12,
    minWidth: 22,
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  unreadText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
});
