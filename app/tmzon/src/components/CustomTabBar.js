import React from 'react';
import { View, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function CustomTabBar({ state, descriptors, navigation }) {
  return (
    <View style={styles.wrapper}>
      <View style={styles.container}>
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const isFocused = state.index === index;

          function onPress() {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });
            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          }

          let iconName;
          let iconSize = 24;
          switch (route.name) {
            case 'Messages':
              iconName = isFocused ? 'chatbubbles' : 'chatbubbles-outline';
              break;
            case 'Explore':
              iconName = isFocused ? 'compass' : 'compass-outline';
              break;
            case 'Menu':
              iconName = isFocused ? 'grid' : 'grid-outline';
              break;
            case 'Profile':
              iconName = isFocused ? 'person-circle' : 'person-circle-outline';
              iconSize = 26;
              break;
            default:
              iconName = 'ellipse-outline';
          }

          const color = isFocused ? '#1DA1F2' : '#AAB8C2';

          return (
            <TouchableOpacity
              key={route.key}
              style={styles.tab}
              onPress={onPress}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              accessibilityLabel={options.tabBarAccessibilityLabel}
            >
              <View style={[styles.iconContainer, isFocused && styles.iconContainerActive]}>
                <Ionicons name={iconName} size={iconSize} color={color} />
              </View>
              {isFocused && <View style={styles.activeDot} />}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    paddingHorizontal: 16,
    paddingBottom: Platform.OS === 'ios' ? 24 : 12,
    backgroundColor: '#FFFFFF',
  },
  container: {
    flexDirection: 'row',
    backgroundColor: '#F7F9FA',
    borderRadius: 28,
    paddingVertical: 8,
    paddingHorizontal: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 8,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainerActive: {
    backgroundColor: '#E8F5FD',
  },
  activeDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#1DA1F2',
    marginTop: 4,
  },
});
