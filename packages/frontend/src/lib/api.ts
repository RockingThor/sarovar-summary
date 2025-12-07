import axios from 'axios'
import { getIdToken } from './firebase'

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
})

// Add auth token to requests
api.interceptors.request.use(async (config) => {
  const token = await getIdToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Handle response errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid - could trigger sign out here
      console.error('Authentication error')
    }
    return Promise.reject(error)
  }
)

export default api

// Auth API
export const authApi = {
  verify: async (token: string) => {
    const response = await api.post('/auth/verify', { token })
    return response.data
  },
  getMe: async () => {
    const response = await api.get('/auth/me')
    return response.data
  },
}

// Admin API
export const adminApi = {
  getHotels: async () => {
    const response = await api.get('/admin/hotels')
    return response.data
  },
  createHotel: async (data: {
    name: string
    code: string
    address: string
    partnerEmail: string
    partnerName: string
  }) => {
    const response = await api.post('/admin/hotels', data)
    return response.data
  },
  getHotelDetail: async (id: string) => {
    const response = await api.get(`/admin/hotels/${id}`)
    return response.data
  },
  updateTask: async (id: string, data: { status: string; estimatedDate?: string | null }) => {
    const response = await api.patch(`/admin/tasks/${id}`, data)
    return response.data
  },
  getAuditLogs: async (hotelId: string) => {
    const response = await api.get(`/admin/audit-logs/${hotelId}`)
    return response.data
  },
  getDepartments: async () => {
    const response = await api.get('/admin/departments')
    return response.data
  },
  getCategories: async () => {
    const response = await api.get('/admin/categories')
    return response.data
  },
}

// User API
export const userApi = {
  getDashboard: async () => {
    const response = await api.get('/user/dashboard')
    return response.data
  },
  getTasks: async (filters?: {
    departmentId?: string
    categoryId?: string
    status?: string
  }) => {
    const params = new URLSearchParams()
    if (filters?.departmentId) params.append('departmentId', filters.departmentId)
    if (filters?.categoryId) params.append('categoryId', filters.categoryId)
    if (filters?.status) params.append('status', filters.status)
    
    const response = await api.get(`/user/tasks?${params.toString()}`)
    return response.data
  },
  updateTask: async (questionId: string, data: { status: string; estimatedDate?: string | null }) => {
    const response = await api.patch(`/user/tasks/${questionId}`, data)
    return response.data
  },
  getDepartments: async () => {
    const response = await api.get('/user/departments')
    return response.data
  },
  getCategories: async () => {
    const response = await api.get('/user/categories')
    return response.data
  },
}

