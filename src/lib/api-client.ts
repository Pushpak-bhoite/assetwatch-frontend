import axios from 'axios'
import Cookies from 'js-cookie'

const ACCESS_TOKEN_KEY = 'thisisjustarandomstring'

// Create axios instance with base configuration
export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api',
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor - adds auth token to requests
apiClient.interceptors.request.use(
  (config) => {
    const cookieState = Cookies.get(ACCESS_TOKEN_KEY)
    const token = cookieState ? JSON.parse(cookieState) : null

    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }

    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor - handles common errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle 401 unauthorized - token expired or invalid
    if (error.response?.status === 401) {
      Cookies.remove(ACCESS_TOKEN_KEY)
      // Redirect will be handled by the query cache in main.tsx
    }

    return Promise.reject(error)
  }
)

export default apiClient
