import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  TextInput,
  Switch,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../theme';
import { Card, Button } from '../components';
import ApiService from '../services/api';

interface Doctor {
  _id: string;
  name: string;
  specialization: string;
  contact: string;
  ratePercentage: number;
  enablePayables: boolean;
  treatmentCategories: string[];
}

const AdminDoctorsScreen: React.FC = () => {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [processing, setProcessing] = useState(false);

  // Form state
  const [newDoctor, setNewDoctor] = useState({
    name: '',
    specialization: '',
    contact: '',
    ratePercentage: 0,
    enablePayables: true,
    treatmentCategories: [] as string[],
  });

  // Edit state
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [showDoctorModal, setShowDoctorModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    fetchDoctors();
  }, []);

  const fetchDoctors = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await ApiService.getDoctors();
      setDoctors(response);
    } catch (error) {
      console.error('Error fetching doctors:', error);
      setError('Failed to load doctors');
    } finally {
      setLoading(false);
    }
  };

  const handleAddDoctor = async () => {
    if (!newDoctor.name.trim() || !newDoctor.specialization.trim()) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    try {
      setProcessing(true);
      const response = await ApiService.createDoctor(newDoctor);
      setDoctors([...doctors, response]);
      setNewDoctor({
        name: '',
        specialization: '',
        contact: '',
        ratePercentage: 0,
        enablePayables: true,
        treatmentCategories: [],
      });
      setShowAddModal(false);
      Alert.alert('Success', 'Doctor added successfully');
    } catch (error) {
      console.error('Error adding doctor:', error);
      Alert.alert('Error', 'Failed to add doctor');
    } finally {
      setProcessing(false);
    }
  };

  const handleEditDoctor = (doctor: Doctor) => {
    setSelectedDoctor(doctor);
    setShowDoctorModal(true);
  };

  const handleEditSave = async () => {
    if (!selectedDoctor) return;

    try {
      setProcessing(true);
      const response = await ApiService.updateDoctor(selectedDoctor._id, selectedDoctor);
      setDoctors(doctors.map(doc => doc._id === selectedDoctor._id ? response : doc));
      setShowDoctorModal(false);
      setSelectedDoctor(null);
      Alert.alert('Success', 'Doctor updated successfully');
    } catch (error) {
      console.error('Error updating doctor:', error);
      Alert.alert('Error', 'Failed to update doctor');
    } finally {
      setProcessing(false);
    }
  };

  const handleDeleteDoctor = async (doctorId: string) => {
    Alert.alert(
      'Delete Doctor',
      'Are you sure you want to delete this doctor?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setProcessing(true);
              await ApiService.deleteDoctor(doctorId);
              setDoctors(doctors.filter(doc => doc._id !== doctorId));
              Alert.alert('Success', 'Doctor deleted successfully');
            } catch (error) {
              console.error('Error deleting doctor:', error);
              Alert.alert('Error', 'Failed to delete doctor');
            } finally {
              setProcessing(false);
            }
          },
        },
      ]
    );
  };

  const closeModals = () => {
    setShowDoctorModal(false);
    setShowAddModal(false);
    setSelectedDoctor(null);
  };

  const renderDoctorIcon = (doctor: Doctor) => (
    <TouchableOpacity
      style={styles.doctorIconContainer}
      onPress={() => handleEditDoctor(doctor)}
      activeOpacity={0.7}
    >
      <View style={[
        styles.doctorIcon,
        { backgroundColor: doctor.enablePayables ? theme.colors.success + '20' : theme.colors.warning + '20' }
      ]}>
        <Ionicons
          name="person"
          size={32}
          color={doctor.enablePayables ? theme.colors.success : theme.colors.warning}
        />
      </View>
      <Text style={styles.doctorIconName} numberOfLines={1}>
        {doctor.name}
      </Text>
      <Text style={styles.doctorIconSpecialization} numberOfLines={1}>
        {doctor.specialization}
      </Text>
      <Text style={styles.doctorIconRate} numberOfLines={1}>
        {doctor.ratePercentage}% rate
      </Text>
      <View style={styles.doctorIconStatus}>
        <Ionicons
          name={doctor.enablePayables ? "checkmark-circle" : "close-circle"}
          size={12}
          color={doctor.enablePayables ? theme.colors.success : theme.colors.warning}
        />
        <Text style={styles.doctorIconStatusText}>
          {doctor.enablePayables ? 'Payables' : 'No Payables'}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const renderDoctorDetails = () => {
    if (!selectedDoctor) return null;

    return (
      <View style={styles.doctorDetailsContainer}>
        <View style={styles.doctorDetailsHeader}>
          <View style={styles.doctorDetailsIcon}>
            <Ionicons
              name="person"
              size={48}
              color={selectedDoctor.enablePayables ? theme.colors.success : theme.colors.warning}
            />
          </View>
          <View style={styles.doctorDetailsInfo}>
            <Text style={styles.doctorDetailsName}>{selectedDoctor.name}</Text>
            <Text style={styles.doctorDetailsSpecialization}>{selectedDoctor.specialization}</Text>
            <Text style={styles.doctorDetailsContact}>{selectedDoctor.contact}</Text>
            <Text style={styles.doctorDetailsRate}>{selectedDoctor.ratePercentage}% rate</Text>
            <View style={styles.doctorDetailsStatus}>
              <Ionicons
                name={selectedDoctor.enablePayables ? "checkmark-circle" : "close-circle"}
                size={16}
                color={selectedDoctor.enablePayables ? theme.colors.success : theme.colors.warning}
              />
              <Text style={styles.doctorDetailsStatusText}>
                {selectedDoctor.enablePayables ? 'Payables Enabled' : 'Payables Disabled'}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.doctorDetailsActions}>
          <TouchableOpacity
            style={[styles.detailActionButton, styles.editButton]}
            onPress={() => {
              // Edit functionality will be handled in the modal
            }}
          >
            <Ionicons name="create" size={20} color={theme.colors.white} />
            <Text style={styles.detailActionButtonText}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.detailActionButton, styles.deleteButton]}
            onPress={() => {
              handleDeleteDoctor(selectedDoctor._id);
              closeModals();
            }}
          >
            <Ionicons name="trash" size={20} color={theme.colors.white} />
            <Text style={styles.detailActionButtonText}>Delete</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderAddForm = () => (
    <View style={styles.addFormContainer}>
      <Text style={styles.addFormTitle}>Add New Doctor</Text>
      <TextInput
        style={styles.input}
        placeholder="Doctor Name"
        value={newDoctor.name}
        onChangeText={(text) => setNewDoctor({ ...newDoctor, name: text })}
      />
      <TextInput
        style={styles.input}
        placeholder="Specialization"
        value={newDoctor.specialization}
        onChangeText={(text) => setNewDoctor({ ...newDoctor, specialization: text })}
      />
      <TextInput
        style={styles.input}
        placeholder="Contact"
        value={newDoctor.contact}
        onChangeText={(text) => setNewDoctor({ ...newDoctor, contact: text })}
      />
      <TextInput
        style={styles.input}
        placeholder="Rate Percentage"
        value={newDoctor.ratePercentage.toString()}
        onChangeText={(text) => setNewDoctor({ ...newDoctor, ratePercentage: parseFloat(text) || 0 })}
        keyboardType="numeric"
      />
      <View style={styles.switchRow}>
        <Text style={styles.switchLabel}>Enable Payables</Text>
        <Switch
          value={newDoctor.enablePayables}
          onValueChange={(value) => setNewDoctor({ ...newDoctor, enablePayables: value })}
        />
      </View>
      <View style={styles.addFormActions}>
        <Button
          title="Cancel"
          onPress={() => setShowAddModal(false)}
          style={[styles.addFormButton, styles.cancelButton]}
        />
        <Button
          title="Add Doctor"
          onPress={handleAddDoctor}
          disabled={processing || !newDoctor.name.trim() || !newDoctor.specialization.trim()}
          style={[styles.addFormButton, styles.addButton]}
        />
      </View>
    </View>
  );

  const renderEditForm = () => {
    if (!selectedDoctor) return null;

    return (
      <View style={styles.editFormContainer}>
        <Text style={styles.editFormTitle}>Edit Doctor</Text>
        <TextInput
          style={styles.input}
          placeholder="Doctor Name"
          value={selectedDoctor.name}
          onChangeText={(text) => setSelectedDoctor({ ...selectedDoctor, name: text })}
        />
        <TextInput
          style={styles.input}
          placeholder="Specialization"
          value={selectedDoctor.specialization}
          onChangeText={(text) => setSelectedDoctor({ ...selectedDoctor, specialization: text })}
        />
        <TextInput
          style={styles.input}
          placeholder="Contact"
          value={selectedDoctor.contact}
          onChangeText={(text) => setSelectedDoctor({ ...selectedDoctor, contact: text })}
        />
        <TextInput
          style={styles.input}
          placeholder="Rate Percentage"
          value={selectedDoctor.ratePercentage?.toString() || ''}
          onChangeText={(text) => setSelectedDoctor({ ...selectedDoctor, ratePercentage: parseFloat(text) || 0 })}
          keyboardType="numeric"
        />
        <View style={styles.switchRow}>
          <Text style={styles.switchLabel}>Enable Payables</Text>
          <Switch
            value={selectedDoctor.enablePayables}
            onValueChange={(value) => setSelectedDoctor({ ...selectedDoctor, enablePayables: value })}
          />
        </View>
        <View style={styles.editFormActions}>
          <Button
            title="Cancel"
            onPress={closeModals}
            style={[styles.editFormButton, styles.cancelButton]}
          />
          <Button
            title="Save Changes"
            onPress={handleEditSave}
            disabled={processing}
            style={[styles.editFormButton, styles.saveButton]}
          />
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Loading doctors...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Doctors</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={fetchDoctors} disabled={loading}>
            <Ionicons name="refresh" size={24} color={theme.colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setShowAddModal(true)}
            style={styles.addButton}
          >
            <Ionicons name="add" size={24} color={theme.colors.white} />
          </TouchableOpacity>
        </View>
      </View>

      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Doctors ({doctors.length})</Text>
          <View style={styles.doctorIconGrid}>
            {doctors.map(doctor => (
              <View key={doctor._id}>
                {renderDoctorIcon(doctor)}
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Add Doctor Modal */}
      {showAddModal && (
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.keyboardAvoidingView}
          >
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Add Doctor</Text>
                <TouchableOpacity onPress={() => setShowAddModal(false)} style={styles.closeButton}>
                  <Ionicons name="close" size={24} color={theme.colors.text.secondary} />
                </TouchableOpacity>
              </View>
              <ScrollView style={styles.modalScrollView} showsVerticalScrollIndicator={false}>
                {renderAddForm()}
              </ScrollView>
            </View>
          </KeyboardAvoidingView>
        </View>
      )}

      {/* Edit Doctor Modal */}
      {showDoctorModal && (
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.keyboardAvoidingView}
          >
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Doctor Details</Text>
                <TouchableOpacity onPress={closeModals} style={styles.closeButton}>
                  <Ionicons name="close" size={24} color={theme.colors.text.secondary} />
                </TouchableOpacity>
              </View>
              <ScrollView style={styles.modalScrollView} showsVerticalScrollIndicator={false}>
                {renderDoctorDetails()}
                {renderEditForm()}
              </ScrollView>
            </View>
          </KeyboardAvoidingView>
        </View>
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  headerTitle: {
    ...theme.typography.h3,
    color: theme.colors.text.primary,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    // gap property not supported in React Native StyleSheet
    },
  addButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: 20,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    ...theme.typography.body1,
    color: theme.colors.text.secondary,
    marginTop: theme.spacing.sm,
  },
  errorContainer: {
    backgroundColor: theme.colors.error + '20',
    padding: theme.spacing.md,
    margin: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
  },
  errorText: {
    ...theme.typography.body1,
    color: theme.colors.error,
  },
  content: {
    flex: 1,
    padding: theme.spacing.md,
  },
  section: {
    marginBottom: theme.spacing.lg,
  },
  sectionTitle: {
    ...theme.typography.h4,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.md,
  },
  doctorIconGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    // gap property not supported in React Native StyleSheet
    marginBottom: theme.spacing.lg,
  },
  doctorIconContainer: {
    alignItems: 'center',
    width: '30%',
    minWidth: 100,
  },
  doctorIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.sm,
  },
  doctorIconName: {
    ...theme.typography.caption,
    color: theme.colors.text.primary,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: theme.spacing.xs,
  },
  doctorIconSpecialization: {
    ...theme.typography.caption,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    marginBottom: theme.spacing.xs,
    fontSize: 10,
  },
  doctorIconRate: {
    ...theme.typography.caption,
    color: theme.colors.primary,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: theme.spacing.xs,
  },
  doctorIconStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    // gap property not supported in React Native StyleSheet
    },
  doctorIconStatusText: {
    ...theme.typography.caption,
    color: theme.colors.text.secondary,
    fontSize: 10,
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-start',
    zIndex: 1000,
  },
  modalContent: {
    backgroundColor: theme.colors.surface,
    borderBottomLeftRadius: theme.borderRadius.lg,
    borderBottomRightRadius: theme.borderRadius.lg,
    width: '100%',
    maxHeight: '90%',
    minHeight: '70%',
  },
  keyboardAvoidingView: {
    flex: 1,
    justifyContent: 'flex-start',
  },
  modalScrollView: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  modalTitle: {
    ...theme.typography.h4,
    color: theme.colors.text.primary,
  },
  closeButton: {
    padding: theme.spacing.sm,
  },
  doctorDetailsContainer: {
    padding: theme.spacing.lg,
  },
  doctorDetailsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  doctorDetailsIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: theme.colors.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.md,
  },
  doctorDetailsInfo: {
    flex: 1,
  },
  doctorDetailsName: {
    ...theme.typography.h4,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  doctorDetailsSpecialization: {
    ...theme.typography.body1,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.xs,
  },
  doctorDetailsContact: {
    ...theme.typography.body2,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.xs,
  },
  doctorDetailsRate: {
    ...theme.typography.body2,
    color: theme.colors.primary,
    fontWeight: '600',
    marginBottom: theme.spacing.xs,
  },
  doctorDetailsStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    // gap property not supported in React Native StyleSheet
    },
  doctorDetailsStatusText: {
    ...theme.typography.caption,
    color: theme.colors.text.secondary,
  },
  doctorDetailsActions: {
    flexDirection: 'row',
    // gap property not supported in React Native StyleSheet
    marginBottom: theme.spacing.lg,
  },
  detailActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    // gap property not supported in React Native StyleSheet
    },
  detailActionButtonText: {
    ...theme.typography.body1,
    color: theme.colors.white,
    fontWeight: '600',
  },
  editButton: {
    backgroundColor: theme.colors.primary,
  },
  deleteButton: {
    backgroundColor: theme.colors.error,
  },
  addFormContainer: {
    padding: theme.spacing.lg,
  },
  addFormTitle: {
    ...theme.typography.h5,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.lg,
  },
  editFormContainer: {
    padding: theme.spacing.lg,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  editFormTitle: {
    ...theme.typography.h5,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.lg,
  },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.sm,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.sm,
    ...theme.typography.body1,
    backgroundColor: theme.colors.surface,
    marginBottom: theme.spacing.sm,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.lg,
  },
  switchLabel: {
    ...theme.typography.body1,
    color: theme.colors.text.primary,
  },
  addFormActions: {
    flexDirection: 'row',
    // gap property not supported in React Native StyleSheet
    },
  addFormButton: {
    flex: 1,
  },
  editFormActions: {
    flexDirection: 'row',
    // gap property not supported in React Native StyleSheet
    },
  editFormButton: {
    flex: 1,
  },
  cancelButton: {
    backgroundColor: theme.colors.text.secondary,
  },
  addButton: {
    backgroundColor: theme.colors.primary,
  },
  saveButton: {
    backgroundColor: theme.colors.primary,
  },
});

export default AdminDoctorsScreen;
