import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { theme } from '../theme';
import ApiService from '../services/api';

interface FinanceItem {
  id: string;
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  screen: string;
  color: string;
}

const FinanceScreen: React.FC = () => {
  const navigation = useNavigation();
  
  // Financial summary state
  const [incomeData, setIncomeData] = useState<any>(null);
  const [expensesData, setExpensesData] = useState<any>(null);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [selectedFinancialYear, setSelectedFinancialYear] = useState('2024-25');
  const [showYearSelector, setShowYearSelector] = useState(false);
  
  const financialYears = ['2023-24', '2024-25', '2025-26'];

  const fetchFinancialSummary = async () => {
    try {
      setSummaryLoading(true);
      console.log('Fetching financial summary for year:', selectedFinancialYear);
      
      // Fetch both income and expenses dashboard data in parallel
      const [incomeResponse, expensesResponse] = await Promise.all([
        ApiService.getIncomeDashboard({ year: selectedFinancialYear }).catch(err => {
          console.error('Income API error:', err);
          throw new Error(`Income API failed: ${err.message}`);
        }),
        ApiService.getExpensesDashboard({ year: selectedFinancialYear }).catch(err => {
          console.error('Expenses API error:', err);
          throw new Error(`Expenses API failed: ${err.message}`);
        })
      ]);
      
      console.log('Financial data loaded:', {
        income: incomeResponse?.totalAmount || 0,
        expenses: expensesResponse?.totalAmount || 0,
        year: selectedFinancialYear
      });
      
      setIncomeData(incomeResponse);
      setExpensesData(expensesResponse);
    } catch (error) {
      console.error('Error fetching financial summary:', error);
      Alert.alert('Error', `Failed to load financial summary: ${error.message}`);
    } finally {
      setSummaryLoading(false);
    }
  };

  const handleYearChange = (year: string) => {
    console.log('Changing financial year from', selectedFinancialYear, 'to', year);
    setSelectedFinancialYear(year);
    setShowYearSelector(false);
    // Add a small delay to ensure state is updated before fetching
    setTimeout(() => {
      fetchFinancialSummary();
    }, 100);
  };

  useEffect(() => {
    fetchFinancialSummary();
  }, []);

  const financeItems: FinanceItem[] = [
    {
      id: 'receivables',
      title: 'Receivables',
      icon: 'receipt',
      screen: 'ReceivablesList',
      color: theme.colors.success,
    },
    {
      id: 'payables',
      title: 'Payables',
      icon: 'card',
      screen: 'PayablesList',
      color: theme.colors.warning,
    },
    {
      id: 'payments',
      title: 'Payments',
      icon: 'card-outline',
      screen: 'PaymentsList',
      color: theme.colors.primary,
    },
    {
      id: 'mswipe-payments',
      title: 'mSwipe',
      icon: 'phone-portrait',
      screen: 'MSwipePayments',
      color: theme.colors.secondary,
    },
    {
      id: 'invoices',
      title: 'Invoices',
      icon: 'document-text',
      screen: 'InvoiceGenerator',
      color: theme.colors.info,
    },
    {
      id: 'expenses',
      title: 'Expenses',
      icon: 'trending-down',
      screen: 'ExpensesList',
      color: theme.colors.error,
    },
    {
      id: 'income',
      title: 'Income',
      icon: 'trending-up',
      screen: 'IncomeList',
      color: theme.colors.success,
    },
    {
      id: 'bank-feed',
      title: 'Bank Feed',
      icon: 'business',
      screen: 'BankFeed',
      color: theme.colors.primary,
    },
  ];

  const handleItemPress = (item: FinanceItem) => {
    navigation.navigate(item.screen as never);
  };

  const renderFinancialSummary = () => (
    <View style={styles.summaryContainer}>
      <View style={styles.summaryHeader}>
        <View style={styles.summaryTitleContainer}>
          <Text style={styles.summaryTitle}>Financial Summary</Text>
          <TouchableOpacity
            style={styles.yearSelector}
            onPress={() => setShowYearSelector(!showYearSelector)}
            disabled={summaryLoading}
          >
            <Text style={styles.yearText}>FY {selectedFinancialYear}</Text>
            {summaryLoading ? (
              <Ionicons name="refresh" size={16} color={theme.colors.primary} />
            ) : (
              <Ionicons name="chevron-down" size={16} color={theme.colors.primary} />
            )}
          </TouchableOpacity>
        </View>
        <TouchableOpacity
          style={styles.refreshButton}
          onPress={fetchFinancialSummary}
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

      <View style={styles.summaryContent}>
        {summaryLoading ? (
          <View style={styles.summaryLoading}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={styles.summaryLoadingText}>Loading financial data...</Text>
          </View>
        ) : incomeData && expensesData ? (
          <View style={styles.summaryCards}>
            {/* Income and Expenses Row */}
            <View style={styles.horizontalCards}>
              {/* Income Card */}
              <View style={[styles.summaryCard, styles.incomeCard, styles.horizontalCard]}>
                <View style={styles.cardHeader}>
                  <Ionicons name="trending-up" size={20} color={theme.colors.success} />
                  <Text style={styles.cardTitle}>Income</Text>
                </View>
                <Text style={styles.cardAmount} numberOfLines={1} ellipsizeMode="tail">
                  ₹{((incomeData.totalAmount || 0) - (incomeData.personalAmount || 0)).toLocaleString('en-IN')}
                </Text>
                <View style={styles.cardBreakdown}>
                  <View style={styles.breakdownItem}>
                    <Text style={styles.breakdownLabel}>Transactions</Text>
                    <Text style={styles.breakdownValue} numberOfLines={1} ellipsizeMode="tail">{incomeData.totalCount || '0'}</Text>
                  </View>
                </View>
              </View>

              {/* Expenses Card */}
              <View style={[styles.summaryCard, styles.expensesCard, styles.horizontalCard]}>
                <View style={styles.cardHeader}>
                  <Ionicons name="trending-down" size={20} color={theme.colors.error} />
                  <Text style={styles.cardTitle}>Expenses</Text>
                </View>
                <Text style={styles.cardAmount} numberOfLines={1} ellipsizeMode="tail">
                  ₹{((expensesData.totalAmount || 0) - (expensesData.personalAmount || 0)).toLocaleString('en-IN')}
                </Text>
                <View style={styles.cardBreakdown}>
                  <View style={styles.breakdownItem}>
                    <Text style={styles.breakdownLabel}>Transactions</Text>
                    <Text style={styles.breakdownValue} numberOfLines={1} ellipsizeMode="tail">{expensesData.totalCount || '0'}</Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Net Profit/Loss Card - Centered */}
            <View style={[styles.summaryCard, styles.netCard, styles.centeredCard]}>
              <View style={styles.cardHeader}>
                <Ionicons 
                  name={((incomeData.totalAmount || 0) - (incomeData.personalAmount || 0)) > ((expensesData.totalAmount || 0) - (expensesData.personalAmount || 0)) ? "trending-up" : "trending-down"} 
                  size={20} 
                  color={((incomeData.totalAmount || 0) - (incomeData.personalAmount || 0)) > ((expensesData.totalAmount || 0) - (expensesData.personalAmount || 0)) ? theme.colors.success : theme.colors.error} 
                />
                <Text style={styles.cardTitle}>Net Result</Text>
              </View>
              <Text 
                style={[
                  styles.cardAmount,
                  { color: ((incomeData.totalAmount || 0) - (incomeData.personalAmount || 0)) > ((expensesData.totalAmount || 0) - (expensesData.personalAmount || 0)) ? theme.colors.success : theme.colors.error }
                ]}
                numberOfLines={1} 
                ellipsizeMode="tail"
              >
                ₹{(((incomeData.totalAmount || 0) - (incomeData.personalAmount || 0)) - ((expensesData.totalAmount || 0) - (expensesData.personalAmount || 0))).toLocaleString('en-IN')}
              </Text>
              <Text style={styles.netLabel}>
                {((incomeData.totalAmount || 0) - (incomeData.personalAmount || 0)) > ((expensesData.totalAmount || 0) - (expensesData.personalAmount || 0)) ? 'Profit' : 'Loss'} for FY {selectedFinancialYear}
              </Text>
            </View>
          </View>
        ) : (
          <View style={styles.summaryError}>
            <Text style={styles.summaryErrorText}>Failed to load financial data</Text>
            <TouchableOpacity style={styles.retryButton} onPress={fetchFinancialSummary}>
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );

  const renderIconGrid = () => (
    <View style={styles.iconGrid}>
      {financeItems.map((item) => (
        <TouchableOpacity
          key={item.id}
          style={styles.iconItem}
          onPress={() => handleItemPress(item)}
          activeOpacity={0.7}
        >
          <View style={[styles.iconContainer, { backgroundColor: item.color + '20' }]}>
            <Ionicons name={item.icon} size={28} color={item.color} />
          </View>
          <Text style={styles.iconTitle}>{item.title}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Finance</Text>
        <Text style={styles.headerSubtitle}>Manage your financial operations</Text>
      </View>
      
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          {renderFinancialSummary()}
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Finance Operations</Text>
          {renderIconGrid()}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  headerTitle: {
    ...theme.typography.h2,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  headerSubtitle: {
    ...theme.typography.body2,
    color: theme.colors.text.secondary,
  },
  content: {
    flex: 1,
    padding: theme.spacing.lg,
  },
  section: {
    marginBottom: theme.spacing.xl,
  },
  iconGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.xs,
  },
  iconItem: {
    width: '30%',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
  },
  iconContainer: {
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
  iconTitle: {
    ...theme.typography.caption,
    color: theme.colors.text.primary,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 16,
  },
  // Financial Summary Styles
  summaryContainer: {
    backgroundColor: 'white',
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  summaryTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  summaryTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginRight: theme.spacing.sm,
  },
  refreshButton: {
    padding: theme.spacing.sm,
    borderRadius: theme.borderRadius.sm,
    backgroundColor: theme.colors.background,
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
  summaryContent: {
    minHeight: 200,
  },
  summaryLoading: {
    padding: theme.spacing.xl,
    alignItems: 'center',
  },
  summaryLoadingText: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    marginTop: theme.spacing.sm,
  },
  summaryError: {
    padding: theme.spacing.xl,
    alignItems: 'center',
  },
  summaryErrorText: {
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
  summaryCards: {
    gap: theme.spacing.md,
  },
  horizontalCards: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    minHeight: 120,
  },
  horizontalCard: {
    flex: 1,
    minWidth: 0, // Allow flex items to shrink below their content size
  },
  centeredCard: {
    alignSelf: 'center',
    width: '60%',
  },
  summaryCard: {
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.sm,
    borderLeftWidth: 4,
  },
  incomeCard: {
    borderLeftColor: theme.colors.success,
  },
  expensesCard: {
    borderLeftColor: theme.colors.error,
  },
  netCard: {
    borderLeftColor: theme.colors.primary,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginLeft: theme.spacing.sm,
    flexShrink: 1,
  },
  cardAmount: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
    flexWrap: 'nowrap',
  },
  cardBreakdown: {
    gap: 2,
  },
  breakdownItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  breakdownLabel: {
    fontSize: 10,
    color: theme.colors.text.secondary,
    flexShrink: 0,
  },
  breakdownValue: {
    fontSize: 10,
    fontWeight: '500',
    color: theme.colors.text.primary,
    flexShrink: 1,
    textAlign: 'right',
  },
  netLabel: {
    fontSize: 10,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    marginTop: theme.spacing.xs,
    flexWrap: 'nowrap',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.md,
  },
});

export default FinanceScreen;
