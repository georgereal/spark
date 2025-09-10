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
  Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { theme } from '../theme';
import { Button, Card, FloatingActionButton } from '../components';
import api, { Patient } from '../services/api';

interface PatientFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  age: string;
  gender: string;
  bloodGroup: string;
  profession: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  officeAddress: string;
  emergencyContact: {
    name: string;
    relationship: string;
    phone: string;
  };
  medicalHistory: string;
  notes: string;
}

const PatientFormScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { patientId } = (route.params as { patientId?: string }) || {};
  
  const [formData, setFormData] = useState<PatientFormData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    age: '',
    gender: '',
    bloodGroup: '',
    profession: '',
    address: '',
    city: 'Bangalore',
    state: 'Karnataka',
    zipCode: '560100',
    officeAddress: '',
    emergencyContact: {
      name: '',
      relationship: '',
      phone: '',
    },
    medicalHistory: '',
    notes: '',
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [errors, setErrors] = useState<Partial<PatientFormData>>({});
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);

  useEffect(() => {
    if (patientId) {
      setIsEditing(true);
      loadPatientData();
    }
  }, [patientId]);

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', () => {
      setKeyboardVisible(true);
    });
    const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => {
      setKeyboardVisible(false);
    });

    return () => {
      keyboardDidHideListener?.remove();
      keyboardDidShowListener?.remove();
    };
  }, []);

  const loadPatientData = async () => {
    try {
      setIsLoading(true);
      const patient = await api.getPatient(patientId!);
      setFormData({
        firstName: patient.firstName || '',
        lastName: patient.lastName || '',
        email: patient.email || '',
        phone: patient.phone || '',
        dateOfBirth: patient.dateOfBirth ? new Date(patient.dateOfBirth).toISOString().split('T')[0] : '',
        age: patient.age?.toString() || '',
        gender: patient.gender || '',
        bloodGroup: patient.bloodGroup || '',
        profession: patient.profession || '',
        address: patient.address || '',
        city: patient.city || 'Bangalore',
        state: patient.state || 'Karnataka',
        zipCode: patient.zipCode || '560100',
        officeAddress: patient.officeAddress || '',
        emergencyContact: {
          name: patient.emergencyContact?.name || '',
          relationship: patient.emergencyContact?.relationship || '',
          phone: patient.emergencyContact?.phone || '',
        },
        medicalHistory: patient.medicalHistory || '',
        notes: patient.notes || '',
      });
      
      // Set the selected date for the date picker
      if (patient.dateOfBirth) {
        setSelectedDate(new Date(patient.dateOfBirth));
      }
    } catch (error) {
      console.error('Error loading patient:', error);
      Alert.alert('Error', 'Failed to load patient data');
    } finally {
      setIsLoading(false);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<PatientFormData> = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }

    if (formData.email.trim() && !/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    }

    if (formData.dateOfBirth && new Date(formData.dateOfBirth) > new Date()) {
      newErrors.dateOfBirth = 'Date of birth cannot be in the future';
    }

    if (formData.age && (isNaN(Number(formData.age)) || Number(formData.age) < 0 || Number(formData.age) > 150)) {
      newErrors.age = 'Please enter a valid age (0-150)';
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
      
      const patientData = {
        ...formData,
        dateOfBirth: formData.dateOfBirth ? new Date(formData.dateOfBirth).toISOString() : undefined,
        age: formData.age ? Number(formData.age) : undefined,
      };

      if (isEditing) {
        await api.updatePatient(patientId!, patientData);
        Alert.alert('Success', 'Patient updated successfully', [
          { text: 'OK', onPress: () => navigation.goBack() }
        ]);
      } else {
        await api.createPatient(patientData);
        Alert.alert('Success', 'Patient created successfully', [
          { text: 'OK', onPress: () => navigation.goBack() }
        ]);
      }
    } catch (error: any) {
      console.error('Error saving patient:', error);
      Alert.alert('Error', error.message || 'Failed to save patient');
    } finally {
      setIsLoading(false);
    }
  };

  const updateFormData = (field: keyof PatientFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const updateEmergencyContact = (field: keyof PatientFormData['emergencyContact'], value: string) => {
    setFormData(prev => ({
      ...prev,
      emergencyContact: {
        ...prev.emergencyContact,
        [field]: value,
      },
    }));
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setSelectedDate(selectedDate);
      const dateString = selectedDate.toISOString().split('T')[0];
      updateFormData('dateOfBirth', dateString);
    }
  };

  const showDatePickerModal = () => {
    setShowDatePicker(true);
  };

  const renderDatePicker = () => (
    <View style={styles.inputGroup}>
      <Text style={styles.inputLabel}>Date of Birth</Text>
      <TouchableOpacity
        style={[
          styles.datePickerContainer,
          errors.dateOfBirth && styles.inputError,
          formData.dateOfBirth && styles.datePickerSelected
        ]}
        onPress={showDatePickerModal}
        activeOpacity={0.7}
      >
        <View style={styles.datePickerContent}>
          <Ionicons 
            name="calendar-outline" 
            size={22} 
            color={formData.dateOfBirth ? theme.colors.primary : theme.colors.text.secondary} 
          />
          <Text style={[
            styles.datePickerText,
            !formData.dateOfBirth && styles.placeholderText,
            formData.dateOfBirth && styles.datePickerTextSelected
          ]}>
            {formData.dateOfBirth 
              ? new Date(formData.dateOfBirth).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })
              : 'Select your date of birth'
            }
          </Text>
        </View>
        <Ionicons 
          name="chevron-down" 
          size={20} 
          color={theme.colors.text.secondary} 
        />
      </TouchableOpacity>
      {errors.dateOfBirth && <Text style={styles.errorText}>{errors.dateOfBirth as string}</Text>}
      
      {showDatePicker && (
        <DateTimePicker
          value={selectedDate}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleDateChange}
          maximumDate={new Date()}
          textColor={theme.colors.text.primary}
        />
      )}
    </View>
  );

  const renderEmergencyContactInput = (
    label: string,
    field: keyof PatientFormData['emergencyContact'],
    placeholder: string,
    keyboardType: 'default' | 'phone-pad' = 'default'
  ) => (
    <View style={styles.inputGroup}>
      <Text style={styles.inputLabel}>{label}</Text>
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder={placeholder}
          placeholderTextColor={theme.colors.text.hint}
          value={formData.emergencyContact[field]}
          onChangeText={(value) => updateEmergencyContact(field, value)}
          keyboardType={keyboardType}
        />
      </View>
    </View>
  );

  const renderEmergencyContactSelector = (
    label: string,
    field: keyof PatientFormData['emergencyContact']
  ) => (
    <View style={styles.inputGroup}>
      <Text style={styles.inputLabel}>{label}</Text>
      <View style={styles.relationshipContainer}>
        {['Spouse', 'Parent', 'Sibling', 'Child', 'Friend', 'Other'].map((relationship) => (
          <TouchableOpacity
            key={relationship}
            style={[
              styles.relationshipOption,
              formData.emergencyContact[field] === relationship && styles.relationshipOptionSelected
            ]}
            onPress={() => updateEmergencyContact(field, relationship)}
          >
            <Text style={[
              styles.relationshipText,
              formData.emergencyContact[field] === relationship && styles.relationshipTextSelected
            ]}>
              {relationship}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderInput = (
    label: string,
    field: keyof PatientFormData,
    placeholder: string,
    keyboardType: 'default' | 'email-address' | 'numeric' | 'phone-pad' = 'default',
    multiline: boolean = false
  ) => (
    <View style={styles.inputGroup}>
      <Text style={styles.inputLabel}>{label}</Text>
      <View style={[styles.inputContainer, errors[field] && styles.inputError]}>
        <TextInput
          style={[styles.input, multiline && styles.multilineInput]}
          placeholder={placeholder}
          placeholderTextColor={theme.colors.text.hint}
          value={formData[field] as string}
          onChangeText={(value) => updateFormData(field, value)}
          keyboardType={keyboardType}
          multiline={multiline}
          numberOfLines={multiline ? 4 : 1}
        />
      </View>
      {errors[field] && <Text style={styles.errorText}>{errors[field] as string}</Text>}
    </View>
  );

  const renderGenderSelector = () => (
    <View style={styles.inputGroup}>
      <Text style={styles.inputLabel}>Gender</Text>
      <View style={styles.genderContainer}>
        {['Male', 'Female', 'Other'].map((gender) => (
          <TouchableOpacity
            key={gender}
            style={[
              styles.genderOption,
              formData.gender === gender && styles.genderOptionSelected
            ]}
            onPress={() => updateFormData('gender', gender)}
          >
            <Text style={[
              styles.genderText,
              formData.gender === gender && styles.genderTextSelected
            ]}>
              {gender}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  if (isLoading && isEditing) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading patient data...</Text>
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
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Ionicons name="arrow-back" size={24} color={theme.colors.text.primary} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>
              {isEditing ? 'Edit Patient' : 'Add New Patient'}
            </Text>
            {isKeyboardVisible ? (
              <TouchableOpacity
                style={styles.headerSaveButton}
                onPress={handleSubmit}
                disabled={isLoading}
              >
                {isLoading ? (
                  <Ionicons name="hourglass-outline" size={20} color={theme.colors.primary} />
                ) : (
                  <Ionicons name="checkmark" size={20} color={theme.colors.primary} />
                )}
              </TouchableOpacity>
            ) : (
              <View style={styles.placeholder} />
            )}
          </View>

          <View style={styles.formContainer}>
            {/* Essential Information - Most Important Fields */}
            <Card style={styles.section}>
              <Text style={styles.sectionTitle}>Personal Information</Text>
              
              {renderInput('First Name *', 'firstName', 'Enter first name')}
              {renderInput('Last Name *', 'lastName', 'Enter last name')}
              {renderInput('Email', 'email', 'Enter email address (optional)', 'email-address')}
              {renderInput('Phone *', 'phone', 'Enter phone number', 'phone-pad')}
              
              {renderGenderSelector()}
              
              <Text style={styles.helperText}>
                You can provide either date of birth or age - both are optional
              </Text>
              
              {renderDatePicker()}
              {renderInput('Age', 'age', 'Enter age (optional)', 'numeric')}
              
              <View style={styles.row}>
                <View style={styles.halfWidth}>
                  {renderInput('Blood Group', 'bloodGroup', 'A+, B-, O+')}
                </View>
                <View style={styles.halfWidth}>
                  {renderInput('Profession', 'profession', 'Engineer, Doctor')}
                </View>
              </View>
            </Card>

            {/* Address Information */}
            <Card style={styles.section}>
              <Text style={styles.sectionTitle}>Address</Text>
              
              {renderInput('Address', 'address', 'Enter full address')}
              
              <View style={styles.row}>
                <View style={styles.halfWidth}>
                  {renderInput('City', 'city', 'Enter city')}
                </View>
                <View style={styles.halfWidth}>
                  {renderInput('State', 'state', 'Enter state')}
                </View>
              </View>
              
              <View style={styles.row}>
                <View style={styles.halfWidth}>
                  {renderInput('ZIP Code', 'zipCode', 'Enter ZIP code')}
                </View>
                <View style={styles.halfWidth}>
                  {renderInput('Office Address', 'officeAddress', 'Enter office address')}
                </View>
              </View>
            </Card>

            {/* Emergency Contact */}
            <Card style={styles.section}>
              <Text style={styles.sectionTitle}>Emergency Contact</Text>
              
              {renderEmergencyContactInput('Name', 'name', 'Enter emergency contact name')}
              {renderEmergencyContactInput('Phone', 'phone', 'Enter emergency contact phone', 'phone-pad')}
              {renderEmergencyContactSelector('Relationship', 'relationship')}
            </Card>

            {/* Medical Information */}
            <Card style={styles.section}>
              <Text style={styles.sectionTitle}>Medical Information</Text>
              
              {renderInput(
                'Medical History',
                'medicalHistory',
                'Any medical conditions, allergies, or history',
                'default',
                true
              )}

              {renderInput(
                'Notes',
                'notes',
                'Additional notes or comments',
                'default',
                true
              )}
            </Card>

            {/* Bottom padding for floating button */}
            <View style={styles.bottomPadding} />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
      
      {/* Floating Save Button - Hide when keyboard is visible */}
      {!isKeyboardVisible && (
        <FloatingActionButton
          onPress={handleSubmit}
          loading={isLoading}
          disabled={isLoading}
          icon={isEditing ? "checkmark" : "add"}
          label={isEditing ? "Update Patient" : "Add Patient"}
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
  keyboardAvoidingView: {
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
  loadingText: {
    fontSize: 16,
    fontWeight: '400',
    lineHeight: 24,
    color: theme.colors.text.secondary,
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
    fontSize: 20,
    fontWeight: '600',
    lineHeight: 26,
    color: theme.colors.text.primary,
  },
  placeholder: {
    width: 40,
  },
  headerSaveButton: {
    padding: theme.spacing.sm,
    borderRadius: theme.spacing.borderRadius.md,
    backgroundColor: theme.colors.primaryLight + '20',
    borderWidth: 1,
    borderColor: theme.colors.primary,
  },
  formContainer: {
    padding: theme.spacing.md,
  },
  section: {
    marginBottom: theme.spacing.lg,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 20,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
  },
  helperText: {
    fontSize: 12,
    fontWeight: '400',
    lineHeight: 16,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.md,
    fontStyle: 'italic',
  },
  inputGroup: {
    marginBottom: theme.spacing.sm,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 16,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  inputContainer: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.spacing.borderRadius.lg,
    paddingHorizontal: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    minHeight: 48,
    justifyContent: 'center',
  },
  inputError: {
    borderColor: theme.colors.error,
  },
  input: {
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 20,
    color: theme.colors.text.primary,
    paddingVertical: theme.spacing.sm,
    minHeight: 20,
  },
  multilineInput: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  placeholderText: {
    color: theme.colors.text.hint,
  },
  datePickerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.spacing.borderRadius.lg,
    paddingHorizontal: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    minHeight: 48,
  },
  datePickerSelected: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primaryLight + '10',
  },
  datePickerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  datePickerText: {
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 20,
    color: theme.colors.text.primary,
    marginLeft: theme.spacing.sm,
    flex: 1,
  },
  datePickerTextSelected: {
    color: theme.colors.primary,
    fontWeight: '500',
  },
  errorText: {
    fontSize: 11,
    fontWeight: '400',
    lineHeight: 14,
    color: theme.colors.error,
    marginTop: theme.spacing.xs,
  },
  row: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
  },
  halfWidth: {
    flex: 1,
  },
  thirdWidth: {
    flex: 1,
  },
  genderContainer: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.xs,
  },
  genderOption: {
    flex: 1,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.sm,
    borderRadius: theme.spacing.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    alignItems: 'center',
    minHeight: 40,
    justifyContent: 'center',
  },
  genderOptionSelected: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primaryLight + '20',
  },
  genderText: {
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 16,
    color: theme.colors.text.secondary,
  },
  genderTextSelected: {
    color: theme.colors.primary,
  },
  relationshipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.xs,
  },
  relationshipOption: {
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.sm,
    borderRadius: theme.spacing.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    minWidth: 80,
    minHeight: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  relationshipOptionSelected: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primaryLight + '20',
  },
  relationshipText: {
    fontSize: 11,
    fontWeight: '500',
    lineHeight: 14,
    color: theme.colors.text.secondary,
  },
  relationshipTextSelected: {
    color: theme.colors.primary,
  },
  buttonContainer: {
    marginTop: theme.spacing.xl,
    marginBottom: theme.spacing.lg,
  },
  bottomPadding: {
    height: 100, // Space for floating button
  },
});

export default PatientFormScreen;