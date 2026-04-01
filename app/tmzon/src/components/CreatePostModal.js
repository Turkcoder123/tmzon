import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Modal,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { createPost } from '../api/client';

export default function CreatePostModal({ visible, onClose, onCreated }) {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handlePost() {
    if (!content.trim()) return;
    setError('');
    setLoading(true);
    try {
      await createPost(content.trim());
      setContent('');
      onCreated && onCreated();
      onClose();
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  function handleCancel() {
    setContent('');
    setError('');
    onClose();
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={handleCancel}
    >
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.sheet}>
          <View style={styles.header}>
            <TouchableOpacity onPress={handleCancel}>
              <Text style={styles.cancelText}>İptal</Text>
            </TouchableOpacity>
            <Text style={styles.title}>Yeni Gönderi</Text>
            <TouchableOpacity
              onPress={handlePost}
              disabled={loading || !content.trim()}
              style={[
                styles.postBtn,
                (!content.trim() || loading) && styles.postBtnDisabled,
              ]}
            >
              {loading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.postBtnText}>Paylaş</Text>
              )}
            </TouchableOpacity>
          </View>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <TextInput
            style={styles.input}
            placeholder="Bir şeyler yaz..."
            placeholderTextColor="#657786"
            value={content}
            onChangeText={setContent}
            multiline
            autoFocus
            textAlignVertical="top"
          />
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 32,
    minHeight: 300,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E1E8ED',
  },
  title: { fontSize: 17, fontWeight: '700', color: '#14171A' },
  cancelText: { fontSize: 16, color: '#657786' },
  postBtn: {
    backgroundColor: '#1DA1F2',
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingVertical: 8,
  },
  postBtnDisabled: { opacity: 0.5 },
  postBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
  error: {
    color: '#E0245E',
    fontSize: 13,
    textAlign: 'center',
    marginTop: 8,
  },
  input: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
    fontSize: 17,
    color: '#14171A',
    lineHeight: 24,
    minHeight: 160,
  },
});
