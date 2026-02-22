export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'employee';
  employeeId?: string;
  designation?: string;
  department?: string;
  profilePicture?: string;
  contactDetails?: {
    phone?: string;
    address?: string;
  };
  officeLocation?: {
    name: string;
    address: string;
    coordinates: {
      latitude: number;
      longitude: number;
      radius: number;
    };
    timezone: string;
  };
  status: 'active' | 'inactive' | 'suspended';
  lastLogin?: string;
  createdAt: string;
}

export interface Task {
  _id: string;
  title: string;
  description: string;
  assignedTo: User;
  assignedBy: User;
  status: 'assigned' | 'in_progress' | 'on_hold' | 'completed' | 'approved' | 'rejected';
  priority: 'low' | 'medium' | 'high';
  category?: string;
  startDate: string;
  dueDate: string;
  estimatedTime: number;
  progress: number;
  attachments: Attachment[];
  updates: TaskUpdate[];
  completedAt?: string;
  approvedAt?: string;
  approvedBy?: string;
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TaskUpdate {
  _id: string;
  comment: string;
  progress: number;
  updatedBy: User;
  timestamp: string;
}

export interface Attachment {
  _id: string;
  filename: string;
  originalName: string;
  path: string;
  size: number;
  uploadedBy: User;
  uploadedAt: string;
}

export interface Notification {
  _id: string;
  recipient: string;
  sender?: User;
  title: string;
  message: string;
  type: 'task_assigned' | 'task_updated' | 'task_completed' | 'task_approved' | 'task_rejected' | 'deadline_reminder' | 'wfh_approved' | 'wfh_rejected' | 'system';
  relatedTask?: Task;
  relatedWFHRequest?: any;
  isRead: boolean;
  readAt?: string;
  createdAt: string;
}

export interface DashboardStats {
  // Admin stats
  totalEmployees?: number;
  tasksAssignedToday?: number;
  tasksCompleted?: number;
  tasksPending?: number;
  overdueTasks?: number;
  
  // Employee stats
  todayTasks?: number;
  pendingTasks?: number;
  inProgressTasks?: number;
  completedTasks?: number;
}

export interface ApiResponse<T> {
  message: string;
  data?: T;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  role?: 'admin' | 'employee';
  designation?: string;
  department?: string;
}

export interface TaskFormData {
  title: string;
  description: string;
  assignedTo: string;
  priority: 'low' | 'medium' | 'high';
  category?: string;
  dueDate: string;
  estimatedTime: number;
}

export interface TaskFilters {
  status?: string;
  priority?: string;
  assignedTo?: string;
  assignedBy?: string;
  date?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface UserFilters {
  role?: string;
  status?: string;
  department?: string;
  search?: string;
  page?: number;
  limit?: number;
}
