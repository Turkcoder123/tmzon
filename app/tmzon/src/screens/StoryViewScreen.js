import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Animated,
  FlatList,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { formatTimeAgo } from '../utils/helpers';
import * as api from '../api/client';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const STORY_DURATION = 5000;

function StoryProgressBar({ count, activeIndex, progress }) {
  return (
    <View style={styles.progressContainer}>
      {Array.from({ length: count }).map((_, i) => (
        <View key={i} style={styles.progressTrack}>
          <Animated.View
            style={[
              styles.progressFill,
              {
                width:
                  i < activeIndex
                    ? '100%'
                    : i === activeIndex
                    ? progress.interpolate({
                        inputRange: [0, 1],
                        outputRange: ['0%', '100%'],
                      })
                    : '0%',
              },
            ]}
          />
        </View>
      ))}
    </View>
  );
}

export default function StoryViewScreen({ route, navigation }) {
  const { storyGroups, initialGroupIndex = 0 } = route.params;
  const [groupIndex, setGroupIndex] = useState(initialGroupIndex);
  const [storyIndex, setStoryIndex] = useState(0);
  const progress = useRef(new Animated.Value(0)).current;
  const animRef = useRef(null);

  const currentGroup = storyGroups[groupIndex];
  const currentStory = currentGroup?.stories[storyIndex];

  const startAnimation = useCallback(() => {
    progress.setValue(0);
    animRef.current = Animated.timing(progress, {
      toValue: 1,
      duration: STORY_DURATION,
      useNativeDriver: false,
    });
    animRef.current.start(({ finished }) => {
      if (finished) {
        goNext();
      }
    });
  }, [groupIndex, storyIndex]);

  useEffect(() => {
    if (currentStory) {
      api.viewStory(currentStory._id).catch(() => {});
      startAnimation();
    }
    return () => {
      if (animRef.current) {
        animRef.current.stop();
      }
    };
  }, [groupIndex, storyIndex, startAnimation, currentStory]);

  const goNext = () => {
    if (!currentGroup) {
      navigation.goBack();
      return;
    }
    if (storyIndex < currentGroup.stories.length - 1) {
      setStoryIndex(storyIndex + 1);
    } else if (groupIndex < storyGroups.length - 1) {
      setGroupIndex(groupIndex + 1);
      setStoryIndex(0);
    } else {
      navigation.goBack();
    }
  };

  const goPrev = () => {
    if (storyIndex > 0) {
      setStoryIndex(storyIndex - 1);
    } else if (groupIndex > 0) {
      setGroupIndex(groupIndex - 1);
      const prevGroup = storyGroups[groupIndex - 1];
      setStoryIndex(prevGroup.stories.length - 1);
    }
  };

  if (!currentStory) {
    navigation.goBack();
    return null;
  }

  return (
    <View style={[styles.container, { backgroundColor: currentStory.backgroundColor || '#1DA1F2' }]}>
      <StatusBar hidden />

      {/* Progress bars */}
      <StoryProgressBar
        count={currentGroup.stories.length}
        activeIndex={storyIndex}
        progress={progress}
      />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.userInfo}>
          <View style={[styles.avatar, { backgroundColor: 'rgba(255,255,255,0.3)' }]}>
            <Text style={styles.avatarText}>
              {currentGroup.user?.username?.charAt(0)?.toUpperCase() || '?'}
            </Text>
          </View>
          <View>
            <Text style={styles.username}>{currentGroup.user?.username || 'User'}</Text>
            <Text style={styles.timeAgo}>{formatTimeAgo(currentStory.createdAt)}</Text>
          </View>
        </View>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeButton}>
          <Ionicons name="close" size={28} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Story content */}
      <View style={styles.content}>
        <Text style={[styles.storyText, { color: currentStory.textColor || '#FFFFFF' }]}>
          {currentStory.content}
        </Text>
      </View>

      {/* Tap zones */}
      <View style={styles.tapZones}>
        <TouchableOpacity style={styles.tapLeft} onPress={goPrev} activeOpacity={1} />
        <TouchableOpacity style={styles.tapRight} onPress={goNext} activeOpacity={1} />
      </View>

      {/* Viewers count */}
      <View style={styles.footer}>
        <Ionicons name="eye-outline" size={18} color="rgba(255,255,255,0.7)" />
        <Text style={styles.viewerCount}>
          {currentStory.viewers?.length || 0}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  progressContainer: {
    flexDirection: 'row',
    paddingHorizontal: 8,
    paddingTop: 50,
    gap: 4,
  },
  progressTrack: {
    flex: 1,
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 1.5,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 1.5,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  username: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  timeAgo: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  storyText: {
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 38,
  },
  tapZones: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: 'row',
    top: 120,
  },
  tapLeft: {
    flex: 1,
  },
  tapRight: {
    flex: 1,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 40,
    gap: 6,
  },
  viewerCount: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
  },
});
