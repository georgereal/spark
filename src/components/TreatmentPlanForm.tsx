import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../theme';
import Button from './Button';
import Card from './Card';

// Custom Number Stepper Component
const NumberStepper = React.memo(({ value, onValueChange, min = 1, max = 20 }: {
  value: number;
  onValueChange: (value: number) => void;
  min?: number;
  max?: number;
}) => {
  const [isPressed, setIsPressed] = useState(false);
  const [pressDirection, setPressDirection] = useState<'up' | 'down' | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const handlePressIn = (direction: 'up' | 'down') => {
    setPressDirection(direction);
    setIsPressed(true);
    
    // Immediate change
    const newValue = direction === 'up' 
      ? Math.min(max, value + 1)
      : Math.max(min, value - 1);
    onValueChange(newValue);
    
    // Start repeating after 500ms
    intervalRef.current = setTimeout(() => {
      const repeatInterval = setInterval(() => {
        onValueChange(prevValue => {
          const nextValue = direction === 'up' 
            ? Math.min(max, prevValue + 1)
            : Math.max(min, prevValue - 1);
          return nextValue;
        });
      }, 150);
      
      intervalRef.current = repeatInterval;
    }, 500);
  };

  const handlePressOut = () => {
    setIsPressed(false);
    setPressDirection(null);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  return (
    <View style={numberStepperStyles.numberStepperContainer}>
      <View style={[
        numberStepperStyles.numberStepper,
        isPressed && numberStepperStyles.numberStepperPressed
      ]}>
        <TouchableOpacity
          style={numberStepperStyles.stepperButton}
          onPressIn={() => handlePressIn('down')}
          onPressOut={handlePressOut}
          activeOpacity={0.7}
        >
          <Ionicons 
            name="remove" 
            size={16} 
            color={pressDirection === 'down' ? theme.colors.primary : theme.colors.text.secondary} 
          />
        </TouchableOpacity>
        
        <View style={numberStepperStyles.stepperValue}>
          <Text style={numberStepperStyles.numberStepperText}>{value}</Text>
        </View>
        
        <TouchableOpacity
          style={numberStepperStyles.stepperButton}
          onPressIn={() => handlePressIn('up')}
          onPressOut={handlePressOut}
          activeOpacity={0.7}
        >
          <Ionicons 
            name="add" 
            size={16} 
            color={pressDirection === 'up' ? theme.colors.primary : theme.colors.text.secondary} 
          />
        </TouchableOpacity>
      </View>
    </View>
  );
});

interface TreatmentCategory {
  _id: string;
  name: string;
  baseCost: number;
  description?: string;
}

interface TreatmentCost {
  _id?: string;
  categoryId: string;
  categoryName: string;
  assignedDoctors: string[];
  baseCost: number;
  particulars: string;
  quantity: number;
  materialCost: number;
  totalCost: number;
}

interface TreatmentPlan {
  _id?: string;
  treatmentPlanId?: string;
  name?: string; // Optional field for identification
  category: any;
  categoryItems: any[];
  costs: TreatmentCost[];
  doctors: any[];
  totalCost: number;
  totalMaterialCost: number;
  notes: string;
  selectedCategories: string[];
  // Per-category dates and status
  startDate: string;
  endDate: string;
  status: string;
}

interface TreatmentPlanFormProps {
  plan?: TreatmentPlan | null;
  onSave: (plan: TreatmentPlan) => void;
  onCancel: () => void;
}

const TreatmentPlanForm: React.FC<TreatmentPlanFormProps> = ({
  plan,
  onSave,
  onCancel,
}) => {
  const [formData, setFormData] = useState<TreatmentPlan>({
    name: '',
    category: null,
    categoryItems: [],
    costs: [],
    doctors: [],
    totalCost: 0,
    totalMaterialCost: 0,
    notes: '',
    selectedCategories: [],
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    status: 'pending',
  });

  const [errors, setErrors] = useState<Partial<TreatmentPlan>>({});
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingCostIndex, setEditingCostIndex] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAllCategories, setShowAllCategories] = useState(false);

  // Mock treatment categories - in real app, this would come from API
  const treatmentCategories: TreatmentCategory[] = [
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
    { _id: '11', name: 'Orthodontics', baseCost: 50000, description: 'Braces and alignment' },
    { _id: '12', name: 'Whitening', baseCost: 3000, description: 'Teeth whitening treatment' },
    { _id: '13', name: 'Gum Treatment', baseCost: 4000, description: 'Periodontal treatment' },
    { _id: '14', name: 'Wisdom Tooth', baseCost: 5000, description: 'Wisdom tooth extraction' },
    { _id: '15', name: 'Emergency', baseCost: 2500, description: 'Emergency dental care' },
  ];

  // Memoized expensive operations
  const filteredCategories = useMemo(() => {
    const availableCategories = treatmentCategories.filter(
      category => !formData.selectedCategories.includes(category._id)
    );
    
    if (searchQuery.trim()) {
      return availableCategories.filter(category =>
        category.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        category.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    return availableCategories;
  }, [formData.selectedCategories, searchQuery]);

  const displayedCategories = useMemo(() => {
    return showAllCategories ? filteredCategories : filteredCategories.slice(0, 6);
  }, [filteredCategories, showAllCategories]);

  const quantityOptions = useMemo(() => {
    return Array.from({ length: 20 }, (_, i) => i + 1);
  }, []);



  useEffect(() => {
    if (plan) {
      setFormData({
        ...plan,
        name: plan.name || '',
        category: plan.category || null,
        categoryItems: plan.categoryItems || [],
        costs: plan.costs || [],
        doctors: plan.doctors || [],
        totalCost: plan.totalCost || 0,
        totalMaterialCost: plan.totalMaterialCost || 0,
        notes: plan.notes || '',
        selectedCategories: plan.selectedCategories || [],
        startDate: plan.startDate || new Date().toISOString().split('T')[0],
        endDate: plan.endDate || '',
        status: plan.status || 'pending',
      });
    }
  }, [plan]);

  const handleInputChange = (field: keyof TreatmentPlan, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: undefined
      }));
    }
  };

  const handleAddCategory = (categoryId: string) => {
    const category = treatmentCategories.find(c => c._id === categoryId);
    if (!category) return;

    const newCost: TreatmentCost = {
      categoryId: category._id,
      categoryName: category.name,
      assignedDoctors: [],
      baseCost: category.baseCost,
      particulars: '',
      quantity: 1,
      materialCost: 0,
      totalCost: category.baseCost,
    };

    setFormData(prev => ({
      ...prev,
      costs: [...prev.costs, newCost],
      selectedCategories: [...prev.selectedCategories, categoryId],
    }));
  };

  const handleUpdateCost = (index: number, field: keyof TreatmentCost, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      costs: prev.costs.map((cost, i) => {
        if (i === index) {
          const updatedCost = { ...cost, [field]: value };
          // Recalculate total cost: (baseCost * quantity) + materialCost
          const treatmentCost = updatedCost.baseCost * (updatedCost.quantity || 1);
          updatedCost.totalCost = treatmentCost + (updatedCost.materialCost || 0);
          return updatedCost;
        }
        return cost;
      })
    }));
  };

  const handleRemoveCost = (index: number) => {
    const costToRemove = formData.costs[index];
    setFormData(prev => ({
      ...prev,
      costs: prev.costs.filter((_, i) => i !== index),
      selectedCategories: prev.selectedCategories.filter(id => id !== costToRemove.categoryId),
    }));
  };

  const calculateTotals = () => {
    const totalCost = formData.costs.reduce((sum, cost) => sum + cost.totalCost, 0);
    const totalMaterialCost = formData.costs.reduce((sum, cost) => sum + cost.materialCost, 0);
    
    setFormData(prev => ({
      ...prev,
      totalCost,
      totalMaterialCost,
    }));
  };

  useEffect(() => {
    calculateTotals();
  }, [formData.costs]);

  const validateForm = (): boolean => {
    const newErrors: Partial<TreatmentPlan> = {};

    // Name is optional - no validation needed

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (!validateForm()) {
      return;
    }

    const planToSave: TreatmentPlan = {
      ...formData,
      treatmentPlanId: plan?._id || plan?.treatmentPlanId || `plan_${Date.now()}`,
    };

    onSave(planToSave);
  };

  const renderInputGroup = (label: string, children: React.ReactNode, required = false) => (
    <View style={styles.inputGroup}>
      <Text style={styles.inputLabel}>
        {label} {required && <Text style={styles.required}>*</Text>}
      </Text>
      {children}
    </View>
  );

  const renderCategoryModal = () => (
    <Modal
      visible={showCategoryModal}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Select Treatment Categories</Text>
          <TouchableOpacity onPress={() => setShowCategoryModal(false)}>
            <Ionicons name="close" size={24} color={theme.colors.text.primary} />
          </TouchableOpacity>
        </View>
        
        <ScrollView style={styles.modalContent}>
          {treatmentCategories
            .filter(category => !formData.selectedCategories.includes(category._id))
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

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Basic Information */}
        <Card style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Basic Information</Text>
          
          {renderInputGroup('Name (Optional)', (
            <TextInput
              style={[styles.input, errors.name && styles.inputError]}
              value={formData.name || ''}
              onChangeText={(value) => handleInputChange('name', value)}
              placeholder="Enter treatment plan name (optional)"
            />
          ), false)}

          <View style={styles.row}>
            {renderInputGroup('Start Date', (
              <TextInput
                style={[styles.input, styles.halfWidth]}
                value={formData.startDate || ''}
                onChangeText={(value) => handleInputChange('startDate', value)}
                placeholder="YYYY-MM-DD"
              />
            ), true)}
            
            {renderInputGroup('End Date', (
              <TextInput
                style={[styles.input, styles.halfWidth]}
                value={formData.endDate || ''}
                onChangeText={(value) => handleInputChange('endDate', value)}
                placeholder="YYYY-MM-DD"
              />
            ))}
          </View>

          {renderInputGroup('Status', (
            <View style={styles.statusContainer}>
              {['pending', 'in-progress', 'completed', 'cancelled'].map((status) => (
                <TouchableOpacity
                  key={status}
                  style={[
                    styles.statusOption,
                    (formData.status || 'pending') === status && styles.statusOptionSelected,
                  ]}
                  onPress={() => handleInputChange('status', status)}
                >
                  <Text style={[
                    styles.statusText,
                    (formData.status || 'pending') === status && styles.statusTextSelected,
                  ]}>
                    {status.charAt(0).toUpperCase() + status.slice(1).replace('-', ' ')}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          ), true)}

        </Card>

        {/* Treatment Categories */}
        <Card style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Treatment Categories</Text>
          </View>

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
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  placeholder="Search treatments..."
                  placeholderTextColor={theme.colors.text.secondary}
                />
                {searchQuery.length > 0 && (
                  <TouchableOpacity onPress={() => setSearchQuery('')}>
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
            
            {filteredCategories.length === 0 && searchQuery.length > 0 && (
              <View style={styles.noResultsContainer}>
                <Ionicons name="search" size={24} color={theme.colors.text.secondary} />
                <Text style={styles.noResultsText}>No treatments found for "{searchQuery}"</Text>
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

          {formData.costs.length === 0 ? (
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
              <Text style={styles.costsListTitle}>Added Categories ({formData.costs.length})</Text>
              {formData.costs.map((cost, index) => (
                <View key={index} style={styles.costRow}>
                  <View style={styles.costRowHeader}>
                    <View style={styles.costRowHeaderLeft}>
                      <View style={styles.costRowIcon}>
                        <Ionicons name="medical" size={16} color={theme.colors.primary} />
                      </View>
                      <Text style={styles.costCategoryName}>{cost.categoryName}</Text>
                    </View>
                    <TouchableOpacity
                      style={styles.removeCostButton}
                      onPress={() => handleRemoveCost(index)}
                    >
                      <Ionicons name="close-circle" size={20} color={theme.colors.error} />
                    </TouchableOpacity>
                  </View>
                  
                  <View style={styles.costRowContent}>
                    {/* First row: Base Cost and Qty */}
                    <View style={styles.costFieldRow}>
                      <View style={styles.costFieldBase}>
                        <Text style={styles.costFieldLabel}>Base Cost</Text>
                        <TextInput
                          style={styles.costInput}
                          value={cost.baseCost.toString()}
                          onChangeText={(value) => handleUpdateCost(index, 'baseCost', parseFloat(value) || 0)}
                          keyboardType="numeric"
                          placeholder="0"
                        />
                      </View>
                      
                      <View style={styles.costFieldQty}>
                        <Text style={styles.costFieldLabel}>Qty</Text>
                        <NumberStepper
                          value={cost.quantity || 1}
                          onValueChange={(value) => handleUpdateCost(index, 'quantity', value)}
                          min={1}
                          max={20}
                        />
                      </View>
                    </View>
                    
                    {/* Second row: Material Cost */}
                    <View style={styles.costFieldRow}>
                      <View style={styles.costFieldMaterialFull}>
                        <Text style={styles.costFieldLabel}>Material Cost</Text>
                        <TextInput
                          style={styles.costInput}
                          value={cost.materialCost.toString()}
                          onChangeText={(value) => handleUpdateCost(index, 'materialCost', parseFloat(value) || 0)}
                          keyboardType="numeric"
                          placeholder="0"
                        />
                      </View>
                    </View>
                    
                    <View style={styles.costField}>
                      <Text style={styles.costFieldLabel}>Particulars</Text>
                      <TextInput
                        style={styles.costInputFull}
                        value={cost.particulars}
                        onChangeText={(value) => handleUpdateCost(index, 'particulars', value)}
                        placeholder="e.g., Composite Filling, Tooth #12"
                      />
                    </View>
                    
                    <View style={styles.costTotalRow}>
                      <View style={styles.costBreakdown}>
                        <Text style={styles.costBreakdownText}>
                          ₹{cost.baseCost} × {cost.quantity || 1} + ₹{cost.materialCost || 0}
                        </Text>
                      </View>
                      <View style={styles.costTotalRight}>
                        <Text style={styles.costTotalLabel}>Total:</Text>
                        <Text style={styles.costTotal}>₹{cost.totalCost}</Text>
                      </View>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* Total Summary */}
          {formData.costs.length > 0 && (
            <View style={styles.totalSummary}>
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Material Total:</Text>
                <Text style={styles.totalValue}>₹{formData.totalMaterialCost}</Text>
              </View>
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Treatment Total:</Text>
                <Text style={styles.totalValue}>₹{formData.totalCost - formData.totalMaterialCost}</Text>
              </View>
              <View style={[styles.totalRow, styles.grandTotalRow]}>
                <Text style={styles.grandTotalLabel}>Grand Total:</Text>
                <Text style={styles.grandTotalValue}>₹{formData.totalCost}</Text>
              </View>
            </View>
          )}
        </Card>

        {/* Status */}
        <Card style={styles.sectionCard}>
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
          ), true)}
        </Card>
      </ScrollView>

      <View style={styles.buttonContainer}>
        <Button
          title="Cancel"
          onPress={onCancel}
          variant="outline"
          style={styles.cancelButton}
        />
        <Button
          title="Save Plan"
          onPress={handleSave}
          style={styles.saveButton}
        />
      </View>

      {renderCategoryModal()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollView: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  sectionCard: {
    marginHorizontal: 0,
    marginVertical: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  inputGroup: {
    marginBottom: theme.spacing.md,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
  },
  required: {
    color: theme.colors.error,
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
    height: 100,
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
  
  // Quick Add Categories
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
    borderRadius: theme.spacing.borderRadius.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: theme.colors.text.primary,
    marginLeft: theme.spacing.sm,
    marginRight: theme.spacing.sm,
  },
  quickAddGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    // gap property not supported in React Native StyleSheet
    marginBottom: theme.spacing.md,
  },
  quickAddItem: {
    width: '30%',
    backgroundColor: theme.colors.white,
    borderRadius: theme.spacing.borderRadius.md,
    padding: theme.spacing.sm,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
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
    fontSize: 11,
    color: theme.colors.primary,
    fontWeight: '600',
  },
  noResultsContainer: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xl,
    paddingHorizontal: theme.spacing.lg,
  },
  noResultsText: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    marginTop: theme.spacing.sm,
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.spacing.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.primary,
    borderStyle: 'dashed',
    marginTop: theme.spacing.sm,
  },
  viewAllButtonText: {
    fontSize: 14,
    color: theme.colors.primary,
    fontWeight: '500',
    marginLeft: theme.spacing.xs,
  },
  instructionText: {
    fontSize: 12,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.md,
    lineHeight: 16,
  },
  
  // Empty Costs
  emptyCostsContainer: {
    alignItems: 'center',
    backgroundColor: theme.colors.background,
    padding: theme.spacing.xl,
    borderRadius: theme.spacing.borderRadius.md,
    marginBottom: theme.spacing.md,
  },
  emptyCostsIcon: {
    marginBottom: theme.spacing.md,
  },
  emptyCostsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
  },
  emptyCostsText: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  
  // Costs List
  costsList: {
    marginBottom: theme.spacing.md,
  },
  costsListTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.md,
  },
  costRow: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.spacing.borderRadius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  costRowHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  costRowHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  costRowIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: theme.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.sm,
  },
  costCategoryName: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  removeCostButton: {
    padding: theme.spacing.xs,
  },
  costRowContent: {
    // gap property not supported in React Native StyleSheet
    },
  costFieldRow: {
    flexDirection: 'row',
    // gap property not supported in React Native StyleSheet
    alignItems: 'flex-end',
  },
  costField: {
    flex: 1,
  },
  costFieldBase: {
    flex: 1.5,
  },
  costFieldQty: {
    flex: 1.2,
    maxWidth: 140,
  },
  costFieldMaterial: {
    flex: 1.5,
  },
  costFieldMaterialFull: {
    flex: 1,
  },
  costFieldLabel: {
    fontSize: 12,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.xs,
    fontWeight: '500',
  },
  costInput: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.spacing.borderRadius.sm,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.sm,
    fontSize: 14,
    color: theme.colors.text.primary,
    backgroundColor: theme.colors.background,
    textAlign: 'right',
    height: 32,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  costInputFull: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.spacing.borderRadius.sm,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.sm,
    fontSize: 14,
    color: theme.colors.text.primary,
    backgroundColor: theme.colors.background,
    includeFontPadding: false,
    textAlignVertical: 'center',
    minHeight: 32,
  },
  costTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: theme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    marginTop: theme.spacing.sm,
  },
  costBreakdown: {
    flex: 1,
  },
  costBreakdownText: {
    fontSize: 12,
    color: theme.colors.text.secondary,
    fontStyle: 'italic',
  },
  costTotalRight: {
    flexDirection: 'row',
    alignItems: 'center',
    // gap property not supported in React Native StyleSheet
    },
  costTotalLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.text.primary,
  },
  costTotal: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.primary,
  },
  
  // Total Summary
  totalSummary: {
    backgroundColor: theme.colors.background,
    borderRadius: theme.spacing.borderRadius.md,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.text.primary,
  },
  totalValue: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  grandTotalRow: {
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    paddingTop: theme.spacing.sm,
    marginTop: theme.spacing.sm,
  },
  grandTotalLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  grandTotalValue: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.primary,
  },
  
  // Status
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
  
  // Modal
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
  modalContent: {
    flex: 1,
    padding: theme.spacing.lg,
  },
  categoryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: theme.colors.white,
    borderRadius: theme.spacing.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
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
    fontSize: 12,
    color: theme.colors.text.secondary,
  },
  categoryCost: {
    backgroundColor: theme.colors.background,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.spacing.borderRadius.md,
  },
  categoryCostText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.primary,
  },
  
  // Buttons
  buttonContainer: {
    flexDirection: 'row',
    // gap property not supported in React Native StyleSheet
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.white,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  cancelButton: {
    flex: 1,
  },
  saveButton: {
    flex: 1,
  },
});

// NumberStepper styles
const numberStepperStyles = StyleSheet.create({
  numberStepperContainer: {
    height: 32,
    justifyContent: 'center',
  },
  numberStepper: {
    height: 32,
    backgroundColor: theme.colors.background,
    borderRadius: theme.spacing.borderRadius.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
  },
  numberStepperPressed: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primary + '10',
  },
  stepperButton: {
    height: 32,
    width: 32,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },
  stepperValue: {
    flex: 1,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderLeftColor: theme.colors.border,
    borderRightColor: theme.colors.border,
  },
  numberStepperText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text.primary,
    textAlign: 'center',
  },
});

export default TreatmentPlanForm;
