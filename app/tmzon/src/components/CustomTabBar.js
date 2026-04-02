import React from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function CustomTabBar({ state, descriptors, navigation }) {
  return (
    <View style={styles.container}>
      <View style={styles.tabBar}>
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const isFocused = state.index === index;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name, route.params);
            }
          };

          let iconName;
          let label;
          switch (route.name) {
            case 'Messages':
              iconName = isFocused ? 'chatbubbles' : 'chatbubbles-outline';
              label = 'Messages';
              break;
            case 'Explore':
              iconName = isFocused ? 'compass' : 'compass-outline';
              label = 'Explore';
              break;
            case 'Menu':
              iconName = isFocused ? 'grid' : 'grid-outline';
              label = 'Menu';
              break;
            case 'Profile':
              iconName = isFocused ? 'person-circle' : 'person-circle-outline';
              label = 'Profile';
              break;
            default:
              iconName = 'ellipse-outline';
              label = route.name;
          }

          return (
            <TouchableOpacity
              key={route.key}
              onPress={onPress}
              style={styles.tabItem}
              activeOpacity={0.7}
            >
              <View style={[
                styles.iconContainer,
                isFocused && styles.iconContainerActive,
              ]}>
                <Ionicons
                  name={iconName}
                  size={24}
                  color={isFocused ? '#1DA1F2' : '#AAB8C2'}
                />
              </View>
              <Text style={[
                styles.tabLabel,
                isFocused && styles.tabLabelActive,
              ]}>
                {label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 12,
    paddingBottom: 20,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    paddingVertical: 8,
    paddingHorizontal: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 12,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
  },
  iconContainer: {
    width: 44,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainerActive: {
    backgroundColor: '#E8F5FE',
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: '#AAB8C2',
    marginTop: 2,
  },
  tabLabelActive: {
    color: '#1DA1F2',
    fontWeight: '700',
  },
});
