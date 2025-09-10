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
import api, { Treatment } from '../services/api';
import FloatingActionButton from '../components/FloatingActionButton';
import SearchInput from '../components/SearchInput';

const TreatmentListScreen: React.FC = () => {
  const [treatments, setTreatments] = useState<Treatment[]>([]);
  const [filteredTreatments, setFilteredTreatments] = useState<Treatment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const navigation = useNavigation();

  const fetchTreatments = async () => {
    try {
      const data = await api.getTreatments();
      console.log('Treatments data received:', data);
      // Handle both array response and paginated response
      let treatmentsData = [];
      if (Array.isArray(data)) {
        treatmentsData = data;
      } else if (data.treatments) {
        treatmentsData = data.treatments;
      }
      setTreatments(treatmentsData);
      setFilteredTreatments(treatmentsData);
    } catch (error: any) {
      console.error('Error fetching treatments:', error);
      if (error.message?.includes('Authentication required')) {
        Alert.alert('Authentication Error', 'Please login again');
      } else {
        Alert.alert('Error', 'Failed to fetch treatments. Please check your connection.');
      }
      setTreatments([]);
      setFilteredTreatments([]);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (query.trim() === '') {
      setFilteredTreatments(treatments);
    } else {
      const filtered = treatments.filter(treatment => {
        const treatmentName = treatment.name?.toLowerCase() || '';
        const patientName = treatment.patientName?.toLowerCase() || '';
        const notes = treatment.notes?.toLowerCase() || '';
        const searchTerm = query.toLowerCase();
        
        return treatmentName.includes(searchTerm) || 
               patientName.includes(searchTerm) || 
               notes.includes(searchTerm);
      });
      setFilteredTreatments(filtered);
    }
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setFilteredTreatments(treatments);
  };

  useEffect(() => {
    fetchTreatments();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchTreatments();
  };

  const renderTreatmentItem = ({ item }: { item: Treatment }) => (
    <TouchableOpacity
      style={styles.treatmentCard}
      onPress={() => navigation.navigate('TreatmentDetails', { treatmentId: item._id })}
    >
      <View style={styles.treatmentInfo}>
        <View style={styles.treatmentHeader}>
          <Text style={styles.treatmentType}>{item.name || item.treatmentType || 'Treatment'}</Text>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
            <Text style={styles.statusText}>{item.status || 'Unknown'}</Text>
          </View>
        </View>
        
        <Text style={styles.patientName}>
          {item.patientName || 'Unknown Patient'}
        </Text>
        
        <Text style={styles.treatmentDescription} numberOfLines={2}>
          {item.description}
        </Text>
        
        <View style={styles.treatmentDetails}>
          <Text style={styles.cost}>₹{item.cost}</Text>
          <Text style={styles.date}>{new Date(item.date).toLocaleDateString()}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return '#4CAF50';
      case 'in-progress': return '#FF9800';
      case 'pending': return '#2196F3';
      case 'cancelled': return '#F44336';
      default: return '#666';
    }
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="medical-outline" size={64} color="#ccc" />
      <Text style={styles.emptyStateTitle}>No Treatments Found</Text>
      <Text style={styles.emptyStateSubtitle}>
        Add your first treatment to get started
      </Text>
      <TouchableOpacity
        style={styles.addButton}
        onPress={() => navigation.navigate('TreatmentForm')}
      >
        <Ionicons name="add" size={20} color="white" />
        <Text style={styles.addButtonText}>Add Treatment</Text>
      </TouchableOpacity>
    </View>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text>Loading treatments...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right', 'bottom']}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>Treatments</Text>
            <Text style={styles.headerSubtitle}>Manage treatment records</Text>
          </View>
          <View style={styles.headerActions}>
            <View style={styles.headerIconContainer}>
              <Ionicons name="medical" size={24} color={theme.colors.primary} />
            </View>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => navigation.navigate('TreatmentForm')}
            >
              <Ionicons name="add" size={20} color="white" />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <SearchInput
        value={searchQuery}
        onChangeText={handleSearch}
        placeholder="Search treatments by name, patient, or notes..."
        onClear={handleClearSearch}
      />

      <FlatList
        data={filteredTreatments}
        keyExtractor={(item) => item._id}
        renderItem={renderTreatmentItem}
        contentContainerStyle={filteredTreatments.length === 0 ? styles.emptyContainer : styles.listContainer}
        ListEmptyComponent={renderEmptyState}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      />
      
      {filteredTreatments.length > 0 && (
        <FloatingActionButton
          onPress={() => navigation.navigate('TreatmentForm')}
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
  treatmentCard: {
    ...theme.components.card.container,
    marginBottom: theme.spacing.md,
  },
  treatmentInfo: {
    flex: 1,
  },
  treatmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  treatmentType: {
    ...theme.typography.styles.cardTitle,
    color: theme.colors.text.primary,
    flex: 1,
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
  treatmentDescription: {
    fontSize: 12,
    color: '#333',
    marginBottom: 10,
  },
  treatmentDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cost: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  date: {
    fontSize: 12,
    color: '#666',
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
  },
  emptyStateTitle: {
    fontSize: 16,
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

export default TreatmentListScreen;
