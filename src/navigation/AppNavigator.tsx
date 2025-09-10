import React from 'react';
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
import ReceivablesListScreen from '../screens/ReceivablesListScreen';
import ReceivableFormScreen from '../screens/ReceivableFormScreen';
import ProfileScreen from '../screens/ProfileScreen';
import SettingsScreen from '../screens/SettingsScreen';

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
          } else if (route.name === 'Receivables') {
            iconName = focused ? 'card' : 'card-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
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
      <Tab.Screen name="Receivables" component={ReceivablesListScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
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
        name="ReceivableForm" 
        component={ReceivableFormScreen}
        options={{ title: 'Add/Edit Receivable' }}
      />
    </Stack.Navigator>
  );
};

// Root Navigator
const AppNavigator = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    // You can return a loading screen here
    return null;
  }

  return (
    <NavigationContainer>
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
