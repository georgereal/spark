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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../theme';
import { Card, Button } from '../components';
import ApiService from '../services/api';

interface TreatmentCategory {
  _id: string;
  name: string;
  description: string;
  baseCost: number;
  enablePayables: boolean;
  defaultDoctors: string[];
}

interface Doctor {
  _id: string;
  name: string;
  specialization: string;
  contact: string;
  ratePercentage: number;
  enablePayables: boolean;
  treatmentCategories: string[];
}

const AdminTreatmentsScreen: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [categories, setCategories] = useState<TreatmentCategory[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [processing, setProcessing] = useState(false);

  // Category form state
  const [newCategory, setNewCategory] = useState({
    name: '',
    description: '',
    baseCost: '',
    enablePayables: true,
  });

  // Doctor form state
  const [newDoctor, setNewDoctor] = useState({
    name: '',
    specialization: '',
    contact: '',
    ratePercentage: 0,
    enablePayables: true,
    treatmentCategories: [] as string[],
  });

  // Edit state
  const [editItem, setEditItem] = useState<any>(null);
  const [editType, setEditType] = useState('');
  const [showEditModal, setShowEditModal] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');
      
      const [categoriesRes, doctorsRes] = await Promise.all([
        ApiService.getTreatmentCategories(),
        ApiService.getDoctors(),
      ]);
      
      setCategories(categoriesRes);
      setDoctors(doctorsRes);
    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleAddCategory = async () => {
    if (!newCategory.name.trim() || !newCategory.baseCost) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    try {
      setProcessing(true);
      const response = await ApiService.createTreatmentCategory(newCategory);
      setCategories([...categories, response]);
      setNewCategory({ name: '', description: '', baseCost: '', enablePayables: true });
      Alert.alert('Success', 'Category added successfully');
    } catch (error) {
      console.error('Error adding category:', error);
      Alert.alert('Error', 'Failed to add category');
    } finally {
      setProcessing(false);
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
      Alert.alert('Success', 'Doctor added successfully');
    } catch (error) {
      console.error('Error adding doctor:', error);
      Alert.alert('Error', 'Failed to add doctor');
    } finally {
      setProcessing(false);
    }
  };

  const handleEdit = (item: any, type: string) => {
    setEditItem(item);
    setEditType(type);
    setShowEditModal(true);
  };

  const handleEditSave = async () => {
    try {
      setProcessing(true);
      if (editType === 'category') {
        const response = await ApiService.updateTreatmentCategory(editItem._id, editItem);
        setCategories(categories.map(cat => cat._id === editItem._id ? response : cat));
      } else {
        const response = await ApiService.updateDoctor(editItem._id, editItem);
        setDoctors(doctors.map(doc => doc._id === editItem._id ? response : doc));
      }
      setShowEditModal(false);
      Alert.alert('Success', 'Updated successfully');
    } catch (error) {
      console.error('Error updating:', error);
      Alert.alert('Error', 'Failed to update');
    } finally {
      setProcessing(false);
    }
  };

  const handleDelete = async (id: string, type: string) => {
    Alert.alert(
      'Delete Item',
      'Are you sure you want to delete this item?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setProcessing(true);
              if (type === 'category') {
                await ApiService.deleteTreatmentCategory(id);
                setCategories(categories.filter(cat => cat._id !== id));
              } else {
                await ApiService.deleteDoctor(id);
                setDoctors(doctors.filter(doc => doc._id !== id));
              }
              Alert.alert('Success', 'Deleted successfully');
            } catch (error) {
              console.error('Error deleting:', error);
              Alert.alert('Error', 'Failed to delete');
            } finally {
              setProcessing(false);
            }
          },
        },
      ]
    );
  };

  const renderCategoryForm = () => (
    <Card style={styles.formCard}>
      <Text style={styles.formTitle}>Add New Category</Text>
      <View style={styles.formRow}>
        <TextInput
          style={styles.input}
          placeholder="Category Name"
          value={newCategory.name}
          onChangeText={(text) => setNewCategory({ ...newCategory, name: text })}
        />
        <TextInput
          style={styles.input}
          placeholder="Base Cost"
          value={newCategory.baseCost}
          onChangeText={(text) => setNewCategory({ ...newCategory, baseCost: text })}
          keyboardType="numeric"
        />
      </View>
      <TextInput
        style={[styles.input, styles.textArea]}
        placeholder="Description"
        value={newCategory.description}
        onChangeText={(text) => setNewCategory({ ...newCategory, description: text })}
        multiline
        numberOfLines={3}
      />
      <View style={styles.switchRow}>
        <Text style={styles.switchLabel}>Enable Payables</Text>
        <Switch
          value={newCategory.enablePayables}
          onValueChange={(value) => setNewCategory({ ...newCategory, enablePayables: value })}
        />
      </View>
      <Button
        title="Add Category"
        onPress={handleAddCategory}
        disabled={processing || !newCategory.name.trim() || !newCategory.baseCost}
        style={styles.addButton}
      />
    </Card>
  );

  const renderDoctorForm = () => (
    <Card style={styles.formCard}>
      <Text style={styles.formTitle}>Add New Doctor</Text>
      <View style={styles.formRow}>
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
      </View>
      <View style={styles.formRow}>
        <TextInput
          style={styles.input}
          placeholder="Contact"
          value={newDoctor.contact}
          onChangeText={(text) => setNewDoctor({ ...newDoctor, contact: text })}
        />
        <TextInput
          style={styles.input}
          placeholder="Rate %"
          value={newDoctor.ratePercentage.toString()}
          onChangeText={(text) => setNewDoctor({ ...newDoctor, ratePercentage: parseFloat(text) || 0 })}
          keyboardType="numeric"
        />
      </View>
      <View style={styles.switchRow}>
        <Text style={styles.switchLabel}>Enable Payables</Text>
        <Switch
          value={newDoctor.enablePayables}
          onValueChange={(value) => setNewDoctor({ ...newDoctor, enablePayables: value })}
        />
      </View>
      <Button
        title="Add Doctor"
        onPress={handleAddDoctor}
        disabled={processing || !newDoctor.name.trim() || !newDoctor.specialization.trim()}
        style={styles.addButton}
      />
    </Card>
  );

  const renderCategoryItem = (category: TreatmentCategory) => (
    <Card key={category._id} style={styles.itemCard}>
      <View style={styles.itemHeader}>
        <View style={styles.itemInfo}>
          <Text style={styles.itemName}>{category.name}</Text>
          <Text style={styles.itemDescription}>{category.description}</Text>
          <Text style={styles.itemCost}>₹{category.baseCost?.toLocaleString()}</Text>
        </View>
        <View style={styles.itemActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleEdit(category, 'category')}
          >
            <Ionicons name="create" size={20} color={theme.colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleDelete(category._id, 'category')}
          >
            <Ionicons name="trash" size={20} color={theme.colors.error} />
          </TouchableOpacity>
        </View>
      </View>
      <View style={styles.itemFooter}>
        <View style={styles.statusRow}>
          <Ionicons
            name={category.enablePayables ? "checkmark-circle" : "close-circle"}
            size={16}
            color={category.enablePayables ? theme.colors.success : theme.colors.error}
          />
          <Text style={styles.statusText}>
            {category.enablePayables ? 'Payables Enabled' : 'Payables Disabled'}
          </Text>
        </View>
      </View>
    </Card>
  );

  const renderDoctorItem = (doctor: Doctor) => (
    <Card key={doctor._id} style={styles.itemCard}>
      <View style={styles.itemHeader}>
        <View style={styles.itemInfo}>
          <Text style={styles.itemName}>{doctor.name}</Text>
          <Text style={styles.itemDescription}>{doctor.specialization}</Text>
          <Text style={styles.itemCost}>{doctor.ratePercentage}% rate</Text>
        </View>
        <View style={styles.itemActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleEdit(doctor, 'doctor')}
          >
            <Ionicons name="create" size={20} color={theme.colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleDelete(doctor._id, 'doctor')}
          >
            <Ionicons name="trash" size={20} color={theme.colors.error} />
          </TouchableOpacity>
        </View>
      </View>
      <View style={styles.itemFooter}>
        <View style={styles.statusRow}>
          <Ionicons
            name={doctor.enablePayables ? "checkmark-circle" : "close-circle"}
            size={16}
            color={doctor.enablePayables ? theme.colors.success : theme.colors.error}
          />
          <Text style={styles.statusText}>
            {doctor.enablePayables ? 'Payables Enabled' : 'Payables Disabled'}
          </Text>
        </View>
        {doctor.contact && (
          <Text style={styles.contactText}>{doctor.contact}</Text>
        )}
      </View>
    </Card>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Loading data...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Treatment Settings</Text>
        <TouchableOpacity onPress={fetchData} disabled={loading}>
          <Ionicons name="refresh" size={24} color={theme.colors.primary} />
        </TouchableOpacity>
      </View>

      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 0 && styles.activeTab]}
          onPress={() => setActiveTab(0)}
        >
          <Text style={[styles.tabText, activeTab === 0 && styles.activeTabText]}>
            Categories ({categories.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 1 && styles.activeTab]}
          onPress={() => setActiveTab(1)}
        >
          <Text style={[styles.tabText, activeTab === 1 && styles.activeTabText]}>
            Doctors ({doctors.length})
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {activeTab === 0 ? (
          <>
            {renderCategoryForm()}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Treatment Categories</Text>
              {categories.map(renderCategoryItem)}
            </View>
          </>
        ) : (
          <>
            {renderDoctorForm()}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Doctors</Text>
              {doctors.map(renderDoctorItem)}
            </View>
          </>
        )}
      </ScrollView>

      {/* Edit Modal */}
      {showEditModal && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              Edit {editType === 'category' ? 'Category' : 'Doctor'}
            </Text>
            <ScrollView style={styles.modalScroll}>
              {editType === 'category' ? (
                <>
                  <TextInput
                    style={styles.input}
                    placeholder="Category Name"
                    value={editItem?.name || ''}
                    onChangeText={(text) => setEditItem({ ...editItem, name: text })}
                  />
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    placeholder="Description"
                    value={editItem?.description || ''}
                    onChangeText={(text) => setEditItem({ ...editItem, description: text })}
                    multiline
                    numberOfLines={3}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Base Cost"
                    value={editItem?.baseCost?.toString() || ''}
                    onChangeText={(text) => setEditItem({ ...editItem, baseCost: parseFloat(text) || 0 })}
                    keyboardType="numeric"
                  />
                  <View style={styles.switchRow}>
                    <Text style={styles.switchLabel}>Enable Payables</Text>
                    <Switch
                      value={editItem?.enablePayables ?? true}
                      onValueChange={(value) => setEditItem({ ...editItem, enablePayables: value })}
                    />
                  </View>
                </>
              ) : (
                <>
                  <TextInput
                    style={styles.input}
                    placeholder="Doctor Name"
                    value={editItem?.name || ''}
                    onChangeText={(text) => setEditItem({ ...editItem, name: text })}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Specialization"
                    value={editItem?.specialization || ''}
                    onChangeText={(text) => setEditItem({ ...editItem, specialization: text })}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Contact"
                    value={editItem?.contact || ''}
                    onChangeText={(text) => setEditItem({ ...editItem, contact: text })}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Rate Percentage"
                    value={editItem?.ratePercentage?.toString() || ''}
                    onChangeText={(text) => setEditItem({ ...editItem, ratePercentage: parseFloat(text) || 0 })}
                    keyboardType="numeric"
                  />
                  <View style={styles.switchRow}>
                    <Text style={styles.switchLabel}>Enable Payables</Text>
                    <Switch
                      value={editItem?.enablePayables ?? true}
                      onValueChange={(value) => setEditItem({ ...editItem, enablePayables: value })}
                    />
                  </View>
                </>
              )}
            </ScrollView>
            <View style={styles.modalActions}>
              <Button
                title="Cancel"
                onPress={() => setShowEditModal(false)}
                style={[styles.modalButton, styles.cancelButton]}
              />
              <Button
                title="Save"
                onPress={handleEditSave}
                disabled={processing}
                style={[styles.modalButton, styles.saveButton]}
              />
            </View>
          </View>
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
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  tab: {
    flex: 1,
    paddingVertical: theme.spacing.md,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: theme.colors.primary,
  },
  tabText: {
    ...theme.typography.body1,
    color: theme.colors.text.secondary,
  },
  activeTabText: {
    color: theme.colors.primary,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: theme.spacing.md,
  },
  formCard: {
    marginBottom: theme.spacing.lg,
  },
  formTitle: {
    ...theme.typography.h5,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.md,
  },
  formRow: {
    flexDirection: 'row',
    // gap property not supported in React Native StyleSheet
    marginBottom: theme.spacing.sm,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.sm,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.sm,
    ...theme.typography.body1,
    backgroundColor: theme.colors.surface,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.md,
  },
  switchLabel: {
    ...theme.typography.body1,
    color: theme.colors.text.primary,
  },
  addButton: {
    marginTop: theme.spacing.sm,
  },
  section: {
    marginTop: theme.spacing.lg,
  },
  sectionTitle: {
    ...theme.typography.h4,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.md,
  },
  itemCard: {
    marginBottom: theme.spacing.sm,
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    ...theme.typography.h5,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  itemDescription: {
    ...theme.typography.body2,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.xs,
  },
  itemCost: {
    ...theme.typography.body2,
    color: theme.colors.primary,
    fontWeight: '600',
  },
  itemActions: {
    flexDirection: 'row',
    // gap property not supported in React Native StyleSheet
    },
  actionButton: {
    padding: theme.spacing.sm,
  },
  itemFooter: {
    marginTop: theme.spacing.sm,
    paddingTop: theme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    // gap property not supported in React Native StyleSheet
    },
  statusText: {
    ...theme.typography.caption,
    color: theme.colors.text.secondary,
  },
  contactText: {
    ...theme.typography.caption,
    color: theme.colors.text.secondary,
    marginTop: theme.spacing.xs,
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modalContent: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    width: '90%',
    maxHeight: '80%',
  },
  modalTitle: {
    ...theme.typography.h4,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.lg,
    textAlign: 'center',
  },
  modalScroll: {
    maxHeight: 400,
  },
  modalActions: {
    flexDirection: 'row',
    // gap property not supported in React Native StyleSheet
    marginTop: theme.spacing.lg,
  },
  modalButton: {
    flex: 1,
  },
  cancelButton: {
    backgroundColor: theme.colors.text.secondary,
  },
  saveButton: {
    backgroundColor: theme.colors.primary,
  },
});

export default AdminTreatmentsScreen;
