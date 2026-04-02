import React from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

const STORIES = [
  { id: '0', name: 'Your Story', isOwn: true, color: '#1DA1F2' },
  { id: '1', name: 'Alice', color: '#E0245E' },
  { id: '2', name: 'Bob', color: '#17BF63' },
  { id: '3', name: 'Charlie', color: '#FFAD1F' },
  { id: '4', name: 'Diana', color: '#7C4DFF' },
  { id: '5', name: 'Eve', color: '#F45D22' },
  { id: '6', name: 'Frank', color: '#794BC4' },
];

const CHATS = [
  {
    id: '1',
    name: 'Alice Johnson',
    message: 'Hey! How are you doing?',
    time: '2m',
    unread: 3,
    online: true,
    color: '#E0245E',
  },
  {
    id: '2',
    name: 'Bob Smith',
    message: 'See you tomorrow at the meeting',
    time: '15m',
    unread: 0,
    online: true,
    color: '#17BF63',
  },
  {
    id: '3',
    name: 'Charlie Brown',
    message: 'Thanks for sharing that link!',
    time: '1h',
    unread: 1,
    online: false,
    color: '#FFAD1F',
  },
  {
    id: '4',
    name: 'Diana Prince',
    message: 'The project is looking great',
    time: '2h',
    unread: 0,
    online: false,
    color: '#7C4DFF',
  },
  {
    id: '5',
    name: 'Eve Williams',
    message: 'Can you send me the photos?',
    time: '3h',
    unread: 0,
    online: true,
    color: '#F45D22',
  },
  {
    id: '6',
    name: 'Frank Miller',
    message: 'Happy birthday! Have a great day',
    time: '5h',
    unread: 0,
    online: false,
    color: '#794BC4',
  },
  {
    id: '7',
    name: 'Grace Lee',
    message: 'I just arrived at the airport',
    time: '1d',
    unread: 0,
    online: false,
    color: '#1DA1F2',
  },
];

function StoryItem({ item }) {
  return (
    <TouchableOpacity style={styles.storyItem}>
      <View style={[styles.storyRing, item.isOwn ? styles.storyRingOwn : { borderColor: item.color }]}>
        <View style={[styles.storyAvatar, { backgroundColor: item.color }]}>
          {item.isOwn ? (
            <Ionicons name="add" size={24} color="#FFFFFF" />
          ) : (
            <Text style={styles.storyAvatarText}>{item.name[0]}</Text>
          )}
        </View>
      </View>
      <Text style={styles.storyName} numberOfLines={1}>
        {item.isOwn ? 'Your Story' : item.name.split(' ')[0]}
      </Text>
    </TouchableOpacity>
  );
}

function ChatItem({ item }) {
  return (
    <TouchableOpacity style={styles.chatItem}>
      <View style={styles.chatAvatarContainer}>
        <View style={[styles.chatAvatar, { backgroundColor: item.color }]}>
          <Text style={styles.chatAvatarText}>{item.name[0]}</Text>
        </View>
        {item.online && <View style={styles.onlineDot} />}
      </View>
      <View style={styles.chatContent}>
        <View style={styles.chatHeader}>
          <Text style={[styles.chatName, item.unread > 0 && styles.chatNameBold]}>
            {item.name}
          </Text>
          <Text style={[styles.chatTime, item.unread > 0 && styles.chatTimeBold]}>
            {item.time}
          </Text>
        </View>
        <View style={styles.chatFooter}>
          <Text
            style={[styles.chatMessage, item.unread > 0 && styles.chatMessageBold]}
            numberOfLines={1}
          >
            {item.message}
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
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Toolbar */}
      <View style={styles.toolbar}>
        <Text style={styles.toolbarTitle}>Messages</Text>
        <View style={styles.toolbarActions}>
          <TouchableOpacity style={styles.toolbarButton}>
            <Ionicons name="create-outline" size={22} color="#14171A" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.toolbarButton}>
            <Ionicons name="search-outline" size={22} color="#14171A" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.toolbarButton}>
            <Ionicons name="ellipsis-horizontal" size={22} color="#14171A" />
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={CHATS}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <ChatItem item={item} />}
        ListHeaderComponent={
          <View>
            {/* Stories */}
            <FlatList
              data={STORIES}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => <StoryItem item={item} />}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.storiesList}
            />
            <View style={styles.storiesDivider} />
          </View>
        }
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FFFFFF' },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  toolbarTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#14171A',
  },
  toolbarActions: {
    flexDirection: 'row',
    gap: 4,
  },
  toolbarButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F7F9FA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  storiesList: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 16,
  },
  storyItem: {
    alignItems: 'center',
    width: 68,
  },
  storyRing: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2.5,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 2,
  },
  storyRingOwn: {
    borderColor: '#E1E8ED',
    borderStyle: 'dashed',
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
  storiesDivider: {
    height: 1,
    backgroundColor: '#F0F3F5',
    marginHorizontal: 16,
  },
  chatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
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
    fontSize: 20,
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
  chatTimeBold: {
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
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  unreadText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
