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
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { theme } from '../theme';
import ApiService, { MSwipePayment } from '../services/api';
import FloatingActionButton from '../components/FloatingActionButton';
import { Card, Button } from '../components';
import { formatCurrency } from '../utils/currency';
import { getStatusColor, getStatusIcon } from '../utils/status';

const MSwipePaymentsScreen: React.FC = () => {
  const [payments, setPayments] = useState<MSwipePayment[]>([]);
  const [filteredPayments, setFilteredPayments] = useState<MSwipePayment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<MSwipePayment | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [amountFilter, setAmountFilter] = useState({ min: '', max: '' });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0,
    hasMore: true
  });
  const [statistics, setStatistics] = useState({
    total: 0,
    mapped: 0,
    pending: 0,
    unmapped: 0
  });
  const [isInitialized, setIsInitialized] = useState(false);
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
      if (amountFilter.min && amountFilter.min.trim()) {
        params.minAmount = parseFloat(amountFilter.min);
      }
      if (amountFilter.max && amountFilter.max.trim()) {
        params.maxAmount = parseFloat(amountFilter.max);
      }

      console.log('API params being sent:', params);
      const data = await ApiService.getMSwipePayments(params);
      console.log('mSwipe payments data received:', {
        transactionsCount: data.transactions?.length || 0,
        pagination: data.pagination,
        append
      });
      
      const paymentsData = data.transactions || [];
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

      // Load statistics if it's the first page
      if (page === 1) {
        fetchStatistics();
      }
    } catch (error: any) {
      console.error('Error fetching mSwipe payments:', error);
      if (error.message?.includes('Authentication required')) {
        Alert.alert('Authentication Error', 'Please login again');
      } else {
        Alert.alert('Error', 'Failed to fetch mSwipe payments. Please check your connection.');
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

  const fetchStatistics = async () => {
    try {
      const response = await ApiService.getMSwipePayments({ limit: 1000 });
      const allPayments = response.transactions || [];
      
      const stats = {
        total: allPayments.length,
        mapped: allPayments.filter(p => p.status === 'mapped' || p.status === 'bank_linked').length,
        pending: allPayments.filter(p => p.status === 'pending').length,
        unmapped: allPayments.filter(p => p.status === 'unmapped').length
      };
      
      setStatistics(stats);
    } catch (error) {
      console.error('Error fetching statistics:', error);
    }
  };

  useEffect(() => {
    fetchPayments();
    fetchStatistics();
    setIsInitialized(true);
  }, []);

  // Handle filter changes by refetching data
  useEffect(() => {
    // Only refetch if we're not in the initial loading state and component is initialized
    if (!isLoading && isInitialized) {
      console.log('Filters changed, refetching data...', { searchQuery, statusFilter, amountFilter });
      // Reset pagination when filters change
      setPagination(prev => ({ ...prev, page: 1, hasMore: true }));
      fetchPayments(1, false);
    }
  }, [searchQuery, statusFilter, amountFilter]);

  const loadMorePayments = async () => {
    if (loadingMore || !pagination.hasMore) {
      console.log('Load more blocked:', { loadingMore, hasMore: pagination.hasMore });
      return;
    }
    
    console.log('Loading more payments, current page:', pagination.page);
    setLoadingMore(true);
    const nextPage = pagination.page + 1;
    await fetchPayments(nextPage, true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Success':
        return theme.colors.success;
      case 'Pending':
        return theme.colors.warning;
      case 'Failed':
        return theme.colors.error;
      case 'Cancelled':
        return theme.colors.text.secondary;
      default:
        return theme.colors.text.secondary;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Success':
        return 'checkmark-circle';
      case 'Pending':
        return 'time';
      case 'Failed':
        return 'alert-circle';
      case 'Cancelled':
        return 'close-circle';
      default:
        return 'help-circle';
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

  const handlePaymentPress = (payment: MSwipePayment) => {
    setSelectedPayment(payment);
    setShowDetailsModal(true);
  };

  const handleFilterPress = () => {
    setShowFilterModal(true);
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setAmountFilter({ min: '', max: '' });
  };

  const applyFilters = () => {
    setShowFilterModal(false);
  };

  const onRefresh = () => {
    setRefreshing(true);
    setPagination(prev => ({ ...prev, page: 1, hasMore: true }));
    fetchPayments(1, false);
    fetchStatistics();
  };

  const handleScroll = (event: any) => {
    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
    const isCloseToBottom = layoutMeasurement.height + contentOffset.y >= contentSize.height - 20;
    
    console.log('Scroll check:', {
      isCloseToBottom,
      hasMore: pagination.hasMore,
      loadingMore,
      currentPage: pagination.page,
      totalPages: pagination.pages,
      totalItems: pagination.total
    });
    
    if (isCloseToBottom && pagination.hasMore && !loadingMore) {
      console.log('Loading more payments...');
      loadMorePayments();
    }
  };

  const renderPaymentIcon = (payment: MSwipePayment) => (
    <TouchableOpacity
      key={payment._id}
      style={styles.paymentIconContainer}
      onPress={() => handlePaymentPress(payment)}
      activeOpacity={0.7}
    >
      <View style={[
        styles.paymentSquare, 
        { 
          borderColor: getStatusColor(payment.status),
          backgroundColor: payment.status === 'mapped' ? '#F0F8F0' : 
                          payment.status === 'unmapped' ? '#FFF0F0' : 
                          payment.status === 'pending' ? '#FFF8F0' : 
                          payment.status === 'bank_linked' ? '#F0F8FF' : 'white'
        }
      ]}>
        {/* Header with status indicator */}
        <View style={styles.squareHeader}>
          <View style={[styles.statusIndicator, { backgroundColor: getStatusColor(payment.status) }]} />
          <Text style={styles.squareStatus} numberOfLines={1}>
            {payment.status?.toUpperCase() || 'UNKNOWN'}
          </Text>
        </View>
        
        {/* Main content area */}
        <View style={styles.squareContent}>
          {/* Amount - most prominent */}
          <Text style={styles.squareAmount} numberOfLines={1}>
            {formatCurrency(payment.amount)}
          </Text>
          
          {/* Merchant/Patient name */}
          <Text style={styles.squareTitle} numberOfLines={2}>
            {payment.merchantName || payment.patientName || 'mSwipe Payment'}
          </Text>
          
          {/* Transaction details */}
          <View style={styles.squareDetails}>
            <Text style={styles.squareDetailText} numberOfLines={1}>
              {payment.transactionId}
            </Text>
            {payment.cardType && (
              <Text style={styles.squareDetailText} numberOfLines={1}>
                {payment.cardType} ••••{payment.last4Digits}
              </Text>
            )}
          </View>
        </View>
        
        {/* Footer with date */}
        <View style={styles.squareFooter}>
          <Text style={styles.squareDate} numberOfLines={1}>
            {new Date(payment.paymentDate).toLocaleDateString('en-IN', {
              day: '2-digit',
              month: '2-digit',
              year: '2-digit'
            })}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderStatisticsCards = () => (
    <View style={styles.statisticsContainer}>
      <Text style={styles.statisticsTitle}>mSwipe Statistics</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.statisticsScrollView}>
        <View style={styles.statisticsCard}>
          <Text style={styles.statisticsCardTitle}>Total</Text>
          <Text style={styles.statisticsCardValue}>{statistics.total}</Text>
          <Text style={styles.statisticsCardLabel}>Transactions</Text>
        </View>
        <View style={[styles.statisticsCard, { backgroundColor: '#E8F5E8' }]}>
          <Text style={[styles.statisticsCardTitle, { color: '#2E7D32' }]}>Mapped</Text>
          <Text style={[styles.statisticsCardValue, { color: '#2E7D32' }]}>{statistics.mapped}</Text>
          <Text style={[styles.statisticsCardLabel, { color: '#2E7D32' }]}>Linked</Text>
        </View>
        <View style={[styles.statisticsCard, { backgroundColor: '#FFF3E0' }]}>
          <Text style={[styles.statisticsCardTitle, { color: '#F57C00' }]}>Pending</Text>
          <Text style={[styles.statisticsCardValue, { color: '#F57C00' }]}>{statistics.pending}</Text>
          <Text style={[styles.statisticsCardLabel, { color: '#F57C00' }]}>Awaiting</Text>
        </View>
        <View style={[styles.statisticsCard, { backgroundColor: '#FFEBEE' }]}>
          <Text style={[styles.statisticsCardTitle, { color: '#D32F2F' }]}>Unmapped</Text>
          <Text style={[styles.statisticsCardValue, { color: '#D32F2F' }]}>{statistics.unmapped}</Text>
          <Text style={[styles.statisticsCardLabel, { color: '#D32F2F' }]}>Unlinked</Text>
        </View>
      </ScrollView>
    </View>
  );

  const renderIconGrid = () => (
    <View>
      <View style={styles.iconGrid}>
        {filteredPayments.map(renderPaymentIcon)}
      </View>
      {loadingMore && (
        <View style={styles.loadingMoreContainer}>
          <View style={styles.loadingSpinner}>
            <ActivityIndicator size="small" color={theme.colors.primary} />
            <Text style={styles.loadingMoreText}>Loading more payments...</Text>
          </View>
        </View>
      )}
      {!pagination.hasMore && filteredPayments.length > 0 && (
        <View style={styles.endOfListContainer}>
          <Text style={styles.endOfListText}>
            All {pagination.total} payments loaded
          </Text>
        </View>
      )}
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="phone-portrait-outline" size={64} color="#ccc" />
      <Text style={styles.emptyStateTitle}>No mSwipe Payments Found</Text>
      <Text style={styles.emptyStateSubtitle}>
        mSwipe payments will appear here
      </Text>
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
          <Text style={styles.modalTitle}>mSwipe Payment Details</Text>
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
                <Text style={styles.detailLabel}>Customer:</Text>
                <Text style={styles.detailValue}>
                  {selectedPayment.customerName || 'N/A'}
                </Text>
              </View>
              
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Amount:</Text>
                <Text style={[styles.detailValue, styles.amountValue]}>
                  {formatCurrency(selectedPayment.amount)}
                </Text>
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
                    {selectedPayment.status?.toUpperCase() || 'UNKNOWN'}
                  </Text>
                </View>
              </View>
              
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Payment Date:</Text>
                <Text style={styles.detailValue}>
                  {formatDate(selectedPayment.paymentDate)}
                </Text>
              </View>
              
              {selectedPayment.transactionId && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Transaction ID:</Text>
                  <Text style={styles.detailValue}>
                    {selectedPayment.transactionId}
                  </Text>
                </View>
              )}
              
              {selectedPayment.referenceNumber && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Reference:</Text>
                  <Text style={styles.detailValue}>
                    {selectedPayment.referenceNumber}
                  </Text>
                </View>
              )}
              
              {selectedPayment.merchantId && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Merchant ID:</Text>
                  <Text style={styles.detailValue}>
                    {selectedPayment.merchantId}
                  </Text>
                </View>
              )}
              
              {selectedPayment.notes && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Notes:</Text>
                  <Text style={styles.detailValue}>
                    {selectedPayment.notes}
                  </Text>
                </View>
              )}
            </Card>
            
            <View style={styles.modalActions}>
              <Button
                title="Close"
                onPress={() => setShowDetailsModal(false)}
                style={styles.closeModalButton}
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
          <Text style={styles.modalTitle}>Filter mSwipe Payments</Text>
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
              placeholder="Search by patient name, transaction ID, reference..."
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            
            <Text style={styles.filterSectionTitle}>Status</Text>
            <View style={styles.statusFilterContainer}>
              {['all', 'mapped', 'pending', 'unmapped', 'bank_linked'].map((status) => (
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
                    {status === 'all' ? 'All' : status.charAt(0).toUpperCase() + status.slice(1)}
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
          <Text>Loading mSwipe payments...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right', 'bottom']}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>mSwipe Payments</Text>
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
          </View>
        </View>
      </View>

      {/* Statistics Cards */}
      {renderStatisticsCards()}

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
  },
  content: {
    flex: 1,
    padding: theme.spacing.lg,
  },
  iconGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.sm,
  },
  paymentIconContainer: {
    width: '48%',
    marginBottom: theme.spacing.md,
  },
  // New square design styles
  paymentSquare: {
    backgroundColor: 'white',
    borderRadius: 12,
    borderWidth: 2,
    padding: theme.spacing.sm,
    minHeight: 140,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  squareHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: theme.spacing.xs,
  },
  squareStatus: {
    fontSize: 10,
    fontWeight: '600',
    color: theme.colors.text.secondary,
    flex: 1,
  },
  squareContent: {
    flex: 1,
    justifyContent: 'center',
  },
  squareAmount: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
    textAlign: 'center',
  },
  squareTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
    textAlign: 'center',
    lineHeight: 16,
  },
  squareDetails: {
    marginTop: theme.spacing.xs,
  },
  squareDetailText: {
    fontSize: 10,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    marginBottom: 2,
  },
  squareFooter: {
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    paddingTop: theme.spacing.xs,
    marginTop: theme.spacing.sm,
  },
  squareDate: {
    fontSize: 10,
    color: theme.colors.text.secondary,
    textAlign: 'center',
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
    justifyContent: 'center',
    paddingTop: theme.spacing.lg,
  },
  closeModalButton: {
    flex: 1,
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
  loadingSpinner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingMoreText: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    fontStyle: 'italic',
    marginLeft: theme.spacing.sm,
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
  // Statistics styles
  statisticsContainer: {
    backgroundColor: theme.colors.background,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  statisticsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
  },
  statisticsScrollView: {
    marginHorizontal: -theme.spacing.md,
  },
  statisticsCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: theme.spacing.md,
    marginHorizontal: theme.spacing.sm,
    minWidth: 120,
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
  statisticsCardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  statisticsCardValue: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  statisticsCardLabel: {
    fontSize: 12,
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },
});

export default MSwipePaymentsScreen;