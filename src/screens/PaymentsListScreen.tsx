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
import ApiService, { Payment, PaymentAnalytics } from '../services/api';
import FloatingActionButton from '../components/FloatingActionButton';
import { Card, Button } from '../components';
import { formatCurrency } from '../utils/currency';
import { getStatusColor, getStatusIcon, getMethodColor, getMethodIcon } from '../utils/status';

const PaymentsListScreen: React.FC = () => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [filteredPayments, setFilteredPayments] = useState<Payment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [methodFilter, setMethodFilter] = useState<string>('all');
  const [amountFilter, setAmountFilter] = useState({ min: '', max: '' });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0,
    hasMore: true
  });
  const [analytics, setAnalytics] = useState<PaymentAnalytics[]>([]);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const navigation = useNavigation();

  const fetchPayments = async (page: number = 1, append: boolean = false) => {
    try {
      const params: any = {
        page,
        limit: pagination.limit,
        sortBy: 'paymentDate',
        sortOrder: 'desc'
      };

      // Add filters only if they have values
      if (searchQuery && searchQuery.trim()) {
        params.search = searchQuery.trim();
      }
      if (statusFilter && statusFilter !== 'all') {
        params.status = statusFilter;
      }
      if (methodFilter && methodFilter !== 'all') {
        params.method = methodFilter;
      }
      if (amountFilter.min && amountFilter.min.trim()) {
        params.minAmount = parseFloat(amountFilter.min);
      }
      if (amountFilter.max && amountFilter.max.trim()) {
        params.maxAmount = parseFloat(amountFilter.max);
      }

      console.log('API params being sent:', params);
      const data = await ApiService.getPayments(params);
      console.log('Payments data received:', data);
      
      const paymentsData = data.payments || [];
      const paginationData = data.pagination || { page: 1, limit: 20, total: 0, pages: 0 };
      
      if (append) {
        // Append new data to existing data
        setPayments(prev => [...prev, ...paymentsData]);
        setFilteredPayments(prev => [...prev, ...paymentsData]);
      } else {
        // Replace existing data
        setPayments(paymentsData);
        setFilteredPayments(paymentsData);
      }
      
      setPagination({
        page: paginationData.page,
        limit: paginationData.limit,
        total: paginationData.total,
        pages: paginationData.pages,
        hasMore: paginationData.page < paginationData.pages
      });
    } catch (error: any) {
      console.error('Error fetching payments:', error);
      if (error.message?.includes('Authentication required')) {
        Alert.alert('Authentication Error', 'Please login again');
      } else {
        Alert.alert('Error', 'Failed to fetch payments. Please check your connection.');
      }
      if (!append) {
        setPayments([]);
        setFilteredPayments([]);
      }
    } finally {
      setIsLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  };

  const fetchAnalytics = async () => {
    try {
      setAnalyticsLoading(true);
      const params: any = {};
      
      if (dateRange.start) params.startDate = dateRange.start;
      if (dateRange.end) params.endDate = dateRange.end;
      if (statusFilter !== 'all') params.status = statusFilter;
      if (methodFilter !== 'all') params.paymentMethod = methodFilter;

      const analyticsData = await ApiService.getPaymentAnalytics(params);
      setAnalytics(analyticsData);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setAnalyticsLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
    fetchAnalytics();
  }, []);

  // Handle filter changes by refetching data
  useEffect(() => {
    // Only refetch if we're not in the initial loading state
    if (!isLoading) {
      console.log('Filters changed, refetching data...', { searchQuery, statusFilter, methodFilter, amountFilter });
      // Reset pagination when filters change
      setPagination(prev => ({ ...prev, page: 1, hasMore: true }));
      fetchPayments(1, false);
      fetchAnalytics();
    }
  }, [searchQuery, statusFilter, methodFilter, amountFilter, dateRange]);

  const loadMorePayments = async () => {
    if (loadingMore || !pagination.hasMore) return;
    
    setLoadingMore(true);
    await fetchPayments(pagination.page + 1, true);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const handlePaymentPress = (payment: Payment) => {
    setSelectedPayment(payment);
    setShowDetailsModal(true);
  };

  const handleFilterPress = () => {
    setShowFilterModal(true);
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setMethodFilter('all');
    setAmountFilter({ min: '', max: '' });
    setDateRange({ start: '', end: '' });
  };

  const applyFilters = () => {
    setShowFilterModal(false);
  };

  const onRefresh = () => {
    setRefreshing(true);
    setPagination(prev => ({ ...prev, page: 1, hasMore: true }));
    fetchPayments(1, false);
    fetchAnalytics();
  };

  const handleScroll = (event: any) => {
    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
    const isCloseToBottom = layoutMeasurement.height + contentOffset.y >= contentSize.height - 20;
    
    if (isCloseToBottom && pagination.hasMore && !loadingMore) {
      loadMorePayments();
    }
  };

  const renderPaymentIcon = (payment: Payment) => (
    <TouchableOpacity
      key={payment._id}
      style={styles.paymentIconContainer}
      onPress={() => handlePaymentPress(payment)}
      activeOpacity={0.7}
    >
      <View style={[styles.paymentIcon, { backgroundColor: getStatusColor(payment.status) + '20' }]}>
        <Ionicons 
          name={getMethodIcon(payment.method) as any} 
          size={32} 
          color={getStatusColor(payment.status)} 
        />
      </View>
      <Text style={styles.paymentIconTitle} numberOfLines={2}>
        {payment.treatmentName || 'Payment'}
      </Text>
      <Text style={styles.paymentIconAmount}>
        {formatCurrency(payment.amount)}
      </Text>
      <Text style={styles.paymentIconStatus}>
        {payment.status}
      </Text>
    </TouchableOpacity>
  );

  const renderSummaryCards = () => {
    if (analyticsLoading) {
      return (
        <View style={styles.summaryContainer}>
          <Text style={styles.summaryTitle}>Payment Summary</Text>
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading analytics...</Text>
          </View>
        </View>
      );
    }

    if (analytics.length === 0) {
      return (
        <View style={styles.summaryContainer}>
          <Text style={styles.summaryTitle}>Payment Summary</Text>
          <View style={styles.noDataContainer}>
            <Text style={styles.noDataText}>No analytics data available</Text>
          </View>
        </View>
      );
    }

    return (
      <View style={styles.summaryContainer}>
        <View style={styles.summaryHeader}>
          <Text style={styles.summaryTitle}>Payment Summary</Text>
          <TouchableOpacity onPress={fetchAnalytics} style={styles.refreshButton}>
            <Ionicons name="refresh" size={20} color={theme.colors.primary} />
          </TouchableOpacity>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.summaryScrollView}>
          {analytics.map((method) => (
            <View key={method._id} style={styles.summaryCard}>
              <Text style={styles.summaryCardTitle}>{method._id}</Text>
              <Text style={styles.summaryCardAmount}>{formatCurrency(method.totalAmount)}</Text>
              <Text style={styles.summaryCardCount}>{method.totalCount} payments</Text>
              <View style={styles.statusBreakdown}>
                {method.paymentMethods.map((pm, index) => (
                  <View key={index} style={styles.statusItem}>
                    <View style={[styles.statusDot, { backgroundColor: getStatusColor(pm.status) }]} />
                    <Text style={styles.statusText}>
                      {pm.status}: {pm.count}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          ))}
        </ScrollView>
      </View>
    );
  };

  const renderIconGrid = () => (
    <View>
      <View style={styles.iconGrid}>
        {filteredPayments.map(renderPaymentIcon)}
      </View>
      {loadingMore && (
        <View style={styles.loadingMoreContainer}>
          <Text style={styles.loadingMoreText}>Loading more payments...</Text>
        </View>
      )}
      {!pagination.hasMore && filteredPayments.length > 0 && (
        <View style={styles.endOfListContainer}>
          <Text style={styles.endOfListText}>No more payments to load</Text>
        </View>
      )}
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="card-outline" size={64} color="#ccc" />
      <Text style={styles.emptyStateTitle}>No Payments Found</Text>
      <Text style={styles.emptyStateSubtitle}>
        Add your first payment to get started
      </Text>
      <TouchableOpacity
        style={styles.addButton}
        onPress={() => navigation.navigate('PaymentForm')}
      >
        <Ionicons name="add" size={20} color="white" />
        <Text style={styles.addButtonText}>Add Payment</Text>
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
          <Text style={styles.modalTitle}>Payment Details</Text>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => setShowDetailsModal(false)}
          >
            <Ionicons name="close" size={24} color={theme.colors.text.primary} />
          </TouchableOpacity>
        </View>
        
        {selectedPayment && (
          <ScrollView style={styles.modalContent}>
            <Card style={styles.detailsCard}>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Treatment:</Text>
                <Text style={styles.detailValue}>
                  {selectedPayment.treatmentName || 'No treatment'}
                </Text>
              </View>
              
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Amount:</Text>
                <Text style={[styles.detailValue, styles.amountValue]}>
                  {formatCurrency(selectedPayment.amount)}
                </Text>
              </View>
              
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Method:</Text>
                <View style={styles.methodContainer}>
                  <Ionicons 
                    name={getMethodIcon(selectedPayment.method) as any} 
                    size={16} 
                    color={theme.colors.primary} 
                  />
                  <Text style={styles.methodText}>
                    {selectedPayment.method?.toUpperCase() || 'N/A'}
                  </Text>
                </View>
              </View>
              
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Status:</Text>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(selectedPayment.status) + '20' }]}>
                  <Ionicons 
                    name={getStatusIcon(selectedPayment.status) as any} 
                    size={16} 
                    color={getStatusColor(selectedPayment.status)} 
                  />
                  <Text style={[styles.statusText, { color: getStatusColor(selectedPayment.status) }]}>
                    {selectedPayment.status}
                  </Text>
                </View>
              </View>
              
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Payment Date:</Text>
                <Text style={styles.detailValue}>
                  {formatDate(selectedPayment.paymentDate)}
                </Text>
              </View>
              
              {selectedPayment.referenceNumber && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Reference:</Text>
                  <Text style={styles.detailValue}>
                    {selectedPayment.referenceNumber}
                  </Text>
                </View>
              )}
              
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Reference:</Text>
                <Text style={styles.detailValue}>
                  {selectedPayment.referenceNumber || 'N/A'}
                </Text>
              </View>
            </Card>
            
            <View style={styles.modalActions}>
              <Button
                title="Edit"
                onPress={() => {
                  setShowDetailsModal(false);
                  navigation.navigate('PaymentForm', { paymentId: selectedPayment._id });
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
          <Text style={styles.modalTitle}>Filter Payments</Text>
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
              placeholder="Search by description, reference..."
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            
            <Text style={styles.filterSectionTitle}>Status</Text>
            <View style={styles.statusFilterContainer}>
              {['all', 'Completed', 'Pending', 'Failed', 'Cancelled'].map((status) => (
                <TouchableOpacity
                  key={status}
                  style={[
                    styles.statusFilterButton,
                    statusFilter === status && styles.statusFilterButtonActive
                  ]}
                  onPress={() => setStatusFilter(status)}
                >
                  <Text style={[
                    styles.statusFilterButtonText,
                    statusFilter === status && styles.statusFilterButtonTextActive
                  ]}>
                    {status === 'all' ? 'All' : status}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            
            <Text style={styles.filterSectionTitle}>Payment Method</Text>
            <View style={styles.statusFilterContainer}>
              {['all', 'Cash', 'Card', 'UPI', 'NetBanking', 'Cheque'].map((method) => (
                <TouchableOpacity
                  key={method}
                  style={[
                    styles.statusFilterButton,
                    methodFilter === method && styles.statusFilterButtonActive
                  ]}
                  onPress={() => setMethodFilter(method)}
                >
                  <Text style={[
                    styles.statusFilterButtonText,
                    methodFilter === method && styles.statusFilterButtonTextActive
                  ]}>
                    {method === 'all' ? 'All' : method}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            
            <Text style={styles.filterSectionTitle}>Date Range</Text>
            <View style={styles.dateRangeContainer}>
              <View style={styles.dateInputContainer}>
                <Text style={styles.dateLabel}>Start Date</Text>
                <TextInput
                  style={styles.dateInput}
                  placeholder="YYYY-MM-DD"
                  value={dateRange.start}
                  onChangeText={(text) => setDateRange(prev => ({ ...prev, start: text }))}
                />
              </View>
              <View style={styles.dateInputContainer}>
                <Text style={styles.dateLabel}>End Date</Text>
                <TextInput
                  style={styles.dateInput}
                  placeholder="YYYY-MM-DD"
                  value={dateRange.end}
                  onChangeText={(text) => setDateRange(prev => ({ ...prev, end: text }))}
                />
              </View>
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
          <Text>Loading payments...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right', 'bottom']}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>Payments</Text>
            <Text style={styles.headerSubtitle}>
              {filteredPayments.length} of {pagination.total} payments
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
              onPress={() => navigation.navigate('PaymentForm')}
            >
              <Ionicons name="add" size={20} color="white" />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Summary Cards */}
      {renderSummaryCards()}

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        onScroll={handleScroll}
        scrollEventThrottle={400}
        showsVerticalScrollIndicator={false}
      >
        {filteredPayments.length === 0 ? (
          renderEmptyState()
        ) : (
          renderIconGrid()
        )}
      </ScrollView>
      
      {payments.length > 0 && (
        <FloatingActionButton
          onPress={() => navigation.navigate('PaymentForm')}
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
  paymentIconContainer: {
    width: '30%',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
  },
  paymentIcon: {
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
  paymentIconTitle: {
    ...theme.typography.caption,
    color: theme.colors.text.primary,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 16,
    marginBottom: theme.spacing.xs,
  },
  paymentIconAmount: {
    ...theme.typography.caption,
    color: theme.colors.primary,
    textAlign: 'center',
    fontSize: 11,
    fontWeight: '600',
    marginBottom: theme.spacing.xs,
  },
  paymentIconStatus: {
    ...theme.typography.caption,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    fontSize: 10,
    fontWeight: '400',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.sm,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: theme.spacing.xs,
  },
  methodContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  methodText: {
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
  // Summary styles
  summaryContainer: {
    backgroundColor: theme.colors.background,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  refreshButton: {
    padding: theme.spacing.xs,
  },
  summaryScrollView: {
    marginHorizontal: -theme.spacing.md,
  },
  summaryCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: theme.spacing.md,
    marginHorizontal: theme.spacing.sm,
    minWidth: 200,
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
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.primary,
    marginBottom: theme.spacing.xs,
  },
  summaryCardAmount: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  summaryCardCount: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.sm,
  },
  statusBreakdown: {
    gap: theme.spacing.xs,
  },
  statusItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  // Date range styles
  dateRangeContainer: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  dateInputContainer: {
    flex: 1,
  },
  dateLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  dateInput: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 8,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.sm,
    fontSize: 14,
    color: theme.colors.text.primary,
    backgroundColor: theme.colors.background,
  },
});

export default PaymentsListScreen;