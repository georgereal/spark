import axios, { AxiosInstance, AxiosResponse } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { Alert } from 'react-native';

// Types for API responses
export interface Patient {
  _id: string;
  firstName: string;
  lastName: string;
  name?: string; // Computed field
  phone: string;
  email: string;
  dateOfBirth?: string;
  age?: number;
  gender?: string;
  bloodGroup?: string;
  profession?: string;
  address: string;
  city?: string;
  state?: string;
  zipCode?: string;
  officeAddress?: string;
  emergencyContact?: {
    name: string;
    relationship: string;
    phone: string;
  };
  medicalHistory?: string;
  notes?: string;
  dataSource?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Treatment {
  _id: string;
  patientId: any; // Can be object or string
  patient?: Patient;
  patientName?: string; // Direct patient name field
  name: string; // Treatment name
  treatmentType?: string; // Fallback field
  description?: string;
  cost: number;
  status?: string; // Status might not always be present
  date: string;
  nextAppointment?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  // Additional fields from your backend
  totalPaidAmount?: number;
  totalReceivableAmount?: number;
  totalRemainingAmount?: number;
  materialCost?: number;
  // Dental checkup fields
  dentalCheckup?: {
    oralHygiene: string;
    gingivalStatus: string;
    plaqueIndex: string;
    bleedingIndex: string;
    mobility: string;
    pocketDepth: string;
    notes: string;
  };
  // Diagnosis fields
  diagnosis?: {
    chiefComplaint: string;
    clinicalFindings: string;
    diagnosis: string;
    treatmentPlan: string;
  };
  // Dental issues
  dentalIssues?: any[];
}

export interface Receivable {
  _id: string;
  patientId: any; // Can be object or string
  patient?: Patient;
  amount: number;
  description?: string;
  notes?: string; // Alternative description field
  status: string; // Status from your backend
  dueDate: string;
  createdAt: string;
  updatedAt: string;
  // Additional fields from your backend
  paidAmount?: number;
  remainingAmount?: number;
  treatmentId?: any;
  treatmentPlanId?: string;
  treatmentPlanName?: string;
}

export interface DashboardStats {
  totalPatients: number;
  totalTreatments: number;
  pendingReceivables: number;
  monthlyRevenue: number;
}

export interface LoginResponse {
  message: string;
  token: string;
  user: {
    id: string;
    username: string;
    email: string;
    displayName: string;
    role: string;
    approvalStatus: string;
    authType: string;
  };
}

// Additional Finance interfaces
export interface Expense {
  _id: string;
  withdrawal: number;
  recipient: string;
  date: string;
  dateObj: string;
  narration: string;
  category: string;
  upiId?: string;
  typeOfExpense: string;
  identifier: string;
  personal: boolean;
  type: string;
  id: string;
  createdAt: string;
  updatedAt: string;
}

export interface Income {
  _id: string;
  deposit: number;
  recipient: string;
  date: string;
  dateObj: string;
  narration: string;
  balance?: number;
  category: string;
  incomeType: string;
  upiId?: string;
  personal: boolean;
  type: string;
  id: string;
  createdAt: string;
  updatedAt: string;
}

export interface Payable {
  _id: string;
  name: string;
  category: string;
  amount: number;
  vendorName?: string;
  dueDate: string;
  status: 'Pending' | 'Paid' | 'Overdue' | 'Partial' | 'Cancelled';
  paymentStatus: 'Pending' | 'Paid' | 'Partial';
  notes?: string;
  isRecurring?: boolean;
  recurrenceType?: string;
  recurrenceCount?: number;
  recurrenceEndDate?: string;
  payableType?: 'treatment' | 'generic';
  patientId?: {
    _id: string;
    firstName: string;
    lastName: string;
  };
  treatmentId?: {
    _id: string;
    name: string;
  };
  doctorId?: {
    _id: string;
    name: string;
  };
  treatmentPlanName?: string;
  paidAmount?: number;
  paymentMethod?: string;
  paidDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Payment {
  _id: string;
  patientName: string;
  amount: number;
  method: 'cash' | 'card' | 'upi' | 'bank_transfer' | 'cheque';
  status: 'completed' | 'pending' | 'failed' | 'refunded';
  treatmentId: string;
  treatmentName: string;
  paymentDate: string;
  referenceNumber: string;
  createdAt: string;
  updatedAt: string;
}

export interface Invoice {
  _id: string;
  invoiceNumber: string;
  patientName: string;
  patientEmail: string;
  amount: number;
  status: 'draft' | 'sent' | 'paid' | 'overdue';
  dueDate: string;
  createdDate: string;
  items: InvoiceItem[];
  createdAt: string;
  updatedAt: string;
}

export interface InvoiceItem {
  description: string;
  quantity: number;
  rate: number;
  amount: number;
}

export interface BankTransaction {
  _id: string;
  deposit: number;
  recipient: string;
  date: string;
  dateObj: string;
  narration: string;
  balance: number;
  category: string;
  incomeType?: string;
  upiId?: string;
  personal: boolean;
  type: string;
  id: string;
  createdAt: string;
  updatedAt: string;
}

export interface MSwipePayment {
  _id: string;
  transactionId: string;
  amount: number;
  patientName?: string;
  treatmentName?: string;
  status: 'unmapped' | 'pending' | 'mapped' | 'bank_linked';
  paymentDate: string;
  mswipeReference?: string;
  deviceId?: string;
  merchantId?: string;
  fees?: number;
  netAmount?: number;
  createdAt: string;
  updatedAt: string;
  // Additional mSwipe specific fields
  cardType?: string;
  last4Digits?: string;
  bankName?: string;
  merchantName?: string;
  terminalId?: string;
  batchNumber?: string;
  approvalCode?: string;
  // Mapping references
  mappedReceivableId?: string;
  mappedBankTransactionId?: string;
  paymentId?: string;
  // Original data from upload
  originalData?: any;
}

export interface PaymentAnalytics {
  _id: string; // payment method
  paymentMethods: {
    status: string;
    paymentType: string;
    count: number;
    totalAmount: number;
    avgAmount: number;
  }[];
  totalCount: number;
  totalAmount: number;
}

class ApiService {
  private api: AxiosInstance;
  private baseURL: string;

