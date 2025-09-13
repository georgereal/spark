import React, { useState, useEffect, useMemo } from 'react';
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
  category: any;
  categoryItems: any[];
  costs: any[];
  doctors: any[];
  totalCost: number;
  totalMaterialCost: number;
  notes: string;
  // Per-category dates and status
  startDate: string;
  endDate: string;
  status: string;
}

interface TreatmentFormData {
  patientId: string;
  patientName: string;
  name: string;
  description: string;
  status: string;
  // Dental checkup fields
  dentalCheckup: {
    oralHygiene: string;
    gingivalStatus: string;
    plaqueIndex: string;
    bleedingIndex: string;
    mobility: string;
    pocketDepth: string;
    notes: string;
  };
  // Diagnosis fields
  diagnosis: {
    chiefComplaint: string;
    clinicalFindings: string;
    diagnosis: string;
    treatmentPlan: string;
  };
  // Treatment plans
  treatmentPlans: TreatmentPlan[];
  // Dental issues
  dentalIssues?: number[];
  toothIssues?: { [toothNumber: number]: { issue: string; comment: string } };
}

const MobileTreatmentFormScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { treatmentId, patientId } = (route.params as { treatmentId?: string; patientId?: string }) || {};

  // Step management
  const [currentStep, setCurrentStep] = useState(1);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  
  // Form data
  const [formData, setFormData] = useState<TreatmentFormData>({
    patientId: patientId || '',
    patientName: '',
    name: '',
    description: '',
    status: 'pending',
    dentalCheckup: {
      oralHygiene: '',
      gingivalStatus: '',
      plaqueIndex: '',
      bleedingIndex: '',
      mobility: '',
      pocketDepth: '',
      notes: '',
    },
    diagnosis: {
      chiefComplaint: '',
      clinicalFindings: '',
      diagnosis: '',
      treatmentPlan: '',
    },
    dentalIssues: [],
    toothIssues: {}, // New structure: { toothNumber: { issue: string, comment: string } }
    treatmentPlans: [],
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [filteredPatients, setFilteredPatients] = useState<Patient[]>([]);
  const [showPatientModal, setShowPatientModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showTreatmentPlanModal, setShowTreatmentPlanModal] = useState(false);
  const [selectedPlanIndex, setSelectedPlanIndex] = useState<number | null>(null);
  const [planData, setPlanData] = useState<Partial<TreatmentPlan>>({});
  const [showDropdownModal, setShowDropdownModal] = useState(false);
  const [dropdownField, setDropdownField] = useState<string>('');
  const [dropdownOptions, setDropdownOptions] = useState<string[]>([]);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [categorySearchQuery, setCategorySearchQuery] = useState('');
  const [showAllCategories, setShowAllCategories] = useState(false);
  const [toothSystemType, setToothSystemType] = useState<'adult' | 'pediatric'>('adult');
  const [showToothIssueModal, setShowToothIssueModal] = useState(false);
  const [selectedTeeth, setSelectedTeeth] = useState<number[]>([]);
  const [toothIssue, setToothIssue] = useState('');
  const [toothComment, setToothComment] = useState('');
  const [isGroupEdit, setIsGroupEdit] = useState(false);

  // Steps configuration
  const steps = [
    { id: 1, title: 'Patient', icon: 'person', description: 'Select patient' },
    { id: 2, title: 'Diagnosis', icon: 'document-text', description: 'Clinical findings' },
    { id: 3, title: 'Treatment Plan', icon: 'list', description: 'Treatment plans' },
    { id: 4, title: 'Review', icon: 'checkmark-circle', description: 'Review & save' },
  ];

  // Dropdown options
  const dropdownOptionsMap = {
    oralHygiene: ['Good', 'Fair', 'Poor', 'Excellent'],
    gingivalStatus: ['Healthy', 'Mild Inflammation', 'Moderate Inflammation', 'Severe Inflammation'],
    mobility: ['None', 'Grade 1', 'Grade 2', 'Grade 3'],
  };

  // Tooth issue options
  const toothIssueOptions = [
    'Cavity',
    'Crown Needed',
    'Root Canal',
    'Extraction',
    'Filling',
    'Crack',
    'Sensitivity',
    'Gum Disease',
    'Other'
  ];

  // Treatment categories
  const treatmentCategories = [
    { _id: '1', name: 'Dental Checkup', baseCost: 500, description: 'Regular dental examination' },
    { _id: '2', name: 'Filling', baseCost: 1500, description: 'Tooth filling procedure' },
    { _id: '3', name: 'Extraction', baseCost: 2000, description: 'Tooth extraction' },
    { _id: '4', name: 'Root Canal', baseCost: 8000, description: 'Root canal treatment' },
    { _id: '5', name: 'Crown', baseCost: 12000, description: 'Dental crown placement' },
    { _id: '6', name: 'Cleaning', baseCost: 800, description: 'Professional dental cleaning' },
    { _id: '7', name: 'Bonding', baseCost: 2000, description: 'Dental bonding procedure' },
    { _id: '8', name: 'Veneers', baseCost: 15000, description: 'Dental veneers' },
    { _id: '9', name: 'Bridges', baseCost: 18000, description: 'Dental bridge placement' },
    { _id: '10', name: 'Implants', baseCost: 35000, description: 'Dental implant surgery' },
  ];

  // Tooth system data
  const adultToothSystem = {
    title: 'Adult Tooth System (FDI)',
    teeth: [
      { number: '18', position: { top: 20, left: 20 } },
      { number: '17', position: { top: 20, left: 60 } },
      { number: '16', position: { top: 20, left: 100 } },
      { number: '15', position: { top: 20, left: 140 } },
      { number: '14', position: { top: 20, left: 180 } },
      { number: '13', position: { top: 20, left: 220 } },
      { number: '12', position: { top: 20, left: 260 } },
      { number: '11', position: { top: 20, left: 300 } },
      { number: '21', position: { top: 20, left: 340 } },
      { number: '22', position: { top: 20, left: 380 } },
      { number: '23', position: { top: 20, left: 420 } },
      { number: '24', position: { top: 20, left: 460 } },
      { number: '25', position: { top: 20, left: 500 } },
      { number: '26', position: { top: 20, left: 540 } },
      { number: '27', position: { top: 20, left: 580 } },
      { number: '28', position: { top: 20, left: 620 } },
      { number: '48', position: { top: 200, left: 20 } },
      { number: '47', position: { top: 200, left: 60 } },
      { number: '46', position: { top: 200, left: 100 } },
      { number: '45', position: { top: 200, left: 140 } },
      { number: '44', position: { top: 200, left: 180 } },
      { number: '43', position: { top: 200, left: 220 } },
      { number: '42', position: { top: 200, left: 260 } },
      { number: '41', position: { top: 200, left: 300 } },
      { number: '31', position: { top: 200, left: 340 } },
      { number: '32', position: { top: 200, left: 380 } },
      { number: '33', position: { top: 200, left: 420 } },
      { number: '34', position: { top: 200, left: 460 } },
      { number: '35', position: { top: 200, left: 500 } },
      { number: '36', position: { top: 200, left: 540 } },
      { number: '37', position: { top: 200, left: 580 } },
      { number: '38', position: { top: 200, left: 620 } },
    ]
  };

  const pediatricToothSystem = {
    title: 'Pediatric Tooth System (FDI)',
    teeth: [
      { number: '55', position: { top: 20, left: 20 } },
      { number: '54', position: { top: 20, left: 60 } },
      { number: '53', position: { top: 20, left: 100 } },
      { number: '52', position: { top: 20, left: 140 } },
      { number: '51', position: { top: 20, left: 180 } },
      { number: '61', position: { top: 20, left: 220 } },
      { number: '62', position: { top: 20, left: 260 } },
      { number: '63', position: { top: 20, left: 300 } },
      { number: '64', position: { top: 20, left: 340 } },
      { number: '65', position: { top: 20, left: 380 } },
      { number: '75', position: { top: 200, left: 20 } },
      { number: '74', position: { top: 200, left: 60 } },
      { number: '73', position: { top: 200, left: 100 } },
      { number: '72', position: { top: 200, left: 140 } },
      { number: '71', position: { top: 200, left: 180 } },
      { number: '81', position: { top: 200, left: 220 } },
      { number: '82', position: { top: 200, left: 260 } },
      { number: '83', position: { top: 200, left: 300 } },
      { number: '84', position: { top: 200, left: 340 } },
      { number: '85', position: { top: 200, left: 380 } },
    ]
  };

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

  useEffect(() => {
    if (treatmentId) {
      fetchTreatment();
    }
    fetchPatients();
  }, [treatmentId]);

  useEffect(() => {
    if (searchQuery.trim()) {
      const filtered = patients.filter(patient => {
        const fullName = `${patient.firstName} ${patient.lastName}`.toLowerCase();
        const phone = patient.phone || '';
        const email = patient.email || '';
        const searchTerm = searchQuery.toLowerCase();
        
        return fullName.includes(searchTerm) || 
               phone.includes(searchTerm) || 
               email.includes(searchTerm);
      });
      setFilteredPatients(filtered);
    } else {
      setFilteredPatients(patients);
    }
  }, [searchQuery, patients]);

  const fetchTreatment = async () => {
    try {
      setIsLoading(true);
      const treatment = await api.getTreatment(treatmentId!);
      setFormData({
        ...treatment,
        cost: treatment.cost?.toString() || '',
        materialCost: treatment.materialCost?.toString() || '',
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
      const patientsData = await api.getPatients();
      setPatients(patientsData);
      setFilteredPatients(patientsData);
    } catch (error) {
      console.error('Error fetching patients:', error);
    }
  };

  const updateFormData = (field: string, value: any) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent as keyof TreatmentFormData],
          [child]: value,
        },
      }));
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
  };

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    switch (step) {
      case 1: // Patient & Basic Info
        if (!formData.patientId) {
          newErrors.patientId = 'Please select a patient';
        }
        break;
      case 2: // Diagnosis
        // All fields are optional - no validation needed
        break;
      case 3: // Treatment Plan
        if (formData.treatmentPlans.length === 0) {
          newErrors.treatmentPlans = 'At least one treatment plan is required';
        }
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCompletedSteps(prev => [...prev, currentStep]);
      setCurrentStep(prev => Math.min(prev + 1, steps.length));
    }
  };

  const handlePrevious = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleStepPress = (step: number) => {
    if (step <= currentStep || completedSteps.includes(step)) {
      setCurrentStep(step);
    }
  };

  const handleDropdownPress = (field: string) => {
    const options = dropdownOptionsMap[field as keyof typeof dropdownOptionsMap] || [];
    setDropdownField(field);
    setDropdownOptions(options);
    setShowDropdownModal(true);
  };

  const handleDropdownSelect = (value: string) => {
    if (dropdownField === 'toothIssue') {
      setToothIssue(value);
    } else {
      updateFormData(`dentalCheckup.${dropdownField}`, value);
    }
    setShowDropdownModal(false);
  };

  // Tooth selection management
  const handleToothPress = (tooth: number) => {
    const currentSelected = selectedTeeth || [];
    if (currentSelected.includes(tooth)) {
      // Remove from selection
      setSelectedTeeth(currentSelected.filter(t => t !== tooth));
    } else {
      // Add to selection
      setSelectedTeeth([...currentSelected, tooth]);
    }
  };

  const handleAddIssueDetails = () => {
    if (selectedTeeth.length === 0) return;
    
    // Check if all selected teeth have the same issue
    const firstToothIssue = formData.toothIssues?.[selectedTeeth[0]];
    if (selectedTeeth.length > 1 && firstToothIssue) {
      // Group edit - pre-fill with first tooth's data
      setToothIssue(firstToothIssue.issue);
      setToothComment(firstToothIssue.comment || '');
    } else {
      setToothIssue('');
      setToothComment('');
    }
    
    setIsGroupEdit(selectedTeeth.length > 1);
    setShowToothIssueModal(true);
  };

  const handleSaveToothIssue = () => {
    if (selectedTeeth.length > 0 && toothIssue) {
      const newToothIssues = { ...formData.toothIssues };
      
      // Apply issue to all selected teeth
      selectedTeeth.forEach(tooth => {
        newToothIssues[tooth] = {
          issue: toothIssue,
          comment: toothComment || '', // Comments are optional
        };
      });
      
      updateFormData('toothIssues', newToothIssues);
    }
    setShowToothIssueModal(false);
    setSelectedTeeth([]);
    setToothIssue('');
    setToothComment('');
    setIsGroupEdit(false);
  };

  const handleRemoveToothIssue = () => {
    if (selectedTeeth.length > 0) {
      const newToothIssues = { ...formData.toothIssues };
      
      // Remove issues from all selected teeth
      selectedTeeth.forEach(tooth => {
        delete newToothIssues[tooth];
      });
      
      updateFormData('toothIssues', newToothIssues);
    }
    setShowToothIssueModal(false);
    setSelectedTeeth([]);
    setToothIssue('');
    setToothComment('');
    setIsGroupEdit(false);
  };

  // Category management functions
  const filteredCategories = treatmentCategories.filter(category =>
    category.name.toLowerCase().includes(categorySearchQuery.toLowerCase()) ||
    category.description.toLowerCase().includes(categorySearchQuery.toLowerCase())
  );

  const displayedCategories = useMemo(() => {
    if (showAllCategories) {
      return filteredCategories;
    }
    return filteredCategories.slice(0, 6);
  }, [filteredCategories, showAllCategories]);

  const handleAddCategory = (categoryId: string) => {
    const category = treatmentCategories.find(c => c._id === categoryId);
    if (category) {
      const newCost = {
        categoryId: category._id,
        categoryName: category.name,
        baseCost: category.baseCost,
        quantity: 1,
        materialCost: 0,
        totalCost: category.baseCost,
      };
      
      setPlanData(prev => ({
        ...prev,
        costs: [...(prev.costs || []), newCost],
        selectedCategories: [...(prev.selectedCategories || []), categoryId],
      }));
    }
  };

  const handleRemoveCategory = (index: number) => {
    setPlanData(prev => {
      const newCosts = [...(prev.costs || [])];
      const removedCost = newCosts.splice(index, 1)[0];
      const newSelectedCategories = (prev.selectedCategories || []).filter(
        id => id !== removedCost.categoryId
      );
      return {
        ...prev,
        costs: newCosts,
        selectedCategories: newSelectedCategories,
      };
    });
  };

  const handleUpdateCost = (index: number, field: string, value: string | number) => {
    setPlanData(prev => {
      const newCosts = [...(prev.costs || [])];
      newCosts[index] = {
        ...newCosts[index],
        [field]: value,
        totalCost: field === 'quantity' || field === 'baseCost' || field === 'materialCost'
          ? (newCosts[index].baseCost * (field === 'quantity' ? value : newCosts[index].quantity)) + 
            (field === 'materialCost' ? value : newCosts[index].materialCost)
          : newCosts[index].totalCost,
      };
      return { ...prev, costs: newCosts };
    });
  };

  const handleSubmit = async () => {
    if (!validateStep(currentStep)) {
      return;
    }

    try {
      setIsLoading(true);
      const treatmentData = {
        ...formData,
        cost: parseFloat(formData.cost) || 0,
        materialCost: parseFloat(formData.materialCost) || 0,
      };

      if (treatmentId) {
        await api.updateTreatment(treatmentId, treatmentData);
      } else {
        await api.createTreatment(treatmentData);
      }

      Alert.alert('Success', 'Treatment saved successfully', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error) {
      console.error('Error saving treatment:', error);
      Alert.alert('Error', 'Failed to save treatment');
    } finally {
      setIsLoading(false);
    }
  };

  const renderStepIndicator = () => (
    <View style={styles.stepIndicator}>
      {steps.map((step) => (
        <TouchableOpacity
          key={step.id}
          style={[
            styles.stepItem,
            currentStep === step.id && styles.stepItemActive,
            completedSteps.includes(step.id) && styles.stepItemCompleted,
            step.id > currentStep && !completedSteps.includes(step.id) && styles.stepItemDisabled,
          ]}
          onPress={() => handleStepPress(step.id)}
        >
          <View style={[
            styles.stepIcon,
            currentStep === step.id && styles.stepIconActive,
            completedSteps.includes(step.id) && styles.stepIconCompleted,
          ]}>
            <Ionicons
              name={completedSteps.includes(step.id) ? 'checkmark' : step.icon as any}
              size={16}
              color={
                completedSteps.includes(step.id) || currentStep === step.id
                  ? theme.colors.white
                  : theme.colors.text.secondary
              }
            />
          </View>
          <Text style={[
            styles.stepTitle,
            currentStep === step.id && styles.stepTitleActive,
            completedSteps.includes(step.id) && styles.stepTitleCompleted,
          ]}>
            {step.title}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderPatientAndBasicInfoStep = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepDescription}>Select patient and enter basic treatment information</Text>

      {/* Patient Selection */}
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Patient *</Text>
        {formData.patientId ? (
          <Card style={styles.selectedPatientCard}>
            <View style={styles.selectedPatientInfo}>
              <View style={styles.patientIcon}>
                <Ionicons name="person" size={24} color={theme.colors.primary} />
              </View>
              <View style={styles.patientDetails}>
                <Text style={styles.patientName}>{formData.patientName}</Text>
                <Text style={styles.patientId}>ID: {formData.patientId}</Text>
              </View>
              <TouchableOpacity
                style={styles.changePatientButton}
                onPress={() => setShowPatientModal(true)}
              >
                <Text style={styles.changePatientText}>Change</Text>
              </TouchableOpacity>
            </View>
          </Card>
        ) : (
          <TouchableOpacity
            style={styles.selectPatientButton}
            onPress={() => setShowPatientModal(true)}
          >
            <Ionicons name="person-add" size={24} color={theme.colors.primary} />
            <Text style={styles.selectPatientText}>Select Patient</Text>
          </TouchableOpacity>
        )}
        {errors.patientId && (
          <Text style={styles.errorText}>{errors.patientId}</Text>
        )}
      </View>

      {/* Treatment Name */}
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Treatment Name</Text>
        <TextInput
          style={[styles.input, errors.name && styles.inputError]}
          value={formData.name}
          onChangeText={(value) => updateFormData('name', value)}
          placeholder="e.g., Root Canal Treatment (optional)"
        />
        {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
      </View>

      {/* Description */}
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Description</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={formData.description}
          onChangeText={(value) => updateFormData('description', value)}
          placeholder="Describe the treatment..."
          multiline
          numberOfLines={3}
        />
      </View>

      {/* Status */}
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Status</Text>
        <View style={styles.statusContainer}>
          {['pending', 'in-progress', 'completed', 'cancelled'].map((status) => (
            <TouchableOpacity
              key={status}
              style={[
                styles.statusOption,
                formData.status === status && styles.statusOptionSelected,
              ]}
              onPress={() => updateFormData('status', status)}
            >
              <Text style={[
                styles.statusText,
                formData.status === status && styles.statusTextSelected,
              ]}>
                {status.charAt(0).toUpperCase() + status.slice(1).replace('-', ' ')}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );

  const renderDiagnosisStep = () => (
    <View style={styles.stepContent}>
      <View style={styles.stepHeader}>
        <Text style={styles.stepDescription}>Record clinical findings and diagnosis</Text>
        <TouchableOpacity
          style={styles.skipButton}
          onPress={() => {
            setCompletedSteps(prev => [...prev, currentStep]);
            setCurrentStep(prev => Math.min(prev + 1, steps.length));
          }}
        >
          <Text style={styles.skipButtonText}>Skip This Section</Text>
        </TouchableOpacity>
      </View>
      
      {/* Dental Checkup Section */}
      <Card style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionIcon}>
            <Ionicons name="fitness" size={20} color={theme.colors.primary} />
          </View>
          <Text style={styles.sectionTitle}>Dental Checkup</Text>
        </View>
        
        <View style={styles.checkupGrid}>
          <View style={styles.checkupRow}>
            <View style={styles.checkupField}>
              <Text style={styles.inputLabel}>Oral Hygiene</Text>
              <TouchableOpacity 
                style={styles.dropdownContainer}
                onPress={() => handleDropdownPress('oralHygiene')}
              >
                <Text style={styles.dropdownText}>
                  {formData.dentalCheckup.oralHygiene || 'Select...'}
                </Text>
                <Ionicons name="chevron-down" size={16} color={theme.colors.text.secondary} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.checkupField}>
              <Text style={styles.inputLabel}>Gingival Status</Text>
              <TouchableOpacity 
                style={styles.dropdownContainer}
                onPress={() => handleDropdownPress('gingivalStatus')}
              >
                <Text style={styles.dropdownText}>
                  {formData.dentalCheckup.gingivalStatus || 'Select...'}
                </Text>
                <Ionicons name="chevron-down" size={16} color={theme.colors.text.secondary} />
              </TouchableOpacity>
            </View>
          </View>
          
          <View style={styles.checkupRow}>
            <View style={styles.checkupField}>
              <Text style={styles.inputLabel}>Plaque Index</Text>
              <TextInput
                style={styles.checkupInput}
                value={formData.dentalCheckup.plaqueIndex}
                onChangeText={(value) => updateFormData('dentalCheckup.plaqueIndex', value)}
                placeholder="0"
                keyboardType="numeric"
              />
            </View>
            
            <View style={styles.checkupField}>
              <Text style={styles.inputLabel}>Bleeding Index</Text>
              <TextInput
                style={styles.checkupInput}
                value={formData.dentalCheckup.bleedingIndex}
                onChangeText={(value) => updateFormData('dentalCheckup.bleedingIndex', value)}
                placeholder="0"
                keyboardType="numeric"
              />
            </View>
          </View>
          
          <View style={styles.checkupRow}>
            <View style={styles.checkupField}>
              <Text style={styles.inputLabel}>Mobility</Text>
              <TouchableOpacity 
                style={styles.dropdownContainer}
                onPress={() => handleDropdownPress('mobility')}
              >
                <Text style={styles.dropdownText}>
                  {formData.dentalCheckup.mobility || 'Select...'}
                </Text>
                <Ionicons name="chevron-down" size={16} color={theme.colors.text.secondary} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.checkupField}>
              <Text style={styles.inputLabel}>Pocket Depth (mm)</Text>
              <TextInput
                style={styles.checkupInput}
                value={formData.dentalCheckup.pocketDepth}
                onChangeText={(value) => updateFormData('dentalCheckup.pocketDepth', value)}
                placeholder="0"
                keyboardType="numeric"
              />
            </View>
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Notes</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={formData.dentalCheckup.notes}
              onChangeText={(value) => updateFormData('dentalCheckup.notes', value)}
              placeholder="Additional checkup notes..."
              multiline
              numberOfLines={3}
            />
          </View>
        </View>
      </Card>

      {/* Diagnosis Section */}
      <Card style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionIcon}>
            <Ionicons name="document-text" size={20} color={theme.colors.primary} />
          </View>
          <Text style={styles.sectionTitle}>Diagnosis</Text>
        </View>
        
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Chief Complaint</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={formData.diagnosis.chiefComplaint}
            onChangeText={(value) => updateFormData('diagnosis.chiefComplaint', value)}
            placeholder="What is the patient's main concern?"
            multiline
            numberOfLines={2}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Clinical Findings</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={formData.diagnosis.clinicalFindings}
            onChangeText={(value) => updateFormData('diagnosis.clinicalFindings', value)}
            placeholder="Describe what you observed during examination..."
            multiline
            numberOfLines={3}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Diagnosis</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={formData.diagnosis.diagnosis}
            onChangeText={(value) => updateFormData('diagnosis.diagnosis', value)}
            placeholder="Your clinical diagnosis..."
            multiline
            numberOfLines={2}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Treatment Plan</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={formData.diagnosis.treatmentPlan}
            onChangeText={(value) => updateFormData('diagnosis.treatmentPlan', value)}
            placeholder="General treatment approach..."
            multiline
            numberOfLines={3}
          />
        </View>
      </Card>

      {/* Dental Chart Section */}
      <Card style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionIcon}>
            <Ionicons name="grid" size={20} color={theme.colors.primary} />
          </View>
          <Text style={styles.sectionTitle}>Dental Chart</Text>
        </View>
        
        {/* Tooth System Selector */}
        <View style={styles.toothSystemSelector}>
          <TouchableOpacity
            style={[
              styles.toothSystemButton,
              toothSystemType === 'adult' && styles.toothSystemButtonSelected
            ]}
            onPress={() => setToothSystemType('adult')}
          >
            <Text style={[
              styles.toothSystemButtonText,
              toothSystemType === 'adult' && styles.toothSystemButtonTextSelected
            ]}>
              Adult (FDI)
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.toothSystemButton,
              toothSystemType === 'pediatric' && styles.toothSystemButtonSelected
            ]}
            onPress={() => setToothSystemType('pediatric')}
          >
            <Text style={[
              styles.toothSystemButtonText,
              toothSystemType === 'pediatric' && styles.toothSystemButtonTextSelected
            ]}>
              Pediatric (FDI)
            </Text>
          </TouchableOpacity>
        </View>
        
        <Text style={styles.chartDescription}>
          {toothSystemType === 'adult' 
            ? 'Two-digit system: First digit (1-4) represents quadrant, second digit (1-8) represents tooth number'
            : 'Two-digit system: First digit (5-8) represents quadrant, second digit (1-5) represents tooth number'
          }
        </Text>
        
        <View style={styles.dentalChart}>
          {toothSystemType === 'adult' ? (
            <View style={styles.quadrantChart}>
              {/* Quadrant 1 - Upper Right */}
              <View style={styles.quadrant}>
                <Text style={styles.quadrantLabel}>Quadrant 1</Text>
                <View style={styles.quadrantTeeth}>
                  {[18, 17, 16, 15, 14, 13, 12, 11].map((tooth) => (
                    <TouchableOpacity
                      key={tooth}
                      style={[
                        styles.toothButton,
                        (selectedTeeth?.includes(tooth) || formData.toothIssues?.[tooth]) && styles.toothButtonSelected
                      ]}
                      onPress={() => handleToothPress(tooth)}
                    >
                      <Text style={[
                        styles.toothText,
                        (selectedTeeth?.includes(tooth) || formData.toothIssues?.[tooth]) && styles.toothTextSelected
                      ]}>
                        {tooth}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Quadrant 2 - Upper Left */}
              <View style={styles.quadrant}>
                <Text style={styles.quadrantLabel}>Quadrant 2</Text>
                <View style={styles.quadrantTeeth}>
                  {[21, 22, 23, 24, 25, 26, 27, 28].map((tooth) => (
                    <TouchableOpacity
                      key={tooth}
                      style={[
                        styles.toothButton,
                        (selectedTeeth?.includes(tooth) || formData.toothIssues?.[tooth]) && styles.toothButtonSelected
                      ]}
                      onPress={() => handleToothPress(tooth)}
                    >
                      <Text style={[
                        styles.toothText,
                        (selectedTeeth?.includes(tooth) || formData.toothIssues?.[tooth]) && styles.toothTextSelected
                      ]}>
                        {tooth}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Quadrant 3 - Lower Left */}
              <View style={styles.quadrant}>
                <Text style={styles.quadrantLabel}>Quadrant 3</Text>
                <View style={styles.quadrantTeeth}>
                  {[31, 32, 33, 34, 35, 36, 37, 38].map((tooth) => (
                    <TouchableOpacity
                      key={tooth}
                      style={[
                        styles.toothButton,
                        (selectedTeeth?.includes(tooth) || formData.toothIssues?.[tooth]) && styles.toothButtonSelected
                      ]}
                      onPress={() => handleToothPress(tooth)}
                    >
                      <Text style={[
                        styles.toothText,
                        (selectedTeeth?.includes(tooth) || formData.toothIssues?.[tooth]) && styles.toothTextSelected
                      ]}>
                        {tooth}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Quadrant 4 - Lower Right */}
              <View style={styles.quadrant}>
                <Text style={styles.quadrantLabel}>Quadrant 4</Text>
                <View style={styles.quadrantTeeth}>
                  {[41, 42, 43, 44, 45, 46, 47, 48].map((tooth) => (
                    <TouchableOpacity
                      key={tooth}
                      style={[
                        styles.toothButton,
                        (selectedTeeth?.includes(tooth) || formData.toothIssues?.[tooth]) && styles.toothButtonSelected
                      ]}
                      onPress={() => handleToothPress(tooth)}
                    >
                      <Text style={[
                        styles.toothText,
                        (selectedTeeth?.includes(tooth) || formData.toothIssues?.[tooth]) && styles.toothTextSelected
                      ]}>
                        {tooth}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>
          ) : (
            <View style={styles.quadrantChart}>
              {/* Quadrant 5 - Upper Right (Pediatric) */}
              <View style={styles.quadrant}>
                <Text style={styles.quadrantLabel}>Quadrant 5</Text>
                <View style={styles.quadrantTeeth}>
                  {[55, 54, 53, 52, 51].map((tooth) => (
                    <TouchableOpacity
                      key={tooth}
                      style={[
                        styles.toothButton,
                        (selectedTeeth?.includes(tooth) || formData.toothIssues?.[tooth]) && styles.toothButtonSelected
                      ]}
                      onPress={() => handleToothPress(tooth)}
                    >
                      <Text style={[
                        styles.toothText,
                        (selectedTeeth?.includes(tooth) || formData.toothIssues?.[tooth]) && styles.toothTextSelected
                      ]}>
                        {tooth}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Quadrant 6 - Upper Left (Pediatric) */}
              <View style={styles.quadrant}>
                <Text style={styles.quadrantLabel}>Quadrant 6</Text>
                <View style={styles.quadrantTeeth}>
                  {[61, 62, 63, 64, 65].map((tooth) => (
                    <TouchableOpacity
                      key={tooth}
                      style={[
                        styles.toothButton,
                        (selectedTeeth?.includes(tooth) || formData.toothIssues?.[tooth]) && styles.toothButtonSelected
                      ]}
                      onPress={() => handleToothPress(tooth)}
                    >
                      <Text style={[
                        styles.toothText,
                        (selectedTeeth?.includes(tooth) || formData.toothIssues?.[tooth]) && styles.toothTextSelected
                      ]}>
                        {tooth}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Quadrant 7 - Lower Left (Pediatric) */}
              <View style={styles.quadrant}>
                <Text style={styles.quadrantLabel}>Quadrant 7</Text>
                <View style={styles.quadrantTeeth}>
                  {[71, 72, 73, 74, 75].map((tooth) => (
                    <TouchableOpacity
                      key={tooth}
                      style={[
                        styles.toothButton,
                        (selectedTeeth?.includes(tooth) || formData.toothIssues?.[tooth]) && styles.toothButtonSelected
                      ]}
                      onPress={() => handleToothPress(tooth)}
                    >
                      <Text style={[
                        styles.toothText,
                        (selectedTeeth?.includes(tooth) || formData.toothIssues?.[tooth]) && styles.toothTextSelected
                      ]}>
                        {tooth}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Quadrant 8 - Lower Right (Pediatric) */}
              <View style={styles.quadrant}>
                <Text style={styles.quadrantLabel}>Quadrant 8</Text>
                <View style={styles.quadrantTeeth}>
                  {[81, 82, 83, 84, 85].map((tooth) => (
                    <TouchableOpacity
                      key={tooth}
                      style={[
                        styles.toothButton,
                        (selectedTeeth?.includes(tooth) || formData.toothIssues?.[tooth]) && styles.toothButtonSelected
                      ]}
                      onPress={() => handleToothPress(tooth)}
                    >
                      <Text style={[
                        styles.toothText,
                        (selectedTeeth?.includes(tooth) || formData.toothIssues?.[tooth]) && styles.toothTextSelected
                      ]}>
                        {tooth}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>
          )}
        </View>
        
        {/* Add Issue Details Button */}
        {selectedTeeth && selectedTeeth.length > 0 && (
          <View style={styles.addIssueButtonContainer}>
            <View style={styles.buttonRow}>
              <Button
                title={`Add Issue Details ${selectedTeeth.length > 1 ? `(${selectedTeeth.length} teeth)` : `(Tooth ${selectedTeeth[0]})`}`}
                onPress={handleAddIssueDetails}
                style={[styles.addIssueButton, { flex: 1, marginRight: theme.spacing.sm }] as any}
              />
              <Button
                title="Clear"
                onPress={() => setSelectedTeeth([])}
                variant="outline"
                style={styles.clearButton}
              />
            </View>
          </View>
        )}
        
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Recorded Tooth Issues</Text>
          {Object.keys(formData.toothIssues || {}).length > 0 ? (
            <View style={styles.toothIssuesList}>
              {Object.entries(formData.toothIssues || {}).map(([tooth, issueData]) => {
                const toothIssue = issueData as { issue: string; comment: string };
                return (
                <View key={tooth} style={styles.toothIssueItem}>
                  <View style={styles.toothIssueHeader}>
                    <Text style={styles.toothIssueTooth}>Tooth {tooth}</Text>
                    <Text style={styles.toothIssueType}>{toothIssue.issue}</Text>
                  </View>
                  {toothIssue.comment && (
                    <Text style={styles.toothIssueComment}>{toothIssue.comment}</Text>
                  )}
                </View>
                );
              })}
            </View>
          ) : (
            <Text style={styles.noIssuesText}>No tooth issues recorded</Text>
          )}
        </View>
      </Card>
    </View>
  );

  const renderTreatmentPlanStep = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepDescription}>Create detailed treatment plans with costs</Text>
      
      {formData.treatmentPlans.length === 0 ? (
        <View style={styles.emptyPlansContainer}>
          <Ionicons name="list" size={48} color={theme.colors.text.secondary} />
          <Text style={styles.emptyPlansText}>No treatment plans yet</Text>
          <Text style={styles.emptyPlansSubtext}>Add your first treatment plan to get started</Text>
        </View>
      ) : (
        <View style={styles.plansList}>
          {formData.treatmentPlans.map((plan, index) => (
            <Card key={index} style={styles.planCard}>
              <View style={styles.planHeader}>
                <View style={styles.planInfo}>
                  <Text style={styles.planName}>{plan.name}</Text>
                  <Text style={styles.planDescription}>{plan.description}</Text>
                </View>
                <View style={styles.planActions}>
                  <TouchableOpacity
                    style={styles.planActionButton}
                    onPress={() => {
                      setSelectedPlanIndex(index);
                      setPlanData(plan);
                      setShowTreatmentPlanModal(true);
                    }}
                  >
                    <Ionicons name="create" size={16} color={theme.colors.primary} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.planActionButton}
                    onPress={() => {
                      const newPlans = formData.treatmentPlans.filter((_, i) => i !== index);
                      updateFormData('treatmentPlans', newPlans);
                    }}
                  >
                    <Ionicons name="trash" size={16} color={theme.colors.error} />
                  </TouchableOpacity>
                </View>
              </View>
              <View style={styles.planMeta}>
                <Text style={styles.planCost}>₹{plan.totalCost || 0}</Text>
                <Text style={styles.planStatus}>{plan.status}</Text>
              </View>
            </Card>
          ))}
        </View>
      )}

      <TouchableOpacity
        style={styles.addPlanButton}
        onPress={() => {
          setSelectedPlanIndex(null);
          setPlanData({});
          setShowTreatmentPlanModal(true);
        }}
      >
        <Ionicons name="add" size={20} color={theme.colors.white} />
        <Text style={styles.addPlanText}>Add Treatment Plan</Text>
      </TouchableOpacity>

      {errors.treatmentPlans && (
        <Text style={styles.errorText}>{errors.treatmentPlans}</Text>
      )}
    </View>
  );

  const renderReviewStep = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepDescription}>Review all information before saving</Text>

      <Card style={styles.reviewCard}>
        <Text style={styles.reviewTitle}>Treatment Summary</Text>

        <View style={styles.reviewSection}>
          <Text style={styles.reviewLabel}>Patient</Text>
          <Text style={styles.reviewValue}>{formData.patientName}</Text>
        </View>

        {formData.name && (
          <View style={styles.reviewSection}>
            <Text style={styles.reviewLabel}>Treatment Name</Text>
            <Text style={styles.reviewValue}>{formData.name}</Text>
          </View>
        )}

        {formData.description && (
          <View style={styles.reviewSection}>
            <Text style={styles.reviewLabel}>Description</Text>
            <Text style={styles.reviewValue}>{formData.description}</Text>
          </View>
        )}

        <View style={styles.reviewSection}>
          <Text style={styles.reviewLabel}>Status</Text>
          <Text style={styles.reviewValue}>{formData.status}</Text>
        </View>

        <View style={styles.reviewSection}>
          <Text style={styles.reviewLabel}>Chief Complaint</Text>
          <Text style={styles.reviewValue}>{formData.diagnosis.chiefComplaint || 'Not specified'}</Text>
        </View>

        <View style={styles.reviewSection}>
          <Text style={styles.reviewLabel}>Diagnosis</Text>
          <Text style={styles.reviewValue}>{formData.diagnosis.diagnosis || 'Not specified'}</Text>
        </View>

        <View style={styles.reviewSection}>
          <Text style={styles.reviewLabel}>Treatment Plans</Text>
          <Text style={styles.reviewValue}>{formData.treatmentPlans.length} plan(s)</Text>
        </View>

        {formData.dentalIssues && formData.dentalIssues.length > 0 && (
          <View style={styles.reviewSection}>
            <Text style={styles.reviewLabel}>Dental Issues</Text>
            <Text style={styles.reviewValue}>Teeth: {formData.dentalIssues.join(', ')}</Text>
          </View>
        )}
      </Card>
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
          <TouchableOpacity
            style={styles.modalCloseButton}
            onPress={() => setShowPatientModal(false)}
          >
            <Ionicons name="close" size={24} color={theme.colors.text.primary} />
          </TouchableOpacity>
        </View>
        
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search patients..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        
        {filteredPatients.length === 0 ? (
          <View style={styles.emptyPatientsContainer}>
            <Ionicons name="person-outline" size={48} color={theme.colors.text.secondary} />
            <Text style={styles.emptyPatientsText}>
              {searchQuery ? 'No patients found' : 'No patients available'}
            </Text>
            <Text style={styles.emptyPatientsSubtext}>
              {searchQuery ? 'Try a different search term' : 'Add patients first to create treatments'}
            </Text>
          </View>
        ) : (
          <FlatList
            data={filteredPatients}
            keyExtractor={(item) => item._id}
            renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.patientItem}
              onPress={() => {
                updateFormData('patientId', item._id);
                updateFormData('patientName', `${item.firstName} ${item.lastName}`);
                setShowPatientModal(false);
                setSearchQuery('');
              }}
            >
              <View style={styles.patientItemIcon}>
                <Ionicons name="person" size={20} color={theme.colors.primary} />
              </View>
              <View style={styles.patientItemInfo}>
                <Text style={styles.patientItemName}>
                  {item.firstName} {item.lastName}
                </Text>
                <Text style={styles.patientItemPhone}>{item.phone}</Text>
              </View>
            </TouchableOpacity>
          )}
          />
        )}
      </SafeAreaView>
    </Modal>
  );

  const renderDropdownModal = () => (
    <Modal
      visible={showDropdownModal}
      transparent
      animationType="slide"
      onRequestClose={() => setShowDropdownModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select {dropdownField === 'oralHygiene' ? 'Oral Hygiene' : dropdownField === 'gingivalStatus' ? 'Gingival Status' : 'Mobility'}</Text>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowDropdownModal(false)}
            >
              <Ionicons name="close" size={24} color={theme.colors.text.secondary} />
            </TouchableOpacity>
          </View>
          
          <FlatList
            data={dropdownOptions}
            keyExtractor={(item) => item}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.dropdownOption}
                onPress={() => handleDropdownSelect(item)}
              >
                <Text style={styles.dropdownOptionText}>{item}</Text>
                {formData.dentalCheckup?.[dropdownField as keyof typeof formData.dentalCheckup] === item && (
                  <Ionicons name="checkmark" size={20} color={theme.colors.primary} />
                )}
              </TouchableOpacity>
            )}
            style={styles.dropdownList}
          />
        </View>
      </View>
    </Modal>
  );

  const renderToothIssueModal = () => (
    <Modal
      visible={showToothIssueModal}
      transparent
      animationType="slide"
      onRequestClose={() => setShowToothIssueModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {isGroupEdit 
                ? `${selectedTeeth.length} Teeth - Issue Details` 
                : `Tooth ${selectedTeeth[0]} - Issue Details`
              }
            </Text>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowToothIssueModal(false)}
            >
              <Ionicons name="close" size={24} color={theme.colors.text.secondary} />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalBody}>
            {/* Selected Teeth Display */}
            <View style={styles.selectedTeethContainer}>
              <Text style={styles.selectedTeethLabel}>Selected Teeth:</Text>
              <View style={styles.selectedTeethList}>
                {selectedTeeth.map(tooth => (
                  <View key={tooth} style={styles.selectedToothTag}>
                    <Text style={styles.selectedToothText}>{tooth}</Text>
                  </View>
                ))}
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Issue Type *</Text>
              <TouchableOpacity
                style={styles.dropdownButton}
                onPress={() => {
                  setDropdownField('toothIssue');
                  setDropdownOptions(toothIssueOptions);
                  setShowDropdownModal(true);
                }}
              >
                <Text style={[styles.dropdownButtonText, toothIssue && styles.dropdownButtonTextSelected]}>
                  {toothIssue || 'Select issue type'}
                </Text>
                <Ionicons name="chevron-down" size={20} color={theme.colors.text.secondary} />
              </TouchableOpacity>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Comments (Optional)</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={toothComment}
                onChangeText={setToothComment}
                placeholder="Add comments about this tooth issue (optional)..."
                placeholderTextColor={theme.colors.text.secondary}
                multiline
                numberOfLines={3}
              />
            </View>
          </ScrollView>

          <View style={styles.modalActions}>
            <Button
              title="Remove Issue"
              onPress={handleRemoveToothIssue}
              variant="outline"
              style={styles.modalButton}
            />
            <Button
              title="Skip"
              onPress={() => setShowToothIssueModal(false)}
              variant="outline"
              style={styles.modalButton}
            />
            <Button
              title="Save Issue"
              onPress={handleSaveToothIssue}
              disabled={!toothIssue}
              style={styles.modalButton}
            />
          </View>
        </View>
      </View>
    </Modal>
  );

  const renderCategoryModal = () => (
    <Modal
      visible={showCategoryModal}
      animationType="slide"
      presentationStyle="fullScreen"
    >
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Select Treatment Categories</Text>
          <TouchableOpacity
            style={styles.modalCloseButton}
            onPress={() => setShowCategoryModal(false)}
          >
            <Ionicons name="close" size={24} color={theme.colors.text.primary} />
          </TouchableOpacity>
        </View>
        
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search categories..."
            value={categorySearchQuery}
            onChangeText={setCategorySearchQuery}
          />
        </View>
        
        <ScrollView style={styles.modalContent}>
          {filteredCategories
            .filter(category => !planData.selectedCategories?.includes(category._id))
            .map(category => (
              <TouchableOpacity
                key={category._id}
                style={styles.categoryItem}
                onPress={() => {
                  handleAddCategory(category._id);
                  setShowCategoryModal(false);
                }}
              >
                <View style={styles.categoryInfo}>
                  <Text style={styles.categoryName}>{category.name}</Text>
                  <Text style={styles.categoryDescription}>{category.description}</Text>
                </View>
                <View style={styles.categoryCost}>
                  <Text style={styles.categoryCostText}>₹{category.baseCost}</Text>
                </View>
              </TouchableOpacity>
            ))}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );

  const renderTreatmentPlanModal = () => (
    <Modal
      visible={showTreatmentPlanModal}
      animationType="slide"
      presentationStyle="fullScreen"
    >
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>
            {selectedPlanIndex !== null ? 'Edit Treatment Plan' : 'Add Treatment Plan'}
          </Text>
          <TouchableOpacity
            style={styles.modalCloseButton}
            onPress={() => setShowTreatmentPlanModal(false)}
          >
            <Ionicons name="close" size={24} color={theme.colors.text.primary} />
          </TouchableOpacity>
        </View>
        
        <ScrollView style={styles.modalContent}>
          <View style={styles.treatmentPlanContainer}>
            <Text style={styles.sectionTitle}>Treatment Plan</Text>
            
            {/* Name Field */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Name (Optional)</Text>
              <TextInput
                style={styles.input}
                value={planData.name || ''}
                onChangeText={(value) => setPlanData(prev => ({...prev, name: value}))}
                placeholder="Enter treatment plan name (optional)"
              />
            </View>

            {/* Start Date */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Start Date</Text>
              <TextInput
                style={styles.input}
                value={planData.startDate || ''}
                onChangeText={(value) => setPlanData(prev => ({...prev, startDate: value}))}
                placeholder="YYYY-MM-DD"
              />
            </View>

            {/* End Date */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>End Date</Text>
              <TextInput
                style={styles.input}
                value={planData.endDate || ''}
                onChangeText={(value) => setPlanData(prev => ({...prev, endDate: value}))}
                placeholder="YYYY-MM-DD"
              />
            </View>

            {/* Status */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Status</Text>
              <View style={styles.statusContainer}>
                {['pending', 'in-progress', 'completed', 'cancelled'].map((status) => (
                  <TouchableOpacity
                    key={status}
                    style={[
                      styles.statusOption,
                      (planData.status || 'pending') === status && styles.statusOptionSelected,
                    ]}
                    onPress={() => setPlanData(prev => ({...prev, status}))}
                  >
                    <Text style={[
                      styles.statusText,
                      (planData.status || 'pending') === status && styles.statusTextSelected,
                    ]}>
                      {status.charAt(0).toUpperCase() + status.slice(1).replace('-', ' ')}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Treatment Categories */}
            <View style={styles.inputGroup}>
              <Text style={styles.sectionTitle}>Treatment Categories</Text>
              
              <Text style={styles.instructionText}>
                Select treatment categories to add them as cost rows below.
              </Text>

              {/* Quick Add Categories */}
              <View style={styles.quickAddContainer}>
                <View style={styles.quickAddHeader}>
                  <Text style={styles.quickAddTitle}>Add Treatments</Text>
                  <View style={styles.searchContainer}>
                    <Ionicons name="search" size={16} color={theme.colors.text.secondary} />
                    <TextInput
                      style={styles.searchInput}
                      value={categorySearchQuery}
                      onChangeText={setCategorySearchQuery}
                      placeholder="Search treatments..."
                      placeholderTextColor={theme.colors.text.secondary}
                    />
                    {categorySearchQuery.length > 0 && (
                      <TouchableOpacity onPress={() => setCategorySearchQuery('')}>
                        <Ionicons name="close-circle" size={16} color={theme.colors.text.secondary} />
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
                
                <View style={styles.quickAddGrid}>
                  {displayedCategories.map(category => (
                    <TouchableOpacity
                      key={category._id}
                      style={styles.quickAddItem}
                      onPress={() => handleAddCategory(category._id)}
                    >
                      <View style={styles.quickAddIcon}>
                        <Ionicons name="add-circle" size={20} color={theme.colors.primary} />
                      </View>
                      <Text style={styles.quickAddName} numberOfLines={1}>
                        {category.name}
                      </Text>
                      <Text style={styles.quickAddCost}>₹{category.baseCost}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                
                {filteredCategories.length === 0 && categorySearchQuery.length > 0 && (
                  <View style={styles.noResultsContainer}>
                    <Ionicons name="search" size={24} color={theme.colors.text.secondary} />
                    <Text style={styles.noResultsText}>No treatments found for "{categorySearchQuery}"</Text>
                  </View>
                )}
                
                {filteredCategories.length > 6 && !showAllCategories && (
                  <TouchableOpacity
                    style={styles.viewAllButton}
                    onPress={() => setShowAllCategories(true)}
                  >
                    <Ionicons name="chevron-down" size={16} color={theme.colors.primary} />
                    <Text style={styles.viewAllButtonText}>
                      Show All ({filteredCategories.length} treatments)
                    </Text>
                  </TouchableOpacity>
                )}
                
                {showAllCategories && filteredCategories.length > 6 && (
                  <TouchableOpacity
                    style={styles.viewAllButton}
                    onPress={() => setShowAllCategories(false)}
                  >
                    <Ionicons name="chevron-up" size={16} color={theme.colors.primary} />
                    <Text style={styles.viewAllButtonText}>Show Less</Text>
                  </TouchableOpacity>
                )}
              </View>

              {(!planData.costs || planData.costs.length === 0) ? (
                <View style={styles.emptyCostsContainer}>
                  <View style={styles.emptyCostsIcon}>
                    <Ionicons name="clipboard-outline" size={32} color={theme.colors.text.secondary} />
                  </View>
                  <Text style={styles.emptyCostsTitle}>No Categories Added</Text>
                  <Text style={styles.emptyCostsText}>
                    Tap on any category above to add it to your treatment plan
                  </Text>
                </View>
              ) : (
                <View style={styles.costsList}>
                  <Text style={styles.costsListTitle}>Added Categories ({planData.costs.length})</Text>
                  {planData.costs.map((cost, index) => (
                    <Card key={index} style={styles.costCard}>
                      <View style={styles.costRowHeader}>
                        <Text style={styles.costCategoryName}>{cost.categoryName}</Text>
                        <TouchableOpacity
                          style={styles.removeCostButton}
                          onPress={() => handleRemoveCategory(index)}
                        >
                          <Ionicons name="close" size={16} color={theme.colors.error} />
                        </TouchableOpacity>
                      </View>
                      
                      <View style={styles.costRowContent}>
                        <View style={styles.costFieldBase}>
                          <Text style={styles.costLabel}>Base Cost</Text>
                          <TextInput
                            style={styles.costInput}
                            value={cost.baseCost.toString()}
                            onChangeText={(value) => handleUpdateCost(index, 'baseCost', parseFloat(value) || 0)}
                            keyboardType="numeric"
                          />
                        </View>
                        
                        <View style={styles.costFieldQty}>
                          <Text style={styles.costLabel}>Qty</Text>
                          <View style={styles.quantityContainer}>
                            <TouchableOpacity
                              style={styles.quantityButton}
                              onPress={() => handleUpdateCost(index, 'quantity', Math.max(1, cost.quantity - 1))}
                            >
                              <Ionicons name="remove" size={16} color={theme.colors.primary} />
                            </TouchableOpacity>
                            <TextInput
                              style={styles.quantityInput}
                              value={cost.quantity.toString()}
                              onChangeText={(value) => handleUpdateCost(index, 'quantity', parseInt(value) || 1)}
                              keyboardType="numeric"
                            />
                            <TouchableOpacity
                              style={styles.quantityButton}
                              onPress={() => handleUpdateCost(index, 'quantity', cost.quantity + 1)}
                            >
                              <Ionicons name="add" size={16} color={theme.colors.primary} />
                            </TouchableOpacity>
                          </View>
                        </View>
                      </View>
                      
                      <View style={styles.costFieldMaterialFull}>
                        <Text style={styles.costLabel}>Material Cost</Text>
                        <TextInput
                          style={styles.costInputFull}
                          value={cost.materialCost.toString()}
                          onChangeText={(value) => handleUpdateCost(index, 'materialCost', parseFloat(value) || 0)}
                          keyboardType="numeric"
                        />
                      </View>
                      
                      <View style={styles.costTotal}>
                        <Text style={styles.costTotalLabel}>Total: ₹{cost.totalCost}</Text>
                      </View>
                    </Card>
                  ))}
                </View>
              )}

              {/* Total Cost Summary */}
              {planData.costs && planData.costs.length > 0 && (
                <View style={styles.totalCostSummary}>
                  <View style={styles.totalCostHeader}>
                    <Text style={styles.totalCostTitle}>Treatment Cost Summary</Text>
                  </View>
                  
                  <View style={styles.totalCostBreakdown}>
                    {planData.costs.map((cost, index) => (
                      <View key={index} style={styles.totalCostRow}>
                        <Text style={styles.totalCostItemName}>
                          {cost.categoryName} (×{cost.quantity})
                        </Text>
                        <Text style={styles.totalCostItemValue}>₹{cost.totalCost}</Text>
                      </View>
                    ))}
                  </View>
                  
                  <View style={styles.totalCostDivider} />
                  
                  <View style={styles.totalCostFinal}>
                    <Text style={styles.totalCostFinalLabel}>Total Treatment Cost</Text>
                    <Text style={styles.totalCostFinalValue}>
                      ₹{planData.costs.reduce((sum, cost) => sum + cost.totalCost, 0)}
                    </Text>
                  </View>
                </View>
              )}
            </View>

            {/* Action Buttons */}
            <View style={styles.modalActions}>
              <Button
                title="Cancel"
                onPress={() => setShowTreatmentPlanModal(false)}
                variant="outline"
                style={styles.modalButton}
              />
              <Button
                title={selectedPlanIndex !== null ? 'Update' : 'Add'}
                onPress={() => {
                  if (selectedPlanIndex !== null) {
                    // Edit existing plan
                    const newPlans = [...formData.treatmentPlans];
                    newPlans[selectedPlanIndex] = planData as any;
                    updateFormData('treatmentPlans', newPlans);
                  } else {
                    // Add new plan
                    updateFormData('treatmentPlans', [...formData.treatmentPlans, planData as any]);
                  }
                  setShowTreatmentPlanModal(false);
                  setSelectedPlanIndex(null);
                  setPlanData({});
                }}
                style={styles.modalButton}
              />
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1:
        return renderPatientAndBasicInfoStep();
      case 2:
        return renderDiagnosisStep();
      case 3:
        return renderTreatmentPlanStep();
      case 4:
        return renderReviewStep();
      default:
        return null;
    }
  };

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
          {renderStepIndicator()}
          {renderCurrentStep()}
        </ScrollView>
        
        {renderPatientModal()}
        {renderDropdownModal()}
        {renderToothIssueModal()}
        {renderCategoryModal()}
        {renderTreatmentPlanModal()}
        
        <View style={styles.navigationContainer}>
          <View style={styles.navigationButtons}>
            {currentStep > 1 && (
              <Button
                title="Previous"
                onPress={handlePrevious}
                variant="outline"
                style={styles.navButton}
              />
            )}
            
            <View style={styles.navButtonSpacer} />
            
            {currentStep < steps.length ? (
              <Button
                title="Next"
                onPress={handleNext}
                style={styles.navButton}
              />
            ) : (
              <Button
                title="Save Treatment"
                onPress={handleSubmit}
                style={styles.navButton}
                loading={isLoading}
              />
            )}
          </View>
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
  
  // Step Indicator
  stepIndicator: {
    flexDirection: 'row',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.lg,
    backgroundColor: theme.colors.white,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  stepItem: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: theme.spacing.xs,
  },
  stepItemActive: {
    // Active step styling
  },
  stepItemCompleted: {
    // Completed step styling
  },
  stepItemDisabled: {
    opacity: 0.5,
  },
  stepIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
  },
  stepIconActive: {
    backgroundColor: theme.colors.primary,
  },
  stepIconCompleted: {
    backgroundColor: theme.colors.success,
  },
  stepTitle: {
    fontSize: 12,
    fontWeight: '500',
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },
  stepTitleActive: {
    color: theme.colors.primary,
  },
  stepTitleCompleted: {
    color: theme.colors.success,
  },
  
  // Step Content
  stepContent: {
    padding: theme.spacing.lg,
  },
  stepDescription: {
    fontSize: 16,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.lg,
    textAlign: 'center',
  },
  
  // Input Styles
  inputGroup: {
    marginBottom: theme.spacing.lg,
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
    minHeight: 100,
    textAlignVertical: 'top',
    includeFontPadding: false,
  },
  row: {
    flexDirection: 'row',
    // gap property not supported in React Native StyleSheet
    },
  halfWidth: {
    flex: 1,
  },
  errorText: {
    fontSize: 12,
    color: theme.colors.error,
    marginTop: theme.spacing.xs,
  },
  
  // Patient Selection
  selectedPatientCard: {
    marginBottom: theme.spacing.md,
  },
  selectedPatientInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  patientIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  patientDetails: {
    flex: 1,
  },
  patientName: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  patientId: {
    fontSize: 14,
    color: theme.colors.text.secondary,
  },
  changePatientButton: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    backgroundColor: theme.colors.primary + '20',
    borderRadius: theme.spacing.borderRadius.sm,
  },
  changePatientText: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.primary,
  },
  selectPatientButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.lg,
    borderWidth: 2,
    borderColor: theme.colors.primary,
    borderStyle: 'dashed',
    borderRadius: theme.spacing.borderRadius.md,
    backgroundColor: theme.colors.primary + '10',
  },
  selectPatientText: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.primary,
    marginLeft: theme.spacing.sm,
  },
  
  // Status Selection
  statusContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    // gap property not supported in React Native StyleSheet
    },
  statusOption: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.spacing.borderRadius.sm,
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  statusOptionSelected: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  statusText: {
    fontSize: 14,
    color: theme.colors.text.secondary,
  },
  statusTextSelected: {
    color: theme.colors.white,
  },
  
  // Treatment Plans
  emptyPlansContainer: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xl,
  },
  emptyPlansText: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.text.primary,
    marginTop: theme.spacing.md,
  },
  emptyPlansSubtext: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    marginTop: theme.spacing.xs,
    textAlign: 'center',
  },
  plansList: {
    marginBottom: theme.spacing.lg,
  },
  planCard: {
    marginBottom: theme.spacing.md,
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  planInfo: {
    flex: 1,
  },
  planName: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  planDescription: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    marginTop: theme.spacing.xs,
  },
  planActions: {
    flexDirection: 'row',
    // gap property not supported in React Native StyleSheet
    },
  planActionButton: {
    padding: theme.spacing.sm,
    borderRadius: theme.spacing.borderRadius.sm,
    backgroundColor: theme.colors.background,
  },
  planMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: theme.spacing.sm,
  },
  planCost: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.primary,
  },
  planStatus: {
    fontSize: 12,
    color: theme.colors.text.secondary,
    textTransform: 'capitalize',
  },
  addPlanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.md,
    backgroundColor: theme.colors.primary,
    borderRadius: theme.spacing.borderRadius.md,
  },
  addPlanText: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.white,
    marginLeft: theme.spacing.sm,
  },
  
  // Review
  reviewCard: {
    marginBottom: theme.spacing.lg,
  },
  reviewTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.lg,
  },
  reviewSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  reviewLabel: {
    fontSize: 14,
    color: theme.colors.text.secondary,
  },
  reviewValue: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.text.primary,
  },
  
  // Navigation
  navigationContainer: {
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.white,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  navigationButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  navButton: {
    flex: 1,
  },
  navButtonSpacer: {
    width: theme.spacing.md,
  },
  
  // Modal Styles
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
    backgroundColor: theme.colors.white,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  modalCloseButton: {
    padding: theme.spacing.sm,
  },
  modalContent: {
    flex: 1,
  },
  searchContainer: {
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.white,
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
    backgroundColor: theme.colors.background,
    includeFontPadding: false,
    textAlignVertical: 'center',
    minHeight: 20,
  },
  patientItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    backgroundColor: theme.colors.white,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  patientItemIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  patientItemInfo: {
    flex: 1,
  },
  patientItemName: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.text.primary,
  },
  patientItemPhone: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    marginTop: theme.spacing.xs,
  },
  emptyPatientsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: theme.spacing.xl,
  },
  emptyPatientsText: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.text.primary,
    marginTop: theme.spacing.md,
  },
  emptyPatientsSubtext: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    marginTop: theme.spacing.xs,
    textAlign: 'center',
    paddingHorizontal: theme.spacing.lg,
  },
  
  // Diagnosis Section Styles
  stepHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  skipButton: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    backgroundColor: theme.colors.background,
    borderRadius: theme.spacing.borderRadius.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  skipButtonText: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    fontWeight: '500',
  },
  sectionCard: {
    marginBottom: theme.spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  sectionIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  checkupGrid: {
    // gap property not supported in React Native StyleSheet
    },
  checkupRow: {
    flexDirection: 'row',
    // gap property not supported in React Native StyleSheet
    },
  checkupField: {
    flex: 1,
  },
  checkupInput: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.spacing.borderRadius.sm,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.sm,
    fontSize: 14,
    color: theme.colors.text.primary,
    backgroundColor: theme.colors.white,
    includeFontPadding: false,
    textAlignVertical: 'center',
    minHeight: 20,
    textAlign: 'center',
  },
  dropdownContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.spacing.borderRadius.sm,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.sm,
    backgroundColor: theme.colors.white,
    minHeight: 40,
  },
  dropdownText: {
    fontSize: 14,
    color: theme.colors.text.primary,
  },
  chartDescription: {
    fontSize: 12,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.md,
    textAlign: 'center',
  },
  dentalChart: {
    marginBottom: theme.spacing.lg,
  },
  toothRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    // gap property not supported in React Native StyleSheet
    marginBottom: theme.spacing.sm,
  },
  toothButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderColor: theme.colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 1,
  },
  toothButtonSelected: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  toothText: {
    fontSize: 12,
    fontWeight: '500',
    color: theme.colors.text.secondary,
  },
  toothTextSelected: {
    color: theme.colors.white,
  },
  
  // Dropdown Modal Styles
  dropdownOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  dropdownOptionText: {
    fontSize: 16,
    color: theme.colors.text.primary,
  },
  dropdownList: {
    maxHeight: 300,
  },
  
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.spacing.borderRadius.lg,
    width: '90%',
    maxHeight: '80%',
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  modalCloseButton: {
    padding: theme.spacing.sm,
  },
  
  // Treatment Plan Modal Styles
  treatmentPlanContainer: {
    padding: theme.spacing.lg,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: theme.spacing.xl,
    // gap property not supported in React Native StyleSheet
    },
  modalButton: {
    flex: 1,
  },
  
  // Category Selection Styles
  addCategoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    backgroundColor: theme.colors.primary + '20',
    borderRadius: theme.spacing.borderRadius.sm,
  },
  addCategoryText: {
    color: theme.colors.primary,
    fontWeight: '500',
    marginLeft: theme.spacing.xs,
  },
  costsList: {
    marginTop: theme.spacing.md,
  },
  costCard: {
    marginBottom: theme.spacing.md,
    padding: theme.spacing.md,
    backgroundColor: theme.colors.white,
    borderRadius: theme.spacing.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  costHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  costCategoryName: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  removeCostButton: {
    padding: theme.spacing.xs,
  },
  costRow: {
    flexDirection: 'row',
    // gap property not supported in React Native StyleSheet
    marginBottom: theme.spacing.sm,
  },
  costField: {
    flex: 1,
  },
  costLabel: {
    fontSize: 12,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.xs,
  },
  costInput: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.spacing.borderRadius.sm,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.sm,
    fontSize: 14,
    color: theme.colors.text.primary,
    backgroundColor: theme.colors.white,
    includeFontPadding: false,
    textAlignVertical: 'center',
    minHeight: 40,
  },
  costTotal: {
    alignItems: 'flex-end',
    marginTop: theme.spacing.sm,
  },
  costTotalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.primary,
  },
  emptyCategories: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xl,
  },
  emptyCategoriesText: {
    fontSize: 16,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.xs,
  },
  emptyCategoriesSubtext: {
    fontSize: 14,
    color: theme.colors.text.secondary,
  },
  
  // Category Modal Styles
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  categoryInfo: {
    flex: 1,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  categoryDescription: {
    fontSize: 14,
    color: theme.colors.text.secondary,
  },
  categoryCost: {
    alignItems: 'flex-end',
  },
  categoryCostText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.primary,
  },
  
  // Advanced Category Selection Styles
  instructionText: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.lg,
    textAlign: 'center',
  },
  quickAddContainer: {
    marginBottom: theme.spacing.lg,
  },
  quickAddHeader: {
    marginBottom: theme.spacing.md,
  },
  quickAddTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
  },
  quickAddGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    // gap property not supported in React Native StyleSheet
    },
  quickAddItem: {
    width: '48%',
    backgroundColor: theme.colors.white,
    borderRadius: theme.spacing.borderRadius.md,
    padding: theme.spacing.sm,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
    minHeight: 80,
    justifyContent: 'center',
  },
  quickAddIcon: {
    marginBottom: theme.spacing.xs,
  },
  quickAddName: {
    fontSize: 12,
    fontWeight: '500',
    color: theme.colors.text.primary,
    textAlign: 'center',
    marginBottom: theme.spacing.xs,
  },
  quickAddCost: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.primary,
  },
  noResultsContainer: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xl,
  },
  noResultsText: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    marginTop: theme.spacing.sm,
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.md,
    marginTop: theme.spacing.md,
  },
  viewAllButtonText: {
    fontSize: 14,
    color: theme.colors.primary,
    fontWeight: '500',
    marginLeft: theme.spacing.xs,
  },
  emptyCostsContainer: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xl,
    backgroundColor: theme.colors.background,
    borderRadius: theme.spacing.borderRadius.md,
    marginTop: theme.spacing.md,
  },
  emptyCostsIcon: {
    marginBottom: theme.spacing.md,
  },
  emptyCostsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  emptyCostsText: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    paddingHorizontal: theme.spacing.lg,
  },
  costsListTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.md,
  },
  costRowHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  costRowContent: {
    flexDirection: 'row',
    // gap property not supported in React Native StyleSheet
    marginBottom: theme.spacing.sm,
  },
  costFieldBase: {
    flex: 2,
  },
  costFieldQty: {
    flex: 1,
  },
  costFieldMaterialFull: {
    marginBottom: theme.spacing.sm,
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.spacing.borderRadius.sm,
    backgroundColor: theme.colors.white,
    minHeight: 40,
  },
  quantityButton: {
    padding: theme.spacing.sm,
    backgroundColor: theme.colors.primary + '10',
    minWidth: 40,
    minHeight: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityInput: {
    flex: 1,
    textAlign: 'center',
    paddingVertical: theme.spacing.sm,
    fontSize: 14,
    color: theme.colors.text.primary,
    includeFontPadding: false,
    textAlignVertical: 'center',
    minHeight: 20,
  },
  costInputFull: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.spacing.borderRadius.sm,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.sm,
    fontSize: 14,
    color: theme.colors.text.primary,
    backgroundColor: theme.colors.white,
    includeFontPadding: false,
    textAlignVertical: 'center',
    minHeight: 40,
  },
  
  // Total Cost Summary Styles
  totalCostSummary: {
    backgroundColor: theme.colors.primary + '05',
    borderRadius: theme.spacing.borderRadius.md,
    padding: theme.spacing.md,
    marginTop: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.primary + '20',
  },
  totalCostHeader: {
    marginBottom: theme.spacing.md,
  },
  totalCostTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.primary,
    textAlign: 'center',
  },
  totalCostBreakdown: {
    marginBottom: theme.spacing.md,
  },
  totalCostRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: theme.spacing.xs,
  },
  totalCostItemName: {
    fontSize: 14,
    color: theme.colors.text.primary,
    flex: 1,
  },
  totalCostItemValue: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.text.primary,
  },
  totalCostDivider: {
    height: 1,
    backgroundColor: theme.colors.border,
    marginVertical: theme.spacing.sm,
  },
  totalCostFinal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
  },
  totalCostFinalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.primary,
  },
  totalCostFinalValue: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.primary,
  },
  
  // Tooth System Selector Styles
  toothSystemSelector: {
    flexDirection: 'row',
    marginBottom: theme.spacing.md,
    backgroundColor: theme.colors.background,
    borderRadius: theme.spacing.borderRadius.sm,
    padding: 4,
  },
  toothSystemButton: {
    flex: 1,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.spacing.borderRadius.sm,
    alignItems: 'center',
  },
  toothSystemButtonSelected: {
    backgroundColor: theme.colors.primary,
  },
  toothSystemButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.text.secondary,
  },
  toothSystemButtonTextSelected: {
    color: theme.colors.white,
    fontWeight: '600',
  },
  
  // Quadrant Chart Styles
  quadrantChart: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    // gap property not supported in React Native StyleSheet
    },
  quadrant: {
    width: '48%',
    backgroundColor: theme.colors.background,
    borderRadius: theme.spacing.borderRadius.md,
    padding: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: theme.spacing.sm,
  },
  quadrantLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.primary,
    textAlign: 'center',
    marginBottom: theme.spacing.xs,
  },
  quadrantTeeth: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 4,
  },
  
  // Tooth Issues Display Styles
  toothIssuesList: {
    marginTop: theme.spacing.sm,
  },
  toothIssueItem: {
    backgroundColor: theme.colors.background,
    borderRadius: theme.spacing.borderRadius.sm,
    padding: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  toothIssueHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
  },
  toothIssueTooth: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.primary,
  },
  toothIssueType: {
    fontSize: 12,
    fontWeight: '500',
    color: theme.colors.text.primary,
    backgroundColor: theme.colors.primary + '10',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.spacing.borderRadius.sm,
  },
  toothIssueComment: {
    fontSize: 12,
    color: theme.colors.text.secondary,
    fontStyle: 'italic',
  },
  noIssuesText: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    fontStyle: 'italic',
    marginTop: theme.spacing.sm,
  },
  
  // Add Issue Button Styles
  addIssueButtonContainer: {
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  addIssueButton: {
    backgroundColor: theme.colors.primary,
  },
  buttonRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  clearButton: {
    minWidth: 80,
  },
  
  // Selected Teeth Display Styles
  selectedTeethContainer: {
    marginBottom: theme.spacing.md,
    padding: theme.spacing.sm,
    backgroundColor: theme.colors.background,
    borderRadius: theme.spacing.borderRadius.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  selectedTeethLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  selectedTeethList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    // gap property not supported in React Native StyleSheet
    },
  selectedToothTag: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.spacing.borderRadius.sm,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
  },
  selectedToothText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.white,
  },
  
  // Modal Body Style
  modalBody: {
    maxHeight: 400,
  },
  
  // Dropdown Button Styles
  dropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.spacing.borderRadius.sm,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.sm,
    backgroundColor: theme.colors.white,
    minHeight: 40,
  },
  dropdownButtonText: {
    fontSize: 14,
    color: theme.colors.text.primary,
  },
  dropdownButtonTextSelected: {
    color: theme.colors.text.primary,
    fontWeight: '500',
  },
});

export default MobileTreatmentFormScreen;
