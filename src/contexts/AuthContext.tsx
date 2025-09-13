import React, { createContext, useContext, useEffect, useState } from 'react';
import { NavigationContainerRef } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface AuthContextType {
  isAuthenticated: boolean;
  user: any;
  login: (user: any) => void;
  logout: () => void;
  setNavigationRef: (ref: NavigationContainerRef<any>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [navigationRef, setNavigationRef] = useState<NavigationContainerRef<any> | null>(null);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      console.log('🔍 [AUTH] Checking authentication status...');
      const token = await AsyncStorage.getItem('authToken');
      const userData = await AsyncStorage.getItem('user');
      
      console.log('🔍 [AUTH] Token exists:', token ? 'YES' : 'NO');
      console.log('🔍 [AUTH] User data exists:', userData ? 'YES' : 'NO');
      console.log('🔍 [AUTH] Token length:', token?.length || 0);
      
      if (token && userData) {
        const parsedUser = JSON.parse(userData);
        console.log('✅ [AUTH] User authenticated:', {
          id: parsedUser.id,
          email: parsedUser.email,
          role: parsedUser.role
        });
        setUser(parsedUser);
        setIsAuthenticated(true);
      } else {
        console.log('❌ [AUTH] User not authenticated');
        setIsAuthenticated(false);
        setUser(null);
      }
    } catch (error) {
      console.error('❌ [AUTH] Error checking auth status:', error);
      setIsAuthenticated(false);
      setUser(null);
    }
  };

  const login = (userData: any) => {
    console.log('🔐 [AUTH] Setting user as authenticated:', {
      id: userData.id,
      email: userData.email,
      role: userData.role
    });
    setUser(userData);
    setIsAuthenticated(true);
  };

  const logout = async () => {
    await AsyncStorage.multiRemove(['authToken', 'user']);
    setUser(null);
    setIsAuthenticated(false);
    // No need to manually navigate - the AppNavigator will automatically show Login screen
  };

  // Listen for storage changes (when logout happens from API service)
  useEffect(() => {
    const handleStorageChange = async () => {
      const token = await AsyncStorage.getItem('authToken');
      if (!token && isAuthenticated) {
        // Token was removed, logout user
        setUser(null);
        setIsAuthenticated(false);
        
        // No need to manually navigate - the AppNavigator will automatically show Login screen
      }
    };

    // Check storage every 5 seconds
    const interval = setInterval(handleStorageChange, 5000);
    return () => clearInterval(interval);
  }, [isAuthenticated, navigationRef]);

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        user,
        login,
        logout,
        setNavigationRef,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};