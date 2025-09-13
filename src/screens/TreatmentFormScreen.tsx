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
import { Button, Card, FloatingActionButton, TreatmentPlanForm } from '../components';
import api, { Treatment, Patient } from '../services/api';

interface TreatmentPlan {
  _id?: string;
  treatmentPlanId?: string;
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  status: string;
  totalCost: number;
  totalMaterialCost: number;
  costs: any[];
  categoryItems: any[];
  doctors: any[];
  category: any;
  notes: string;
}

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
  treatmentPlans: TreatmentPlan[];
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
    treatmentPlans: [],
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
  const [showTreatmentPlanModal, setShowTreatmentPlanModal] = useState(false);
  const [selectedPlanIndex, setSelectedPlanIndex] = useState<number | null>(null);
  const [planData, setPlanData] = useState<TreatmentPlan | null>(null);
  const [activeTab, setActiveTab] = useState(0);
  
  const tabs = [
    { id: 'patient', title: 'Patient', icon: 'person' },
    { id: 'treatment', title: 'Treatment', icon: 'medical' },
    { id: 'checkup', title: 'Checkup', icon: 'fitness' },
    { id: 'diagnosis', title: 'Diagnosis', icon: 'document-text' },
  ];

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
        treatmentPlans: treatment.treatmentPlans || [],
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

  const handleAddTreatmentPlan = () => {
    setSelectedPlanIndex(null);
    setPlanData(null);
    setShowTreatmentPlanModal(true);
  };

  const handleEditPlan = (plan: TreatmentPlan, index: number) => {
    setSelectedPlanIndex(index);
    setPlanData(plan);
    setShowTreatmentPlanModal(true);
  };

  const handleSaveTreatmentPlan = (plan: TreatmentPlan) => {
    if (selectedPlanIndex !== null) {
      // Edit existing plan
      setFormData(prev => ({
        ...prev,
        treatmentPlans: prev.treatmentPlans.map((p, index) => 
          index === selectedPlanIndex ? plan : p
        )
      }));
    } else {
      // Add new plan
      setFormData(prev => ({
        ...prev,
        treatmentPlans: [...prev.treatmentPlans, plan]
      }));
    }
    setShowTreatmentPlanModal(false);
    setSelectedPlanIndex(null);
    setPlanData(null);
  };

  const handleDeleteTreatmentPlan = (index: number) => {
    Alert.alert(
      'Delete Treatment Plan',
      'Are you sure you want to delete this treatment plan?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            setFormData(prev => ({
              ...prev,
              treatmentPlans: prev.treatmentPlans.filter((_, i) => i !== index)
            }));
          }
        }
      ]
    );
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'completed':
        return theme.colors.success;
      case 'in_progress':
        return theme.colors.warning;
      case 'cancelled':
        return theme.colors.error;
      case 'planned':
      default:
        return theme.colors.primary;
    }
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

  const renderTabNavigation = () => {
    console.log('🔍 [TreatmentForm] Rendering tab navigation, activeTab:', activeTab);
    return (
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
              onPress={() => {
                console.log('🔍 [TreatmentForm] Tab pressed:', tab.title, 'index:', index);
                setActiveTab(index);
              }}
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
  };

  const renderTabContent = () => {
    console.log('🔍 [TreatmentForm] Rendering tab content for activeTab:', activeTab);
    switch (activeTab) {
      case 0:
        console.log('🔍 [TreatmentForm] Rendering Patient tab');
        return renderPatientInfo();
      case 1:
        console.log('🔍 [TreatmentForm] Rendering Treatment tab');
        return (
          <View>
            {renderTreatmentPlans()}
            {renderTreatmentDetails()}
          </View>
        );
      case 2:
        console.log('🔍 [TreatmentForm] Rendering Checkup tab');
        return renderDentalCheckup();
      case 3:
        console.log('🔍 [TreatmentForm] Rendering Diagnosis tab');
        return renderDiagnosis();
      default:
        console.log('🔍 [TreatmentForm] Rendering default Patient tab');
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
      >
        <Ionicons 
          name="chevron-back" 
          size={20} 
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
      >
        <Text style={[
          styles.navButtonText,
          activeTab === tabs.length - 1 && styles.navButtonTextDisabled
        ]}>
          Next
        </Text>
        <Ionicons 
          name="chevron-forward" 
          size={20} 
          color={activeTab === tabs.length - 1 ? theme.colors.text.disabled : theme.colors.primary} 
        />
      </TouchableOpacity>
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

  const renderTreatmentPlans = () => (
    <View style={styles.treatmentPlansContainer}>
      {/* Header with Quick Actions */}
      <View style={styles.plansHeader}>
        <View style={styles.plansHeaderLeft}>
          <View style={styles.plansIconContainer}>
            <Ionicons name="medical" size={24} color={theme.colors.primary} />
          </View>
          <View>
            <Text style={styles.plansHeaderTitle}>Treatment Plans</Text>
            <Text style={styles.plansHeaderSubtitle}>
              {formData.treatmentPlans.length} plan{formData.treatmentPlans.length !== 1 ? 's' : ''}
            </Text>
          </View>
        </View>
        {formData.patientId && (
          <TouchableOpacity
            style={styles.quickAddButton}
            onPress={handleAddTreatmentPlan}
          >
            <Ionicons name="add" size={20} color={theme.colors.white} />
          </TouchableOpacity>
        )}
      </View>

      {/* Content Area */}
      {!formData.patientId ? (
        <View style={styles.linkPatientCard}>
          <View style={styles.linkPatientIcon}>
            <Ionicons name="person-add" size={32} color={theme.colors.primary} />
          </View>
          <Text style={styles.linkPatientTitle}>Link Patient to Continue</Text>
          <Text style={styles.linkPatientText}>
            Connect a patient to start creating treatment plans
          </Text>
          <TouchableOpacity
            style={styles.linkPatientButton}
            onPress={() => setShowPatientModal(true)}
          >
            <Ionicons name="link" size={16} color={theme.colors.white} />
            <Text style={styles.linkPatientButtonText}>Link Patient</Text>
          </TouchableOpacity>
        </View>
      ) : formData.treatmentPlans.length === 0 ? (
        <View style={styles.emptyPlansCard}>
          <View style={styles.emptyPlansIcon}>
            <Ionicons name="clipboard-outline" size={40} color={theme.colors.primary} />
          </View>
          <Text style={styles.emptyPlansTitle}>Ready to Create Plans</Text>
          <Text style={styles.emptyPlansText}>
            Start by creating your first treatment plan for {formData.patientName}
          </Text>
          <TouchableOpacity
            style={styles.createFirstPlanButton}
            onPress={handleAddTreatmentPlan}
          >
            <Ionicons name="add-circle" size={20} color={theme.colors.white} />
            <Text style={styles.createFirstPlanButtonText}>Create First Plan</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.plansGrid}>
          {formData.treatmentPlans.map((plan, index) => (
            <TouchableOpacity
              key={plan._id || index}
              style={styles.planCard}
              onPress={() => handleEditPlan(plan, index)}
            >
              <View style={styles.planCardHeader}>
                <View style={styles.planCardIcon}>
                  <Ionicons name="document-text" size={20} color={theme.colors.primary} />
                </View>
                <View style={styles.planCardActions}>
                  <TouchableOpacity
                    style={styles.planCardAction}
                    onPress={(e) => {
                      e.stopPropagation();
                      handleEditPlan(plan, index);
                    }}
                  >
                    <Ionicons name="create" size={14} color={theme.colors.text.secondary} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.planCardAction}
                    onPress={(e) => {
                      e.stopPropagation();
                      handleDeleteTreatmentPlan(index);
                    }}
                  >
                    <Ionicons name="trash" size={14} color={theme.colors.error} />
                  </TouchableOpacity>
                </View>
              </View>
              
              <Text style={styles.planCardName} numberOfLines={1}>
                {plan.name || 'Untitled Plan'}
              </Text>
              
              <View style={styles.planCardStatus}>
                <View style={[
                  styles.planStatusDot,
                  { backgroundColor: getStatusColor(plan.status) }
                ]} />
                <Text style={styles.planStatusText}>
                  {plan.status?.replace('_', ' ').toUpperCase() || 'PLANNED'}
                </Text>
              </View>
              
              {plan.startDate && (
                <Text style={styles.planCardDate}>
                  {new Date(plan.startDate).toLocaleDateString()}
                </Text>
              )}
              
              <View style={styles.planCardCosts}>
                <View style={styles.planCardCostItem}>
                  <Text style={styles.planCardCostLabel}>Total</Text>
                  <Text style={styles.planCardCostValue}>₹{plan.totalCost || 0}</Text>
                </View>
                <View style={styles.planCardCostItem}>
                  <Text style={styles.planCardCostLabel}>Materials</Text>
                  <Text style={styles.planCardCostValue}>₹{plan.totalMaterialCost || 0}</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
          
          <TouchableOpacity
            style={styles.addPlanCard}
            onPress={handleAddTreatmentPlan}
          >
            <View style={styles.addPlanIcon}>
              <Ionicons name="add" size={24} color={theme.colors.primary} />
            </View>
            <Text style={styles.addPlanText}>Add New Plan</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
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

  const renderTreatmentPlanModal = () => (
    <Modal
      visible={showTreatmentPlanModal}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>
            {selectedPlanIndex !== null ? 'Edit Treatment Plan' : 'Add Treatment Plan'}
          </Text>
          <TouchableOpacity onPress={() => setShowTreatmentPlanModal(false)}>
            <Ionicons name="close" size={24} color={theme.colors.text.primary} />
          </TouchableOpacity>
        </View>
        
        <ScrollView style={styles.modalContent}>
          <TreatmentPlanForm
            plan={planData}
            onSave={handleSaveTreatmentPlan}
            onCancel={() => setShowTreatmentPlanModal(false)}
          />
        </ScrollView>
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
        <View style={styles.tabViewContainer}>
          {renderTabNavigation()}
          <View style={styles.debugContainer}>
            <Text style={styles.debugText}>Current Tab: {tabs[activeTab]?.title} ({activeTab + 1}/{tabs.length})</Text>
          </View>
          <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
            {renderTabContent()}
          </ScrollView>
          {renderTabNavigationButtons()}
        </View>
        
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
      {renderTreatmentPlanModal()}
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
    includeFontPadding: false,
    textAlignVertical: 'center',
    minHeight: 20,
  },
  inputError: {
    borderColor: theme.colors.error,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
    includeFontPadding: false,
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
    // gap property not supported in React Native StyleSheet
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
    // gap property not supported in React Native StyleSheet
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
    // gap property not supported in React Native StyleSheet
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
  
  // New Mobile-First Treatment Plans Styling
  treatmentPlansContainer: {
    margin: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  
  // Header
  plansHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  plansHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  plansIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  plansHeaderTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  plansHeaderSubtitle: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    marginTop: 2,
  },
  quickAddButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  // Link Patient Card
  linkPatientCard: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.spacing.borderRadius.lg,
    padding: theme.spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  linkPatientIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: theme.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  linkPatientTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
    textAlign: 'center',
  },
  linkPatientText: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    marginBottom: theme.spacing.xl,
    lineHeight: 20,
  },
  linkPatientButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.spacing.borderRadius.md,
  },
  linkPatientButtonText: {
    fontSize: 16,
    color: theme.colors.white,
    fontWeight: '500',
    marginLeft: theme.spacing.sm,
  },
  
  // Empty Plans Card
  emptyPlansCard: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.spacing.borderRadius.lg,
    padding: theme.spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  emptyPlansIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: theme.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  emptyPlansTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
    textAlign: 'center',
  },
  emptyPlansText: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    marginBottom: theme.spacing.xl,
    lineHeight: 20,
    paddingHorizontal: theme.spacing.md,
  },
  createFirstPlanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.spacing.borderRadius.md,
  },
  createFirstPlanButtonText: {
    fontSize: 16,
    color: theme.colors.white,
    fontWeight: '500',
    marginLeft: theme.spacing.sm,
  },
  
  // Plans Grid
  plansGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    // gap property not supported in React Native StyleSheet
    },
  planCard: {
    width: '48%',
    backgroundColor: theme.colors.white,
    borderRadius: theme.spacing.borderRadius.lg,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  planCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  planCardIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  planCardActions: {
    flexDirection: 'row',
    // gap property not supported in React Native StyleSheet
    },
  planCardAction: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: theme.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  planCardName: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
  },
  planCardStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  planStatusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: theme.spacing.sm,
  },
  planStatusText: {
    fontSize: 12,
    color: theme.colors.text.secondary,
    fontWeight: '500',
  },
  planCardDate: {
    fontSize: 12,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.md,
  },
  planCardCosts: {
    // gap property not supported in React Native StyleSheet
    },
  planCardCostItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  planCardCostLabel: {
    fontSize: 12,
    color: theme.colors.text.secondary,
  },
  planCardCostValue: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  
  // Add Plan Card
  addPlanCard: {
    width: '48%',
    backgroundColor: theme.colors.white,
    borderRadius: theme.spacing.borderRadius.lg,
    padding: theme.spacing.md,
    borderWidth: 2,
    borderColor: theme.colors.primary,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 140,
  },
  addPlanIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  addPlanText: {
    fontSize: 14,
    color: theme.colors.primary,
    fontWeight: '500',
    textAlign: 'center',
  },
  
  modalContent: {
    flex: 1,
    padding: theme.spacing.lg,
  },
  
  // Tab navigation styles
  tabViewContainer: {
    flex: 1,
  },
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
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    marginRight: theme.spacing.sm,
    borderRadius: theme.borderRadius.lg,
    backgroundColor: theme.colors.background,
    minWidth: 100,
    justifyContent: 'center',
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
  
  // Tab navigation button styles
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
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.background,
  },
  navButtonDisabled: {
    backgroundColor: theme.colors.background,
    opacity: 0.5,
  },
  navButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.primary,
    marginHorizontal: theme.spacing.xs,
  },
  navButtonTextDisabled: {
    color: theme.colors.text.disabled,
  },
  tabIndicator: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.text.secondary,
  },
  
  // Debug styles
  debugContainer: {
    backgroundColor: theme.colors.primary + '20',
    padding: theme.spacing.sm,
    alignItems: 'center',
  },
  debugText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.primary,
  },
});

export default TreatmentFormScreen;