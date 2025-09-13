import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { theme } from '../theme';
import { Card } from '../components';
import api, { Treatment, Patient } from '../services/api';

// Use the existing Treatment interface from API
type TreatmentDetailsData = Treatment;

const TreatmentDetailsScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { treatmentId } = (route.params as { treatmentId: string }) || {};
  
  const [treatment, setTreatment] = useState<TreatmentDetailsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState(0);
  
  const tabs = [
    { id: 'patient', title: 'Patient', icon: 'person' },
    { id: 'diagnosis', title: 'Diagnosis', icon: 'document-text' },
    { id: 'treatment', title: 'Treatment Plan', icon: 'medical' },
  ];

  useEffect(() => {
    if (treatmentId) {
      loadTreatmentDetails();
    }
  }, [treatmentId]);

  const loadTreatmentDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('🔍 [TreatmentDetails] Loading treatment with ID:', treatmentId);
      const treatmentData = await api.getTreatment(treatmentId);
      console.log('🔍 [TreatmentDetails] Loaded treatment data:', treatmentData);
      setTreatment(treatmentData);
    } catch (err: any) {
      console.error('❌ [TreatmentDetails] Error loading treatment details:', err);
      setError(err.message || 'Failed to load treatment details');
      Alert.alert('Error', 'Failed to load treatment details');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getStatusColor = (status?: string) => {
    switch (status?.toLowerCase()) {
      case 'completed':
        return theme.colors.success;
      case 'in_progress':
      case 'ongoing':
        return theme.colors.warning;
      case 'pending':
        return theme.colors.text.secondary;
      case 'cancelled':
        return theme.colors.error;
      default:
        return theme.colors.text.secondary;
    }
  };

  const getStatusIcon = (status?: string) => {
    switch (status?.toLowerCase()) {
      case 'completed':
        return 'checkmark-circle';
      case 'in_progress':
      case 'ongoing':
        return 'time';
      case 'pending':
        return 'hourglass';
      case 'cancelled':
        return 'close-circle';
      default:
        return 'help-circle';
    }
  };

  const renderTabNavigation = () => (
    <View style={styles.tabContainer}>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabScrollContent}
      >
        {tabs.map((tab, index) => (
          <TouchableOpacity
            key={tab.id}
            style={[
              styles.tab,
              activeTab === index && styles.activeTab
            ]}
            onPress={() => setActiveTab(index)}
            activeOpacity={0.7}
          >
            <Ionicons 
              name={tab.icon as any} 
              size={20} 
              color={activeTab === index ? theme.colors.white : theme.colors.text.secondary} 
            />
            <Text style={[
              styles.tabText,
              activeTab === index && styles.activeTabText
            ]}>
              {tab.title}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  const renderTabContent = () => {
    if (!treatment) {
      return (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No treatment data available</Text>
        </View>
      );
    }

    switch (activeTab) {
      case 0:
        return renderPatientInfo();
      case 1:
        return renderDiagnosis();
      case 2:
        return renderTreatmentPlan();
      default:
        return renderPatientInfo();
    }
  };

  const renderTabNavigationButtons = () => (
    <View style={styles.tabNavigationButtons}>
      <TouchableOpacity
        style={[
          styles.navButton,
          activeTab === 0 && styles.navButtonDisabled
        ]}
        onPress={() => setActiveTab(Math.max(0, activeTab - 1))}
        disabled={activeTab === 0}
        activeOpacity={0.7}
      >
        <Ionicons 
          name="chevron-back" 
          size={24} 
          color={activeTab === 0 ? theme.colors.text.disabled : theme.colors.primary} 
        />
        <Text style={[
          styles.navButtonText,
          activeTab === 0 && styles.navButtonTextDisabled
        ]}>
          Previous
        </Text>
      </TouchableOpacity>

      <Text style={styles.tabIndicator}>
        {activeTab + 1} of {tabs.length}
      </Text>

      <TouchableOpacity
        style={[
          styles.navButton,
          activeTab === tabs.length - 1 && styles.navButtonDisabled
        ]}
        onPress={() => setActiveTab(Math.min(tabs.length - 1, activeTab + 1))}
        disabled={activeTab === tabs.length - 1}
        activeOpacity={0.7}
      >
        <Text style={[
          styles.navButtonText,
          activeTab === tabs.length - 1 && styles.navButtonTextDisabled
        ]}>
          Next
        </Text>
        <Ionicons 
          name="chevron-forward" 
          size={24} 
          color={activeTab === tabs.length - 1 ? theme.colors.text.disabled : theme.colors.primary} 
        />
      </TouchableOpacity>
    </View>
  );

  const renderDetailRow = (label: string, value: string | number | undefined, icon?: string) => {
    if (value === undefined || value === null || value === '') return null;
    
    return (
      <View style={styles.detailRow}>
        <View style={styles.detailLabelContainer}>
          {icon && (
            <Ionicons 
              name={icon as any} 
              size={16} 
              color={theme.colors.text.secondary} 
              style={styles.detailIcon}
            />
          )}
          <Text style={styles.detailLabel}>{label}</Text>
        </View>
        <Text style={styles.detailValue}>{value}</Text>
      </View>
    );
  };

  const renderPatientInfo = () => (
    <Card style={styles.sectionCard}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Patient Information</Text>
      </View>
      <View style={styles.sectionContent}>
        {treatment?.patientId ? (
          <View style={styles.patientInfo}>
            <Text style={styles.patientName}>
              {treatment?.patientName || (typeof treatment?.patient === 'object' ? treatment.patient.name : 'Unknown Patient')}
            </Text>
            <View style={styles.patientDetails}>
              {typeof treatment?.patient === 'object' && treatment.patient?.phone && (
                <Text style={styles.patientDetailText}>Phone: {treatment.patient.phone}</Text>
              )}
              {typeof treatment?.patient === 'object' && treatment.patient?.email && (
                <Text style={styles.patientDetailText}>Email: {treatment.patient.email}</Text>
              )}
              {typeof treatment?.patient === 'object' && treatment.patient?.age && (
                <Text style={styles.patientDetailText}>Age: {treatment.patient.age} years</Text>
              )}
              {typeof treatment?.patient === 'object' && treatment.patient?.gender && (
                <Text style={styles.patientDetailText}>Gender: {treatment.patient.gender}</Text>
              )}
            </View>
          </View>
        ) : (
          <Text style={styles.noPatientText}>No patient information available</Text>
        )}
      </View>
    </Card>
  );

  const renderTreatmentPlan = () => (
    <View>
      <Card style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Treatment Details</Text>
        </View>
        <View style={styles.sectionContent}>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Treatment Name</Text>
            <Text style={styles.readOnlyText}>
              {treatment?.name || 'Not specified'}
            </Text>
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Description</Text>
            <Text style={styles.readOnlyText}>
              {treatment?.description || 'Not specified'}
            </Text>
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Treatment Type</Text>
            <Text style={styles.readOnlyText}>
              {treatment?.treatmentType || 'Not specified'}
            </Text>
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Date</Text>
            <Text style={styles.readOnlyText}>
              {treatment?.date ? formatDate(treatment.date) : 'Not specified'}
            </Text>
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Status</Text>
            <View style={styles.statusContainer}>
              <Ionicons 
                name={getStatusIcon(treatment?.status)} 
                size={16} 
                color={getStatusColor(treatment?.status)} 
              />
              <Text style={[styles.statusText, { color: getStatusColor(treatment?.status) }]}>
                {treatment?.status || 'Not specified'}
              </Text>
            </View>
          </View>
        </View>
      </Card>

      <Card style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Financial Information</Text>
        </View>
        <View style={styles.sectionContent}>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Treatment Cost</Text>
            <Text style={styles.readOnlyText}>
              {treatment?.cost ? formatCurrency(treatment.cost) : 'Not specified'}
            </Text>
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Material Cost</Text>
            <Text style={styles.readOnlyText}>
              {treatment?.materialCost ? formatCurrency(treatment.materialCost) : 'Not specified'}
            </Text>
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Total Paid</Text>
            <Text style={styles.readOnlyText}>
              {treatment?.totalPaidAmount ? formatCurrency(treatment.totalPaidAmount) : 'Not specified'}
            </Text>
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Receivable Amount</Text>
            <Text style={styles.readOnlyText}>
              {treatment?.totalReceivableAmount ? formatCurrency(treatment.totalReceivableAmount) : 'Not specified'}
            </Text>
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Remaining Amount</Text>
            <Text style={styles.readOnlyText}>
              {treatment?.totalRemainingAmount ? formatCurrency(treatment.totalRemainingAmount) : 'Not specified'}
            </Text>
          </View>
        </View>
      </Card>

      {treatment?.nextAppointment && (
        <Card style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Next Appointment</Text>
          </View>
          <View style={styles.sectionContent}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Date</Text>
              <Text style={styles.readOnlyText}>
                {formatDate(treatment.nextAppointment)}
              </Text>
            </View>
          </View>
        </Card>
      )}

      {treatment?.notes && (
        <Card style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Notes</Text>
          </View>
          <View style={styles.sectionContent}>
            <Text style={styles.readOnlyText}>{treatment.notes}</Text>
          </View>
        </Card>
      )}
    </View>
  );

  const renderDiagnosis = () => (
    <Card style={styles.sectionCard}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Diagnosis</Text>
      </View>
      <View style={styles.sectionContent}>
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Chief Complaint</Text>
          <Text style={styles.readOnlyText}>
            {treatment?.diagnosis?.chiefComplaint || 'Not specified'}
          </Text>
        </View>
        
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Clinical Findings</Text>
          <Text style={styles.readOnlyText}>
            {treatment?.diagnosis?.clinicalFindings || 'Not specified'}
          </Text>
        </View>
        
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Diagnosis</Text>
          <Text style={styles.readOnlyText}>
            {treatment?.diagnosis?.diagnosis || 'Not specified'}
          </Text>
        </View>
        
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Treatment Plan</Text>
          <Text style={styles.readOnlyText}>
            {treatment?.diagnosis?.treatmentPlan || 'Not specified'}
          </Text>
        </View>
      </View>
    </Card>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Loading treatment details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={48} color={theme.colors.error} />
          <Text style={styles.errorTitle}>Error</Text>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadTreatmentDetails}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (!treatment) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="document-outline" size={48} color={theme.colors.text.secondary} />
          <Text style={styles.errorTitle}>Treatment Not Found</Text>
          <Text style={styles.errorText}>The requested treatment could not be found.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right', 'bottom']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
      >
        <View style={styles.tabViewContainer}>
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Ionicons name="arrow-back" size={24} color={theme.colors.text.primary} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Treatment Details</Text>
            <TouchableOpacity
              style={styles.editButton}
              onPress={() => (navigation as any).navigate('TreatmentForm', { treatmentId: treatment._id })}
            >
              <Ionicons name="create-outline" size={20} color={theme.colors.primary} />
              <Text style={styles.editButtonText}>Edit</Text>
            </TouchableOpacity>
          </View>

          {/* Tab Navigation */}
          {renderTabNavigation()}
          
          {/* Tab Content */}
          <ScrollView 
            style={styles.scrollView} 
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {renderTabContent()}
          </ScrollView>
          
          {/* Tab Navigation Buttons */}
          {renderTabNavigationButtons()}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  tabViewContainer: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: theme.spacing.md,
    fontSize: 16,
    color: theme.colors.text.secondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.lg,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  errorText: {
    fontSize: 16,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    marginBottom: theme.spacing.lg,
  },
  retryButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
  },
  retryButtonText: {
    color: theme.colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    backgroundColor: theme.colors.white,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderLight,
  },
  backButton: {
    padding: theme.spacing.sm,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text.primary,
    flex: 1,
    textAlign: 'center',
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.lg,
    backgroundColor: theme.colors.primaryLight + '20',
    borderWidth: 1,
    borderColor: theme.colors.primary,
  },
  editButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.primary,
    marginLeft: theme.spacing.xs,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: theme.spacing.xl,
  },
  section: {
    margin: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  sectionHeader: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderLight,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  sectionContent: {
    padding: theme.spacing.lg,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.md,
  },
  detailLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  detailIcon: {
    marginRight: theme.spacing.xs,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.text.secondary,
    flex: 1,
  },
  detailValue: {
    fontSize: 14,
    color: theme.colors.text.primary,
    textAlign: 'right',
    flex: 1,
    marginLeft: theme.spacing.sm,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: theme.spacing.sm,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: theme.spacing.xs,
  },
  notesText: {
    fontSize: 14,
    color: theme.colors.text.primary,
    lineHeight: 20,
  },
  
  // Tab navigation styles
  tabContainer: {
    backgroundColor: theme.colors.white,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderLight,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  tabScrollContent: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    marginHorizontal: theme.spacing.xs,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.background,
    minWidth: 100,
  },
  activeTab: {
    backgroundColor: theme.colors.primary,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.text.secondary,
    marginLeft: theme.spacing.xs,
  },
  activeTabText: {
    color: theme.colors.white,
  },
  tabNavigationButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    backgroundColor: theme.colors.white,
    borderTopWidth: 1,
    borderTopColor: theme.colors.borderLight,
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    backgroundColor: theme.colors.primary,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  navButtonDisabled: {
    backgroundColor: theme.colors.background,
    elevation: 0,
    shadowOpacity: 0,
  },
  navButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.white,
    marginHorizontal: theme.spacing.sm,
  },
  navButtonTextDisabled: {
    color: theme.colors.text.disabled,
  },
  tabIndicator: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.text.secondary,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xl,
  },
  emptyText: {
    fontSize: 16,
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },
  
  // Treatment form matching styles
  sectionCard: {
    margin: theme.spacing.md,
    marginBottom: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    backgroundColor: theme.colors.white,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  inputGroup: {
    marginBottom: theme.spacing.lg,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
  },
  readOnlyText: {
    fontSize: 16,
    color: theme.colors.text.primary,
    backgroundColor: theme.colors.background,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
    minHeight: 48,
    textAlignVertical: 'top',
  },
  patientInfo: {
    padding: theme.spacing.md,
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.md,
  },
  patientName: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
  },
  patientDetails: {
    marginTop: theme.spacing.sm,
  },
  patientDetailText: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.xs,
  },
  noPatientText: {
    fontSize: 16,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    fontStyle: 'italic',
    padding: theme.spacing.lg,
  },
});

export default TreatmentDetailsScreen;