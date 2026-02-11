import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { LoginCredentials, RegisterData, User, Task, DashboardStats, TaskFormData, TaskFilters, UserFilters } from '../types';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
const BACKEND_BASE = API_BASE_URL.replace(/\/api\/?$/, '');

export const getAvatarUrl = (path: string | undefined): string | undefined => {
  if (!path) return undefined;
  if (path.startsWith('http')) return path;
  return `${BACKEND_BASE}${path}`;
};

console.log('=== API SERVICE DEBUG ===');
console.log('REACT_APP_API_URL from process.env:', process.env.REACT_APP_API_URL);
console.log('Final API_BASE_URL:', API_BASE_URL);

class ApiService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
      timeout: 10000,
    });

    // Request interceptor to add auth token
    this.api.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor to handle common errors
    this.api.interceptors.response.use(
      (response: AxiosResponse) => response,
      (error) => {
        const status = error.response?.status;
        const url: string | undefined = error.config?.url;

        // For auth endpoints (login/register), just pass the error
        // so the Login/Register components can show messages without refreshing.
        const isAuthEndpoint =
          url?.includes('/auth/login') || url?.includes('/auth/register');

        if (status === 401 && !isAuthEndpoint) {
          // Token expired or invalid for a protected API call
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  // Auth endpoints
  async login(credentials: LoginCredentials) {
    const response = await this.api.post('/auth/login', credentials);
    return response.data;
  }

  async requestOtp(email: string, role: string) {
    const response = await this.api.post('/auth/otp/request', { email, role });
    return response.data;
  }

  async verifyOtp(email: string, otp: string, role: string) {
    const response = await this.api.post('/auth/otp/verify', { email, otp, role });
    return response.data;
  }

  async register(userData: RegisterData) {
    const response = await this.api.post('/auth/register', userData);
    return response.data;
  }

  async getProfile(): Promise<{ user: User }> {
    const response = await this.api.get('/auth/profile');
    return response.data;
  }

  async updateProfile(userData: Partial<User>): Promise<{ user: User }> {
    const response = await this.api.put('/auth/profile', userData);
    return response.data;
  }

  async uploadProfilePicture(file: File): Promise<{ user: User }> {
    const formData = new FormData();
    formData.append('avatar', file);
    const response = await this.api.post('/auth/profile/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  }

  // User endpoints
  async getUsers(filters?: UserFilters) {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          params.append(key, value.toString());
        }
      });
    }
    const response = await this.api.get(`/users?${params}`);
    return response.data;
  }

  async getUserById(id: string): Promise<{ user: User }> {
    const response = await this.api.get(`/users/${id}`);
    return response.data;
  }

  async createUser(userData: RegisterData) {
    const response = await this.api.post('/users', userData);
    return response.data;
  }

  async createEmployee(employeeData: { name: string; email: string; password: string; designation?: string; department?: string }) {
    // Reuse admin "create user" endpoint with role fixed to employee
    const response = await this.api.post('/users', {
      ...employeeData,
      role: 'employee',
    });
    return response.data;
  }

  async updateUser(id: string, userData: Partial<User>) {
    const response = await this.api.put(`/users/${id}`, userData);
    return response.data;
  }

  async deleteUser(id: string) {
    const response = await this.api.delete(`/users/${id}`);
    return response.data;
  }

  async getDashboardStats(): Promise<{ stats: DashboardStats }> {
    const response = await this.api.get('/users/dashboard/stats');
    return response.data;
  }

  // Task endpoints
  async getTasks(filters?: TaskFilters) {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, value.toString());
        }
      });
    }
    const queryString = params.toString();
    const url = queryString ? `/tasks?${queryString}` : '/tasks';
    const response = await this.api.get(url);
    return response.data;
  }

  async getTaskById(id: string): Promise<{ task: Task }> {
    console.log('=== API getTaskById ===');
    console.log('ID received:', id, typeof id);
    console.log('ID is undefined?', id === undefined);
    console.log('ID is null?', id === null);
    console.log('ID is "undefined"?', id === 'undefined');
    
    if (!id || id === 'undefined' || id === null) {
      console.error('❌ Invalid ID passed to getTaskById:', id);
      throw new Error('Invalid task ID provided');
    }
    
    const response = await this.api.get(`/tasks/${id}`);
    return response.data;
  }

  async createTask(taskData: TaskFormData) {
    const response = await this.api.post('/tasks', taskData);
    return response.data;
  }

  async updateTaskStatus(id: string, status: string, progress?: number, comment?: string) {
    const response = await this.api.put(`/tasks/${id}/status`, {
      status,
      progress,
      comment
    });
    return response.data;
  }

  async addTaskUpdate(id: string, comment: string, progress?: number) {
    const response = await this.api.post(`/tasks/${id}/updates`, {
      comment,
      progress
    });
    return response.data;
  }

  async reassignTask(id: string, assignedTo: string) {
    const response = await this.api.put(`/tasks/${id}/reassign`, { assignedTo });
    return response.data;
  }

  async uploadTaskAttachments(id: string, files: File[]) {
    const formData = new FormData();
    files.forEach(file => {
      formData.append('attachments', file);
    });
    const response = await this.api.post(`/tasks/${id}/attachments`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  async deleteTask(id: string) {
    const response = await this.api.delete(`/tasks/${id}`);
    return response.data;
  }

  // Notification endpoints
  async getNotifications(page = 1, limit = 10, isRead?: boolean, type?: string) {
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('limit', limit.toString());
    if (isRead !== undefined) {
      params.append('isRead', isRead.toString());
    }
    if (type) {
      params.append('type', type);
    }
    const response = await this.api.get(`/notifications?${params}`);
    return response.data;
  }

  async markNotificationAsRead(id: string) {
    const response = await this.api.put(`/notifications/${id}/read`);
    return response.data;
  }

  async markAllNotificationsAsRead() {
    const response = await this.api.put('/notifications/read/all');
    return response.data;
  }

  // Location-based attendance methods
  async checkIn(locationData: { latitude: number; longitude: number; accuracy: number; address?: string }) {
    const response = await this.api.post('/attendance/check-in', locationData);
    return response.data;
  }

  async checkOut(locationData: { latitude: number; longitude: number; accuracy: number; address?: string }) {
    const response = await this.api.post('/attendance/check-out', locationData);
    return response.data;
  }

  async getTodayAttendance() {
    const response = await this.api.get('/attendance/today');
    return response.data;
  }

  async getAttendance(page = 1, limit = 10, startDate?: string, endDate?: string, userId?: string) {
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('limit', limit.toString());
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    if (userId) params.append('userId', userId);
    
    const response = await this.api.get(`/attendance?${params}`);
    return response.data;
  }

  async deleteNotification(id: string) {
    const response = await this.api.delete(`/notifications/${id}`);
    return response.data;
  }

  async getUnreadCount(): Promise<{ unreadCount: number }> {
    const response = await this.api.get('/notifications/unread/count');
    return response.data;
  }

  // Report endpoints
  async getDailyReports(date?: string) {
    const params = date ? `?date=${date}` : '';
    const response = await this.api.get(`/reports/daily${params}`);
    return response.data;
  }

  async getMonthlyReports(month?: number, year?: number) {
    const params = new URLSearchParams();
    if (month !== undefined) params.append('month', month.toString());
    if (year !== undefined) params.append('year', year.toString());
    const response = await this.api.get(`/reports/monthly?${params}`);
    return response.data;
  }

  async getEmployeePerformance(startDate?: string, endDate?: string) {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    const response = await this.api.get(`/reports/employee-performance?${params}`);
    return response.data;
  }

  async exportData(
    type: string,
    format: string,
    startDate?: string,
    endDate?: string,
    month?: number,
    year?: number
  ) {
    const params = new URLSearchParams();
    params.append('type', type);
    params.append('format', format);
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    if (month != null) params.append('month', String(month));
    if (year != null) params.append('year', String(year));
    const response = await this.api.get(`/reports/export?${params}`, {
      responseType: 'blob',
    });
    return response;
  }

  async getAttendanceMonthlyReport(month: number, year: number) {
    const params = new URLSearchParams();
    params.append('month', String(month));
    params.append('year', String(year));
    const response = await this.api.get(`/reports/attendance-monthly?${params}`);
    return response.data;
  }

  // Attendance endpoints
  async getMyAttendance(startDate?: string, endDate?: string) {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    const response = await this.api.get(`/attendance/me?${params}`);
    return response.data;
  }

  /** Admin: get all employees' attendance (optional date range and userId filter) */
  async getAllAttendance(startDate?: string, endDate?: string, userId?: string) {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    if (userId) params.append('userId', userId);
    const response = await this.api.get(`/attendance/all?${params}`);
    return response.data;
  }
}

export const apiService = new ApiService();
export default apiService;
