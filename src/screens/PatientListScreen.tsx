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
import api, { Patient } from '../services/api';
import { theme } from '../theme';
import { EmptyState, FloatingActionButton, SearchInput } from '../components';

const PatientListScreen: React.FC = () => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [filteredPatients, setFilteredPatients] = useState<Patient[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const navigation = useNavigation();

  const fetchPatients = async () => {
    try {
      const data = await api.getPatients();
      console.log('Patients data received:', data);
      setPatients(data);
      setFilteredPatients(data);
    } catch (error: any) {
      console.error('Error fetching patients:', error);
      if (error.message?.includes('Authentication required')) {
        Alert.alert('Authentication Error', 'Please login again');
      } else {
        Alert.alert('Error', 'Failed to fetch patients. Please check your connection.');
      }
      setPatients([]);
      setFilteredPatients([]);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (query.trim() === '') {
      setFilteredPatients(patients);
    } else {
      const filtered = patients.filter(patient => {
        const fullName = `${patient.firstName} ${patient.lastName}`.toLowerCase();
        const phone = patient.phone?.toLowerCase() || '';
        const email = patient.email?.toLowerCase() || '';
        const searchTerm = query.toLowerCase();
        
        return fullName.includes(searchTerm) || 
               phone.includes(searchTerm) || 
               email.includes(searchTerm);
      });
      setFilteredPatients(filtered);
    }
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setFilteredPatients(patients);
  };

  useEffect(() => {
    fetchPatients();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchPatients();
  };

  const handleDeletePatient = (patientId: string, patientName: string) => {
    Alert.alert(
      'Delete Patient',
      `Are you sure you want to delete ${patientName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.deletePatient(patientId);
              fetchPatients(); // Refresh the list
            } catch (error) {
              Alert.alert('Error', 'Failed to delete patient');
            }
          },
        },
      ]
    );
  };

  const renderPatientItem = ({ item }: { item: Patient }) => (
    <TouchableOpacity
      style={styles.patientCard}
      onPress={() => navigation.navigate('PatientDetails', { patientId: item._id })}
    >
      <View style={styles.patientInfo}>
        <View style={styles.patientHeader}>
          <Text style={styles.patientName}>{item.name}</Text>
          <View style={styles.patientActions}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => navigation.navigate('PatientForm', { patientId: item._id })}
            >
              <Ionicons name="pencil" size={16} color={theme.colors.primary} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleDeletePatient(item._id, item.name)}
            >
              <Ionicons name="trash" size={16} color={theme.colors.error} />
            </TouchableOpacity>
          </View>
        </View>
        
        <View style={styles.patientDetails}>
          {item.phone && (
            <View style={styles.detailRow}>
              <Ionicons name="call" size={14} color="#666" />
              <Text style={styles.detailText}>{item.phone}</Text>
            </View>
          )}
          {item.email && (
            <View style={styles.detailRow}>
              <Ionicons name="mail" size={14} color="#666" />
              <Text style={styles.detailText}>{item.email}</Text>
            </View>
          )}
          {item.age && (
            <View style={styles.detailRow}>
              <Ionicons name="calendar" size={14} color="#666" />
              <Text style={styles.detailText}>{item.age} years old</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <EmptyState
      icon="people-outline"
      title="No Patients Found"
      subtitle="Add your first patient to get started"
      buttonText="Add Patient"
      onButtonPress={() => navigation.navigate('PatientForm')}
    />
  );

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right', 'bottom']}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>Patients</Text>
            <Text style={styles.headerSubtitle}>Manage your patient records</Text>
          </View>
          <View style={styles.headerActions}>
            <View style={styles.headerIconContainer}>
              <Ionicons name="people" size={24} color={theme.colors.primary} />
            </View>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => navigation.navigate('PatientForm')}
            >
              <Ionicons name="add" size={20} color="white" />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <SearchInput
        value={searchQuery}
        onChangeText={handleSearch}
        placeholder="Search patients by name, phone, or email..."
        onClear={handleClearSearch}
      />

      <FlatList
        data={filteredPatients}
        keyExtractor={(item) => item._id}
        renderItem={renderPatientItem}
        contentContainerStyle={filteredPatients.length === 0 ? styles.emptyContainer : styles.listContainer}
        ListEmptyComponent={renderEmptyState}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      />
      
      {filteredPatients.length > 0 && (
        <FloatingActionButton
          onPress={() => navigation.navigate('PatientForm')}
          icon="add"
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
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
  addButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: 25,
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonText: {
    color: theme.colors.white,
    fontWeight: 'bold',
    marginLeft: theme.spacing.xs,
  },
  listContainer: {
    padding: theme.spacing.lg,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  patientCard: {
    ...theme.components.card.container,
    marginBottom: theme.spacing.md,
  },
  patientInfo: {
    flex: 1,
  },
  patientHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  patientName: {
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 24,
    color: theme.colors.text.primary,
    flex: 1,
  },
  patientActions: {
    flexDirection: 'row',
    gap: theme.spacing.xs,
  },
  actionButton: {
    padding: theme.spacing.sm,
    borderRadius: theme.spacing.borderRadius.sm,
    backgroundColor: theme.colors.gray[100],
  },
  patientDetails: {
    gap: theme.spacing.xs,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailText: {
    fontSize: 12,
    fontWeight: '400',
    lineHeight: 20,
    color: theme.colors.text.secondary,
    marginLeft: theme.spacing.xs,
  },
  emptyState: {
    alignItems: 'center',
    padding: theme.spacing['2xl'],
  },
  emptyStateTitle: {
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 26,
    color: theme.colors.text.primary,
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.sm,
  },
  emptyStateSubtitle: {
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 24,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    marginBottom: theme.spacing.xl,
  },
});

export default PatientListScreen;
