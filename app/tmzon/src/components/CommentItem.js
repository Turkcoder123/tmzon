import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function CommentItem({ comment, currentUserId, onDelete }) {
  const author = comment.author || comment.user || {};
  const authorName = author.username || 'Anonim';
  const firstLetter = authorName.charAt(0).toUpperCase();
  const commentId = comment._id || comment.id;
  const isOwner =
    currentUserId &&
    (author._id === currentUserId || author.id === currentUserId);

  return (
    <View style={styles.container}>
      {author.avatar ? (
        <Image source={{ uri: author.avatar }} style={styles.avatar} />
      ) : (
        <View style={styles.avatarPlaceholder}>
          <Text style={styles.avatarLetter}>{firstLetter}</Text>
        </View>
      )}

      <View style={styles.body}>
        <Text style={styles.username}>@{authorName}</Text>
        <Text style={styles.content}>{comment.content}</Text>
      </View>

      {isOwner && (
        <TouchableOpacity
          onPress={() => onDelete && onDelete(commentId)}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          style={styles.deleteBtn}
        >
          <Ionicons name="close-circle-outline" size={18} color="#E0245E" />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E1E8ED',
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 10,
    backgroundColor: '#E1E8ED',
  },
  avatarPlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#1DA1F2',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  avatarLetter: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
  body: { flex: 1 },
  username: { fontSize: 13, fontWeight: '700', color: '#14171A', marginBottom: 2 },
  content: { fontSize: 14, color: '#14171A', lineHeight: 20 },
  deleteBtn: { paddingLeft: 8, paddingTop: 2 },
});
