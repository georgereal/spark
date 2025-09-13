import React, { useEffect, useState, useCallback } from 'react';
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
  Platform,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { theme } from '../theme';
import ApiService, { BankTransaction } from '../services/api';
import FloatingActionButton from '../components/FloatingActionButton';
import { Card, Button } from '../components';
import { formatCurrency } from '../utils/currency';

const BankFeedScreen: React.FC = () => {
  const [transactions, setTransactions] = useState<BankTransaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<BankTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<BankTransaction | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [amountFilter, setAmountFilter] = useState({ min: '', max: '' });
  const [accountBalance, setAccountBalance] = useState(0);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0,
    hasMore: true
  });
  
  // New state for enhanced features
  const [selectedFinancialYear, setSelectedFinancialYear] = useState('2024-25');
  const [showYearSelector, setShowYearSelector] = useState(false);
  const [summaryData, setSummaryData] = useState({
    totalIncome: 0,
    totalExpenses: 0,
    netAmount: 0,
    incomeCount: 0,
    expenseCount: 0
  });
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'income' | 'expenses'>('income');
  const [mswipeLinking, setMswipeLinking] = useState(false);
  const [analysisData, setAnalysisData] = useState(null);
  const [showAnalysis, setShowAnalysis] = useState(false);
  
  // Upload-related state
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [uploadWarning, setUploadWarning] = useState('');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [overrideDate, setOverrideDate] = useState(false);
  const [customMinDate, setCustomMinDate] = useState('');
  const [minDate, setMinDate] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const [workingData, setWorkingData] = useState(null);
  
  const navigation = useNavigation();

  // Financial year options
  const financialYears = ['2020-21', '2021-22', '2022-23', '2023-24', '2024-25', '2025-26', '2026-27'];

  // Fetch summary data for selected financial year
  const fetchSummaryData = useCallback(async () => {
    setSummaryLoading(true);
    try {
      const [incomeRes, expensesRes] = await Promise.all([
        ApiService.getIncomeDashboard({ year: selectedFinancialYear }),
        ApiService.getExpensesDashboard({ year: selectedFinancialYear })
      ]);
      
      const totalIncome = (incomeRes.totalAmount || 0) - (incomeRes.personalAmount || 0);
      const totalExpenses = (expensesRes.totalAmount || 0) - (expensesRes.personalAmount || 0);
      
      setSummaryData({
        totalIncome,
        totalExpenses,
        netAmount: totalIncome - totalExpenses,
        incomeCount: incomeRes.totalCount || 0,
        expenseCount: expensesRes.totalCount || 0
      });
    } catch (error) {
      console.error('Error fetching summary data:', error);
    } finally {
      setSummaryLoading(false);
    }
  }, [selectedFinancialYear]);

  // Handle financial year change
  const handleYearChange = (year: string) => {
    setSelectedFinancialYear(year);
    setShowYearSelector(false);
    fetchSummaryData();
  };

  // Fetch mSwipe analysis
  const fetchAnalysis = async () => {
    try {
      setMswipeLinking(true);
      const response = await ApiService.get('/bank-statement/mswipe-analysis');
      setAnalysisData(response.data);
      setShowAnalysis(true);
    } catch (error) {
      console.error('Error fetching analysis:', error);
      Alert.alert('Error', 'Failed to fetch analysis data');
    } finally {
      setMswipeLinking(false);
    }
  };

  // Bulk link mSwipe transactions
  const handleBulkLinkMswipe = async () => {
    try {
      setMswipeLinking(true);
      const response = await ApiService.post('/bank-statement/link-mswipe');
      Alert.alert('Success', response.data.message);
    } catch (error) {
      console.error('Error linking mSwipe:', error);
      Alert.alert('Error', 'Failed to link mSwipe transactions');
    } finally {
      setMswipeLinking(false);
    }
  };

  // Fetch sessions
  const fetchSessions = async () => {
    setLoadingSessions(true);
    try {
      console.log('🔍 [BankFeed] Fetching sessions...');
      const response = await ApiService.get('/bank-statement/sessions');
      console.log('📁 [BankFeed] Sessions response:', response.data);
      setSessions(response.data);
    } catch (error) {
      console.error('❌ [BankFeed] Error fetching sessions:', error);
      // Don't throw error, just log it
    } finally {
      setLoadingSessions(false);
    }
  };

  // Load session data
  const loadSessionData = async (sessionId: string) => {
    try {
      const response = await ApiService.get(`/bank-statement/working-area/${sessionId}`);
      setWorkingData(response.data);
      setCurrentSessionId(sessionId);
    } catch (error) {
      console.error('Error loading session data:', error);
      Alert.alert('Error', 'Failed to load session data');
    }
  };

  // Handle bank statement upload
  const handleBankStatementUpload = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['text/csv', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
        copyToCacheDirectory: true,
      });

      if (result.canceled) return;

      const file = result.assets[0];
      setUploading(true);
      setUploadError('');
      setUploadWarning('');
      setWorkingData(null);

      const formData = new FormData();
      formData.append('bankStatement', {
        uri: file.uri,
        type: file.mimeType || 'text/csv',
        name: file.name,
      } as any);

      if (!overrideDate && minDate) {
        formData.append('minDate', minDate);
      } else if (overrideDate && customMinDate) {
        formData.append('minDate', customMinDate);
      }

      const response = await ApiService.post('/bank-statement/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.sessionId) {
        await loadSessionData(response.data.sessionId);
        await fetchSessions();
        
        if (response.data.errors && response.data.errors.length > 0) {
          setUploadWarning(response.data.errors.join('\n'));
        }
        
        Alert.alert(
          'Upload Successful',
          `Bank statement uploaded successfully. Session ID: ${response.data.sessionId.substring(0, 8)}...`
        );
        setShowUploadModal(false);
      } else {
        setUploadError('Failed to upload statement.');
      }
    } catch (error) {
      console.error('Error uploading bank statement:', error);
      setUploadError(error.response?.data?.message || 'Failed to upload and parse statement');
    } finally {
      setUploading(false);
    }
  };

  // Fetch latest dates for filtering
  const fetchLatestDates = async () => {
    try {
      console.log('🔍 [BankFeed] Fetching latest dates...');
      const response = await ApiService.get('/bank-statement/latest-dates');
      console.log('📅 [BankFeed] Latest dates response:', response.data);
      
      const { latestIncomeDate, latestExpenseDate } = response.data;
      
      if (latestIncomeDate && latestExpenseDate) {
        const incomeDate = new Date(latestIncomeDate);
        const expenseDate = new Date(latestExpenseDate);
        setMinDate(incomeDate > expenseDate ? latestIncomeDate : latestExpenseDate);
        console.log('📅 [BankFeed] Min date set to:', incomeDate > expenseDate ? latestIncomeDate : latestExpenseDate);
      }
    } catch (error) {
      console.error('❌ [BankFeed] Error fetching latest dates:', error);
      // Don't throw error, just log it as this is not critical
    }
  };

  const fetchTransactions = async (page: number = 1, append: boolean = false) => {
    try {
      const params: any = {
        page,
        limit: pagination.limit,
        sortBy: 'date',
        sortOrder: 'desc'
      };

      // Add filters only if they have values
      if (searchQuery && searchQuery.trim()) {
        params.search = searchQuery.trim();
      }
      if (typeFilter && typeFilter !== 'all') {
        params.category = typeFilter;
      }
      if (statusFilter && statusFilter !== 'all') {
        params.personal = statusFilter === 'Personal';
      }
      if (amountFilter.min && amountFilter.min.trim()) {
        params.minAmount = parseFloat(amountFilter.min);
      }
      if (amountFilter.max && amountFilter.max.trim()) {
        params.maxAmount = parseFloat(amountFilter.max);
      }

      console.log('API params being sent:', params);
      const data = await ApiService.getBankTransactions(params);
      console.log('Bank transactions data received:', data);
      
      const transactionsData = data.income || [];
      const paginationData = data.pagination || { page: 1, limit: 20, total: 0, pages: 0 };
      
      if (append) {
        // Append new data to existing data
        setTransactions(prev => [...prev, ...transactionsData]);
        setFilteredTransactions(prev => [...prev, ...transactionsData]);
      } else {
        // Replace existing data
        setTransactions(transactionsData);
        setFilteredTransactions(transactionsData);
        
        // Calculate account balance from latest transaction
        if (transactionsData.length > 0) {
          setAccountBalance(transactionsData[0].balance || 0);
        }
      }
      
      setPagination({
        page: paginationData.page,
        limit: paginationData.limit,
        total: paginationData.total,
        pages: paginationData.pages,
        hasMore: paginationData.page < paginationData.pages
      });
    } catch (error: any) {
      console.error('Error fetching bank transactions:', error);
      if (error.message?.includes('Authentication required')) {
        Alert.alert('Authentication Error', 'Please login again');
      } else {
        Alert.alert('Error', 'Failed to fetch bank transactions. Please check your connection.');
      }
      if (!append) {
        setTransactions([]);
        setFilteredTransactions([]);
      }
    } finally {
      setIsLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
    fetchSummaryData();
    fetchSessions();
    fetchLatestDates();
  }, []);

  // Handle filter changes by refetching data
  useEffect(() => {
    // Only refetch if we're not in the initial loading state
    if (!isLoading) {
      console.log('Filters changed, refetching data...', { searchQuery, typeFilter, statusFilter, amountFilter });
      // Reset pagination when filters change
      setPagination(prev => ({ ...prev, page: 1, hasMore: true }));
      fetchTransactions(1, false);
    }
  }, [searchQuery, typeFilter, statusFilter, amountFilter]);

  const loadMoreTransactions = async () => {
    if (loadingMore || !pagination.hasMore) return;
    
    setLoadingMore(true);
    await fetchTransactions(pagination.page + 1, true);
  };

  const getTypeColor = (category: string) => {
    switch (category?.toLowerCase()) {
      case 'upi':
        return theme.colors.primary;
      case 'neft':
        return theme.colors.success;
      case 'imps':
        return theme.colors.warning;
      case 'rtgs':
        return theme.colors.info;
      case 'cash':
        return theme.colors.text.secondary;
      case 'debit card':
        return theme.colors.error;
      default:
        return theme.colors.text.secondary;
    }
  };

  const getTypeIcon = (category: string) => {
    switch (category?.toLowerCase()) {
      case 'upi':
        return 'phone-portrait';
      case 'neft':
        return 'swap-horizontal';
      case 'imps':
        return 'flash';
      case 'rtgs':
        return 'business';
      case 'cash':
        return 'cash';
      case 'debit card':
        return 'card';
      default:
        return 'card';
    }
  };

  const getStatusColor = (personal: boolean) => {
    return personal ? theme.colors.warning : theme.colors.success;
  };

  const getStatusIcon = (personal: boolean) => {
    return personal ? 'person' : 'checkmark-circle';
  };

  const getCategoryIcon = (category?: string) => {
    switch (category?.toLowerCase()) {
      case 'salary':
        return 'briefcase';
      case 'payment':
        return 'card';
      case 'transfer':
        return 'swap-horizontal';
      case 'withdrawal':
        return 'cash';
      case 'deposit':
        return 'add-circle';
      default:
        return 'card';
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

  const handleTransactionPress = (transaction: BankTransaction) => {
    setSelectedTransaction(transaction);
    setShowDetailsModal(true);
  };

  const handleFilterPress = () => {
    setShowFilterModal(true);
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setTypeFilter('all');
    setStatusFilter('all');
    setAmountFilter({ min: '', max: '' });
  };

  const applyFilters = () => {
    setShowFilterModal(false);
  };

  const onRefresh = () => {
    setRefreshing(true);
    setPagination(prev => ({ ...prev, page: 1, hasMore: true }));
    fetchTransactions(1, false);
  };

  const handleScroll = (event: any) => {
    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
    const isCloseToBottom = layoutMeasurement.height + contentOffset.y >= contentSize.height - 20;
    
    if (isCloseToBottom && pagination.hasMore && !loadingMore) {
      loadMoreTransactions();
    }
  };

  // Render summary cards
  const renderSummaryCards = () => (
    <View style={styles.summaryContainer}>
      <View style={styles.summaryHeader}>
        <Text style={styles.summaryTitle}>Financial Summary</Text>
        <TouchableOpacity
          style={styles.yearSelector}
          onPress={() => setShowYearSelector(true)}
        >
          <Text style={styles.yearText}>{selectedFinancialYear}</Text>
          <Ionicons name="chevron-down" size={16} color={theme.colors.text.primary} />
        </TouchableOpacity>
      </View>
      
      {summaryLoading ? (
        <View style={styles.summaryLoading}>
          <ActivityIndicator size="small" color={theme.colors.primary} />
          <Text style={styles.summaryLoadingText}>Loading summary...</Text>
        </View>
      ) : (
        <View style={styles.summaryCards}>
          <View style={styles.horizontalCards}>
            <View style={[styles.summaryCard, styles.incomeCard]}>
              <View style={styles.cardHeader}>
                <Ionicons name="trending-up" size={20} color="white" />
                <Text style={styles.cardTitle}>Income</Text>
              </View>
              <Text style={styles.cardAmount}>{formatCurrency(summaryData.totalIncome)}</Text>
              <Text style={styles.cardSubtitle}>{summaryData.incomeCount} transactions</Text>
            </View>
            
            <View style={[styles.summaryCard, styles.expensesCard]}>
              <View style={styles.cardHeader}>
                <Ionicons name="trending-down" size={20} color="white" />
                <Text style={styles.cardTitle}>Expenses</Text>
              </View>
              <Text style={styles.cardAmount}>{formatCurrency(summaryData.totalExpenses)}</Text>
              <Text style={styles.cardSubtitle}>{summaryData.expenseCount} transactions</Text>
            </View>
          </View>
          
          <View style={[styles.summaryCard, styles.netCard, styles.centeredCard]}>
            <View style={styles.cardHeader}>
              <Ionicons 
                name={summaryData.netAmount >= 0 ? "trending-up" : "trending-down"} 
                size={20} 
                color="white" 
              />
              <Text style={styles.cardTitle}>Net Result</Text>
            </View>
            <Text style={styles.cardAmount}>{formatCurrency(summaryData.netAmount)}</Text>
            <Text style={styles.cardSubtitle}>
              {summaryData.netAmount >= 0 ? 'Profit' : 'Loss'} FY {selectedFinancialYear}
            </Text>
          </View>
        </View>
      )}
    </View>
  );

  // Render tabs
  const renderTabs = () => (
    <View style={styles.tabsContainer}>
      <TouchableOpacity
        style={[styles.tab, activeTab === 'income' && styles.activeTab]}
        onPress={() => setActiveTab('income')}
      >
        <Text style={[styles.tabText, activeTab === 'income' && styles.activeTabText]}>
          Income
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.tab, activeTab === 'expenses' && styles.activeTab]}
        onPress={() => setActiveTab('expenses')}
      >
        <Text style={[styles.tabText, activeTab === 'expenses' && styles.activeTabText]}>
          Expenses
        </Text>
      </TouchableOpacity>
    </View>
  );

  // Render upload section
  const renderUploadSection = () => (
    <View style={styles.uploadContainer}>
      <View style={styles.uploadHeader}>
        <Ionicons name="cloud-upload" size={24} color={theme.colors.primary} />
        <Text style={styles.uploadTitle}>Upload Bank Statement</Text>
      </View>
      <Text style={styles.uploadSubtitle}>
        Upload your bank statement to auto-classify and reconcile income and expenses
      </Text>
      
      <TouchableOpacity
        style={styles.uploadButton}
        onPress={() => setShowUploadModal(true)}
        disabled={uploading}
      >
        <Ionicons name="document" size={20} color="white" />
        <Text style={styles.uploadButtonText}>
          {uploading ? 'Uploading...' : 'Select File'}
        </Text>
      </TouchableOpacity>
      
      <Text style={styles.uploadInfo}>
        Supported: CSV, XLS, XLSX. Only new transactions after last upload will be loaded by default.
      </Text>
    </View>
  );

  // Render sessions section
  const renderSessionsSection = () => {
    if (loadingSessions) {
      return (
        <View style={styles.sessionsContainer}>
          <View style={styles.sessionsLoading}>
            <ActivityIndicator size="small" color={theme.colors.primary} />
            <Text style={styles.sessionsLoadingText}>Loading sessions...</Text>
          </View>
        </View>
      );
    }

    if (sessions.length === 0) {
      return (
        <View style={styles.sessionsContainer}>
          <Text style={styles.sessionsTitle}>No Active Sessions</Text>
          <Text style={styles.sessionsSubtitle}>
            Upload a bank statement to create a new session for review and editing.
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.sessionsContainer}>
        <Text style={styles.sessionsTitle}>Active Sessions</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.sessionsList}>
            {sessions.map((session: any) => (
              <TouchableOpacity
                key={session._id}
                style={[
                  styles.sessionCard,
                  currentSessionId === session._id && styles.sessionCardActive
                ]}
                onPress={() => loadSessionData(session._id)}
              >
                <Text style={styles.sessionId}>
                  {session._id.substring(0, 8)}...
                </Text>
                <Text style={styles.sessionStats}>
                  Total: {session.totalRecords} | Income: {session.incomeCount} | Expense: {session.expenseCount}
                </Text>
                <Text style={styles.sessionDate}>
                  {new Date(session.createdAt).toLocaleDateString()}
                </Text>
                <View style={styles.sessionStatus}>
                  <Text style={[
                    styles.sessionStatusText,
                    currentSessionId === session._id && styles.sessionStatusTextActive
                  ]}>
                    {currentSessionId === session._id ? 'Active' : 'Load'}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>
    );
  };

  // Render action buttons
  const renderActionButtons = () => (
    <View style={styles.actionButtons}>
      <TouchableOpacity
        style={[styles.actionButton, styles.linkButton]}
        onPress={handleBulkLinkMswipe}
        disabled={mswipeLinking}
      >
        <Ionicons name="link" size={16} color="white" />
        <Text style={styles.actionButtonText}>
          {mswipeLinking ? 'Linking...' : 'Link mSwipe'}
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={[styles.actionButton, styles.analysisButton]}
        onPress={fetchAnalysis}
        disabled={mswipeLinking}
      >
        <Ionicons name="analytics" size={16} color="white" />
        <Text style={styles.actionButtonText}>
          {mswipeLinking ? 'Analyzing...' : 'Analysis'}
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderTransactionIcon = (transaction: BankTransaction) => (
    <TouchableOpacity
      key={transaction._id}
      style={styles.transactionIconContainer}
      onPress={() => handleTransactionPress(transaction)}
      activeOpacity={0.7}
    >
      <View style={[styles.transactionIcon, { backgroundColor: getTypeColor(transaction.category) + '20' }]}>
        <Ionicons 
          name={getTypeIcon(transaction.category) as any} 
          size={32} 
          color={getTypeColor(transaction.category)} 
        />
      </View>
      <Text style={styles.transactionIconTitle} numberOfLines={2}>
        {transaction.narration || 'Transaction'}
      </Text>
      <Text style={[styles.transactionIconAmount, { color: getTypeColor(transaction.category) }]}>
        +{formatCurrency(transaction.deposit)}
      </Text>
      <Text style={styles.transactionIconStatus}>
        {transaction.personal ? 'PERSONAL' : 'BUSINESS'}
      </Text>
    </TouchableOpacity>
  );

  const renderIconGrid = () => (
    <View>
      <View style={styles.iconGrid}>
        {filteredTransactions.map(renderTransactionIcon)}
      </View>
      {loadingMore && (
        <View style={styles.loadingMoreContainer}>
          <Text style={styles.loadingMoreText}>Loading more transactions...</Text>
        </View>
      )}
      {!pagination.hasMore && filteredTransactions.length > 0 && (
        <View style={styles.endOfListContainer}>
          <Text style={styles.endOfListText}>No more transactions to load</Text>
        </View>
      )}
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="card-outline" size={64} color="#ccc" />
      <Text style={styles.emptyStateTitle}>No Transactions Found</Text>
      <Text style={styles.emptyStateSubtitle}>
        Bank transactions will appear here
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
          <Text style={styles.modalTitle}>Transaction Details</Text>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => setShowDetailsModal(false)}
          >
            <Ionicons name="close" size={24} color={theme.colors.text.primary} />
          </TouchableOpacity>
        </View>
        
        {selectedTransaction && (
          <ScrollView style={styles.modalContent}>
            <Card style={styles.detailsCard}>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Narration:</Text>
                <Text style={styles.detailValue}>
                  {selectedTransaction.narration || 'No narration'}
                </Text>
              </View>
              
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Amount:</Text>
                <Text style={[styles.detailValue, { color: getTypeColor(selectedTransaction.category) }]}>
                  +{formatCurrency(selectedTransaction.deposit)}
                </Text>
              </View>
              
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Category:</Text>
                <View style={styles.typeContainer}>
                  <Ionicons 
                    name={getTypeIcon(selectedTransaction.category) as any} 
                    size={16} 
                    color={getTypeColor(selectedTransaction.category)} 
                  />
                  <Text style={[styles.typeText, { color: getTypeColor(selectedTransaction.category) }]}>
                    {selectedTransaction.category?.toUpperCase() || 'UNKNOWN'}
                  </Text>
                </View>
              </View>
              
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Type:</Text>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(selectedTransaction.personal) + '20' }]}>
                  <Ionicons 
                    name={getStatusIcon(selectedTransaction.personal) as any} 
                    size={16} 
                    color={getStatusColor(selectedTransaction.personal)} 
                  />
                  <Text style={[styles.statusText, { color: getStatusColor(selectedTransaction.personal) }]}>
                    {selectedTransaction.personal ? 'PERSONAL' : 'BUSINESS'}
                  </Text>
                </View>
              </View>
              
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Date:</Text>
                <Text style={styles.detailValue}>
                  {formatDate(selectedTransaction.date)}
                </Text>
              </View>
              
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Balance:</Text>
                <Text style={[styles.detailValue, styles.balanceValue]}>
                  {formatCurrency(selectedTransaction.balance)}
                </Text>
              </View>
              
              {selectedTransaction.recipient && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Recipient:</Text>
                  <Text style={styles.detailValue}>
                    {selectedTransaction.recipient}
                  </Text>
                </View>
              )}
              
              {selectedTransaction.upiId && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>UPI ID:</Text>
                  <Text style={styles.detailValue}>
                    {selectedTransaction.upiId}
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
          <Text style={styles.modalTitle}>Filter Transactions</Text>
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
              placeholder="Search by narration, recipient, UPI ID..."
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            
            <Text style={styles.filterSectionTitle}>Category</Text>
            <View style={styles.statusFilterContainer}>
              {['all', 'UPI', 'NEFT', 'IMPS', 'RTGS', 'Cash', 'Debit Card'].map((category) => (
                <TouchableOpacity
                  key={category}
                  style={[
                    styles.statusFilterButton,
                    typeFilter === category && styles.statusFilterButtonActive
                  ]}
                  onPress={() => setTypeFilter(category)}
                >
                  <Text style={[
                    styles.statusFilterButtonText,
                    typeFilter === category && styles.statusFilterButtonTextActive
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
                    statusFilter === type && styles.statusFilterButtonActive
                  ]}
                  onPress={() => setStatusFilter(type)}
                >
                  <Text style={[
                    styles.statusFilterButtonText,
                    statusFilter === type && styles.statusFilterButtonTextActive
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
          <Text>Loading transactions...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right', 'bottom']}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>Bank Feed</Text>
            <Text style={styles.headerSubtitle}>
              {filteredTransactions.length} of {pagination.total} transactions
            </Text>
            <Text style={styles.balanceText}>
              Balance: {formatCurrency(accountBalance)}
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

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        onScroll={handleScroll}
        scrollEventThrottle={400}
        showsVerticalScrollIndicator={false}
      >
      {/* Upload Section */}
      {renderUploadSection()}
      
      {/* Sessions Section */}
      {renderSessionsSection()}
      
      {/* Financial Summary Cards */}
      {renderSummaryCards()}
      
      {/* Tabs */}
      {renderTabs()}
      
      {/* Action Buttons */}
      {renderActionButtons()}
      
      {/* Transactions Grid */}
      {filteredTransactions.length === 0 ? (
        renderEmptyState()
      ) : (
        renderIconGrid()
      )}
      </ScrollView>

      {/* Year Selector Modal */}
      <Modal
        visible={showYearSelector}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowYearSelector(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Financial Year</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowYearSelector(false)}
            >
              <Ionicons name="close" size={24} color={theme.colors.text.primary} />
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.modalContent}>
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
                  {year}
                </Text>
                {selectedFinancialYear === year && (
                  <Ionicons name="checkmark" size={20} color={theme.colors.primary} />
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Analysis Modal */}
      <Modal
        visible={showAnalysis}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowAnalysis(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>mSwipe Analysis</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowAnalysis(false)}
            >
              <Ionicons name="close" size={24} color={theme.colors.text.primary} />
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.modalContent}>
            {analysisData ? (
              <View>
                <Text style={styles.analysisText}>
                  Analysis data loaded successfully. This feature provides detailed insights into mSwipe transaction mapping and reconciliation.
                </Text>
                {/* Add more analysis content here */}
              </View>
            ) : (
              <View style={styles.analysisLoading}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
                <Text style={styles.analysisLoadingText}>Loading analysis...</Text>
              </View>
            )}
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Upload Modal */}
      <Modal
        visible={showUploadModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowUploadModal(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Upload Bank Statement</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowUploadModal(false)}
            >
              <Ionicons name="close" size={24} color={theme.colors.text.primary} />
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.modalContent}>
            <View style={styles.uploadModalContent}>
              <View style={styles.uploadInfoSection}>
                <Ionicons name="information-circle" size={24} color={theme.colors.info} />
                <Text style={styles.uploadInfoText}>
                  Upload your bank statement file to automatically classify and reconcile income and expenses.
                </Text>
              </View>
              
              <View style={styles.uploadOptions}>
                <Text style={styles.uploadOptionsTitle}>Upload Options</Text>
                
                <TouchableOpacity
                  style={styles.uploadOption}
                  onPress={() => setOverrideDate(!overrideDate)}
                >
                  <View style={styles.uploadOptionLeft}>
                    <Ionicons 
                      name={overrideDate ? "checkbox" : "square-outline"} 
                      size={20} 
                      color={theme.colors.primary} 
                    />
                    <Text style={styles.uploadOptionText}>Override minimum date</Text>
                  </View>
                </TouchableOpacity>
                
                {overrideDate && (
                  <View style={styles.dateInputContainer}>
                    <Text style={styles.dateInputLabel}>Import from date</Text>
                    <TextInput
                      style={styles.dateInput}
                      value={customMinDate}
                      onChangeText={setCustomMinDate}
                      placeholder="YYYY-MM-DD"
                      placeholderTextColor={theme.colors.text.secondary}
                    />
                  </View>
                )}
                
                {!overrideDate && minDate && (
                  <View style={styles.dateInfoContainer}>
                    <Ionicons name="calendar" size={16} color={theme.colors.text.secondary} />
                    <Text style={styles.dateInfoText}>
                      Only transactions after: {new Date(minDate).toLocaleDateString()}
                    </Text>
                  </View>
                )}
              </View>
              
              <TouchableOpacity
                style={[styles.uploadButton, styles.uploadButtonLarge]}
                onPress={handleBankStatementUpload}
                disabled={uploading}
              >
                <Ionicons name="cloud-upload" size={24} color="white" />
                <Text style={styles.uploadButtonTextLarge}>
                  {uploading ? 'Uploading...' : 'Select File to Upload'}
                </Text>
              </TouchableOpacity>
              
              {uploadError ? (
                <View style={styles.errorContainer}>
                  <Ionicons name="alert-circle" size={20} color={theme.colors.error} />
                  <Text style={styles.errorText}>{uploadError}</Text>
                </View>
              ) : null}
              
              {uploadWarning ? (
                <View style={styles.warningContainer}>
                  <Ionicons name="warning" size={20} color={theme.colors.warning} />
                  <Text style={styles.warningText}>{uploadWarning}</Text>
                </View>
              ) : null}
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>

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
  balanceText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.primary,
    marginTop: theme.spacing.xs,
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
  },
  transactionIconContainer: {
    width: '30%',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
  },
  transactionIcon: {
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
  transactionIconTitle: {
    ...theme.typography.caption,
    color: theme.colors.text.primary,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 16,
    marginBottom: theme.spacing.xs,
  },
  transactionIconAmount: {
    ...theme.typography.caption,
    textAlign: 'center',
    fontSize: 11,
    fontWeight: '600',
    marginBottom: theme.spacing.xs,
  },
  transactionIconStatus: {
    ...theme.typography.caption,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    fontSize: 10,
    fontWeight: '400',
  },
  typeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  typeText: {
    fontSize: 14,
    color: theme.colors.text.primary,
    marginLeft: theme.spacing.xs,
    fontWeight: '500',
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
    color: theme.colors.primary,
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
  
  // Summary Cards Styles
  summaryContainer: {
    backgroundColor: theme.colors.white,
    margin: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  yearSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.sm,
  },
  yearText: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.text.primary,
    marginRight: theme.spacing.xs,
  },
  summaryLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.lg,
  },
  summaryLoadingText: {
    marginLeft: theme.spacing.sm,
    fontSize: 14,
    color: theme.colors.text.secondary,
  },
  summaryCards: {
    gap: theme.spacing.sm,
  },
  horizontalCards: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  summaryCard: {
    flex: 1,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    minHeight: 100,
  },
  incomeCard: {
    backgroundColor: theme.colors.success,
  },
  expensesCard: {
    backgroundColor: theme.colors.error,
  },
  netCard: {
    backgroundColor: theme.colors.primary,
  },
  centeredCard: {
    alignSelf: 'center',
    width: '60%',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
    marginLeft: theme.spacing.sm,
  },
  cardAmount: {
    fontSize: 18,
    fontWeight: '700',
    color: 'white',
    marginBottom: theme.spacing.xs,
  },
  cardSubtitle: {
    fontSize: 12,
    color: 'white',
    opacity: 0.8,
  },
  
  // Tabs Styles
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: theme.colors.white,
    marginHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: theme.spacing.sm,
    alignItems: 'center',
    borderRadius: theme.borderRadius.sm,
  },
  activeTab: {
    backgroundColor: theme.colors.primary,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.text.secondary,
  },
  activeTabText: {
    color: 'white',
  },
  
  // Action Buttons Styles
  actionButtons: {
    flexDirection: 'row',
    marginHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
  },
  linkButton: {
    backgroundColor: theme.colors.info,
  },
  analysisButton: {
    backgroundColor: theme.colors.warning,
  },
  actionButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: theme.spacing.xs,
  },
  
  // Year Selector Modal Styles
  yearOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderLight,
  },
  yearOptionSelected: {
    backgroundColor: theme.colors.primary + '10',
  },
  yearOptionText: {
    fontSize: 16,
    color: theme.colors.text.primary,
  },
  yearOptionTextSelected: {
    color: theme.colors.primary,
    fontWeight: '600',
  },
  
  // Analysis Modal Styles
  analysisText: {
    fontSize: 16,
    color: theme.colors.text.primary,
    lineHeight: 24,
    marginBottom: theme.spacing.md,
  },
  analysisLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.xl,
  },
  analysisLoadingText: {
    marginLeft: theme.spacing.sm,
    fontSize: 16,
    color: theme.colors.text.secondary,
  },
  
  // Upload Section Styles
  uploadContainer: {
    backgroundColor: '#e3f2fd',
    margin: theme.spacing.md,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.colors.primary + '20',
  },
  uploadHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  uploadTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginLeft: theme.spacing.sm,
  },
  uploadSubtitle: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.md,
    lineHeight: 20,
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.sm,
  },
  uploadButtonLarge: {
    paddingVertical: theme.spacing.md,
    marginTop: theme.spacing.md,
  },
  uploadButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: theme.spacing.xs,
  },
  uploadButtonTextLarge: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: theme.spacing.sm,
  },
  uploadInfo: {
    fontSize: 12,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  
  // Sessions Section Styles
  sessionsContainer: {
    backgroundColor: theme.colors.white,
    margin: theme.spacing.md,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  sessionsLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.lg,
  },
  sessionsLoadingText: {
    marginLeft: theme.spacing.sm,
    fontSize: 14,
    color: theme.colors.text.secondary,
  },
  sessionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
  },
  sessionsSubtitle: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    lineHeight: 20,
  },
  sessionsList: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  sessionCard: {
    backgroundColor: theme.colors.background,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    minWidth: 200,
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
  },
  sessionCardActive: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primary + '10',
  },
  sessionId: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  sessionStats: {
    fontSize: 12,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.xs,
  },
  sessionDate: {
    fontSize: 12,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.sm,
  },
  sessionStatus: {
    alignSelf: 'flex-start',
  },
  sessionStatusText: {
    fontSize: 12,
    color: theme.colors.primary,
    fontWeight: '500',
  },
  sessionStatusTextActive: {
    color: theme.colors.success,
  },
  
  // Upload Modal Styles
  uploadModalContent: {
    padding: theme.spacing.md,
  },
  uploadInfoSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: theme.colors.info + '10',
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.lg,
  },
  uploadInfoText: {
    flex: 1,
    fontSize: 14,
    color: theme.colors.text.primary,
    marginLeft: theme.spacing.sm,
    lineHeight: 20,
  },
  uploadOptions: {
    marginBottom: theme.spacing.lg,
  },
  uploadOptionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.md,
  },
  uploadOption: {
    marginBottom: theme.spacing.sm,
  },
  uploadOptionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  uploadOptionText: {
    fontSize: 14,
    color: theme.colors.text.primary,
    marginLeft: theme.spacing.sm,
  },
  dateInputContainer: {
    marginTop: theme.spacing.sm,
    marginLeft: theme.spacing.xl,
  },
  dateInputLabel: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.xs,
  },
  dateInput: {
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
    borderRadius: theme.borderRadius.sm,
    padding: theme.spacing.sm,
    fontSize: 14,
    color: theme.colors.text.primary,
  },
  dateInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: theme.spacing.sm,
    marginLeft: theme.spacing.xl,
  },
  dateInfoText: {
    fontSize: 12,
    color: theme.colors.text.secondary,
    marginLeft: theme.spacing.xs,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.error + '10',
    padding: theme.spacing.sm,
    borderRadius: theme.borderRadius.sm,
    marginTop: theme.spacing.md,
  },
  errorText: {
    flex: 1,
    fontSize: 14,
    color: theme.colors.error,
    marginLeft: theme.spacing.sm,
  },
  warningContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.warning + '10',
    padding: theme.spacing.sm,
    borderRadius: theme.borderRadius.sm,
    marginTop: theme.spacing.md,
  },
  warningText: {
    flex: 1,
    fontSize: 14,
    color: theme.colors.warning,
    marginLeft: theme.spacing.sm,
  },
});

export default BankFeedScreen;