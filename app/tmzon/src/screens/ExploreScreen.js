import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

export default function ExploreScreen() {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.toolbar}>
        <Text style={styles.toolbarTitle}>Explore</Text>
      </View>
      <View style={styles.content}>
        <View style={styles.iconCircle}>
          <Ionicons name="compass-outline" size={48} color="#1DA1F2" />
        </View>
        <Text style={styles.title}>Explore</Text>
        <Text style={styles.subtitle}>
          Discover trending topics, people, and content from around the world.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  toolbar: {
    paddingHorizontal: 20,
    paddingVertical: 12,
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
  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#E8F5FE',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#14171A',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#657786',
    textAlign: 'center',
    lineHeight: 24,
  },
});
