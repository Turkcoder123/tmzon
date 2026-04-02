import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = now - d;
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return 'az önce';
  if (diffMin < 60) return `${diffMin}dk`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}sa`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 7) return `${diffDay}g`;
  return d.toLocaleDateString('tr-TR');
}

export default function PostCard({
  post,
  currentUserId,
  onPress,
  onLike,
  onDelete,
  onAuthorPress,
}) {
  const author = post.author || {};
  const authorName = author.username || 'Anonim';
  const firstLetter = authorName.charAt(0).toUpperCase();
  const liked = post.liked || false;
  const likesCount = Array.isArray(post.likes) ? post.likes.length : (post.likes ?? post.likesCount ?? 0);
  const commentsCount = post.comments?.length ?? post.commentsCount ?? 0;

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => onPress && onPress(post)}
      activeOpacity={0.7}
    >
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.avatarRow}
          onPress={() => onAuthorPress && onAuthorPress(authorName)}
        >
          {author.avatar ? (
            <Image source={{ uri: author.avatar }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarLetter}>{firstLetter}</Text>
            </View>
          )}
          <View>
            <Text style={styles.username}>@{authorName}</Text>
            <Text style={styles.date}>{formatDate(post.createdAt)}</Text>
          </View>
        </TouchableOpacity>

        {currentUserId &&
          (author._id === currentUserId || author.id === currentUserId) && (
            <TouchableOpacity
              onPress={() => onDelete && onDelete(post)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="trash-outline" size={18} color="#E0245E" />
            </TouchableOpacity>
          )}
      </View>

      <Text style={styles.content}>{post.content}</Text>

      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => onLike && onLike(post)}
        >
          <Ionicons
            name={liked ? 'heart' : 'heart-outline'}
            size={20}
            color={liked ? '#E0245E' : '#657786'}
          />
          <Text style={[styles.actionText, liked && styles.likedText]}>
            {likesCount}
          </Text>
        </TouchableOpacity>

        <View style={styles.actionBtn}>
          <Ionicons name="chatbubble-outline" size={19} color="#657786" />
          <Text style={styles.actionText}>{commentsCount}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E1E8ED',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  avatarRow: { flexDirection: 'row', alignItems: 'center' },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    marginRight: 10,
    backgroundColor: '#E1E8ED',
  },
  avatarPlaceholder: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#1DA1F2',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  avatarLetter: { color: '#FFFFFF', fontSize: 18, fontWeight: '700' },
  username: { fontSize: 15, fontWeight: '700', color: '#14171A' },
  date: { fontSize: 12, color: '#657786', marginTop: 1 },
  content: {
    fontSize: 16,
    color: '#14171A',
    lineHeight: 22,
    marginBottom: 12,
  },
  actions: { flexDirection: 'row', alignItems: 'center' },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 24,
  },
  actionText: { marginLeft: 5, fontSize: 14, color: '#657786' },
  likedText: { color: '#E0245E' },
});
