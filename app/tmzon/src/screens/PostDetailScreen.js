import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import * as api from '../api/client';
import CommentItem from '../components/CommentItem';

export default function PostDetailScreen({ route, navigation }) {
  const { postId } = route.params;
  const { user } = useAuth();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState('');
  const [sending, setSending] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    loadPost();
  }, [postId]);

  async function loadPost() {
    try {
      const data = await api.getPost(postId);
      setPost(data.post || data);
    } catch {
      Alert.alert('Hata', 'Gönderi yüklenemedi');
    } finally {
      setLoading(false);
    }
  }

  async function handleLike() {
    if (!post) return;
    try {
      const data = await api.toggleLike(postId);
      setPost((p) => ({
        ...p,
        liked: data.liked,
        likes: data.likes,
      }));
    } catch (e) {
      Alert.alert('Hata', e.message || 'Beğeni işlemi başarısız');
    }
  }

  async function handleAddComment() {
    if (!commentText.trim()) return;
    setSending(true);
    try {
      await api.addComment(postId, commentText.trim());
      setCommentText('');
      await loadPost();
    } catch (e) {
      Alert.alert('Hata', e.message);
    } finally {
      setSending(false);
    }
  }

  async function handleDeleteComment(commentId) {
    Alert.alert('Sil', 'Bu yorumu silmek istediğine emin misin?', [
      { text: 'İptal', style: 'cancel' },
      {
        text: 'Sil',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.deleteComment(postId, commentId);
            await loadPost();
          } catch (e) {
            Alert.alert('Hata', e.message || 'Yorum silinemedi');
          }
        },
      },
    ]);
  }

  async function handleDeletePost() {
    Alert.alert('Sil', 'Bu gönderiyi silmek istediğine emin misin?', [
      { text: 'İptal', style: 'cancel' },
      {
        text: 'Sil',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.deletePost(postId);
            navigation.goBack();
          } catch (e) {
            Alert.alert('Hata', e.message || 'Gönderi silinemedi');
          }
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

  if (!post) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <Text style={styles.emptyText}>Gönderi bulunamadı</Text>
        </View>
      </SafeAreaView>
    );
  }

  const author = post.author || {};
  const authorName = author.username || 'Anonim';
  const firstLetter = authorName.charAt(0).toUpperCase();
  const isOwner =
    user?.userId &&
    (author._id === user.userId || author.id === user.userId);
  const liked = post.liked || false;
  const likesCount = Array.isArray(post.likes) ? post.likes.length : (post.likes ?? post.likesCount ?? 0);
  const comments = post.comments || [];

  function renderHeader() {
    return (
      <View style={styles.postContainer}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.avatarRow}
            onPress={() =>
              navigation.navigate('ProfileView', { username: authorName })
            }
          >
            {author.avatar ? (
              <Image source={{ uri: author.avatar }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarLetter}>{firstLetter}</Text>
              </View>
            )}
            <Text style={styles.username}>@{authorName}</Text>
          </TouchableOpacity>

          {isOwner && (
            <TouchableOpacity onPress={handleDeletePost}>
              <Ionicons name="trash-outline" size={20} color="#E0245E" />
            </TouchableOpacity>
          )}
        </View>

        <Text style={styles.content}>{post.content}</Text>

        <View style={styles.meta}>
          <Text style={styles.date}>
            {new Date(post.createdAt).toLocaleString('tr-TR')}
          </Text>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity style={styles.actionBtn} onPress={handleLike}>
            <Ionicons
              name={liked ? 'heart' : 'heart-outline'}
              size={22}
              color={liked ? '#E0245E' : '#657786'}
            />
            <Text style={[styles.actionText, liked && styles.likedText]}>
              {likesCount} Beğen
            </Text>
          </TouchableOpacity>

          <View style={styles.actionBtn}>
            <Ionicons name="chatbubble-outline" size={20} color="#657786" />
            <Text style={styles.actionText}>
              {comments.length} Yorum
            </Text>
          </View>
        </View>

        <View style={styles.commentsHeader}>
          <Text style={styles.commentsTitle}>Yorumlar</Text>
        </View>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <FlatList
          data={comments}
          keyExtractor={(item) => item._id || item.id || String(Math.random())}
          renderItem={({ item }) => (
            <CommentItem
              comment={item}
              currentUserId={user?.userId}
              onDelete={handleDeleteComment}
            />
          )}
          ListHeaderComponent={renderHeader}
          ListEmptyComponent={
            <Text style={styles.noComments}>Henüz yorum yok</Text>
          }
          contentContainerStyle={styles.listContent}
        />

        <View style={styles.inputBar}>
          <TextInput
            ref={inputRef}
            style={styles.commentInput}
            placeholder="Yorum yaz..."
            placeholderTextColor="#657786"
            value={commentText}
            onChangeText={setCommentText}
            multiline
          />
          <TouchableOpacity
            onPress={handleAddComment}
            disabled={sending || !commentText.trim()}
            style={[
              styles.sendBtn,
              (!commentText.trim() || sending) && styles.sendBtnDisabled,
            ]}
          >
            {sending ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Ionicons name="send" size={18} color="#FFFFFF" />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FFFFFF' },
  flex: { flex: 1 },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: { marginTop: 10, fontSize: 14, color: '#657786' },
  emptyText: { fontSize: 16, color: '#657786' },
  postContainer: { borderBottomWidth: 1, borderBottomColor: '#E1E8ED' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 10,
  },
  avatarRow: { flexDirection: 'row', alignItems: 'center' },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    marginRight: 10,
    backgroundColor: '#E1E8ED',
  },
  avatarPlaceholder: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#1DA1F2',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  avatarLetter: { color: '#FFFFFF', fontSize: 20, fontWeight: '700' },
  username: { fontSize: 16, fontWeight: '700', color: '#14171A' },
  content: {
    fontSize: 18,
    color: '#14171A',
    lineHeight: 26,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  meta: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E1E8ED',
  },
  date: { fontSize: 13, color: '#657786' },
  actions: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E1E8ED',
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 28,
  },
  actionText: { marginLeft: 6, fontSize: 14, color: '#657786' },
  likedText: { color: '#E0245E' },
  commentsHeader: { paddingHorizontal: 16, paddingVertical: 12 },
  commentsTitle: { fontSize: 16, fontWeight: '700', color: '#14171A' },
  noComments: {
    textAlign: 'center',
    color: '#657786',
    fontSize: 14,
    paddingVertical: 20,
  },
  listContent: { paddingBottom: 16 },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#E1E8ED',
    backgroundColor: '#FFFFFF',
  },
  commentInput: {
    flex: 1,
    backgroundColor: '#F7F9FA',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    color: '#14171A',
    maxHeight: 100,
    marginRight: 8,
  },
  sendBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#1DA1F2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendBtnDisabled: { opacity: 0.5 },
});
