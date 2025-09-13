import React, { useRef, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../theme';

import { useAuth } from '../contexts/AuthContext';
import LoginScreen from '../screens/LoginScreen';
import DashboardScreen from '../screens/DashboardScreen';
import PatientListScreen from '../screens/PatientListScreen';
import PatientDetailsScreen from '../screens/PatientDetailsScreen';
import PatientFormScreen from '../screens/PatientFormScreen';
import TreatmentListScreen from '../screens/TreatmentListScreen';
import TreatmentDetailsScreen from '../screens/TreatmentDetailsScreen';
import TreatmentFormScreen from '../screens/TreatmentFormScreen';
import MobileTreatmentFormScreen from '../screens/MobileTreatmentFormScreen';
import ReceivablesListScreen from '../screens/ReceivablesListScreen';
import ReceivableFormScreen from '../screens/ReceivableFormScreen';
import FinanceScreen from '../screens/FinanceScreen';
import PayablesListScreen from '../screens/PayablesListScreen';
import PaymentsListScreen from '../screens/PaymentsListScreen';
import ExpensesListScreen from '../screens/ExpensesListScreen';
import IncomeListScreen from '../screens/IncomeListScreen';
import InvoiceGeneratorScreen from '../screens/InvoiceGeneratorScreen';
import BankFeedScreen from '../screens/BankFeedScreen';
import MSwipePaymentsScreen from '../screens/MSwipePaymentsScreen';
import ProfileScreen from '../screens/ProfileScreen';
import SettingsScreen from '../screens/SettingsScreen';
import AdminScreen from '../screens/AdminScreen';
import AdminSectionsScreen from '../screens/AdminSectionsScreen';
import AdminUsersScreen from '../screens/AdminUsersScreen';
import AdminCategoriesScreen from '../screens/AdminCategoriesScreen';
import AdminDoctorsScreen from '../screens/AdminDoctorsScreen';
import AdminSystemScreen from '../screens/AdminSystemScreen';
import MoreScreen from '../screens/MoreScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();
const Drawer = createDrawerNavigator();

// Main Tab Navigator
const MainTabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap;

          if (route.name === 'Dashboard') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Patients') {
            iconName = focused ? 'people' : 'people-outline';
          } else if (route.name === 'Treatments') {
            iconName = focused ? 'medical' : 'medical-outline';
          } else if (route.name === 'Finance') {
            iconName = focused ? 'wallet' : 'wallet-outline';
          } else if (route.name === 'More') {
            iconName = focused ? 'apps' : 'apps-outline';
          } else {
            iconName = 'help-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.text.secondary,
        headerShown: false,
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="Patients" component={PatientListScreen} />
      <Tab.Screen name="Treatments" component={TreatmentListScreen} />
      <Tab.Screen name="Finance" component={FinanceScreen} />
      <Tab.Screen name="More" component={MoreScreen} />
    </Tab.Navigator>
  );
};

// Drawer Navigator for additional screens
const DrawerNavigator = () => {
  return (
    <Drawer.Navigator
      screenOptions={{
        headerShown: true,
        headerStyle: {
          backgroundColor: theme.colors.white,
          height: 100, // Increased height for more space
          borderBottomWidth: 1,
          borderBottomColor: theme.colors.borderLight,
          elevation: 2,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.1,
          shadowRadius: 2,
        },
        headerTintColor: theme.colors.text.primary,
        headerTitleStyle: {
          fontWeight: '600',
          fontSize: 20, // Increased font size
          color: theme.colors.text.primary,
        },
      }}
    >
      <Drawer.Screen 
        name="MainTabs" 
        component={MainTabNavigator} 
        options={{ title: 'Spark' }}
      />
      <Drawer.Screen 
        name="Settings" 
        component={SettingsScreen} 
        options={{ title: 'Settings' }}
      />
      <Drawer.Screen 
        name="Admin" 
        component={AdminScreen} 
        options={{ title: 'Admin Panel' }}
      />
    </Drawer.Navigator>
  );
};

