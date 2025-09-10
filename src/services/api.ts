import axios, { AxiosInstance, AxiosResponse } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

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
  token: string;
  user: {
    _id: string;
    email: string;
    name: string;
    role: string;
  };
}

class ApiService {
  private api: AxiosInstance;
  private baseURL: string;

  constructor() {
    // Use localhost for web (HTTPS compatible) and network IP for mobile
    this.baseURL = __DEV__ 
      ? (Platform.OS === 'web' ? 'http://localhost:5006/api' : 'http://192.168.1.107:5006/api')
      : 'https://your-production-domain.com/api';
    
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
        const token = await AsyncStorage.getItem('authToken');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor to handle errors
    this.api.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 401) {
          // Token expired or invalid, clear storage and redirect to login
          await AsyncStorage.removeItem('authToken');
          await AsyncStorage.removeItem('user');
          // You can emit an event here to trigger navigation to login
        }
        return Promise.reject(error);
      }
    );
  }

  // Authentication methods
  async login(email: string, password: string): Promise<LoginResponse> {
    const response: AxiosResponse<LoginResponse> = await this.api.post('/auth/signin', {
      identifier: email,
      password,
    });
    
    // Store token and user data
    await AsyncStorage.setItem('authToken', response.data.token);
    await AsyncStorage.setItem('user', JSON.stringify(response.data.user));
    
    return response.data;
  }

  async logout(): Promise<void> {
    await AsyncStorage.removeItem('authToken');
    await AsyncStorage.removeItem('user');
  }

  async getCurrentUser() {
    const userStr = await AsyncStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
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
  async getReceivables(): Promise<Receivable[]> {
    const response: AxiosResponse<Receivable[]> = await this.api.get('/receivables');
    return response.data;
  }

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
