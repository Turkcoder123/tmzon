import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

export default function ExploreScreen() {
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.toolbar}>
        <Text style={styles.toolbarTitle}>Explore</Text>
      </View>
      <View style={styles.content}>
        <Ionicons name="compass-outline" size={64} color="#E1E8ED" />
        <Text style={styles.emptyTitle}>Coming Soon</Text>
        <Text style={styles.emptyText}>
          Explore trending topics, discover new people, and find interesting content.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FFFFFF' },
  toolbar: {
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  toolbarTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#14171A',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#14171A',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 15,
    color: '#657786',
    textAlign: 'center',
    lineHeight: 22,
  },
});