// Main Stack Navigator
const AppStackNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: true,
        headerStyle: {
          backgroundColor: theme.colors.white,
          height: 100, // Increased height for more space
          borderBottomWidth: 1,
          borderBottomColor: theme.colors.borderLight,
          elevation: 2,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.1,
          shadowRadius: 2,
        },
        headerTintColor: theme.colors.text.primary,
        headerTitleStyle: {
          fontWeight: '600',
          fontSize: 20, // Increased font size
          color: theme.colors.text.primary,
        },
      }}
    >
      <Stack.Screen 
        name="Main" 
        component={DrawerNavigator} 
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="PatientDetails" 
        component={PatientDetailsScreen}
        options={{ title: 'Patient Details' }}
      />
      <Stack.Screen 
        name="PatientForm" 
        component={PatientFormScreen}
        options={{ title: 'Add/Edit Patient' }}
      />
      <Stack.Screen 
        name="TreatmentDetails" 
        component={TreatmentDetailsScreen}
        options={{ title: 'Treatment Details' }}
      />
      <Stack.Screen 
        name="TreatmentForm" 
        component={TreatmentFormScreen}
        options={{ title: 'Add/Edit Treatment' }}
      />
      <Stack.Screen 
        name="MobileTreatmentForm" 
        component={MobileTreatmentFormScreen}
        options={{ title: 'Add/Edit Treatment' }}
      />
      <Stack.Screen 
        name="ReceivablesList" 
        component={ReceivablesListScreen}
        options={{ title: 'Receivables' }}
      />
      <Stack.Screen 
        name="ReceivableForm" 
        component={ReceivableFormScreen}
        options={{ title: 'Add/Edit Receivable' }}
      />
      <Stack.Screen 
        name="Finance" 
        component={FinanceScreen}
        options={{ title: 'Finance' }}
      />
      <Stack.Screen 
        name="PayablesList" 
        component={PayablesListScreen}
        options={{ title: 'Payables' }}
      />
      <Stack.Screen 
        name="PaymentsList" 
        component={PaymentsListScreen}
        options={{ title: 'Payments' }}
      />
      <Stack.Screen 
        name="ExpensesList" 
        component={ExpensesListScreen}
        options={{ title: 'Expenses' }}
      />
      <Stack.Screen 
        name="IncomeList" 
        component={IncomeListScreen}
        options={{ title: 'Income' }}
      />
      <Stack.Screen 
        name="InvoiceGenerator" 
        component={InvoiceGeneratorScreen}
        options={{ title: 'Invoices' }}
      />
      <Stack.Screen 
        name="BankFeed" 
        component={BankFeedScreen}
        options={{ title: 'Bank Feed' }}
      />
      <Stack.Screen 
        name="MSwipePayments" 
        component={MSwipePaymentsScreen}
        options={{ title: 'mSwipe Payments' }}
      />
      <Stack.Screen 
        name="AdminSections" 
        component={AdminSectionsScreen}
        options={{ title: 'Admin Options' }}
      />
      <Stack.Screen 
        name="Profile" 
        component={ProfileScreen}
        options={{ title: 'Profile' }}
      />
      <Stack.Screen 
        name="AdminUsers" 
        component={AdminUsersScreen}
        options={{ title: 'User Management' }}
      />
        <Stack.Screen
          name="AdminCategories"
          component={AdminCategoriesScreen}
          options={{ title: 'Treatment Categories' }}
        />
        <Stack.Screen
          name="AdminDoctors"
          component={AdminDoctorsScreen}
          options={{ title: 'Doctors' }}
        />
        <Stack.Screen
          name="AdminSystem"
          component={AdminSystemScreen}
          options={{ title: 'System Settings' }}
        />
    </Stack.Navigator>
  );
};

// Root Navigator
const AppNavigator = () => {
  const { isAuthenticated, isLoading, setNavigationRef } = useAuth();
  const navigationRef = useRef<NavigationContainerRef<any>>(null);

  useEffect(() => {
    if (navigationRef.current) {
      setNavigationRef(navigationRef.current);
    }
  }, []);

  if (isLoading) {
    // You can return a loading screen here
    return null;
  }

  return (
    <NavigationContainer ref={navigationRef}>
      {isAuthenticated ? (
        <AppStackNavigator />
      ) : (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Login" component={LoginScreen} />
        </Stack.Navigator>
      )}
    </NavigationContainer>
  );
};

export default AppNavigator;
