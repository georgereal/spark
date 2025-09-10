import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { theme } from '../theme';
import api, { Receivable } from '../services/api';
import FloatingActionButton from '../components/FloatingActionButton';

const ReceivablesListScreen: React.FC = () => {
  const [receivables, setReceivables] = useState<Receivable[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const navigation = useNavigation();

  const fetchReceivables = async () => {
    try {
      const data = await api.getReceivables();
      console.log('Receivables data received:', data);
      // Handle both array response and paginated response
      if (Array.isArray(data)) {
        setReceivables(data);
      } else if (data.receivables) {
        setReceivables(data.receivables);
      } else {
        setReceivables([]);
      }
    } catch (error: any) {
      console.error('Error fetching receivables:', error);
      if (error.message?.includes('Authentication required')) {
        Alert.alert('Authentication Error', 'Please login again');
      } else {
        Alert.alert('Error', 'Failed to fetch receivables. Please check your connection.');
      }
      setReceivables([]);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchReceivables();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchReceivables();
  };

  const renderReceivableItem = ({ item }: { item: Receivable }) => (
    <TouchableOpacity
      style={styles.receivableCard}
      onPress={() => navigation.navigate('ReceivableForm', { receivableId: item._id })}
    >
      <View style={styles.receivableInfo}>
        <View style={styles.receivableHeader}>
          <Text style={styles.amount}>₹{item.amount}</Text>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
            <Text style={styles.statusText}>{item.status}</Text>
          </View>
        </View>
        
        <Text style={styles.patientName}>
          {item.treatmentPlanName || 'Unknown Patient'}
        </Text>
        
        <Text style={styles.description} numberOfLines={2}>
          {item.notes || item.description || 'No description'}
        </Text>
        
        <View style={styles.receivableDetails}>
          <Text style={styles.dueDate}>
            Due: {new Date(item.dueDate).toLocaleDateString()}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'paid': return '#4CAF50';
      case 'pending': return '#FF9800';
      case 'overdue': return '#F44336';
      default: return '#666';
    }
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="card-outline" size={64} color="#ccc" />
      <Text style={styles.emptyStateTitle}>No Receivables Found</Text>
      <Text style={styles.emptyStateSubtitle}>
        Add your first receivable to get started
      </Text>
      <TouchableOpacity
        style={styles.addButton}
        onPress={() => navigation.navigate('ReceivableForm')}
      >
        <Ionicons name="add" size={20} color="white" />
        <Text style={styles.addButtonText}>Add Receivable</Text>
      </TouchableOpacity>
    </View>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text>Loading receivables...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right', 'bottom']}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>Receivables</Text>
            <Text style={styles.headerSubtitle}>Track outstanding payments</Text>
          </View>
          <View style={styles.headerActions}>
            <View style={styles.headerIconContainer}>
              <Ionicons name="card" size={24} color={theme.colors.primary} />
            </View>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => navigation.navigate('ReceivableForm')}
            >
              <Ionicons name="add" size={20} color="white" />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <FlatList
        data={receivables}
        keyExtractor={(item) => item._id}
        renderItem={renderReceivableItem}
        contentContainerStyle={receivables.length === 0 ? styles.emptyContainer : styles.listContainer}
        ListEmptyComponent={renderEmptyState}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      />
      
      {receivables.length > 0 && (
        <FloatingActionButton
          onPress={() => navigation.navigate('ReceivableForm')}
          icon="add"
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
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
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  headerIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.colors.primaryLight + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButton: {
    backgroundColor: '#2196F3',
    borderRadius: 25,
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonText: {
    color: 'white',
    fontWeight: 'bold',
    marginLeft: 5,
  },
  listContainer: {
    padding: 20,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  receivableCard: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  receivableInfo: {
    flex: 1,
  },
  receivableHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  amount: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#333',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 11,
    color: 'white',
    fontWeight: 'bold',
  },
  patientName: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
  },
  description: {
    fontSize: 12,
    color: '#333',
    marginBottom: 10,
  },
  receivableDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dueDate: {
    fontSize: 12,
    color: '#666',
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
  },
  emptyStateTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 20,
    marginBottom: 10,
  },
  emptyStateSubtitle: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
  },
});

export default ReceivablesListScreen;
