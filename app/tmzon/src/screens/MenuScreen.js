import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';

const menuItems = [
  { id: 'settings', icon: 'settings-outline', label: 'Settings', screen: 'Settings' },
  { id: 'sessions', icon: 'phone-portrait-outline', label: 'Active Sessions', screen: 'Sessions' },
  { id: 'password', icon: 'lock-closed-outline', label: 'Change Password', screen: 'ChangePassword' },
  { id: 'verify', icon: 'mail-outline', label: 'Verify Email', screen: 'VerifyEmail' },
  { id: 'edit', icon: 'create-outline', label: 'Edit Profile', screen: 'EditProfile' },
];

export default function MenuScreen({ navigation }) {
  const { user, logout } = useAuth();

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.toolbar}>
        <Text style={styles.toolbarTitle}>Menu</Text>
      </View>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* User card */}
        <TouchableOpacity
          style={styles.userCard}
          onPress={() => navigation.navigate('ProfileView', { username: user?.username })}
        >
          <View style={styles.userAvatar}>
            <Text style={styles.userAvatarText}>
              {user?.username ? user.username[0].toUpperCase() : 'U'}
            </Text>
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{user?.username || 'User'}</Text>
            <Text style={styles.userSubtitle}>View your profile</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#AAB8C2" />
        </TouchableOpacity>

        {/* Menu items */}
        <View style={styles.menuSection}>
          {menuItems.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.menuItem}
              onPress={() => navigation.navigate(item.screen)}
            >
              <View style={styles.menuItemIcon}>
                <Ionicons name={item.icon} size={22} color="#14171A" />
              </View>
              <Text style={styles.menuItemLabel}>{item.label}</Text>
              <Ionicons name="chevron-forward" size={18} color="#AAB8C2" />
            </TouchableOpacity>
          ))}
        </View>

        {/* Logout */}
        <TouchableOpacity style={styles.logoutButton} onPress={logout}>
          <Ionicons name="log-out-outline" size={22} color="#E0245E" />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </ScrollView>
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
    paddingHorizontal: 16,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F7F9FA',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
  },
  userAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#1DA1F2',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  userAvatarText: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#14171A',
    marginBottom: 2,
  },
  userSubtitle: {
    fontSize: 14,
    color: '#657786',
  },
  menuSection: {
    backgroundColor: '#F7F9FA',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 24,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#EBEEF0',
  },
  menuItemIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  menuItemLabel: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: '#14171A',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF0F3',
    borderRadius: 16,
    paddingVertical: 16,
    gap: 8,
    marginBottom: 32,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#E0245E',
  },
});
