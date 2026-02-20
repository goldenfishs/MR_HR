import api from './api';
import { ApiResponse, PaginatedResponse } from '../types';

// Auth API
export const authApi = {
  login: (email: string, password: string) =>
    api.post<ApiResponse<any>>('/auth/login', { email, password }),

  register: (data: any) =>
    api.post<ApiResponse<any>>('/auth/register', data),

  logout: (refreshToken: string) =>
    api.post<ApiResponse>('/auth/logout', { refresh_token: refreshToken }),

  logoutAll: () =>
    api.post<ApiResponse>('/auth/logout-all'),

  refreshToken: (refreshToken: string) =>
    api.post<ApiResponse<{ accessToken: string }>>('/auth/refresh-token', { refresh_token: refreshToken }),

  sendVerification: (email: string, type: 'register' | 'reset_password' | 'login') =>
    api.post<ApiResponse>('/auth/send-verification', { email, type }),

  resetPassword: (email: string, code: string, newPassword: string) =>
    api.post<ApiResponse>('/auth/reset-password', { email, code, new_password: newPassword }),

  changePassword: (oldPassword: string, newPassword: string) =>
    api.post<ApiResponse>('/auth/change-password', { old_password: oldPassword, new_password: newPassword }),

  getCurrentUser: () =>
    api.get<ApiResponse<any>>('/auth/me'),
};

// Interview API
export const interviewApi = {
  getAll: (params?: { status?: string; search?: string; page?: number; pageSize?: number }) =>
    api.get<ApiResponse<PaginatedResponse<any>>>('/interviews', { params }),

  getById: (id: number) =>
    api.get<ApiResponse<any>>(`/interviews/${id}`),

  create: (data: any) =>
    api.post<ApiResponse<any>>('/interviews', data),

  update: (id: number, data: any) =>
    api.put<ApiResponse<any>>(`/interviews/${id}`, data),

  delete: (id: number) =>
    api.delete<ApiResponse>(`/interviews/${id}`),

  publish: (id: number) =>
    api.post<ApiResponse>(`/interviews/${id}/publish`),

  close: (id: number) =>
    api.post<ApiResponse>(`/interviews/${id}/close`),

  getSlots: (id: number) =>
    api.get<ApiResponse<any[]>>(`/interviews/${id}/slots`),

  getAvailableSlots: (id: number) =>
    api.get<ApiResponse<any[]>>(`/interviews/${id}/available-slots`),

  getRegistrations: (id: number, status?: string) =>
    api.get<ApiResponse<any[]>>(`/interviews/${id}/registrations`, { params: { status } }),
};

// Registration API
export const registrationApi = {
  getMy: (status?: string) =>
    api.get<ApiResponse<any[]>>('/registrations/my', { params: { status } }),

  getById: (id: number) =>
    api.get<ApiResponse<any>>(`/registrations/${id}`),

  create: (data: any) =>
    api.post<ApiResponse<any>>('/registrations', data),

  cancel: (id: number) =>
    api.put<ApiResponse>(`/registrations/${id}/cancel`),

  updateStatus: (id: number, status: string) =>
    api.put<ApiResponse>(`/registrations/${id}/status`, { status }),

  score: (id: number, score: number, feedback?: string) =>
    api.put<ApiResponse>(`/registrations/${id}/score`, { score, feedback }),

  announce: (id: number) =>
    api.post<ApiResponse>(`/registrations/${id}/announce`),

  getAll: (params?: { interview_id?: number; status?: string; page?: number; pageSize?: number }) =>
    api.get<ApiResponse<PaginatedResponse<any>>>('/registrations', { params }),
};

// Question API
export const questionApi = {
  getAll: (params?: { category?: string; difficulty?: string; search?: string; page?: number; pageSize?: number }) =>
    api.get<ApiResponse<PaginatedResponse<any>>>('/questions', { params }),

  getById: (id: number) =>
    api.get<ApiResponse<any>>(`/questions/${id}`),

  getCategories: () =>
    api.get<ApiResponse<string[]>>('/questions/categories'),

  getRandom: (count?: number, category?: string) =>
    api.get<ApiResponse<any[]>>('/questions/random', { params: { count, category } }),

  create: (data: any) =>
    api.post<ApiResponse<any>>('/questions', data),

  update: (id: number, data: any) =>
    api.put<ApiResponse<any>>(`/questions/${id}`, data),

  delete: (id: number) =>
    api.delete<ApiResponse>(`/questions/${id}`),
};

// Classroom API
export const classroomApi = {
  getAll: (params?: { is_available?: number; min_capacity?: number; page?: number; pageSize?: number }) =>
    api.get<ApiResponse<PaginatedResponse<any>>>('/classrooms', { params }),

  getById: (id: number) =>
    api.get<ApiResponse<any>>(`/classrooms/${id}`),

  getAvailable: (date: string, startTime: string, endTime: string) =>
    api.get<ApiResponse<any[]>>('/classrooms/available', { params: { date, start_time: startTime, end_time: endTime } }),

  create: (data: any) =>
    api.post<ApiResponse<any>>('/classrooms', data),

  update: (id: number, data: any) =>
    api.put<ApiResponse<any>>(`/classrooms/${id}`, data),

  delete: (id: number) =>
    api.delete<ApiResponse>(`/classrooms/${id}`),
};

// Resource API
export const resourceApi = {
  getAll: (params?: { type?: string; category?: string; page?: number; pageSize?: number }) =>
    api.get<ApiResponse<PaginatedResponse<any>>>('/resources', { params }),

  getById: (id: number) =>
    api.get<ApiResponse<any>>(`/resources/${id}`),

  getCategories: () =>
    api.get<ApiResponse<string[]>>('/resources/categories'),

  create: (data: any) =>
    api.post<ApiResponse<any>>('/resources', data),

  update: (id: number, data: any) =>
    api.put<ApiResponse<any>>(`/resources/${id}`, data),

  delete: (id: number) =>
    api.delete<ApiResponse>(`/resources/${id}`),
};

// Admin API
export const adminApi = {
  getDashboard: () =>
    api.get<ApiResponse<any>>('/admin/dashboard'),

  getStatistics: () =>
    api.get<ApiResponse<any>>('/admin/statistics'),

  getAllUsers: (params?: { role?: string; page?: number; pageSize?: number }) =>
    api.get<ApiResponse<PaginatedResponse<any>>>('/admin/users', { params }),

  updateUserRole: (id: number, role: string) =>
    api.put<ApiResponse<any>>(`/admin/users/${id}/role`, { role }),

  deleteUser: (id: number) =>
    api.delete<ApiResponse>(`/admin/users/${id}`),

  createSlot: (interviewId: number, data: any) =>
    api.post<ApiResponse<any>>(`/admin/interviews/${interviewId}/slots`, data),

  updateSlot: (id: number, data: any) =>
    api.put<ApiResponse<any>>(`/admin/slots/${id}`, data),

  deleteSlot: (id: number) =>
    api.delete<ApiResponse>(`/admin/slots/${id}`),
};

// User API
export const userApi = {
  getProfile: () =>
    api.get<ApiResponse<any>>('/users/profile'),

  updateProfile: (data: any) =>
    api.put<ApiResponse<any>>('/users/profile', data),

  uploadAvatar: (avatarUrl: string) =>
    api.post<ApiResponse<any>>('/users/avatar', { avatar_url: avatarUrl }),

  getMyInterviews: (status?: string) =>
    api.get<ApiResponse<any[]>>('/users/interviews', { params: { status } }),
};
