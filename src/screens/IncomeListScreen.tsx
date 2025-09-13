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
import ApiService, { Income } from '../services/api';
import FloatingActionButton from '../components/FloatingActionButton';
import { Card, Button } from '../components';
import { formatCurrency } from '../utils/currency';

const IncomeListScreen: React.FC = () => {
  const [incomes, setIncomes] = useState<Income[]>([]);
  const [filteredIncomes, setFilteredIncomes] = useState<Income[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [selectedIncome, setSelectedIncome] = useState<Income | null>(null);
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

  const fetchIncomes = async (page: number = 1, append: boolean = false) => {
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
        params.incomeType = typeFilter;
      }
      if (amountFilter.min && amountFilter.min.trim()) {
        params.minAmount = parseFloat(amountFilter.min);
      }
      if (amountFilter.max && amountFilter.max.trim()) {
        params.maxAmount = parseFloat(amountFilter.max);
      }

      console.log('API params being sent:', params);
      console.log('Selected financial year:', selectedFinancialYear);
      const data = await ApiService.getIncome(params);
      console.log('Incomes data received:', {
        incomesCount: data.income?.length || 0,
        pagination: data.pagination,
        append
      });
      
      const incomesData = data.income || [];
      const paginationData = data.pagination || { page: 1, limit: 20, total: 0, pages: 0 };
      
      if (append) {
        // Append new data to existing data
        setIncomes(prev => [...prev, ...incomesData]);
        setFilteredIncomes(prev => [...prev, ...incomesData]);
      } else {
        // Replace existing data
        setIncomes(incomesData);
        setFilteredIncomes(incomesData);
      }
      
      setPagination({
        page: paginationData.page,
        limit: paginationData.limit,
        total: paginationData.total,
        pages: paginationData.pages,
        hasMore: paginationData.page < paginationData.pages
      });
    } catch (error: any) {
      console.error('Error fetching incomes:', error);
      if (error.message?.includes('Authentication required')) {
        Alert.alert('Authentication Error', 'Please login again');
      } else {
        Alert.alert('Error', 'Failed to fetch incomes. Please check your connection.');
      }
      if (!append) {
        setIncomes([]);
        setFilteredIncomes([]);
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
      console.log('Fetching dashboard for year:', selectedFinancialYear);
      const response = await ApiService.getIncomeDashboard({ year: selectedFinancialYear });
      console.log('Dashboard data received:', response);
      setDashboardData(response);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
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
    fetchIncomes();
    fetchDashboard();
  }, []);

  // Watch for financial year changes (skip initial load)
  useEffect(() => {
    if (selectedFinancialYear && !isLoading && !dashboardLoading) {
      console.log('Financial year changed, refetching data for:', selectedFinancialYear);
      fetchIncomes(1, false);
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
      fetchIncomes(1, false);
    }
  }, [searchQuery, categoryFilter, typeFilter, amountFilter]);

  const loadMoreIncomes = async () => {
    if (loadingMore || !pagination.hasMore) return;
    
    setLoadingMore(true);
    await fetchIncomes(pagination.page + 1, true);
  };

  const getCategoryIcon = (category?: string) => {
    switch (category?.toLowerCase()) {
      case 'consultation fees':
        return 'medical';
      case 'treatment fees':
        return 'construct';
      case 'surgery fees':
        return 'cut';
      case 'follow-up fees':
        return 'refresh';
      case 'emergency fees':
        return 'alert-circle';
      case 'insurance':
        return 'shield';
      case 'other':
        return 'cash';
      default:
        return 'trending-up';
    }
  };

  const getCategoryColor = (category?: string) => {
    switch (category?.toLowerCase()) {
      case 'consultation fees':
        return theme.colors.primary;
      case 'treatment fees':
        return theme.colors.success;
      case 'surgery fees':
        return theme.colors.error;
      case 'follow-up fees':
        return theme.colors.warning;
      case 'emergency fees':
        return '#FF5722';
      case 'insurance':
        return '#9C27B0';
      case 'other':
        return theme.colors.text.secondary;
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

  const handleIncomePress = (income: Income) => {
    setSelectedIncome(income);
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
    fetchIncomes(1, false);
    fetchDashboard();
  };

  const handleScroll = (event: any) => {
    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
    const isCloseToBottom = layoutMeasurement.height + contentOffset.y >= contentSize.height - 20;
    
    if (isCloseToBottom && pagination.hasMore && !loadingMore) {
      loadMoreIncomes();
    }
  };

  const renderDashboard = () => (
    <View style={styles.dashboardContainer}>
      <View style={styles.dashboardHeader}>
        <View style={styles.dashboardTitleContainer}>
          <Text style={styles.dashboardTitle}>Income Summary</Text>
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
              <Text style={[
                styles.yearOptionText,
                selectedFinancialYear === year && styles.yearOptionTextSelected
              ]}>
                FY {year}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
      
      <View style={styles.dashboardContent}>
        {dashboardLoading ? (
          <View style={styles.dashboardLoading}>
            <Text style={styles.dashboardLoadingText}>Loading summary...</Text>
          </View>
        ) : dashboardData ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.dashboardScrollView}>
            {/* Summary Cards */}
            <View style={styles.summaryCard}>
              <Text style={styles.summaryCardTitle}>Total Income</Text>
              <Text style={styles.summaryCardAmount}>
                {formatCurrency(dashboardData.totalAmount || 0)}
              </Text>
              <Text style={styles.summaryCardLabel}>FY {selectedFinancialYear}</Text>
            </View>
            
            <View style={[styles.summaryCard, { backgroundColor: '#E8F5E8' }]}>
              <Text style={[styles.summaryCardTitle, { color: '#2E7D32' }]}>Business</Text>
              <Text style={[styles.summaryCardAmount, { color: '#2E7D32' }]}>
                {formatCurrency(dashboardData.businessAmount || 0)}
              </Text>
              <Text style={[styles.summaryCardLabel, { color: '#2E7D32' }]}>Business Income</Text>
            </View>
            
            <View style={[styles.summaryCard, { backgroundColor: '#FFF3E0' }]}>
              <Text style={[styles.summaryCardTitle, { color: '#F57C00' }]}>Personal</Text>
              <Text style={[styles.summaryCardAmount, { color: '#F57C00' }]}>
                {formatCurrency(dashboardData.personalAmount || 0)}
              </Text>
              <Text style={[styles.summaryCardLabel, { color: '#F57C00' }]}>Personal Income</Text>
            </View>
            
            <View style={[styles.summaryCard, { backgroundColor: '#E3F2FD' }]}>
              <Text style={[styles.summaryCardTitle, { color: '#1976D2' }]}>Transactions</Text>
              <Text style={[styles.summaryCardAmount, { color: '#1976D2' }]}>
                {dashboardData.totalCount || 0}
              </Text>
              <Text style={[styles.summaryCardLabel, { color: '#1976D2' }]}>Total Count</Text>
            </View>
          </ScrollView>
        ) : (
          <View style={styles.dashboardError}>
            <Text style={styles.dashboardErrorText}>Failed to load summary data</Text>
            <TouchableOpacity style={styles.retryButton} onPress={fetchDashboard}>
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );

  const renderIncomeIcon = (income: Income) => (
    <TouchableOpacity
      key={income._id}
      style={styles.incomeIconContainer}
      onPress={() => handleIncomePress(income)}
      activeOpacity={0.7}
    >
      <View style={[styles.incomeIcon, { backgroundColor: getCategoryColor(income.category) + '20' }]}>
        <Ionicons 
          name={getCategoryIcon(income.category) as any} 
          size={32} 
          color={getCategoryColor(income.category)} 
        />
      </View>
      <Text style={styles.incomeIconTitle} numberOfLines={2}>
        {income.narration || 'Income'}
      </Text>
      <Text style={styles.incomeIconAmount}>
        {formatCurrency(income.deposit)}
      </Text>
      <Text style={styles.incomeIconCategory}>
        {income.category?.toUpperCase() || 'OTHER'}
      </Text>
    </TouchableOpacity>
  );

  const renderIconGrid = () => (
    <View>
      <View style={styles.iconGrid}>
        {filteredIncomes.map(renderIncomeIcon)}
      </View>
      {loadingMore && (
        <View style={styles.loadingMoreContainer}>
          <Text style={styles.loadingMoreText}>Loading more incomes...</Text>
        </View>
      )}
      {!pagination.hasMore && filteredIncomes.length > 0 && (
        <View style={styles.endOfListContainer}>
          <Text style={styles.endOfListText}>No more incomes to load</Text>
        </View>
      )}
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="trending-up-outline" size={64} color="#ccc" />
      <Text style={styles.emptyStateTitle}>No Incomes Found</Text>
      <Text style={styles.emptyStateSubtitle}>
        Add your first income to get started
      </Text>
      <TouchableOpacity
        style={styles.addButton}
        onPress={() => navigation.navigate('IncomeForm')}
      >
        <Ionicons name="add" size={20} color="white" />
        <Text style={styles.addButtonText}>Add Income</Text>
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
          <Text style={styles.modalTitle}>Income Details</Text>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => setShowDetailsModal(false)}
          >
            <Ionicons name="close" size={24} color={theme.colors.text.primary} />
          </TouchableOpacity>
        </View>
        
        {selectedIncome && (
          <ScrollView style={styles.modalContent}>
            <Card style={styles.detailsCard}>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Description:</Text>
                <Text style={styles.detailValue}>
                  {selectedIncome.narration || 'No description'}
                </Text>
              </View>
              
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Amount:</Text>
                <Text style={[styles.detailValue, styles.amountValue]}>
                  {formatCurrency(selectedIncome.deposit)}
                </Text>
              </View>
              
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>From:</Text>
                <Text style={styles.detailValue}>
                  {selectedIncome.recipient || 'N/A'}
                </Text>
              </View>
              
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Category:</Text>
                <View style={styles.categoryContainer}>
                  <Ionicons 
                    name={getCategoryIcon(selectedIncome.category) as any} 
                    size={16} 
                    color={getCategoryColor(selectedIncome.category)} 
                  />
                  <Text style={[styles.categoryText, { color: getCategoryColor(selectedIncome.category) }]}>
                    {selectedIncome.category?.toUpperCase() || 'OTHER'}
                  </Text>
                </View>
              </View>
              
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Type:</Text>
                <Text style={styles.detailValue}>
                  {selectedIncome.incomeType || 'N/A'}
                </Text>
              </View>
              
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Personal:</Text>
                <Text style={styles.detailValue}>
                  {selectedIncome.personal ? 'Yes' : 'No'}
                </Text>
              </View>
              
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Balance:</Text>
                <Text style={[styles.detailValue, styles.balanceValue]}>
                  {formatCurrency(selectedIncome.balance || 0)}
                </Text>
              </View>
              
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Date:</Text>
                <Text style={styles.detailValue}>
                  {formatDate(selectedIncome.dateObj)}
                </Text>
              </View>
            </Card>
            
            <View style={styles.modalActions}>
              <Button
                title="Edit"
                onPress={() => {
                  setShowDetailsModal(false);
                  navigation.navigate('IncomeForm', { incomeId: selectedIncome._id });
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
          <Text style={styles.modalTitle}>Filter Incomes</Text>
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
              {['all', 'Consultation Fees', 'Treatment Fees', 'Surgery Fees', 'Follow-up Fees', 'Emergency Fees', 'Insurance', 'Other'].map((category) => (
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
          <Text>Loading incomes...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right', 'bottom']}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>Income</Text>
            <Text style={styles.headerSubtitle}>
              {filteredIncomes.length} of {pagination.total} incomes
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
              onPress={() => navigation.navigate('IncomeForm')}
            >
              <Ionicons name="add" size={20} color="white" />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Dashboard */}
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
        {filteredIncomes.length === 0 ? (
          renderEmptyState()
        ) : (
          renderIconGrid()
        )}
      </ScrollView>
      
      {incomes.length > 0 && (
        <FloatingActionButton
          onPress={() => navigation.navigate('IncomeForm')}
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
  incomeIconContainer: {
    width: '30%',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
  },
  incomeIcon: {
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
  incomeIconTitle: {
    ...theme.typography.caption,
    color: theme.colors.text.primary,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 16,
    marginBottom: theme.spacing.xs,
  },
  incomeIconAmount: {
    ...theme.typography.caption,
    color: theme.colors.success,
    textAlign: 'center',
    fontSize: 11,
    fontWeight: '600',
    marginBottom: theme.spacing.xs,
  },
  incomeIconCategory: {
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
  balanceValue: {
    fontWeight: '600',
    color: theme.colors.success,
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
    color: theme.colors.success,
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
    backgroundColor: theme.colors.background,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  dashboardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  dashboardTitleContainer: {
    flex: 1,
  },
  dashboardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  yearSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  yearText: {
    fontSize: 14,
    color: theme.colors.primary,
    marginRight: theme.spacing.xs,
  },
  yearSelectorContainer: {
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  yearOption: {
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.sm,
    borderRadius: 6,
    marginBottom: theme.spacing.xs,
  },
  yearOptionSelected: {
    backgroundColor: theme.colors.primary + '20',
  },
  yearOptionText: {
    fontSize: 14,
    color: theme.colors.text.primary,
  },
  yearOptionTextSelected: {
    color: theme.colors.primary,
    fontWeight: '600',
  },
  refreshButton: {
    padding: theme.spacing.xs,
  },
  dashboardContent: {
    paddingHorizontal: theme.spacing.md,
    paddingBottom: theme.spacing.sm,
  },
  dashboardScrollView: {
    marginHorizontal: -theme.spacing.md,
  },
  summaryCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: theme.spacing.md,
    marginHorizontal: theme.spacing.sm,
    minWidth: 140,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  summaryCardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  summaryCardAmount: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  summaryCardLabel: {
    fontSize: 12,
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
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default IncomeListScreen;