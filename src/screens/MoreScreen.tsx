import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';
import { theme } from '../theme';
import { Card } from '../components';
import ApiService from '../services/api';

interface MoreItem {
  id: string;
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  screen?: string;
  action?: () => void;
  color: string;
  requiresAdmin?: boolean;
}

const MoreScreen: React.FC = () => {
  const navigation = useNavigation();
  const { currentUser, logout } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAdminStatus();
  }, [currentUser]);

  const checkAdminStatus = async () => {
    try {
      console.log('🔍 [MORE] Checking admin status via /admin/me API...');
      
      // Use /admin/me API as primary source of truth
      const serverUserRole = await ApiService.getCurrentUserRole();
      console.log('🔍 [MORE] Server user role response:', serverUserRole);
      
      // Check admin status from server response
      const serverIsAdmin = serverUserRole.isAdmin === true || serverUserRole.role === 'admin';
      console.log('🔍 [MORE] Server admin check:', serverIsAdmin);
      
      setIsAdmin(serverIsAdmin);
      
      // Also log current user context for comparison
      console.log('🔍 [MORE] Current user context:', currentUser);
      
    } catch (error) {
      console.error('❌ [MORE] Error checking admin status via API:', error);
      
      // Fallback to local context if API fails
      if (currentUser) {
        console.log('🔍 [MORE] Falling back to local context check...');
        const localIsAdmin = currentUser.role === 'admin' || currentUser.role === 'Admin' || currentUser.isAdmin === true;
        console.log('🔍 [MORE] Local admin check fallback:', localIsAdmin);
        setIsAdmin(localIsAdmin);
      } else {
        console.log('🔍 [MORE] No current user context available');
        setIsAdmin(false);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Logout', style: 'destructive', onPress: logout },
      ]
    );
  };

  const moreItems: MoreItem[] = [
    {
      id: 'profile',
      title: 'Profile',
      description: 'View and edit your profile',
      icon: 'person',
      screen: 'Profile',
      color: theme.colors.primary,
    },
    {
      id: 'settings',
      title: 'Settings',
      description: 'App preferences and configuration',
      icon: 'settings',
      screen: 'Settings',
      color: theme.colors.secondary,
    },
    {
      id: 'reports',
      title: 'Reports',
      description: 'View practice reports and analytics',
      icon: 'bar-chart',
      screen: 'Reports',
      color: theme.colors.info,
    },
    {
      id: 'calendar',
      title: 'Calendar',
      description: 'Manage appointments and schedule',
      icon: 'calendar',
      screen: 'Calendar',
      color: theme.colors.success,
    },
    {
      id: 'backup',
      title: 'Backup & Sync',
      description: 'Backup data and sync across devices',
      icon: 'cloud-upload',
      screen: 'Backup',
      color: theme.colors.accent,
    },
    {
      id: 'help',
      title: 'Help & Support',
      description: 'Get help and contact support',
      icon: 'help-circle',
      screen: 'Help',
      color: theme.colors.info,
    },
    {
      id: 'about',
      title: 'About',
      description: 'App version and information',
      icon: 'information-circle',
      screen: 'About',
      color: theme.colors.text.secondary,
    },
    {
      id: 'logout',
      title: 'Logout',
      description: 'Sign out of your account',
      icon: 'log-out',
      action: handleLogout,
      color: theme.colors.error,
    },
  ];

  // Admin items - only show if user has admin privileges
  const adminItems: MoreItem[] = [
    {
      id: 'admin-dashboard',
      title: 'Admin Dashboard',
      description: 'Overview of admin functions',
      icon: 'shield-checkmark',
      screen: 'Admin',
      color: theme.colors.primary,
      requiresAdmin: true,
    },
    {
      id: 'user-management',
      title: 'User Management',
      description: 'Manage users and permissions',
      icon: 'people',
      screen: 'AdminUsers',
      color: theme.colors.warning,
      requiresAdmin: true,
    },
    {
      id: 'treatment-categories',
      title: 'Treatment Categories',
      description: 'Manage treatment categories and pricing',
      icon: 'medical',
      screen: 'AdminCategories',
      color: theme.colors.success,
      requiresAdmin: true,
    },
    {
      id: 'doctors',
      title: 'Doctors',
      description: 'Manage doctor profiles and specializations',
      icon: 'person',
      screen: 'AdminDoctors',
      color: theme.colors.secondary,
      requiresAdmin: true,
    },
    {
      id: 'system-settings',
      title: 'System Settings',
      description: 'Configure system-wide settings',
      icon: 'cog',
      screen: 'AdminSystem',
      color: theme.colors.secondary,
      requiresAdmin: true,
    },
  ];

  const handleItemPress = (item: MoreItem) => {
    if (item.action) {
      item.action();
    } else if (item.screen) {
      navigation.navigate(item.screen as never);
    }
  };

  const renderIconGrid = (items: MoreItem[], title?: string | boolean) => {
    const visibleItems = items.filter(item => 
      !item.requiresAdmin || isAdmin
    );

    if (visibleItems.length === 0) {
      return null;
    }

    return (
      <View key={title || 'items'} style={styles.section}>
        {title && title !== false && <Text style={styles.sectionTitle}>{title}</Text>}
        <View style={styles.iconGrid}>
          {visibleItems.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.iconItem}
              onPress={() => handleItemPress(item)}
              activeOpacity={0.7}
            >
              <View style={[styles.iconContainer, { backgroundColor: item.color + '20' }]}>
                <Ionicons name={item.icon} size={28} color={item.color} />
              </View>
              <Text style={styles.iconTitle}>{item.title}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>More</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* User Info Card */}
        <Card style={styles.userCard}>
          <View style={styles.userInfo}>
            <View style={styles.userAvatar}>
              <Ionicons name="person" size={32} color={theme.colors.primary} />
            </View>
            <View style={styles.userDetails}>
              <Text style={styles.userName}>
                {currentUser?.displayName || currentUser?.email || 'User'}
              </Text>
              <Text style={styles.userEmail}>{currentUser?.email}</Text>
              {isAdmin && (
                <View style={styles.adminBadge}>
                  <Ionicons name="shield-checkmark" size={12} color={theme.colors.primary} />
                  <Text style={styles.adminText}>Admin</Text>
                </View>
              )}
            </View>
          </View>
        </Card>

        {/* Main Items Grid */}
        {renderIconGrid(moreItems)}

        {/* Admin Section - Show with separator if user is admin */}
        {isAdmin && (
          <View style={styles.adminSection}>
            <View style={styles.sectionDivider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>Administration</Text>
              <View style={styles.dividerLine} />
            </View>
            {renderIconGrid(adminItems, false)}
          </View>
        )}
        
        {/* Debug info - temporary */}
        {__DEV__ && (
          <View style={styles.debugContainer}>
            <Text style={styles.debugText}>Debug Info:</Text>
            <Text style={styles.debugText}>isAdmin: {isAdmin.toString()}</Text>
            <Text style={styles.debugText}>Context role: {currentUser?.role || 'none'}</Text>
            <Text style={styles.debugText}>Context email: {currentUser?.email || 'none'}</Text>
            <Text style={styles.debugText}>Using /admin/me API as primary source</Text>
          </View>
        )}
        
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  headerTitle: {
    ...theme.typography.h3,
    color: theme.colors.text.primary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    ...theme.typography.body1,
    color: theme.colors.text.secondary,
  },
  content: {
    flex: 1,
    padding: theme.spacing.md,
  },
  userCard: {
    marginBottom: theme.spacing.lg,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: theme.colors.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.md,
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    ...theme.typography.h4,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  userEmail: {
    ...theme.typography.body2,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.xs,
  },
  adminBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primary + '20',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.sm,
    alignSelf: 'flex-start',
  },
  adminText: {
    ...theme.typography.caption,
    color: theme.colors.primary,
    marginLeft: theme.spacing.xs,
    fontWeight: '600',
  },
  section: {
    marginBottom: theme.spacing.xl,
  },
  sectionTitle: {
    ...theme.typography.h4,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.lg,
    paddingHorizontal: theme.spacing.xs,
  },
  iconGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.xs,
  },
  iconItem: {
    width: '30%',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  iconTitle: {
    ...theme.typography.caption,
    color: theme.colors.text.primary,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 16,
  },
  adminSection: {
    marginTop: theme.spacing.xl,
    marginBottom: theme.spacing.lg,
  },
  sectionDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: theme.spacing.lg,
    paddingHorizontal: theme.spacing.md,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: theme.colors.border,
  },
  dividerText: {
    ...theme.typography.caption,
    color: theme.colors.text.secondary,
    marginHorizontal: theme.spacing.md,
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  debugContainer: {
    backgroundColor: theme.colors.warning + '20',
    padding: theme.spacing.md,
    margin: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.warning,
  },
  debugText: {
    ...theme.typography.caption,
    color: theme.colors.warning,
    fontSize: 12,
    marginBottom: theme.spacing.xs,
  },
});

export default MoreScreen;
