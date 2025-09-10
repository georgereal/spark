import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import api, { DashboardStats } from '../services/api';
import { theme } from '../theme';

const DashboardScreen: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const navigation = useNavigation();

  const fetchStats = async () => {
    try {
      const data = await api.getDashboardStats();
      setStats(data);
    } catch (error: any) {
      console.error('Error fetching dashboard stats:', error);
      if (error.response?.status === 401) {
        // Handle authentication error - user might need to login again
        console.log('Authentication required');
      }
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchStats();
  };

  const StatCard = ({ title, value, icon, color, onPress }: {
    title: string;
    value: number | string;
    icon: keyof typeof Ionicons.glyphMap;
    color: string;
    onPress?: () => void;
  }) => (
    <TouchableOpacity 
      style={[styles.statCard, { borderLeftColor: color }]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={styles.statContent}>
        <View style={styles.statTextContainer}>
          <Text style={styles.statValue}>{value}</Text>
          <Text style={styles.statTitle}>{title}</Text>
        </View>
        <View style={[styles.statIcon, { backgroundColor: color }]}>
          <Ionicons name={icon} size={24} color="white" />
        </View>
      </View>
    </TouchableOpacity>
  );

  const QuickAction = ({ title, icon, onPress }: {
    title: string;
    icon: keyof typeof Ionicons.glyphMap;
    onPress: () => void;
  }) => (
    <TouchableOpacity style={styles.quickAction} onPress={onPress} activeOpacity={0.8}>
      <View style={styles.quickActionIcon}>
        <Ionicons name={icon} size={24} color={theme.colors.primary} />
      </View>
      <Text style={styles.quickActionText}>{title}</Text>
    </TouchableOpacity>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right', 'bottom']}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <View style={styles.headerTextContainer}>
              <Text style={styles.headerTitle}>Dashboard</Text>
              <Text style={styles.headerSubtitle}>Welcome to Spark</Text>
            </View>
            <View style={styles.headerIconContainer}>
              <Ionicons name="home" size={24} color={theme.colors.primary} />
            </View>
          </View>
        </View>

        <View style={styles.statsContainer}>
          <StatCard
            title="Total Patients"
            value={stats?.totalPatients || 0}
            icon="people"
            color="#4CAF50"
            onPress={() => navigation.navigate('Patients')}
          />
          <StatCard
            title="Active Treatments"
            value={stats?.totalTreatments || 0}
            icon="medical"
            color="#FF9800"
            onPress={() => navigation.navigate('Treatments')}
          />
          <StatCard
            title="Pending Receivables"
            value={stats?.pendingReceivables || 0}
            icon="card"
            color="#F44336"
            onPress={() => navigation.navigate('Receivables')}
          />
          <StatCard
            title="Monthly Revenue"
            value={`₹${stats?.monthlyRevenue || 0}`}
            icon="trending-up"
            color="#2196F3"
            onPress={() => navigation.navigate('Receivables')}
          />
        </View>

        <View style={styles.quickActionsContainer}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActionsGrid}>
            <QuickAction
              title="Add Patient"
              icon="person-add"
              onPress={() => {
                navigation.navigate('PatientForm');
              }}
            />
            <QuickAction
              title="New Treatment"
              icon="medical"
              onPress={() => {
                navigation.navigate('TreatmentForm');
              }}
            />
            <QuickAction
              title="View Patients"
              icon="people"
              onPress={() => {
                navigation.navigate('Patients');
              }}
            />
            <QuickAction
              title="View Treatments"
              icon="medical"
              onPress={() => {
                navigation.navigate('Treatments');
              }}
            />
          </View>
        </View>

        <View style={styles.recentActivityContainer}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          <View style={styles.activityItem}>
            <View style={styles.activityIcon}>
              <Ionicons name="person" size={20} color="#4CAF50" />
            </View>
            <View style={styles.activityContent}>
              <Text style={styles.activityTitle}>New patient registered</Text>
              <Text style={styles.activityTime}>2 hours ago</Text>
            </View>
          </View>
          <View style={styles.activityItem}>
            <View style={styles.activityIcon}>
              <Ionicons name="medical" size={20} color="#FF9800" />
            </View>
            <View style={styles.activityContent}>
              <Text style={styles.activityTitle}>Treatment completed</Text>
              <Text style={styles.activityTime}>4 hours ago</Text>
            </View>
          </View>
          <View style={styles.activityItem}>
            <View style={styles.activityIcon}>
              <Ionicons name="card" size={20} color="#F44336" />
            </View>
            <View style={styles.activityContent}>
              <Text style={styles.activityTitle}>Payment received</Text>
              <Text style={styles.activityTime}>6 hours ago</Text>
            </View>
          </View>
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
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    backgroundColor: theme.colors.white,
    paddingVertical: theme.spacing.lg,
    paddingHorizontal: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderLight,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    lineHeight: 30,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  headerSubtitle: {
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 20,
    color: theme.colors.text.secondary,
  },
  headerIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.colors.primaryLight + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsContainer: {
    padding: theme.spacing.md,
  },
  statCard: {
    ...theme.components.card.container,
    borderLeftWidth: 4,
    marginBottom: theme.spacing.md,
  },
  statContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statTextContainer: {
    flex: 1,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '600',
    lineHeight: 34,
    color: theme.colors.text.primary,
  },
  statTitle: {
    fontSize: 11,
    fontWeight: '400',
    lineHeight: 20,
    color: theme.colors.text.secondary,
    marginTop: theme.spacing.xs,
  },
  statIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quickActionsContainer: {
    padding: theme.spacing.lg,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 26,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.lg,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  quickAction: {
    ...theme.components.card.container,
    width: '48%',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
    padding: theme.spacing.lg,
  },
  quickActionIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: theme.colors.primaryLight + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  quickActionText: {
    fontSize: 11,
    fontWeight: '500',
    lineHeight: 20,
    color: theme.colors.text.primary,
    textAlign: 'center',
  },
  recentActivityContainer: {
    padding: theme.spacing.lg,
  },
  activityItem: {
    ...theme.components.listItem.container,
    marginBottom: theme.spacing.sm,
  },
  activityIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.colors.gray[100],
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 24,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  activityTime: {
    fontSize: 11,
    fontWeight: '400',
    lineHeight: 18,
    color: theme.colors.text.secondary,
  },
});

export default DashboardScreen;
