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

interface TreatmentCategory {
  _id: string;
  name: string;
  description: string;
  baseCost: number;
  enablePayables: boolean;
  defaultDoctors: string[];
}

const AdminCategoriesScreen: React.FC = () => {
  const [categories, setCategories] = useState<TreatmentCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [processing, setProcessing] = useState(false);

  // Form state
  const [newCategory, setNewCategory] = useState({
    name: '',
    description: '',
    baseCost: '',
    enablePayables: true,
  });

  // Edit state
  const [selectedCategory, setSelectedCategory] = useState<TreatmentCategory | null>(null);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await ApiService.getTreatmentCategories();
      setCategories(response);
    } catch (error) {
      console.error('Error fetching categories:', error);
      setError('Failed to load categories');
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
      setShowAddModal(false);
      Alert.alert('Success', 'Category added successfully');
    } catch (error) {
      console.error('Error adding category:', error);
      Alert.alert('Error', 'Failed to add category');
    } finally {
      setProcessing(false);
    }
  };

  const handleEditCategory = (category: TreatmentCategory) => {
    setSelectedCategory(category);
    setShowCategoryModal(true);
  };

  const handleEditSave = async () => {
    if (!selectedCategory) return;

    try {
      setProcessing(true);
      const response = await ApiService.updateTreatmentCategory(selectedCategory._id, selectedCategory);
      setCategories(categories.map(cat => cat._id === selectedCategory._id ? response : cat));
      setShowCategoryModal(false);
      setSelectedCategory(null);
      Alert.alert('Success', 'Category updated successfully');
    } catch (error) {
      console.error('Error updating category:', error);
      Alert.alert('Error', 'Failed to update category');
    } finally {
      setProcessing(false);
    }
  };

  const handleDeleteCategory = async (categoryId: string) => {
    Alert.alert(
      'Delete Category',
      'Are you sure you want to delete this category?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setProcessing(true);
              await ApiService.deleteTreatmentCategory(categoryId);
              setCategories(categories.filter(cat => cat._id !== categoryId));
              Alert.alert('Success', 'Category deleted successfully');
            } catch (error) {
              console.error('Error deleting category:', error);
              Alert.alert('Error', 'Failed to delete category');
            } finally {
              setProcessing(false);
            }
          },
        },
      ]
    );
  };

  const closeModals = () => {
    setShowCategoryModal(false);
    setShowAddModal(false);
    setSelectedCategory(null);
  };

  const renderCategoryIcon = (category: TreatmentCategory) => (
    <TouchableOpacity
      style={styles.categoryIconContainer}
      onPress={() => handleEditCategory(category)}
      activeOpacity={0.7}
    >
      <View style={[
        styles.categoryIcon,
        { backgroundColor: category.enablePayables ? theme.colors.success + '20' : theme.colors.warning + '20' }
      ]}>
        <Ionicons
          name="medical"
          size={32}
          color={category.enablePayables ? theme.colors.success : theme.colors.warning}
        />
      </View>
      <Text style={styles.categoryIconName} numberOfLines={1}>
        {category.name}
      </Text>
      <Text style={styles.categoryIconCost} numberOfLines={1}>
        ₹{category.baseCost?.toLocaleString()}
      </Text>
      <View style={styles.categoryIconStatus}>
        <Ionicons
          name={category.enablePayables ? "checkmark-circle" : "close-circle"}
          size={12}
          color={category.enablePayables ? theme.colors.success : theme.colors.warning}
        />
        <Text style={styles.categoryIconStatusText}>
          {category.enablePayables ? 'Payables' : 'No Payables'}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const renderCategoryDetails = () => {
    if (!selectedCategory) return null;

    return (
      <View style={styles.categoryDetailsContainer}>
        <View style={styles.categoryDetailsHeader}>
          <View style={styles.categoryDetailsIcon}>
            <Ionicons
              name="medical"
              size={48}
              color={selectedCategory.enablePayables ? theme.colors.success : theme.colors.warning}
            />
          </View>
          <View style={styles.categoryDetailsInfo}>
            <Text style={styles.categoryDetailsName}>{selectedCategory.name}</Text>
            <Text style={styles.categoryDetailsDescription}>{selectedCategory.description}</Text>
            <Text style={styles.categoryDetailsCost}>₹{selectedCategory.baseCost?.toLocaleString()}</Text>
            <View style={styles.categoryDetailsStatus}>
              <Ionicons
                name={selectedCategory.enablePayables ? "checkmark-circle" : "close-circle"}
                size={16}
                color={selectedCategory.enablePayables ? theme.colors.success : theme.colors.warning}
              />
              <Text style={styles.categoryDetailsStatusText}>
                {selectedCategory.enablePayables ? 'Payables Enabled' : 'Payables Disabled'}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.categoryDetailsActions}>
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
              handleDeleteCategory(selectedCategory._id);
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
      <Text style={styles.addFormTitle}>Add New Category</Text>
      <TextInput
        style={styles.input}
        placeholder="Category Name"
        value={newCategory.name}
        onChangeText={(text) => setNewCategory({ ...newCategory, name: text })}
      />
      <TextInput
        style={[styles.input, styles.textArea]}
        placeholder="Description"
        value={newCategory.description}
        onChangeText={(text) => setNewCategory({ ...newCategory, description: text })}
        multiline
        numberOfLines={3}
      />
      <TextInput
        style={styles.input}
        placeholder="Base Cost"
        value={newCategory.baseCost}
        onChangeText={(text) => setNewCategory({ ...newCategory, baseCost: text })}
        keyboardType="numeric"
      />
      <View style={styles.switchRow}>
        <Text style={styles.switchLabel}>Enable Payables</Text>
        <Switch
          value={newCategory.enablePayables}
          onValueChange={(value) => setNewCategory({ ...newCategory, enablePayables: value })}
        />
      </View>
      <View style={styles.addFormActions}>
        <Button
          title="Cancel"
          onPress={() => setShowAddModal(false)}
          style={[styles.addFormButton, styles.cancelButton]}
        />
        <Button
          title="Add Category"
          onPress={handleAddCategory}
          disabled={processing || !newCategory.name.trim() || !newCategory.baseCost}
          style={[styles.addFormButton, styles.addButton]}
        />
      </View>
    </View>
  );

  const renderEditForm = () => {
    if (!selectedCategory) return null;

    return (
      <View style={styles.editFormContainer}>
        <Text style={styles.editFormTitle}>Edit Category</Text>
        <TextInput
          style={styles.input}
          placeholder="Category Name"
          value={selectedCategory.name}
          onChangeText={(text) => setSelectedCategory({ ...selectedCategory, name: text })}
        />
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Description"
          value={selectedCategory.description}
          onChangeText={(text) => setSelectedCategory({ ...selectedCategory, description: text })}
          multiline
          numberOfLines={3}
        />
        <TextInput
          style={styles.input}
          placeholder="Base Cost"
          value={selectedCategory.baseCost?.toString() || ''}
          onChangeText={(text) => setSelectedCategory({ ...selectedCategory, baseCost: parseFloat(text) || 0 })}
          keyboardType="numeric"
        />
        <View style={styles.switchRow}>
          <Text style={styles.switchLabel}>Enable Payables</Text>
          <Switch
            value={selectedCategory.enablePayables}
            onValueChange={(value) => setSelectedCategory({ ...selectedCategory, enablePayables: value })}
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
          <Text style={styles.loadingText}>Loading categories...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Treatment Categories</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={fetchCategories} disabled={loading}>
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
          <Text style={styles.sectionTitle}>Categories ({categories.length})</Text>
          <View style={styles.categoryIconGrid}>
            {categories.map(category => (
              <View key={category._id}>
                {renderCategoryIcon(category)}
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Add Category Modal */}
      {showAddModal && (
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.keyboardAvoidingView}
          >
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Add Category</Text>
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

      {/* Edit Category Modal */}
      {showCategoryModal && (
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.keyboardAvoidingView}
          >
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Category Details</Text>
                <TouchableOpacity onPress={closeModals} style={styles.closeButton}>
                  <Ionicons name="close" size={24} color={theme.colors.text.secondary} />
                </TouchableOpacity>
              </View>
              <ScrollView style={styles.modalScrollView} showsVerticalScrollIndicator={false}>
                {renderCategoryDetails()}
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
  categoryIconGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    // gap property not supported in React Native StyleSheet
    // Using marginRight and marginBottom on items instead
    marginBottom: theme.spacing.lg,
  },
  categoryIconContainer: {
    alignItems: 'center',
    width: '30%',
    minWidth: 100,
    marginRight: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  categoryIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.sm,
  },
  categoryIconName: {
    ...theme.typography.caption,
    color: theme.colors.text.primary,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: theme.spacing.xs,
  },
  categoryIconCost: {
    ...theme.typography.caption,
    color: theme.colors.primary,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: theme.spacing.xs,
  },
  categoryIconStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    // gap property not supported in React Native StyleSheet
    },
  categoryIconStatusText: {
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
  categoryDetailsContainer: {
    padding: theme.spacing.lg,
  },
  categoryDetailsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  categoryDetailsIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: theme.colors.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.md,
  },
  categoryDetailsInfo: {
    flex: 1,
  },
  categoryDetailsName: {
    ...theme.typography.h4,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  categoryDetailsDescription: {
    ...theme.typography.body1,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.xs,
  },
  categoryDetailsCost: {
    ...theme.typography.body2,
    color: theme.colors.primary,
    fontWeight: '600',
    marginBottom: theme.spacing.xs,
  },
  categoryDetailsStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    // gap property not supported in React Native StyleSheet
    },
  categoryDetailsStatusText: {
    ...theme.typography.caption,
    color: theme.colors.text.secondary,
  },
  categoryDetailsActions: {
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
  textArea: {
    height: 80,
    textAlignVertical: 'top',
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

export default AdminCategoriesScreen;
