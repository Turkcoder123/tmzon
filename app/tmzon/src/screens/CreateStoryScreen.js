import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as api from '../api/client';

const COLORS = [
  '#1DA1F2', '#17BF63', '#794BC4', '#F45D22', '#E0245E',
  '#FFAD1F', '#14171A', '#657786', '#E91E63', '#00BCD4',
  '#4CAF50', '#FF5722', '#3F51B5', '#009688',
];

export default function CreateStoryScreen({ navigation }) {
  const [content, setContent] = useState('');
  const [backgroundColor, setBackgroundColor] = useState('#1DA1F2');
  const [textColor, setTextColor] = useState('#FFFFFF');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handlePost = async () => {
    if (!content.trim() || loading) return;
    setLoading(true);
    setError('');

    try {
      await api.createStory(content.trim(), backgroundColor, textColor);
      navigation.goBack();
    } catch (err) {
      setError(err.message || 'Story oluşturulamadı');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="close" size={28} color="#14171A" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Story Oluştur</Text>
          <TouchableOpacity
            style={[styles.postButton, !content.trim() && styles.postButtonDisabled]}
            onPress={handlePost}
            disabled={!content.trim() || loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.postButtonText}>Paylaş</Text>
            )}
          </TouchableOpacity>
        </View>

        {error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {/* Preview */}
        <View style={[styles.preview, { backgroundColor }]}>
          <Text style={[styles.previewText, { color: textColor }]}>
            {content || 'Story metnini yaz...'}
          </Text>
        </View>

        {/* Input */}
        <View style={styles.inputSection}>
          <TextInput
            style={styles.input}
            placeholder="Story metnini yaz..."
            placeholderTextColor="#AAB8C2"
            value={content}
            onChangeText={setContent}
            multiline
            maxLength={200}
            autoFocus
          />
          <Text style={styles.charCount}>{content.length}/200</Text>
        </View>

        {/* Color Picker */}
        <View style={styles.colorSection}>
          <Text style={styles.sectionTitle}>Arkaplan Rengi</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.colorRow}>
              {COLORS.map((color) => (
                <TouchableOpacity
                  key={color}
                  style={[
                    styles.colorCircle,
                    { backgroundColor: color },
                    backgroundColor === color && styles.colorCircleActive,
                  ]}
                  onPress={() => setBackgroundColor(color)}
                />
              ))}
            </View>
          </ScrollView>
        </View>

        {/* Text Color Toggle */}
        <View style={styles.textColorSection}>
          <Text style={styles.sectionTitle}>Metin Rengi</Text>
          <View style={styles.textColorRow}>
            <TouchableOpacity
              style={[
                styles.textColorOption,
                textColor === '#FFFFFF' && styles.textColorActive,
              ]}
              onPress={() => setTextColor('#FFFFFF')}
            >
              <View style={[styles.textColorCircle, { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E1E8ED' }]} />
              <Text style={styles.textColorLabel}>Beyaz</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.textColorOption,
                textColor === '#14171A' && styles.textColorActive,
              ]}
              onPress={() => setTextColor('#14171A')}
            >
              <View style={[styles.textColorCircle, { backgroundColor: '#14171A' }]} />
              <Text style={styles.textColorLabel}>Siyah</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.textColorOption,
                textColor === '#FFAD1F' && styles.textColorActive,
              ]}
              onPress={() => setTextColor('#FFAD1F')}
            >
              <View style={[styles.textColorCircle, { backgroundColor: '#FFAD1F' }]} />
              <Text style={styles.textColorLabel}>Sarı</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  flex: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F3F5',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#14171A',
  },
  postButton: {
    backgroundColor: '#1DA1F2',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
  },
  postButtonDisabled: {
    backgroundColor: '#AAB8C2',
  },
  postButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  errorContainer: {
    backgroundColor: '#FFF0F0',
    padding: 12,
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 8,
  },
  errorText: {
    color: '#E0245E',
    fontSize: 14,
  },
  preview: {
    marginHorizontal: 16,
    marginTop: 16,
    height: 200,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  previewText: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 28,
  },
  inputSection: {
    paddingHorizontal: 16,
    marginTop: 16,
  },
  input: {
    fontSize: 16,
    color: '#14171A',
    borderWidth: 1,
    borderColor: '#E1E8ED',
    borderRadius: 12,
    padding: 12,
    minHeight: 60,
    textAlignVertical: 'top',
  },
  charCount: {
    fontSize: 12,
    color: '#AAB8C2',
    textAlign: 'right',
    marginTop: 4,
  },
  colorSection: {
    paddingHorizontal: 16,
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#657786',
    marginBottom: 10,
  },
  colorRow: {
    flexDirection: 'row',
    gap: 10,
    paddingRight: 16,
  },
  colorCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  colorCircleActive: {
    borderWidth: 3,
    borderColor: '#14171A',
  },
  textColorSection: {
    paddingHorizontal: 16,
    marginTop: 20,
  },
  textColorRow: {
    flexDirection: 'row',
    gap: 16,
  },
  textColorOption: {
    alignItems: 'center',
    padding: 8,
    borderRadius: 12,
  },
  textColorActive: {
    backgroundColor: '#E8F5FE',
  },
  textColorCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },
  textColorLabel: {
    fontSize: 12,
    color: '#657786',
    marginTop: 4,
  },
});
