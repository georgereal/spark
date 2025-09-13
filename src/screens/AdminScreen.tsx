import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { useNavigation } from '@react-navigation/native';
import { theme } from '../theme';
import { Card, Button } from '../components';
import ApiService from '../services/api';

const AdminScreen: React.FC = () => {
  const { currentUser } = useAuth();
  const navigation = useNavigation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [stats, setStats] = useState({
    totalUsers: 0,
    pendingUsers: 0,
    totalCategories: 0,
    totalDoctors: 0,
  });

  useEffect(() => {
    if (currentUser) {
      checkAdminStatus();
    }
  }, [currentUser]);

  const checkAdminStatus = async () => {
    try {
      setLoading(true);
      setError('');
      
      console.log('🔍 [ADMIN] Checking admin status from server...');
      const serverUserRole = await ApiService.getCurrentUserRole();
      console.log('🔍 [ADMIN] Server user role:', serverUserRole);
      
      if (serverUserRole.isAdmin || serverUserRole.role === 'admin') {
        console.log('✅ [ADMIN] User has admin privileges, fetching stats...');
        await fetchStats();
      } else {
        console.log('❌ [ADMIN] User does not have admin privileges');
        setError('You do not have admin privileges');
      }
    } catch (error) {
      console.error('❌ [ADMIN] Error checking admin status:', error);
      setError('Failed to verify admin privileges');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const [users, pendingUsers, categories, doctors] = await Promise.all([
        ApiService.getAdminUsers(),
        ApiService.getPendingUsers(),
        ApiService.getTreatmentCategories(),
        ApiService.getDoctors(),
      ]);

      setStats({
        totalUsers: users.length,
        pendingUsers: pendingUsers.length,
        totalCategories: categories.length,
        totalDoctors: doctors.length,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
      setError('Failed to load admin statistics');
    }
  };

  const handleMorePress = () => {
    navigation.navigate('AdminSections' as never);
  };

  if (!currentUser) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="lock-closed" size={48} color={theme.colors.error} />
          <Text style={styles.errorTitle}>Access Denied</Text>
          <Text style={styles.errorText}>Please log in to access the admin panel.</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error && error.includes('Failed to verify admin privileges')) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="lock-closed" size={48} color={theme.colors.error} />
          <Text style={styles.errorTitle}>Access Denied</Text>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Admin Dashboard</Text>
        <TouchableOpacity
          style={styles.refreshButton}
          onPress={checkAdminStatus}
          disabled={loading}
        >
          <Ionicons 
            name="refresh" 
            size={20} 
            color={theme.colors.primary} 
          />
        </TouchableOpacity>
      </View>

      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      )}

      {error && (
        <View style={styles.alertContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Welcome Card */}
        <Card style={styles.welcomeCard}>
          <View style={styles.welcomeContent}>
            <Ionicons name="shield-checkmark" size={32} color={theme.colors.primary} />
            <View style={styles.welcomeText}>
              <Text style={styles.welcomeTitle}>Admin Panel</Text>
              <Text style={styles.welcomeSubtitle}>
                Manage your dental practice efficiently
              </Text>
            </View>
          </View>
        </Card>

        {/* Quick Stats */}
        <View style={styles.statsContainer}>
          <Text style={styles.sectionTitle}>Quick Overview</Text>
          <View style={styles.statsGrid}>
            <Card style={styles.statCard}>
              <Ionicons name="people" size={24} color={theme.colors.primary} />
              <Text style={styles.statNumber}>{stats.totalUsers}</Text>
              <Text style={styles.statLabel}>Total Users</Text>
            </Card>
            
            <Card style={styles.statCard}>
              <Ionicons name="person-add" size={24} color={theme.colors.warning} />
              <Text style={styles.statNumber}>{stats.pendingUsers}</Text>
              <Text style={styles.statLabel}>Pending</Text>
            </Card>
            
            <Card style={styles.statCard}>
              <Ionicons name="medical" size={24} color={theme.colors.success} />
              <Text style={styles.statNumber}>{stats.totalCategories}</Text>
              <Text style={styles.statLabel}>Categories</Text>
            </Card>
            
            <Card style={styles.statCard}>
              <Ionicons name="person" size={24} color={theme.colors.secondary} />
              <Text style={styles.statNumber}>{stats.totalDoctors}</Text>
              <Text style={styles.statLabel}>Doctors</Text>
            </Card>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.actionsContainer}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          
          <TouchableOpacity style={styles.actionCard} onPress={handleMorePress}>
            <View style={styles.actionContent}>
              <View style={styles.actionIcon}>
                <Ionicons name="apps" size={24} color={theme.colors.primary} />
              </View>
              <View style={styles.actionText}>
                <Text style={styles.actionTitle}>All Admin Options</Text>
                <Text style={styles.actionSubtitle}>
                  Access all admin features and settings
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={theme.colors.text.secondary} />
            </View>
          </TouchableOpacity>

          {stats.pendingUsers > 0 && (
            <TouchableOpacity 
              style={[styles.actionCard, styles.urgentAction]}
              onPress={handleMorePress}
            >
              <View style={styles.actionContent}>
                <View style={[styles.actionIcon, { backgroundColor: theme.colors.warning + '20' }]}>
                  <Ionicons name="person-add" size={24} color={theme.colors.warning} />
                </View>
                <View style={styles.actionText}>
                  <Text style={styles.actionTitle}>Pending Approvals</Text>
                  <Text style={styles.actionSubtitle}>
                    {stats.pendingUsers} user{stats.pendingUsers !== 1 ? 's' : ''} waiting for approval
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={theme.colors.warning} />
              </View>
            </TouchableOpacity>
          )}
        </View>
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
    justifyContent: 'space-between',
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
  refreshButton: {
    padding: theme.spacing.xs,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xl,
  },
  loadingText: {
    ...theme.typography.body1,
    color: theme.colors.text.secondary,
    marginTop: theme.spacing.sm,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xl,
  },
  errorTitle: {
    ...theme.typography.h3,
    color: theme.colors.error,
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  errorText: {
    ...theme.typography.body1,
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },
  alertContainer: {
    backgroundColor: theme.colors.error + '20',
    padding: theme.spacing.md,
    margin: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
  },
  content: {
    flex: 1,
    padding: theme.spacing.md,
  },
  welcomeCard: {
    marginBottom: theme.spacing.lg,
  },
  welcomeContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  welcomeText: {
    marginLeft: theme.spacing.md,
    flex: 1,
  },
  welcomeTitle: {
    ...theme.typography.h4,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  welcomeSubtitle: {
    ...theme.typography.body2,
    color: theme.colors.text.secondary,
  },
  statsContainer: {
    marginBottom: theme.spacing.xl,
  },
  sectionTitle: {
    ...theme.typography.h4,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.md,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    // gap property not supported in React Native StyleSheet
    },
  statCard: {
    flex: 1,
    minWidth: '45%',
    alignItems: 'center',
    padding: theme.spacing.md,
  },
  statNumber: {
    ...theme.typography.h2,
    color: theme.colors.text.primary,
    marginTop: theme.spacing.xs,
    marginBottom: theme.spacing.xs,
  },
  statLabel: {
    ...theme.typography.caption,
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },
  actionsContainer: {
    marginBottom: theme.spacing.xl,
  },
  actionCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  urgentAction: {
    borderColor: theme.colors.warning,
    backgroundColor: theme.colors.warning + '05',
  },
  actionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.md,
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.colors.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.md,
  },
  actionText: {
    flex: 1,
  },
  actionTitle: {
    ...theme.typography.h5,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  actionSubtitle: {
    ...theme.typography.body2,
    color: theme.colors.text.secondary,
  },
});

export default AdminScreen;