import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Dimensions,
  TouchableOpacity,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

const slides = [
  {
    id: '1',
    icon: 'chatbubbles-outline',
    color: '#1DA1F2',
    bgColor: '#E8F5FD',
    title: 'Connect with Friends',
    description: 'Stay in touch with your friends and family through instant messaging',
  },
  {
    id: '2',
    icon: 'globe-outline',
    color: '#17BF63',
    bgColor: '#E6F9EE',
    title: 'Explore the World',
    description: 'Discover new people, places and ideas from around the globe',
  },
  {
    id: '3',
    icon: 'shield-checkmark-outline',
    color: '#7C4DFF',
    bgColor: '#EDE7F6',
    title: 'Safe & Secure',
    description: 'Your data is protected with end-to-end encryption and privacy controls',
  },
];

export default function WelcomeScreen({ navigation }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const flatListRef = useRef(null);

  const onViewableItemsChanged = useRef(({ viewableItems }) => {
    if (viewableItems.length > 0) {
      setActiveIndex(viewableItems[0].index ?? 0);
    }
  }).current;

  const viewabilityConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

  function renderSlide({ item }) {
    return (
      <View style={styles.slide}>
        <View style={[styles.illustrationContainer, { backgroundColor: item.bgColor }]}>
          <Ionicons name={item.icon} size={120} color={item.color} />
        </View>
        <Text style={styles.slideTitle}>{item.title}</Text>
        <Text style={styles.slideDescription}>{item.description}</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header with language button */}
      <View style={styles.header}>
        <View style={styles.headerLeft} />
        <Text style={styles.brandName}>tmzon</Text>
        <TouchableOpacity style={styles.langButton}>
          <Ionicons name="globe-outline" size={20} color="#657786" />
          <Text style={styles.langText}>EN</Text>
          <Ionicons name="chevron-down" size={14} color="#657786" />
        </TouchableOpacity>
      </View>

      {/* Slides */}
      <View style={styles.slidesContainer}>
        <FlatList
          ref={flatListRef}
          data={slides}
          renderItem={renderSlide}
          keyExtractor={(item) => item.id}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={viewabilityConfig}
          bounces={false}
        />

        {/* Dot indicators */}
        <View style={styles.dotsContainer}>
          {slides.map((_, index) => (
            <View
              key={index}
              style={[
                styles.dot,
                activeIndex === index ? styles.dotActive : styles.dotInactive,
              ]}
            />
          ))}
        </View>
      </View>

      {/* Bottom buttons */}
      <View style={styles.bottomContainer}>
        <TouchableOpacity
          style={styles.getStartedButton}
          onPress={() => navigation.navigate('Register')}
        >
          <Text style={styles.getStartedText}>Get Started</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.loginButton}
          onPress={() => navigation.navigate('Login')}
        >
          <Text style={styles.loginText}>Login</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  headerLeft: {
    width: 70,
  },
  brandName: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1DA1F2',
  },
  langButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F7F9FA',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 4,
  },
  langText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#657786',
  },
  slidesContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  slide: {
    width: width,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  illustrationContainer: {
    width: 220,
    height: 220,
    borderRadius: 110,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 40,
  },
  slideTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: '#14171A',
    textAlign: 'center',
    marginBottom: 12,
  },
  slideDescription: {
    fontSize: 16,
    color: '#657786',
    textAlign: 'center',
    lineHeight: 24,
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 32,
  },
  dot: {
    borderRadius: 6,
    marginHorizontal: 4,
  },
  dotActive: {
    width: 24,
    height: 8,
    backgroundColor: '#1DA1F2',
    borderRadius: 4,
  },
  dotInactive: {
    width: 8,
    height: 8,
    backgroundColor: '#E1E8ED',
  },
  bottomContainer: {
    paddingHorizontal: 24,
    paddingBottom: 16,
    gap: 12,
  },
  getStartedButton: {
    backgroundColor: '#1DA1F2',
    borderRadius: 28,
    paddingVertical: 16,
    alignItems: 'center',
  },
  getStartedText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
  },
  loginButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#1DA1F2',
  },
  loginText: {
    color: '#1DA1F2',
    fontSize: 17,
    fontWeight: '700',
  },
});
