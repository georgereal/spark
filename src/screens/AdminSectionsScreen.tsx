import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { theme } from '../theme';

interface AdminSection {
  title: string;
  items: AdminItem[];
}

interface AdminItem {
  id: string;
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  screen: string;
  color: string;
}

const AdminSectionsScreen: React.FC = () => {
  const navigation = useNavigation();

  const adminSections: AdminSection[] = [
    {
      title: 'User Management',
      items: [
        {
          id: 'pending-users',
          title: 'Pending Approvals',
          description: 'Review and approve new user registrations',
          icon: 'person-add',
          screen: 'AdminPendingUsers',
          color: theme.colors.warning,
        },
        {
          id: 'all-users',
          title: 'All Users',
          description: 'Manage existing users and permissions',
          icon: 'people',
          screen: 'AdminAllUsers',
          color: theme.colors.primary,
        },
        {
          id: 'user-roles',
          title: 'User Roles',
          description: 'Assign and manage user roles',
          icon: 'shield-checkmark',
          screen: 'AdminUserRoles',
          color: theme.colors.info,
        },
      ],
    },
    {
      title: 'Treatment Settings',
      items: [
        {
          id: 'treatment-categories',
          title: 'Treatment Categories',
          description: 'Manage treatment categories and pricing',
          icon: 'medical',
          screen: 'AdminCategories',
          color: theme.colors.success,
        },
        {
          id: 'doctors',
          title: 'Doctors',
          description: 'Manage doctor profiles and specializations',
          icon: 'person',
          screen: 'AdminDoctors',
          color: theme.colors.secondary,
        },
        {
          id: 'pricing',
          title: 'Pricing Rules',
          description: 'Configure pricing and discount rules',
          icon: 'calculator',
          screen: 'AdminPricing',
          color: theme.colors.accent,
        },
      ],
    },
    {
      title: 'System Settings',
      items: [
        {
          id: 'general-settings',
          title: 'General Settings',
          description: 'Configure system-wide settings',
          icon: 'settings',
          screen: 'AdminGeneralSettings',
          color: theme.colors.text.primary,
        },
        {
          id: 'notifications',
          title: 'Notifications',
          description: 'Manage notification preferences',
          icon: 'notifications',
          screen: 'AdminNotifications',
          color: theme.colors.warning,
        },
        {
          id: 'backup',
          title: 'Backup & Restore',
          description: 'Manage data backup and restore',
          icon: 'cloud-upload',
          screen: 'AdminBackup',
          color: theme.colors.info,
        },
      ],
    },
  ];

  const handleItemPress = (item: AdminItem) => {
    // For now, we'll navigate to the main admin screen with the specific tab
    // Later, we can create individual screens for each item
    navigation.navigate('Admin' as never, { initialTab: item.id } as never);
  };

  const renderSection = (section: AdminSection) => (
    <View key={section.title} style={styles.section}>
      <Text style={styles.sectionTitle}>{section.title}</Text>
      <View style={styles.sectionItems}>
        {section.items.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={styles.itemCard}
            onPress={() => handleItemPress(item)}
            activeOpacity={0.7}
          >
            <View style={[styles.itemIcon, { backgroundColor: item.color + '20' }]}>
              <Ionicons name={item.icon} size={24} color={item.color} />
            </View>
            <View style={styles.itemContent}>
              <Text style={styles.itemTitle}>{item.title}</Text>
              <Text style={styles.itemDescription}>{item.description}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={theme.colors.text.secondary} />
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={theme.colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Admin Panel</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.welcomeCard}>
          <Text style={styles.welcomeTitle}>Welcome to Admin Panel</Text>
          <Text style={styles.welcomeSubtitle}>
            Manage users, treatments, and system settings
          </Text>
        </View>

        {adminSections.map(renderSection)}
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
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  backButton: {
    padding: theme.spacing.xs,
  },
  headerTitle: {
    ...theme.typography.h3,
    color: theme.colors.text.primary,
    flex: 1,
    textAlign: 'center',
  },
  headerSpacer: {
    width: 32,
  },
  content: {
    flex: 1,
    padding: theme.spacing.md,
  },
  welcomeCard: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    marginBottom: theme.spacing.lg,
    alignItems: 'center',
  },
  welcomeTitle: {
    ...theme.typography.h2,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  welcomeSubtitle: {
    ...theme.typography.body2,
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },
  section: {
    marginBottom: theme.spacing.xl,
  },
  sectionTitle: {
    ...theme.typography.h4,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.md,
    paddingHorizontal: theme.spacing.xs,
  },
  sectionItems: {
    // gap property not supported in React Native StyleSheet
    },
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  itemIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.md,
  },
  itemContent: {
    flex: 1,
  },
  itemTitle: {
    ...theme.typography.h5,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  itemDescription: {
    ...theme.typography.body2,
    color: theme.colors.text.secondary,
  },
});

export default AdminSectionsScreen;
