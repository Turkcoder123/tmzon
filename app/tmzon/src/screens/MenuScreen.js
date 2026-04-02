import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';

const menuSections = [
  {
    title: 'Account',
    items: [
      { icon: 'person-outline', label: 'Edit Profile', screen: 'EditProfile' },
      { icon: 'mail-outline', label: 'Verify Email', screen: 'VerifyEmail' },
      { icon: 'bookmark-outline', label: 'Saved Posts', screen: null },
    ],
  },
  {
    title: 'Security',
    items: [
      { icon: 'lock-closed-outline', label: 'Change Password', screen: 'ChangePassword' },
      { icon: 'phone-portrait-outline', label: 'Active Sessions', screen: 'Sessions' },
      { icon: 'shield-checkmark-outline', label: 'Privacy', screen: null },
    ],
  },
  {
    title: 'Preferences',
    items: [
      { icon: 'moon-outline', label: 'Dark Mode', screen: null },
      { icon: 'notifications-outline', label: 'Notifications', screen: null },
      { icon: 'globe-outline', label: 'Language', screen: null },
    ],
  },
  {
    title: 'Support',
    items: [
      { icon: 'help-circle-outline', label: 'Help Center', screen: null },
      { icon: 'chatbubble-outline', label: 'Contact Us', screen: null },
      { icon: 'information-circle-outline', label: 'About', screen: null },
    ],
  },
];

function MenuItem({ item, onPress }) {
  return (
    <TouchableOpacity
      style={styles.menuItem}
      onPress={onPress}
      activeOpacity={0.7}
      disabled={!item.screen}
    >
      <View style={styles.menuItemLeft}>
        <View style={styles.menuIconContainer}>
          <Ionicons name={item.icon} size={22} color="#14171A" />
        </View>
        <Text style={styles.menuItemLabel}>{item.label}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#AAB8C2" />
    </TouchableOpacity>
  );
}

export default function MenuScreen({ navigation }) {
  const { logout } = useAuth();

  function handleMenuPress(screen) {
    if (screen) {
      navigation.navigate(screen);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.toolbar}>
        <Text style={styles.toolbarTitle}>Menu</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {menuSections.map((section, sectionIndex) => (
          <View key={sectionIndex} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <View style={styles.sectionCard}>
              {section.items.map((item, itemIndex) => (
                <View key={itemIndex}>
                  <MenuItem
                    item={item}
                    onPress={() => handleMenuPress(item.screen)}
                  />
                  {itemIndex < section.items.length - 1 && (
                    <View style={styles.divider} />
                  )}
                </View>
              ))}
            </View>
          </View>
        ))}

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutButton} onPress={logout}>
          <Ionicons name="log-out-outline" size={22} color="#E0245E" />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>

        <View style={styles.footer}>
          <Text style={styles.footerText}>tmzon v1.0.0</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#F7F9FA',
  },
  toolbar: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
  },
  toolbarTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#14171A',
  },
  scrollContent: {
    paddingVertical: 8,
    paddingBottom: 24,
  },
  section: {
    marginTop: 16,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#657786',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
    marginLeft: 4,
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  menuIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#F7F9FA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuItemLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#14171A',
  },
  divider: {
    height: 1,
    backgroundColor: '#F0F3F5',
    marginLeft: 66,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginTop: 24,
    marginHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: '#FDDDE5',
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#E0245E',
  },
  footer: {
    alignItems: 'center',
    marginTop: 24,
  },
  footerText: {
    fontSize: 13,
    color: '#AAB8C2',
  },
});
