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
import ApiService, { Invoice } from '../services/api';
import FloatingActionButton from '../components/FloatingActionButton';
import { Card, Button } from '../components';

const InvoiceGeneratorScreen: React.FC = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [filteredInvoices, setFilteredInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
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
  const navigation = useNavigation();

  const fetchInvoices = async (page: number = 1, append: boolean = false) => {
    try {
      const params: any = {
        page,
        limit: pagination.limit,
        sortBy: 'createdAt',
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
      const data = await ApiService.getInvoices(params);
      console.log('Invoices data received:', data);
      
      const invoicesData = data.invoices || [];
      const paginationData = data.pagination || { page: 1, limit: 20, total: 0, pages: 0 };
      
      if (append) {
        // Append new data to existing data
        setInvoices(prev => [...prev, ...invoicesData]);
        setFilteredInvoices(prev => [...prev, ...invoicesData]);
      } else {
        // Replace existing data
        setInvoices(invoicesData);
        setFilteredInvoices(invoicesData);
      }
      
      setPagination({
        page: paginationData.page,
        limit: paginationData.limit,
        total: paginationData.total,
        pages: paginationData.pages,
        hasMore: paginationData.page < paginationData.pages
      });
    } catch (error: any) {
      console.error('Error fetching invoices:', error);
      if (error.message?.includes('Authentication required')) {
        Alert.alert('Authentication Error', 'Please login again');
      } else {
        Alert.alert('Error', 'Failed to fetch invoices. Please check your connection.');
      }
      if (!append) {
        setInvoices([]);
        setFilteredInvoices([]);
      }
    } finally {
      setIsLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

  // Handle filter changes by refetching data
  useEffect(() => {
    // Only refetch if we're not in the initial loading state
    if (!isLoading) {
      console.log('Filters changed, refetching data...', { searchQuery, statusFilter, amountFilter });
      // Reset pagination when filters change
      setPagination(prev => ({ ...prev, page: 1, hasMore: true }));
      fetchInvoices(1, false);
    }
  }, [searchQuery, statusFilter, amountFilter]);

  const loadMoreInvoices = async () => {
    if (loadingMore || !pagination.hasMore) return;
    
    setLoadingMore(true);
    await fetchInvoices(pagination.page + 1, true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Paid':
        return theme.colors.success;
      case 'Pending':
        return theme.colors.warning;
      case 'Overdue':
        return theme.colors.error;
      case 'Draft':
        return theme.colors.text.secondary;
      case 'Cancelled':
        return theme.colors.text.secondary;
      default:
        return theme.colors.text.secondary;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Paid':
        return 'checkmark-circle';
      case 'Pending':
        return 'time';
      case 'Overdue':
        return 'alert-circle';
      case 'Draft':
        return 'document-text';
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

  const handleInvoicePress = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
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
    fetchInvoices(1, false);
  };

  const handleScroll = (event: any) => {
    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
    const isCloseToBottom = layoutMeasurement.height + contentOffset.y >= contentSize.height - 20;
    
    if (isCloseToBottom && pagination.hasMore && !loadingMore) {
      loadMoreInvoices();
    }
  };

  const renderInvoiceIcon = (invoice: Invoice) => (
    <TouchableOpacity
      key={invoice._id}
      style={styles.invoiceIconContainer}
      onPress={() => handleInvoicePress(invoice)}
      activeOpacity={0.7}
    >
      <View style={[styles.invoiceIcon, { backgroundColor: getStatusColor(invoice.status) + '20' }]}>
        <Ionicons 
          name="receipt" 
          size={32} 
          color={getStatusColor(invoice.status)} 
        />
      </View>
      <Text style={styles.invoiceIconTitle} numberOfLines={2}>
        {invoice.invoiceNumber || 'Invoice'}
      </Text>
      <Text style={styles.invoiceIconAmount}>
        {formatCurrency(invoice.totalAmount)}
      </Text>
      <Text style={styles.invoiceIconStatus}>
        {invoice.status?.toUpperCase() || 'UNKNOWN'}
      </Text>
    </TouchableOpacity>
  );

  const renderIconGrid = () => (
    <View>
      <View style={styles.iconGrid}>
        {filteredInvoices.map(renderInvoiceIcon)}
      </View>
      {loadingMore && (
        <View style={styles.loadingMoreContainer}>
          <Text style={styles.loadingMoreText}>Loading more invoices...</Text>
        </View>
      )}
      {!pagination.hasMore && filteredInvoices.length > 0 && (
        <View style={styles.endOfListContainer}>
          <Text style={styles.endOfListText}>No more invoices to load</Text>
        </View>
      )}
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="receipt-outline" size={64} color="#ccc" />
      <Text style={styles.emptyStateTitle}>No Invoices Found</Text>
      <Text style={styles.emptyStateSubtitle}>
        Create your first invoice to get started
      </Text>
      <TouchableOpacity
        style={styles.addButton}
        onPress={() => navigation.navigate('InvoiceForm')}
      >
        <Ionicons name="add" size={20} color="white" />
        <Text style={styles.addButtonText}>Create Invoice</Text>
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
          <Text style={styles.modalTitle}>Invoice Details</Text>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => setShowDetailsModal(false)}
          >
            <Ionicons name="close" size={24} color={theme.colors.text.primary} />
          </TouchableOpacity>
        </View>
        
        {selectedInvoice && (
          <ScrollView style={styles.modalContent}>
            <Card style={styles.detailsCard}>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Invoice Number:</Text>
                <Text style={styles.detailValue}>
                  {selectedInvoice.invoiceNumber || 'N/A'}
                </Text>
              </View>
              
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Client:</Text>
                <Text style={styles.detailValue}>
                  {selectedInvoice.clientName || 'N/A'}
                </Text>
              </View>
              
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Amount:</Text>
                <Text style={[styles.detailValue, styles.amountValue]}>
                  {formatCurrency(selectedInvoice.totalAmount)}
                </Text>
              </View>
              
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Status:</Text>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(selectedInvoice.status) + '20' }]}>
                  <Ionicons 
                    name={getStatusIcon(selectedInvoice.status) as any} 
                    size={16} 
                    color={getStatusColor(selectedInvoice.status)} 
                  />
                  <Text style={[styles.statusText, { color: getStatusColor(selectedInvoice.status) }]}>
                    {selectedInvoice.status?.toUpperCase() || 'UNKNOWN'}
                  </Text>
                </View>
              </View>
              
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Issue Date:</Text>
                <Text style={styles.detailValue}>
                  {formatDate(selectedInvoice.issueDate)}
                </Text>
              </View>
              
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Due Date:</Text>
                <Text style={styles.detailValue}>
                  {formatDate(selectedInvoice.dueDate)}
                </Text>
              </View>
              
              {selectedInvoice.paidDate && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Paid Date:</Text>
                  <Text style={styles.detailValue}>
                    {formatDate(selectedInvoice.paidDate)}
                  </Text>
                </View>
              )}
              
              {selectedInvoice.notes && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Notes:</Text>
                  <Text style={styles.detailValue}>
                    {selectedInvoice.notes}
                  </Text>
                </View>
              )}
            </Card>
            
            <View style={styles.modalActions}>
              <Button
                title="Edit"
                onPress={() => {
                  setShowDetailsModal(false);
                  navigation.navigate('InvoiceForm', { invoiceId: selectedInvoice._id });
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
          <Text style={styles.modalTitle}>Filter Invoices</Text>
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
              placeholder="Search by invoice number, client..."
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            
            <Text style={styles.filterSectionTitle}>Status</Text>
            <View style={styles.statusFilterContainer}>
              {['all', 'Draft', 'Pending', 'Paid', 'Overdue', 'Cancelled'].map((status) => (
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
          <Text>Loading invoices...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right', 'bottom']}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>Invoices</Text>
            <Text style={styles.headerSubtitle}>
              {filteredInvoices.length} of {pagination.total} invoices
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
              onPress={() => navigation.navigate('InvoiceForm')}
            >
              <Ionicons name="add" size={20} color="white" />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        onScroll={handleScroll}
        scrollEventThrottle={400}
        showsVerticalScrollIndicator={false}
      >
        {filteredInvoices.length === 0 ? (
          renderEmptyState()
        ) : (
          renderIconGrid()
        )}
      </ScrollView>
      
      {invoices.length > 0 && (
        <FloatingActionButton
          onPress={() => navigation.navigate('InvoiceForm')}
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
  invoiceIconContainer: {
    width: '30%',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
  },
  invoiceIcon: {
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
  invoiceIconTitle: {
    ...theme.typography.caption,
    color: theme.colors.text.primary,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 16,
    marginBottom: theme.spacing.xs,
  },
  invoiceIconAmount: {
    ...theme.typography.caption,
    color: theme.colors.primary,
    textAlign: 'center',
    fontSize: 11,
    fontWeight: '600',
    marginBottom: theme.spacing.xs,
  },
  invoiceIconStatus: {
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
});

export default InvoiceGeneratorScreen;