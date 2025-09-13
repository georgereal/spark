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
      style={styles.patientItem}
      onPress={() => (navigation as any).navigate('PatientDetails', { patientId: item._id })}
      activeOpacity={0.7}
    >
      <View style={styles.patientAvatar}>
        <Text style={styles.avatarText}>
          {item.firstName?.charAt(0)?.toUpperCase()}{item.lastName?.charAt(0)?.toUpperCase()}
        </Text>
      </View>
      
      <View style={styles.patientContent}>
        <View style={styles.patientMainInfo}>
          <Text style={styles.patientName} numberOfLines={1}>
            {item.name}
          </Text>
          <View style={styles.patientMeta}>
            {item.phone && (
              <Text style={styles.patientPhone} numberOfLines={1}>
                {item.phone}
              </Text>
            )}
            {item.age && (
              <Text style={styles.patientAge}>
                • {item.age} years
              </Text>
            )}
          </View>
        </View>
        
        <View style={styles.patientActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={(e) => {
              e.stopPropagation();
              (navigation as any).navigate('PatientForm', { patientId: item._id });
            }}
          >
            <Ionicons name="pencil" size={18} color={theme.colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={(e) => {
              e.stopPropagation();
              handleDeletePatient(item._id, item.name || 'Unknown');
            }}
          >
            <Ionicons name="trash" size={18} color={theme.colors.error} />
          </TouchableOpacity>
        </View>
      </View>
      
      <Ionicons name="chevron-forward" size={20} color={theme.colors.text.secondary} />
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <EmptyState
      icon="people-outline"
      title="No Patients Found"
      subtitle="Add your first patient to get started"
      buttonText="Add Patient"
      onButtonPress={() => (navigation as any).navigate('PatientForm')}
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
              onPress={() => (navigation as any).navigate('PatientForm')}
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

      {filteredPatients.length > 0 && (
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            {filteredPatients.length} {filteredPatients.length === 1 ? 'Patient' : 'Patients'}
          </Text>
          {searchQuery && (
            <Text style={styles.searchResults}>
              Search results for "{searchQuery}"
            </Text>
          )}
        </View>
      )}

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
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
      
      {filteredPatients.length > 0 && (
        <FloatingActionButton
          onPress={() => (navigation as any).navigate('PatientForm')}
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
    // gap property not supported in React Native StyleSheet
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
    paddingHorizontal: theme.spacing.md,
    paddingTop: theme.spacing.sm,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  // New mobile-friendly list item styles
  patientItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.white,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.xs,
    borderRadius: theme.borderRadius.md,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    borderLeftWidth: 3,
    borderLeftColor: theme.colors.primary,
  },
  patientAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.white,
  },
  patientContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  patientMainInfo: {
    flex: 1,
    marginRight: theme.spacing.sm,
  },
  patientName: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  patientMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  patientPhone: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    flex: 1,
  },
  patientAge: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    marginLeft: theme.spacing.xs,
  },
  patientActions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: theme.spacing.sm,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: theme.spacing.xs,
  },
  
  // Section header styles
  sectionHeader: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    backgroundColor: theme.colors.background,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderLight,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  searchResults: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    marginTop: theme.spacing.xs,
  },
  separator: {
    height: theme.spacing.xs,
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
