import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Modal,
  FlatList,
  Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { theme } from '../theme';
import { Button, Card, FloatingActionButton } from '../components';
import api, { Treatment, Patient } from '../services/api';

interface TreatmentFormData {
  name: string;
  description: string;
  cost: string;
  materialCost: string;
  status: string;
  date: string;
  nextAppointment: string;
  patientId: string;
  patientName: string;
  notes: string;
  dentalCheckup: {
    oralHygiene: string;
    gingivalStatus: string;
    plaqueIndex: string;
    bleedingIndex: string;
    mobility: string;
    pocketDepth: string;
    notes: string;
  };
  diagnosis: {
    chiefComplaint: string;
    clinicalFindings: string;
    diagnosis: string;
    treatmentPlan: string;
  };
  dentalIssues: any[];
}

const TreatmentFormScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { treatmentId, patientId } = (route.params as { treatmentId?: string; patientId?: string }) || {};
  
  const [formData, setFormData] = useState<TreatmentFormData>({
    name: '',
    description: '',
    cost: '',
    materialCost: '',
    status: 'pending',
    date: new Date().toISOString().split('T')[0],
    nextAppointment: '',
    patientId: patientId || '',
    patientName: '',
    notes: '',
    dentalCheckup: {
      oralHygiene: 'Good',
      gingivalStatus: 'Healthy',
      plaqueIndex: '0',
      bleedingIndex: '0',
      mobility: 'None',
      pocketDepth: '0',
      notes: '',
    },
    diagnosis: {
      chiefComplaint: '',
      clinicalFindings: '',
      diagnosis: '',
      treatmentPlan: '',
    },
    dentalIssues: [],
  });
  
  const [patients, setPatients] = useState<Patient[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [errors, setErrors] = useState<Partial<TreatmentFormData>>({});
  const [showPatientModal, setShowPatientModal] = useState(false);
  const [patientSearchQuery, setPatientSearchQuery] = useState('');
  const [filteredPatients, setFilteredPatients] = useState<Patient[]>([]);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

  // Treatment templates for quick selection
  const treatmentTemplates = {
    'Cleaning': {
      name: 'Dental Cleaning',
      description: 'Professional dental cleaning and scaling to remove plaque and tartar buildup.'
    },
    'Filling': {
      name: 'Dental Filling',
      description: 'Restoration of decayed or damaged tooth using dental filling material.'
    },
    'Extraction': {
      name: 'Tooth Extraction',
      description: 'Surgical removal of a tooth from its socket in the bone.'
    },
    'Root Canal': {
      name: 'Root Canal Treatment',
      description: 'Treatment to repair and save a badly damaged or infected tooth.'
    },
    'Crown': {
      name: 'Dental Crown',
      description: 'Custom-made cap that covers the entire tooth to restore its shape, size, and strength.'
    },
    'Other': {
      name: '',
      description: ''
    }
  };

  useEffect(() => {
    if (treatmentId) {
      fetchTreatment();
      setIsEditing(true);
    } else {
      fetchPatients();
    }
  }, [treatmentId]);

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', () => {
      setIsKeyboardVisible(true);
    });
    const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => {
      setIsKeyboardVisible(false);
    });

    return () => {
      keyboardDidShowListener?.remove();
      keyboardDidHideListener?.remove();
    };
  }, []);

  const fetchTreatment = async () => {
    try {
      setIsLoading(true);
      const treatment = await api.getTreatment(treatmentId!);
      setFormData({
        name: treatment.name || '',
        description: treatment.description || '',
        cost: treatment.cost?.toString() || '',
        materialCost: treatment.materialCost?.toString() || '',
        status: treatment.status || 'pending',
        date: treatment.date ? new Date(treatment.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        nextAppointment: treatment.nextAppointment ? new Date(treatment.nextAppointment).toISOString().split('T')[0] : '',
        patientId: treatment.patientId || '',
        patientName: treatment.patientName || '',
        notes: treatment.notes || '',
        dentalCheckup: treatment.dentalCheckup || {
          oralHygiene: 'Good',
          gingivalStatus: 'Healthy',
          plaqueIndex: '0',
          bleedingIndex: '0',
          mobility: 'None',
          pocketDepth: '0',
          notes: '',
        },
        diagnosis: treatment.diagnosis || {
          chiefComplaint: '',
          clinicalFindings: '',
          diagnosis: '',
          treatmentPlan: '',
        },
        dentalIssues: treatment.dentalIssues || [],
      });
    } catch (error) {
      console.error('Error fetching treatment:', error);
      Alert.alert('Error', 'Failed to fetch treatment details');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPatients = async () => {
    try {
      const data = await api.getPatients();
      setPatients(data);
      setFilteredPatients(data);
    } catch (error) {
      console.error('Error fetching patients:', error);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent as keyof TreatmentFormData] as any,
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }
    
    // Clear error when user starts typing
    if (errors[field as keyof TreatmentFormData]) {
      setErrors(prev => ({
        ...prev,
        [field]: undefined
      }));
    }
  };

  const handlePatientSearch = (query: string) => {
    setPatientSearchQuery(query);
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

  const handlePatientSelect = (patient: Patient) => {
    setFormData(prev => ({
      ...prev,
      patientId: patient._id,
      patientName: `${patient.firstName} ${patient.lastName}`.trim()
    }));
    setShowPatientModal(false);
    setPatientSearchQuery('');
  };

  const handleTemplateSelect = (template: string) => {
    const selectedTemplate = treatmentTemplates[template as keyof typeof treatmentTemplates];
    setFormData(prev => ({
      ...prev,
      name: selectedTemplate.name,
      description: selectedTemplate.description
    }));
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<TreatmentFormData> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Treatment name is required';
    }
    if (!formData.patientId) {
      newErrors.patientId = 'Patient is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setIsLoading(true);
      
      const treatmentData = {
        ...formData,
        cost: parseFloat(formData.cost) || 0,
        materialCost: parseFloat(formData.materialCost) || 0,
        date: new Date(formData.date).toISOString(),
        nextAppointment: formData.nextAppointment ? new Date(formData.nextAppointment).toISOString() : undefined,
      };

      if (isEditing) {
        await api.updateTreatment(treatmentId!, treatmentData);
        Alert.alert('Success', 'Treatment updated successfully');
      } else {
        await api.createTreatment(treatmentData);
        Alert.alert('Success', 'Treatment created successfully');
      }
      
      navigation.goBack();
    } catch (error) {
      console.error('Error saving treatment:', error);
      Alert.alert('Error', 'Failed to save treatment');
    } finally {
      setIsLoading(false);
    }
  };

  const renderSectionHeader = (title: string, icon: string) => (
    <View style={styles.sectionHeader}>
      <View style={styles.sectionHeaderContent}>
        <View style={styles.sectionIconContainer}>
          <Ionicons name={icon as any} size={20} color={theme.colors.primary} />
        </View>
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
    </View>
  );

  const renderInputGroup = (label: string, children: React.ReactNode) => (
    <View style={styles.inputGroup}>
      <Text style={styles.inputLabel}>{label}</Text>
      {children}
    </View>
  );

  const renderPatientInfo = () => (
    <Card style={styles.sectionCard}>
      {renderSectionHeader('Patient Information', 'person')}
      <View style={styles.sectionContent}>
        {formData.patientId ? (
          <View style={styles.patientInfo}>
            <Text style={styles.patientName}>{formData.patientName}</Text>
            <TouchableOpacity 
              style={styles.editPatientButton}
              onPress={() => setShowPatientModal(true)}
            >
              <Ionicons name="create" size={16} color={theme.colors.primary} />
              <Text style={styles.editPatientText}>Edit</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity 
            style={styles.linkPatientButton}
            onPress={() => setShowPatientModal(true)}
          >
            <Ionicons name="link" size={20} color={theme.colors.primary} />
            <Text style={styles.linkPatientText}>Link Patient</Text>
          </TouchableOpacity>
        )}
      </View>
    </Card>
  );

  const renderTreatmentDetails = () => (
    <Card style={styles.sectionCard}>
      {renderSectionHeader('Treatment Details', 'medical')}
      <View style={styles.sectionContent}>
        <View style={styles.templateContainer}>
          <Text style={styles.templateLabel}>Quick Templates:</Text>
          <View style={styles.templateButtons}>
            {Object.keys(treatmentTemplates).map(template => (
              <TouchableOpacity
                key={template}
                style={styles.templateButton}
                onPress={() => handleTemplateSelect(template)}
              >
                <Text style={styles.templateButtonText}>{template}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
        
        {renderInputGroup('Treatment Name *', (
          <TextInput
            style={[styles.input, errors.name && styles.inputError]}
            value={formData.name}
            onChangeText={(value) => handleInputChange('name', value)}
            placeholder="Enter treatment name"
          />
        ))}
        
        {renderInputGroup('Description', (
          <TextInput
            style={[styles.input, styles.textArea]}
            value={formData.description}
            onChangeText={(value) => handleInputChange('description', value)}
            placeholder="Enter treatment description"
            multiline
            numberOfLines={3}
          />
        ))}

        <View style={styles.row}>
          {renderInputGroup('Cost (₹)', (
            <TextInput
              style={[styles.input, styles.halfWidth]}
              value={formData.cost}
              onChangeText={(value) => handleInputChange('cost', value)}
              placeholder="0"
              keyboardType="numeric"
            />
          ))}
          
          {renderInputGroup('Material Cost (₹)', (
            <TextInput
              style={[styles.input, styles.halfWidth]}
              value={formData.materialCost}
              onChangeText={(value) => handleInputChange('materialCost', value)}
              placeholder="0"
              keyboardType="numeric"
            />
          ))}
        </View>

        <View style={styles.row}>
          {renderInputGroup('Status', (
            <View style={styles.statusContainer}>
              {['pending', 'in_progress', 'completed', 'cancelled'].map(status => (
                <TouchableOpacity
                  key={status}
                  style={[
                    styles.statusOption,
                    formData.status === status && styles.statusOptionSelected
                  ]}
                  onPress={() => handleInputChange('status', status)}
                >
                  <Text style={[
                    styles.statusText,
                    formData.status === status && styles.statusTextSelected
                  ]}>
                    {status.replace('_', ' ').toUpperCase()}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          ))}
        </View>

        <View style={styles.row}>
          {renderInputGroup('Treatment Date', (
            <TextInput
              style={[styles.input, styles.halfWidth]}
              value={formData.date}
              onChangeText={(value) => handleInputChange('date', value)}
              placeholder="YYYY-MM-DD"
            />
          ))}
          
          {renderInputGroup('Next Appointment', (
            <TextInput
              style={[styles.input, styles.halfWidth]}
              value={formData.nextAppointment}
              onChangeText={(value) => handleInputChange('nextAppointment', value)}
              placeholder="YYYY-MM-DD"
            />
          ))}
        </View>

        {renderInputGroup('Notes', (
          <TextInput
            style={[styles.input, styles.textArea]}
            value={formData.notes}
            onChangeText={(value) => handleInputChange('notes', value)}
            placeholder="Additional notes"
            multiline
            numberOfLines={3}
          />
        ))}
      </View>
    </Card>
  );

  const renderDentalCheckup = () => (
    <Card style={styles.sectionCard}>
      {renderSectionHeader('Dental Checkup', 'fitness')}
      <View style={styles.sectionContent}>
        <View style={styles.row}>
          {renderInputGroup('Oral Hygiene', (
            <View style={styles.selectContainer}>
              {['Good', 'Fair', 'Poor'].map(option => (
                <TouchableOpacity
                  key={option}
                  style={[
                    styles.selectOption,
                    formData.dentalCheckup.oralHygiene === option && styles.selectOptionSelected
                  ]}
                  onPress={() => handleInputChange('dentalCheckup.oralHygiene', option)}
                >
                  <Text style={[
                    styles.selectText,
                    formData.dentalCheckup.oralHygiene === option && styles.selectTextSelected
                  ]}>
                    {option}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          ))}
          
          {renderInputGroup('Gingival Status', (
            <View style={styles.selectContainer}>
              {['Healthy', 'Mild Inflammation', 'Moderate Inflammation', 'Severe Inflammation'].map(option => (
                <TouchableOpacity
                  key={option}
                  style={[
                    styles.selectOption,
                    formData.dentalCheckup.gingivalStatus === option && styles.selectOptionSelected
                  ]}
                  onPress={() => handleInputChange('dentalCheckup.gingivalStatus', option)}
                >
                  <Text style={[
                    styles.selectText,
                    formData.dentalCheckup.gingivalStatus === option && styles.selectTextSelected
                  ]}>
                    {option}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          ))}
        </View>

        <View style={styles.row}>
          {renderInputGroup('Plaque Index (0-3)', (
            <TextInput
              style={[styles.input, styles.halfWidth]}
              value={formData.dentalCheckup.plaqueIndex}
              onChangeText={(value) => handleInputChange('dentalCheckup.plaqueIndex', value)}
              placeholder="0"
              keyboardType="numeric"
            />
          ))}
          
          {renderInputGroup('Bleeding Index (0-3)', (
            <TextInput
              style={[styles.input, styles.halfWidth]}
              value={formData.dentalCheckup.bleedingIndex}
              onChangeText={(value) => handleInputChange('dentalCheckup.bleedingIndex', value)}
              placeholder="0"
              keyboardType="numeric"
            />
          ))}
        </View>

        <View style={styles.row}>
          {renderInputGroup('Mobility', (
            <View style={styles.selectContainer}>
              {['None', 'Grade 1', 'Grade 2', 'Grade 3'].map(option => (
                <TouchableOpacity
                  key={option}
                  style={[
                    styles.selectOption,
                    formData.dentalCheckup.mobility === option && styles.selectOptionSelected
                  ]}
                  onPress={() => handleInputChange('dentalCheckup.mobility', option)}
                >
                  <Text style={[
                    styles.selectText,
                    formData.dentalCheckup.mobility === option && styles.selectTextSelected
                  ]}>
                    {option}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          ))}
          
          {renderInputGroup('Pocket Depth (mm)', (
            <TextInput
              style={[styles.input, styles.halfWidth]}
              value={formData.dentalCheckup.pocketDepth}
              onChangeText={(value) => handleInputChange('dentalCheckup.pocketDepth', value)}
              placeholder="0"
              keyboardType="numeric"
            />
          ))}
        </View>

        {renderInputGroup('Checkup Notes', (
          <TextInput
            style={[styles.input, styles.textArea]}
            value={formData.dentalCheckup.notes}
            onChangeText={(value) => handleInputChange('dentalCheckup.notes', value)}
            placeholder="Additional checkup notes"
            multiline
            numberOfLines={3}
          />
        ))}
      </View>
    </Card>
  );

  const renderDiagnosis = () => (
    <Card style={styles.sectionCard}>
      {renderSectionHeader('Diagnosis', 'document-text')}
      <View style={styles.sectionContent}>
        {renderInputGroup('Chief Complaint', (
          <TextInput
            style={[styles.input, styles.textArea]}
            value={formData.diagnosis.chiefComplaint}
            onChangeText={(value) => handleInputChange('diagnosis.chiefComplaint', value)}
            placeholder="Patient's main complaint"
            multiline
            numberOfLines={2}
          />
        ))}

        {renderInputGroup('Clinical Findings', (
          <TextInput
            style={[styles.input, styles.textArea]}
            value={formData.diagnosis.clinicalFindings}
            onChangeText={(value) => handleInputChange('diagnosis.clinicalFindings', value)}
            placeholder="Clinical observations"
            multiline
            numberOfLines={2}
          />
        ))}

        {renderInputGroup('Diagnosis', (
          <TextInput
            style={[styles.input, styles.textArea]}
            value={formData.diagnosis.diagnosis}
            onChangeText={(value) => handleInputChange('diagnosis.diagnosis', value)}
            placeholder="Final diagnosis"
            multiline
            numberOfLines={2}
          />
        ))}

        {renderInputGroup('Treatment Plan', (
          <TextInput
            style={[styles.input, styles.textArea]}
            value={formData.diagnosis.treatmentPlan}
            onChangeText={(value) => handleInputChange('diagnosis.treatmentPlan', value)}
            placeholder="Proposed treatment plan"
            multiline
            numberOfLines={2}
          />
        ))}
      </View>
    </Card>
  );

  const renderPatientModal = () => (
    <Modal
      visible={showPatientModal}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Select Patient</Text>
          <TouchableOpacity onPress={() => setShowPatientModal(false)}>
            <Ionicons name="close" size={24} color={theme.colors.text.primary} />
          </TouchableOpacity>
        </View>
        
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            value={patientSearchQuery}
            onChangeText={handlePatientSearch}
            placeholder="Search patients..."
            autoFocus
          />
        </View>
        
        <FlatList
          data={filteredPatients}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.patientItem}
              onPress={() => handlePatientSelect(item)}
            >
              <View style={styles.patientItemContent}>
                <Text style={styles.patientItemName}>
                  {item.firstName} {item.lastName}
                </Text>
                <Text style={styles.patientItemDetails}>
                  {item.phone} {item.email ? `• ${item.email}` : ''}
                </Text>
              </View>
            </TouchableOpacity>
          )}
          style={styles.patientList}
        />
      </SafeAreaView>
    </Modal>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['left', 'right', 'bottom']}>
        <View style={styles.loadingContainer}>
          <Text>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right', 'bottom']}>
      <KeyboardAvoidingView 
        style={styles.keyboardContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {renderPatientInfo()}
          {renderTreatmentDetails()}
          {renderDentalCheckup()}
          {renderDiagnosis()}
        </ScrollView>
        
        {!isKeyboardVisible && (
          <FloatingActionButton
            onPress={handleSubmit}
            icon="checkmark"
            label={isEditing ? 'Update Treatment' : 'Create Treatment'}
            loading={isLoading}
          />
        )}
        
        {isKeyboardVisible && (
          <View style={styles.keyboardSaveButton}>
            <Button
              title={isEditing ? 'Update Treatment' : 'Create Treatment'}
              onPress={handleSubmit}
              loading={isLoading}
            />
          </View>
        )}
      </KeyboardAvoidingView>
      
      {renderPatientModal()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  keyboardContainer: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  // Section styling
  sectionCard: {
    margin: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  sectionHeader: {
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    borderTopLeftRadius: theme.spacing.borderRadius.lg,
    borderTopRightRadius: theme.spacing.borderRadius.lg,
  },
  sectionHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.white,
  },
  sectionContent: {
    padding: theme.spacing.lg,
  },
  
  // Input styling
  inputGroup: {
    marginBottom: theme.spacing.md,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
  },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.spacing.borderRadius.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    fontSize: 14,
    color: theme.colors.text.primary,
    backgroundColor: theme.colors.white,
  },
  inputError: {
    borderColor: theme.colors.error,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  halfWidth: {
    flex: 1,
    marginRight: theme.spacing.sm,
  },
  row: {
    flexDirection: 'row',
    marginBottom: theme.spacing.md,
  },
  
  // Patient info styling
  patientInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  patientName: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  editPatientButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.spacing.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.primary,
  },
  editPatientText: {
    fontSize: 14,
    color: theme.colors.primary,
    marginLeft: theme.spacing.xs,
  },
  linkPatientButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.lg,
    borderRadius: theme.spacing.borderRadius.md,
    borderWidth: 2,
    borderColor: theme.colors.primary,
    borderStyle: 'dashed',
  },
  linkPatientText: {
    fontSize: 16,
    color: theme.colors.primary,
    marginLeft: theme.spacing.sm,
  },
  
  // Template styling
  templateContainer: {
    marginBottom: theme.spacing.lg,
  },
  templateLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
  },
  templateButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  templateButton: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.spacing.borderRadius.md,
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  templateButtonText: {
    fontSize: 12,
    color: theme.colors.text.secondary,
  },
  
  // Status styling
  statusContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  statusOption: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.spacing.borderRadius.md,
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  statusOptionSelected: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  statusText: {
    fontSize: 12,
    color: theme.colors.text.secondary,
    fontWeight: '500',
  },
  statusTextSelected: {
    color: theme.colors.white,
  },
  
  // Select styling
  selectContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  selectOption: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.spacing.borderRadius.md,
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  selectOptionSelected: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  selectText: {
    fontSize: 12,
    color: theme.colors.text.secondary,
    fontWeight: '500',
  },
  selectTextSelected: {
    color: theme.colors.white,
  },
  
  // Modal styling
  modalContainer: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  searchContainer: {
    padding: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  searchInput: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.spacing.borderRadius.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    fontSize: 14,
    color: theme.colors.text.primary,
    backgroundColor: theme.colors.white,
  },
  patientList: {
    flex: 1,
  },
  patientItem: {
    padding: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  patientItemContent: {
    flex: 1,
  },
  patientItemName: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  patientItemDetails: {
    fontSize: 14,
    color: theme.colors.text.secondary,
  },
  
  // Keyboard save button
  keyboardSaveButton: {
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.white,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
});

export default TreatmentFormScreen;