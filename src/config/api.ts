import { Platform } from 'react-native';

// API Configuration
export const API_CONFIG = {
  // Update these URLs to match your actual backend deployment
  BASE_URL: __DEV__ 
    ? (Platform.OS === 'web' ? 'http://localhost:5006/api' : 'http://192.168.1.107:5006/api')  // Development URL
    : 'https://your-production-domain.com/api', // Production URL
  
  // API Endpoints
  ENDPOINTS: {
        AUTH: {
          LOGIN: '/auth/signin',
      LOGOUT: '/auth/logout',
      REFRESH: '/auth/refresh',
    },
    PATIENTS: {
      LIST: '/patients',
      CREATE: '/patients',
      GET: (id: string) => `/patients/${id}`,
      UPDATE: (id: string) => `/patients/${id}`,
      DELETE: (id: string) => `/patients/${id}`,
    },
    TREATMENTS: {
      LIST: '/treatments',
      CREATE: '/treatments',
      GET: (id: string) => `/treatments/${id}`,
      UPDATE: (id: string) => `/treatments/${id}`,
      DELETE: (id: string) => `/treatments/${id}`,
    },
    RECEIVABLES: {
      LIST: '/receivables',
      CREATE: '/receivables',
      GET: (id: string) => `/receivables/${id}`,
      UPDATE: (id: string) => `/receivables/${id}`,
      DELETE: (id: string) => `/receivables/${id}`,
    },
    DASHBOARD: {
      STATS: '/dashboard/stats',
    },
    UPLOAD: '/upload',
  },
  
  // Request timeout in milliseconds
  TIMEOUT: 10000,
  
  // Retry configuration
  RETRY: {
    ATTEMPTS: 3,
    DELAY: 1000,
  },
};

// Environment-specific configurations
export const ENV_CONFIG = {
  DEVELOPMENT: {
    API_URL: 'http://192.168.1.107:5006/api',
    DEBUG: true,
  },
  PRODUCTION: {
    API_URL: 'https://your-production-domain.com',
    DEBUG: false,
  },
};

// Get current environment configuration
export const getCurrentConfig = () => {
  return __DEV__ ? ENV_CONFIG.DEVELOPMENT : ENV_CONFIG.PRODUCTION;
};