  constructor() {
    // Use localhost for web (HTTPS compatible) and network IP for mobile
    this.baseURL = __DEV__ 
      ? (Platform.OS === 'web' ? 'http://localhost:5006/api' : 'http://192.168.1.107:5006/api')
      : 'https://your-production-domain.com/api';
    
    console.log('🌐 [API] Platform.OS:', Platform.OS);
    console.log('🌐 [API] __DEV__:', __DEV__);
    console.log('🌐 [API] Base URL set to:', this.baseURL);
    
    this.api = axios.create({
      baseURL: this.baseURL,
      timeout: 30000, // Increased timeout to 30 seconds
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor to add auth token
    this.api.interceptors.request.use(
      async (config) => {
        console.log('📤 [API] Making request to:', config.url);
        console.log('📤 [API] Request method:', config.method?.toUpperCase());
        console.log('📤 [API] Request params:', config.params);
        console.log('📤 [API] Full URL with params:', `${config.baseURL}${config.url}${config.params ? '?' + new URLSearchParams(config.params).toString() : ''}`);
        
        const token = await AsyncStorage.getItem('authToken');
        console.log('🔑 [API] Token from storage:', token ? 'YES' : 'NO');
        console.log('🔑 [API] Token length:', token?.length || 0);
        
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
          console.log('✅ [API] Authorization header set');
          console.log('✅ [API] Full Authorization header:', `Bearer ${token.substring(0, 20)}...`);
        } else {
          console.log('❌ [API] No token found, request will be unauthenticated');
        }
        
        console.log('📤 [API] Request headers:', {
          'Content-Type': config.headers['Content-Type'],
          'Authorization': config.headers.Authorization ? 'Bearer [TOKEN]' : 'NOT SET'
        });
        
        return config;
      },
      (error) => {
        console.error('❌ [API] Request interceptor error:', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor to handle errors
    this.api.interceptors.response.use(
      (response) => {
        console.log('📥 [API] Response received:', response.status, response.config.url);
        return response;
      },
      async (error) => {
        console.log('❌ [API] Response error:', error.response?.status, error.config?.url);
        console.log('❌ [API] Error message:', error.message);
        console.log('❌ [API] Error response data:', error.response?.data);
        
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
          console.log('🚪 [API] 401 Unauthorized - logging out user');
          // Token expired or invalid, logout user immediately
          await this.handleLogout();
          return Promise.reject(error);
        }

        return Promise.reject(error);
      }
    );
  }


  private async handleLogout() {
    // Clear all stored data
    await AsyncStorage.multiRemove(['authToken', 'user']);
    
    // Show alert to user
    Alert.alert(
      'Session Expired',
      'Your session has expired. Please log in again.',
      [
        {
          text: 'OK',
          onPress: () => {
            // Navigate to login screen
            // This will be handled by the navigation context
          }
        }
      ]
    );
  }

  // Authentication methods
  async login(email: string, password: string): Promise<LoginResponse> {
    console.log('🔐 [API] Starting login process...');
    console.log('🔐 [API] Email:', email);
    console.log('🔐 [API] Password length:', password.length);
    console.log('🔐 [API] Base URL:', this.baseURL);
    
    try {
      const response: AxiosResponse<LoginResponse> = await this.api.post('/auth/signin', {
        identifier: email,
        password,
      });
      
      console.log('✅ [API] Login successful!');
      console.log('✅ [API] Response status:', response.status);
      console.log('✅ [API] Token received:', response.data.token ? 'YES' : 'NO');
      console.log('✅ [API] Token length:', response.data.token?.length || 0);
      console.log('✅ [API] User data:', {
        id: response.data.user.id,
        email: response.data.user.email,
        role: response.data.user.role
      });
      
      // Store token and user data
      await AsyncStorage.setItem('authToken', response.data.token);
      await AsyncStorage.setItem('user', JSON.stringify(response.data.user));
      
      // Verify token was stored
      const storedToken = await AsyncStorage.getItem('authToken');
      const storedUser = await AsyncStorage.getItem('user');
      console.log('💾 [API] Token stored:', storedToken ? 'YES' : 'NO');
      console.log('💾 [API] User stored:', storedUser ? 'YES' : 'NO');
      console.log('💾 [API] Stored token length:', storedToken?.length || 0);
      
      return response.data;
    } catch (error: any) {
      console.error('❌ [API] Login failed:', error);
      console.error('❌ [API] Error response:', error.response?.data);
      console.error('❌ [API] Error status:', error.response?.status);
      throw error;
    }
  }

  async logout(): Promise<void> {
    await AsyncStorage.multiRemove(['authToken', 'user']);
  }

  async getCurrentUser() {
    const userStr = await AsyncStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  }

  // Generic HTTP methods
  async get(url: string, params?: any): Promise<any> {
    const response = await this.api.get(url, { params });
    return response;
  }

  async post(url: string, data?: any, config?: any): Promise<any> {
    const response = await this.api.post(url, data, config);
    return response;
  }

  async put(url: string, data?: any): Promise<any> {
    const response = await this.api.put(url, data);
    return response;
  }

  async delete(url: string): Promise<any> {
    const response = await this.api.delete(url);
    return response;
  }

  // Patient methods
  async getPatients(): Promise<Patient[]> {
    try {
      const response: AxiosResponse<{patients: Patient[], pagination: any}> = await this.api.get('/patients');
      // Transform the data to include computed name field
      const patients = response.data.patients.map(patient => ({
        ...patient,
        name: `${patient.firstName} ${patient.lastName}`.trim()
      }));
      return patients;
    } catch (error: any) {
      if (error.response?.status === 401) {
        throw new Error('Authentication required. Please login again.');
      }
      throw error;
    }
  }

  async getPatient(id: string): Promise<Patient> {
    const response: AxiosResponse<Patient> = await this.api.get(`/patients/${id}`);
    return response.data;
  }

  async createPatient(patientData: Partial<Patient>): Promise<Patient> {
    const response: AxiosResponse<Patient> = await this.api.post('/patients', patientData);
    return response.data;
  }

  async updatePatient(id: string, patientData: Partial<Patient>): Promise<Patient> {
    const response: AxiosResponse<Patient> = await this.api.put(`/patients/${id}`, patientData);
    return response.data;
  }

  async deletePatient(id: string): Promise<void> {
    await this.api.delete(`/patients/${id}`);
  }

  // Treatment methods
  async getTreatments(): Promise<Treatment[]> {
    const response: AxiosResponse<Treatment[]> = await this.api.get('/treatments');
    return response.data;
  }

  async getTreatment(id: string): Promise<Treatment> {
    const response: AxiosResponse<Treatment> = await this.api.get(`/treatments/${id}`);
    return response.data;
  }

  async createTreatment(treatmentData: Partial<Treatment>): Promise<Treatment> {
    const response: AxiosResponse<Treatment> = await this.api.post('/treatments', treatmentData);
    return response.data;
  }

  async updateTreatment(id: string, treatmentData: Partial<Treatment>): Promise<Treatment> {
    const response: AxiosResponse<Treatment> = await this.api.put(`/treatments/${id}`, treatmentData);
    return response.data;
  }

  async deleteTreatment(id: string): Promise<void> {
    await this.api.delete(`/treatments/${id}`);
  }

  // Receivables methods
  async getReceivable(id: string): Promise<Receivable> {
    const response: AxiosResponse<Receivable> = await this.api.get(`/receivables/${id}`);
    return response.data;
  }

  async createReceivable(receivableData: Partial<Receivable>): Promise<Receivable> {
    const response: AxiosResponse<Receivable> = await this.api.post('/receivables', receivableData);
    return response.data;
  }

  async updateReceivable(id: string, receivableData: Partial<Receivable>): Promise<Receivable> {
    const response: AxiosResponse<Receivable> = await this.api.put(`/receivables/${id}`, receivableData);
    return response.data;
  }

  async deleteReceivable(id: string): Promise<void> {
    await this.api.delete(`/receivables/${id}`);
  }

  // Dashboard methods
  async getDashboardStats(): Promise<DashboardStats> {
    try {
      // Since there's no general dashboard endpoint, we'll aggregate data from existing endpoints
      const [patientsResponse, treatmentsResponse, receivablesResponse] = await Promise.all([
        this.api.get('/patients'),
        this.api.get('/treatments'),
        this.api.get('/receivables')
      ]);

      const patients = patientsResponse.data.patients || patientsResponse.data || [];
      const treatments = treatmentsResponse.data.treatments || treatmentsResponse.data || [];
      const receivables = receivablesResponse.data.receivables || receivablesResponse.data || [];

      // Calculate stats
      const totalPatients = patients.length;
      const totalTreatments = treatments.length;
      const pendingReceivables = receivables.filter((r: any) => r.status === 'pending').length;
      
      // Calculate monthly revenue (sum of paid amounts this month)
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      const monthlyRevenue = treatments
        .filter((t: any) => {
          const treatmentDate = new Date(t.date || t.createdAt);
          return treatmentDate.getMonth() === currentMonth && 
                 treatmentDate.getFullYear() === currentYear;
        })
        .reduce((sum: number, t: any) => sum + (t.totalPaidAmount || 0), 0);

      return {
        totalPatients,
        totalTreatments,
        pendingReceivables,
        monthlyRevenue
      };
    } catch (error) {
      console.error('Error calculating dashboard stats:', error);
      // Return default stats if there's an error
      return {
        totalPatients: 0,
        totalTreatments: 0,
        pendingReceivables: 0,
        monthlyRevenue: 0
      };
    }
  }

  // File upload methods
  async uploadFile(file: any, type: 'image' | 'document'): Promise<string> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);

    const response: AxiosResponse<{ url: string }> = await this.api.post('/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data.url;
  }

  // Finance methods
  async getReceivables(params?: any): Promise<{ receivables: Receivable[]; pagination: any }> {
    console.log('🔍 [API] getReceivables called with params:', params);
    console.log('🔍 [API] Base URL:', this.baseURL);
    console.log('🔍 [API] Full URL will be:', `${this.baseURL}/receivables`);
    
    // Log the actual request that will be made
    const requestConfig = { params };
    console.log('🔍 [API] Request config:', requestConfig);
    
    const response = await this.api.get('/receivables', requestConfig);
    console.log('🔍 [API] getReceivables response:', response.data);
    return response.data;
  }

  async getExpenses(params?: any): Promise<{ expenses: Expense[]; pagination: any }> {
    const response = await this.api.get('/expenses', { params });
    return response.data;
  }

  async getIncome(params?: any): Promise<{ income: Income[]; pagination: any }> {
    const response = await this.api.get('/income', { params });
    return response.data;
  }

  async getIncomeDashboard(params?: any): Promise<any> {
    const response = await this.api.get('/income/dashboard', { params });
    return response.data;
  }

  async getExpensesDashboard(params?: any): Promise<any> {
    const response = await this.api.get('/expenses/dashboard', { params });
    return response.data;
  }

  async getPayables(params?: any): Promise<{ payables: Payable[]; pagination: any }> {
    const response = await this.api.get('/payables', { params });
    return response.data;
  }

  async getGenericPayables(params?: any): Promise<{ payables: Payable[]; pagination: any }> {
    const response = await this.api.get('/generic-payables', { params });
    return response.data;
  }

  async getPayments(params?: any): Promise<{ payments: Payment[]; pagination: any }> {
    const response = await this.api.get('/payments', { params });
    return response.data;
  }

  async getInvoices(params?: any): Promise<{ invoices: Invoice[]; pagination: any }> {
    const response = await this.api.get('/invoices', { params });
    return response.data;
  }

  async getBankTransactions(params?: any): Promise<{ transactions: BankTransaction[]; pagination: any }> {
    const response = await this.api.get('/income', { params });
    return response.data;
  }

  async getMSwipePayments(params?: any): Promise<{ transactions: MSwipePayment[]; pagination: any }> {
    const response = await this.api.get('/mswipe-transactions', { params });
    return response.data;
  }

  async getPaymentAnalytics(params?: any): Promise<PaymentAnalytics[]> {
    const response = await this.api.get('/payments/analytics/summary', { params });
    return response.data;
  }

  // Admin methods
  async getAdminUsers(): Promise<any> {
    const response = await this.api.get('/admin/users');
    return response.data;
  }

  async getCurrentUserRole(): Promise<any> {
    const response = await this.api.get('/admin/me');
    return response.data;
  }

  async getPendingUsers(): Promise<any> {
    const response = await this.api.get('/admin/pending-users');
    return response.data;
  }

  async getTreatmentCategories(): Promise<any> {
    const response = await this.api.get('/admin/treatment-categories');
    return response.data;
  }

  async getDoctors(): Promise<any> {
    const response = await this.api.get('/admin/doctors');
    return response.data;
  }

  async approveUser(userId: string, role: string): Promise<any> {
    const response = await this.api.post(`/admin/approve-user/${userId}`, { role });
    return response.data;
  }

  async rejectUser(userId: string, rejectionReason: string): Promise<any> {
    const response = await this.api.post(`/admin/reject-user/${userId}`, { rejectionReason });
    return response.data;
  }

  async setAdmin(userId: string): Promise<any> {
    const response = await this.api.post(`/admin/set-admin/${userId}`);
    return response.data;
  }

  async removeAdmin(userId: string): Promise<any> {
    const response = await this.api.post(`/admin/remove-admin/${userId}`);
    return response.data;
  }

  async createTreatmentCategory(category: any): Promise<any> {
    const response = await this.api.post('/admin/treatment-categories', category);
    return response.data;
  }

  async updateTreatmentCategory(categoryId: string, category: any): Promise<any> {
    const response = await this.api.put(`/admin/treatment-categories/${categoryId}`, category);
    return response.data;
  }

  async deleteTreatmentCategory(categoryId: string): Promise<any> {
    const response = await this.api.delete(`/admin/treatment-categories/${categoryId}`);
    return response.data;
  }

  async createDoctor(doctor: any): Promise<any> {
    const response = await this.api.post('/admin/doctors', doctor);
    return response.data;
  }

  async updateDoctor(doctorId: string, doctor: any): Promise<any> {
    const response = await this.api.put(`/admin/doctors/${doctorId}`, doctor);
    return response.data;
  }

  async deleteDoctor(doctorId: string): Promise<any> {
    const response = await this.api.delete(`/admin/doctors/${doctorId}`);
    return response.data;
  }

  // Debug method to test API connection
  async testConnection(): Promise<any> {
    try {
      const response = await this.api.get('/');
      return response.data;
    } catch (error) {
      console.error('API connection test failed:', error);
      throw error;
    }
  }
}

export default new ApiService();
