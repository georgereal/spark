import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Modal,
  ScrollView,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { theme } from '../theme';
import ApiService, { Expense } from '../services/api';
import FloatingActionButton from '../components/FloatingActionButton';
import { Card, Button } from '../components';

const ExpensesListScreen: React.FC = () => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [filteredExpenses, setFilteredExpenses] = useState<Expense[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [amountFilter, setAmountFilter] = useState({ min: '', max: '' });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0,
    hasMore: true
  });
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [dashboardLoading, setDashboardLoading] = useState(false);
  const [selectedFinancialYear, setSelectedFinancialYear] = useState('2024-25');
  const [showYearSelector, setShowYearSelector] = useState(false);
  const navigation = useNavigation();

  const financialYears = ['2023-24', '2024-25', '2025-26'];

  const fetchExpenses = async (page: number = 1, append: boolean = false) => {
    try {
      const params: any = {
        page,
        limit: pagination.limit,
        sortBy: 'dateObj',
        sortOrder: 'desc',
        year: selectedFinancialYear
      };

      // Add filters only if they have values
      if (searchQuery && searchQuery.trim()) {
        params.search = searchQuery.trim();
      }
      if (categoryFilter && categoryFilter !== 'all') {
        params.category = categoryFilter;
      }
      if (typeFilter && typeFilter !== 'all') {
        params.typeOfExpense = typeFilter;
      }
      if (amountFilter.min && amountFilter.min.trim()) {
        params.minAmount = parseFloat(amountFilter.min);
      }
      if (amountFilter.max && amountFilter.max.trim()) {
        params.maxAmount = parseFloat(amountFilter.max);
      }

      console.log('API params being sent:', params);
      const data = await ApiService.getExpenses(params);
      console.log('Expenses data received:', data);
      
      const expensesData = data.expenses || [];
      const paginationData = data.pagination || { page: 1, limit: 20, total: 0, pages: 0 };
      
      if (append) {
        // Append new data to existing data
        setExpenses(prev => [...prev, ...expensesData]);
        setFilteredExpenses(prev => [...prev, ...expensesData]);
      } else {
        // Replace existing data
        setExpenses(expensesData);
        setFilteredExpenses(expensesData);
      }
      
      setPagination({
        page: paginationData.page,
        limit: paginationData.limit,
        total: paginationData.total,
        pages: paginationData.pages,
        hasMore: paginationData.page < paginationData.pages
      });
    } catch (error: any) {
      console.error('Error fetching expenses:', error);
      if (error.message?.includes('Authentication required')) {
        Alert.alert('Authentication Error', 'Please login again');
      } else {
        Alert.alert('Error', 'Failed to fetch expenses. Please check your connection.');
      }
      if (!append) {
        setExpenses([]);
        setFilteredExpenses([]);
      }
    } finally {
      setIsLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  };

  const fetchDashboard = async () => {
    try {
      setDashboardLoading(true);
      console.log('Fetching expenses dashboard for year:', selectedFinancialYear);
      const response = await ApiService.getExpensesDashboard({ year: selectedFinancialYear });
      console.log('Expenses dashboard data received:', response);
      setDashboardData(response);
    } catch (error) {
      console.error('Error fetching expenses dashboard data:', error);
    } finally {
      setDashboardLoading(false);
    }
  };

  const handleYearChange = (year: string) => {
    console.log('Year changing from', selectedFinancialYear, 'to', year);
    setSelectedFinancialYear(year);
    setShowYearSelector(false);
    // Reset pagination - useEffect will handle the API calls
    setPagination(prev => ({ ...prev, page: 1, hasMore: true }));
  };

  useEffect(() => {
    fetchExpenses();
    fetchDashboard();
  }, []);

  // Watch for financial year changes (skip initial load)
  useEffect(() => {
    if (selectedFinancialYear && !isLoading && !dashboardLoading) {
      console.log('Financial year changed, refetching data for:', selectedFinancialYear);
      fetchExpenses(1, false);
      fetchDashboard();
    }
  }, [selectedFinancialYear]);

  // Handle filter changes by refetching data
  useEffect(() => {
    // Only refetch if we're not in the initial loading state
    if (!isLoading) {
      console.log('Filters changed, refetching data...', { searchQuery, categoryFilter, typeFilter, amountFilter });
      // Reset pagination when filters change
      setPagination(prev => ({ ...prev, page: 1, hasMore: true }));
      fetchExpenses(1, false);
    }
  }, [searchQuery, categoryFilter, typeFilter, amountFilter]);

  const loadMoreExpenses = async () => {
    if (loadingMore || !pagination.hasMore) return;
    
    setLoadingMore(true);
    await fetchExpenses(pagination.page + 1, true);
  };

  const getCategoryIcon = (category?: string) => {
    switch (category?.toLowerCase()) {
      case 'office supplies':
        return 'briefcase';
      case 'medical supplies':
        return 'medical';
      case 'utilities':
        return 'flash';
      case 'rent':
        return 'home';
      case 'equipment':
        return 'construct';
      case 'marketing':
        return 'megaphone';
      case 'travel':
        return 'airplane';
      case 'food':
        return 'restaurant';
      default:
        return 'receipt';
    }
  };

  const getCategoryColor = (category?: string) => {
    switch (category?.toLowerCase()) {
      case 'office supplies':
        return theme.colors.primary;
      case 'medical supplies':
        return theme.colors.error;
      case 'utilities':
        return theme.colors.warning;
      case 'rent':
        return theme.colors.text.secondary;
      case 'equipment':
        return theme.colors.success;
      case 'marketing':
        return '#9C27B0';
      case 'travel':
        return '#FF5722';
      case 'food':
        return '#FF9800';
      default:
        return theme.colors.primary;
    }
  };

  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString('en-IN')}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const handleExpensePress = (expense: Expense) => {
    setSelectedExpense(expense);
    setShowDetailsModal(true);
  };

  const handleFilterPress = () => {
    setShowFilterModal(true);
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setCategoryFilter('all');
    setTypeFilter('all');
    setAmountFilter({ min: '', max: '' });
  };

  const applyFilters = () => {
    setShowFilterModal(false);
  };

  const onRefresh = () => {
    setRefreshing(true);
    setPagination(prev => ({ ...prev, page: 1, hasMore: true }));
    fetchExpenses(1, false);
    fetchDashboard();
  };

  const handleScroll = (event: any) => {
    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
    const isCloseToBottom = layoutMeasurement.height + contentOffset.y >= contentSize.height - 20;
    
    if (isCloseToBottom && pagination.hasMore && !loadingMore) {
      loadMoreExpenses();
    }
  };

  const renderExpenseIcon = (expense: Expense) => (
    <TouchableOpacity
      key={expense._id}
      style={styles.expenseIconContainer}
      onPress={() => handleExpensePress(expense)}
      activeOpacity={0.7}
    >
      <View style={[styles.expenseIcon, { backgroundColor: getCategoryColor(expense.category) + '20' }]}>
        <Ionicons 
          name={getCategoryIcon(expense.category) as any} 
          size={32} 
          color={getCategoryColor(expense.category)} 
        />
      </View>
      <Text style={styles.expenseIconTitle} numberOfLines={2}>
        {expense.narration || 'Expense'}
      </Text>
      <Text style={styles.expenseIconAmount}>
        {formatCurrency(expense.withdrawal)}
      </Text>
      <Text style={styles.expenseIconCategory}>
        {expense.category || 'Uncategorized'}
      </Text>
    </TouchableOpacity>
  );

  const renderDashboard = () => (
    <View style={styles.dashboardContainer}>
      <View style={styles.dashboardHeader}>
        <View style={styles.dashboardTitleContainer}>
          <Text style={styles.dashboardTitle}>Expenses Summary</Text>
          <TouchableOpacity
            style={styles.yearSelector}
            onPress={() => setShowYearSelector(!showYearSelector)}
            disabled={dashboardLoading}
          >
            <Text style={styles.yearText}>FY {selectedFinancialYear}</Text>
            {dashboardLoading ? (
              <Ionicons name="refresh" size={16} color={theme.colors.primary} />
            ) : (
              <Ionicons name="chevron-down" size={16} color={theme.colors.primary} />
            )}
          </TouchableOpacity>
        </View>
        <TouchableOpacity
          style={styles.refreshButton}
          onPress={fetchDashboard}
        >
          <Ionicons name="refresh" size={20} color={theme.colors.primary} />
        </TouchableOpacity>
      </View>

      {showYearSelector && (
        <View style={styles.yearSelectorContainer}>
          {financialYears.map((year) => (
            <TouchableOpacity
              key={year}
              style={[
                styles.yearOption,
                selectedFinancialYear === year && styles.yearOptionSelected
              ]}
              onPress={() => handleYearChange(year)}
            >
              <Text
                style={[
                  styles.yearOptionText,
                  selectedFinancialYear === year && styles.yearOptionTextSelected
                ]}
              >
                FY {year}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      <View style={styles.dashboardContent}>
        {dashboardLoading ? (
          <View style={styles.dashboardLoading}>
            <Text style={styles.dashboardLoadingText}>Loading dashboard...</Text>
          </View>
        ) : dashboardData ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.dashboardScrollView}>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryCardTitle}>Total Expenses</Text>
              <Text style={styles.summaryCardAmount}>
                ₹{dashboardData.totalAmount?.toLocaleString('en-IN') || '0'}
              </Text>
              <Text style={styles.summaryCardLabel}>FY {selectedFinancialYear}</Text>
            </View>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryCardTitle}>Business</Text>
              <Text style={styles.summaryCardAmount}>
                ₹{dashboardData.businessAmount?.toLocaleString('en-IN') || '0'}
              </Text>
              <Text style={styles.summaryCardLabel}>Business Expenses</Text>
            </View>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryCardTitle}>Personal</Text>
              <Text style={styles.summaryCardAmount}>
                ₹{dashboardData.personalAmount?.toLocaleString('en-IN') || '0'}
              </Text>
              <Text style={styles.summaryCardLabel}>Personal Expenses</Text>
            </View>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryCardTitle}>Count</Text>
              <Text style={styles.summaryCardAmount}>
                {dashboardData.totalCount || '0'}
              </Text>
              <Text style={styles.summaryCardLabel}>Total Transactions</Text>
            </View>
          </ScrollView>
        ) : (
          <View style={styles.dashboardError}>
            <Text style={styles.dashboardErrorText}>Failed to load dashboard data</Text>
            <TouchableOpacity style={styles.retryButton} onPress={fetchDashboard}>
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );

  const renderIconGrid = () => (
    <View>
      <View style={styles.iconGrid}>
        {filteredExpenses.map(renderExpenseIcon)}
      </View>
      {loadingMore && (
        <View style={styles.loadingMoreContainer}>
          <Text style={styles.loadingMoreText}>Loading more expenses...</Text>
        </View>
      )}
      {!pagination.hasMore && filteredExpenses.length > 0 && (
        <View style={styles.endOfListContainer}>
          <Text style={styles.endOfListText}>No more expenses to load</Text>
        </View>
      )}
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="receipt-outline" size={64} color="#ccc" />
      <Text style={styles.emptyStateTitle}>No Expenses Found</Text>
      <Text style={styles.emptyStateSubtitle}>
        Add your first expense to get started
      </Text>
      <TouchableOpacity
        style={styles.addButton}
        onPress={() => navigation.navigate('ExpenseForm')}
      >
        <Ionicons name="add" size={20} color="white" />
        <Text style={styles.addButtonText}>Add Expense</Text>
      </TouchableOpacity>
    </View>
  );

  const renderDetailsModal = () => (
    <Modal
      visible={showDetailsModal}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={() => setShowDetailsModal(false)}
    >
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Expense Details</Text>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => setShowDetailsModal(false)}
          >
            <Ionicons name="close" size={24} color={theme.colors.text.primary} />
          </TouchableOpacity>
        </View>
        
        {selectedExpense && (
          <ScrollView style={styles.modalContent}>
            <Card style={styles.detailsCard}>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Description:</Text>
                <Text style={styles.detailValue}>
                  {selectedExpense.narration || 'No description'}
                </Text>
              </View>
              
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Amount:</Text>
                <Text style={[styles.detailValue, styles.amountValue]}>
                  {formatCurrency(selectedExpense.withdrawal)}
                </Text>
              </View>
              
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Recipient:</Text>
                <Text style={styles.detailValue}>
                  {selectedExpense.recipient || 'N/A'}
                </Text>
              </View>
              
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Category:</Text>
                <View style={styles.categoryContainer}>
                  <Ionicons 
                    name={getCategoryIcon(selectedExpense.category) as any} 
                    size={16} 
                    color={getCategoryColor(selectedExpense.category)} 
                  />
                  <Text style={[styles.categoryText, { color: getCategoryColor(selectedExpense.category) }]}>
                    {selectedExpense.category || 'Uncategorized'}
                  </Text>
                </View>
              </View>
              
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Type:</Text>
                <Text style={styles.detailValue}>
                  {selectedExpense.typeOfExpense || 'N/A'}
                </Text>
              </View>
              
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Personal:</Text>
                <Text style={styles.detailValue}>
                  {selectedExpense.personal ? 'Yes' : 'No'}
                </Text>
              </View>
              
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Date:</Text>
                <Text style={styles.detailValue}>
                  {formatDate(selectedExpense.dateObj)}
                </Text>
              </View>
            </Card>
            
            <View style={styles.modalActions}>
              <Button
                title="Edit"
                onPress={() => {
                  setShowDetailsModal(false);
                  navigation.navigate('ExpenseForm', { expenseId: selectedExpense._id });
                }}
                style={styles.editButton}
              />
              <Button
                title="Close"
                onPress={() => setShowDetailsModal(false)}
                style={styles.closeModalButton}
                variant="outline"
              />
            </View>
          </ScrollView>
        )}
      </SafeAreaView>
    </Modal>
  );

  const renderFilterModal = () => (
    <Modal
      visible={showFilterModal}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={() => setShowFilterModal(false)}
    >
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Filter Expenses</Text>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => setShowFilterModal(false)}
          >
            <Ionicons name="close" size={24} color={theme.colors.text.primary} />
          </TouchableOpacity>
        </View>
        
        <ScrollView style={styles.modalContent}>
          <Card style={styles.filterCard}>
            <Text style={styles.filterSectionTitle}>Search</Text>
            <TextInput
              style={styles.searchInput}
              placeholder="Search by description, recipient..."
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            
            <Text style={styles.filterSectionTitle}>Category</Text>
            <View style={styles.statusFilterContainer}>
              {['all', 'Office Supplies', 'Medical Supplies', 'Utilities', 'Rent', 'Equipment', 'Marketing', 'Travel', 'Food'].map((category) => (
                <TouchableOpacity
                  key={category}
                  style={[
                    styles.statusFilterButton,
                    categoryFilter === category && styles.statusFilterButtonActive
                  ]}
                  onPress={() => setCategoryFilter(category)}
                >
                  <Text style={[
                    styles.statusFilterButtonText,
                    categoryFilter === category && styles.statusFilterButtonTextActive
                  ]}>
                    {category === 'all' ? 'All' : category}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            
            <Text style={styles.filterSectionTitle}>Type</Text>
            <View style={styles.statusFilterContainer}>
              {['all', 'Business', 'Personal'].map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.statusFilterButton,
                    typeFilter === type && styles.statusFilterButtonActive
                  ]}
                  onPress={() => setTypeFilter(type)}
                >
                  <Text style={[
                    styles.statusFilterButtonText,
                    typeFilter === type && styles.statusFilterButtonTextActive
                  ]}>
                    {type === 'all' ? 'All' : type}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </Card>
          
          <View style={styles.modalActions}>
            <Button
              title="Clear Filters"
              onPress={handleClearFilters}
              style={styles.clearButton}
              variant="outline"
            />
            <Button
              title="Apply Filters"
              onPress={applyFilters}
              style={styles.applyButton}
            />
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text>Loading expenses...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right', 'bottom']}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>Expenses</Text>
            <Text style={styles.headerSubtitle}>
              {filteredExpenses.length} of {pagination.total} expenses
            </Text>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.filterButton}
              onPress={handleFilterPress}
            >
              <Ionicons name="filter" size={20} color={theme.colors.primary} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => navigation.navigate('ExpenseForm')}
            >
              <Ionicons name="add" size={20} color="white" />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {renderDashboard()}

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        onScroll={handleScroll}
        scrollEventThrottle={400}
        showsVerticalScrollIndicator={false}
      >
        {filteredExpenses.length === 0 ? (
          renderEmptyState()
        ) : (
          renderIconGrid()
        )}
      </ScrollView>
      
      {expenses.length > 0 && (
        <FloatingActionButton
          onPress={() => navigation.navigate('ExpenseForm')}
          icon="add"
        />
      )}

      {renderDetailsModal()}
      {renderFilterModal()}
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
  },
  filterButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.primaryLight + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.sm,
  },
  addButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: 25,
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    padding: theme.spacing.lg,
  },
  iconGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  expenseIconContainer: {
    width: '30%',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
  },
  expenseIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  expenseIconTitle: {
    ...theme.typography.caption,
    color: theme.colors.text.primary,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 16,
    marginBottom: theme.spacing.xs,
  },
  expenseIconAmount: {
    ...theme.typography.caption,
    color: theme.colors.primary,
    textAlign: 'center',
    fontSize: 11,
    fontWeight: '600',
    marginBottom: theme.spacing.xs,
  },
  expenseIconCategory: {
    ...theme.typography.caption,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    fontSize: 10,
    fontWeight: '400',
  },
  categoryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryText: {
    fontSize: 14,
    color: theme.colors.text.primary,
    marginLeft: theme.spacing.xs,
    fontWeight: '500',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtitle: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  addButtonText: {
    color: 'white',
    fontWeight: 'bold',
    marginLeft: 5,
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderLight,
    backgroundColor: theme.colors.white,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  closeButton: {
    padding: theme.spacing.sm,
  },
  modalContent: {
    flex: 1,
    padding: theme.spacing.lg,
  },
  detailsCard: {
    marginBottom: theme.spacing.lg,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderLight,
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
    flex: 2,
    textAlign: 'right',
  },
  amountValue: {
    fontWeight: '600',
    color: theme.colors.primary,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: theme.spacing.lg,
  },
  editButton: {
    flex: 1,
    marginRight: theme.spacing.sm,
  },
  closeModalButton: {
    flex: 1,
    marginLeft: theme.spacing.sm,
  },
  // Filter modal styles
  filterCard: {
    marginBottom: theme.spacing.lg,
  },
  filterSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
    marginTop: theme.spacing.md,
  },
  searchInput: {
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
    borderRadius: theme.borderRadius.sm,
    padding: theme.spacing.sm,
    fontSize: 14,
    color: theme.colors.text.primary,
    backgroundColor: theme.colors.white,
  },
  statusFilterContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  statusFilterButton: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.sm,
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
    backgroundColor: theme.colors.white,
    marginRight: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
  },
  statusFilterButtonActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  statusFilterButtonText: {
    fontSize: 12,
    color: theme.colors.text.secondary,
  },
  statusFilterButtonTextActive: {
    color: theme.colors.white,
    fontWeight: '600',
  },
  clearButton: {
    flex: 1,
    marginRight: theme.spacing.sm,
  },
  applyButton: {
    flex: 1,
    marginLeft: theme.spacing.sm,
  },
  // Loading more styles
  loadingMoreContainer: {
    padding: theme.spacing.lg,
    alignItems: 'center',
  },
  loadingMoreText: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    fontStyle: 'italic',
  },
  endOfListContainer: {
    padding: theme.spacing.lg,
    alignItems: 'center',
  },
  endOfListText: {
    fontSize: 12,
    color: theme.colors.text.secondary,
    fontStyle: 'italic',
  },
  // Dashboard styles
  dashboardContainer: {
    backgroundColor: 'white',
    margin: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  dashboardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  dashboardTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  dashboardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginRight: theme.spacing.sm,
  },
  refreshButton: {
    padding: theme.spacing.sm,
    borderRadius: theme.borderRadius.sm,
    backgroundColor: theme.colors.background,
  },
  dashboardContent: {
    minHeight: 100,
  },
  dashboardScrollView: {
    paddingVertical: theme.spacing.sm,
  },
  summaryCard: {
    backgroundColor: theme.colors.background,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    marginRight: theme.spacing.sm,
    minWidth: 120,
    alignItems: 'center',
  },
  summaryCardTitle: {
    fontSize: 12,
    fontWeight: '500',
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.xs,
  },
  summaryCardAmount: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  summaryCardLabel: {
    fontSize: 10,
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },
  dashboardLoading: {
    padding: theme.spacing.lg,
    alignItems: 'center',
  },
  dashboardLoadingText: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    fontStyle: 'italic',
  },
  dashboardError: {
    padding: theme.spacing.lg,
    alignItems: 'center',
  },
  dashboardErrorText: {
    fontSize: 14,
    color: theme.colors.error,
    marginBottom: theme.spacing.sm,
  },
  retryButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.sm,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
  yearSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  yearText: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.primary,
    marginRight: theme.spacing.xs,
  },
  yearSelectorContainer: {
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.sm,
    padding: theme.spacing.sm,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  yearOption: {
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.borderRadius.sm,
    marginBottom: theme.spacing.xs,
  },
  yearOptionSelected: {
    backgroundColor: theme.colors.primary,
  },
  yearOptionText: {
    fontSize: 14,
    color: theme.colors.text.primary,
  },
  yearOptionTextSelected: {
    color: 'white',
    fontWeight: '500',
  },
});

export default ExpensesListScreen;