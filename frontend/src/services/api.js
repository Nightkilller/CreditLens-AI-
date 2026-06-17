import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api'

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor — attach JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('creditlens_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Response interceptor — handle 401 (redirect to login)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('creditlens_token')
      localStorage.removeItem('creditlens_user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// ========== Auth API ==========
export const authAPI = {
  login: (email, password) => api.post('/auth/login', { email, password }),
}

// ========== MSME API ==========
export const msmeAPI = {
  getAll: (params) => api.get('/msmes', { params }),
  getById: (id) => api.get(`/msmes/${id}`),
  search: (query) => api.get('/msmes/search', { params: { q: query } }),
}

// ========== Scoring API ==========
export const scoringAPI = {
  scoreById: (msmeId) => api.post(`/score/${msmeId}`),
  getScore: (msmeId) => api.get(`/score/${msmeId}`),
  getHistory: (msmeId) => api.get(`/score/${msmeId}/history`),
}

export default api
