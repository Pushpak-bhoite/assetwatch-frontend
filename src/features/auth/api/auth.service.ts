import apiClient from '@/lib/api-client'

// Types matching the backend schemas
export interface LoginRequest {
  username: string // fastapi-users expects 'username' field for email
  password: string
}

export interface LoginResponse {
  access_token: string
  token_type: string
}

export interface RegisterRequest {
  email: string
  password: string
  name: string
}

export interface User {
  id: string
  email: string
  name: string
  organization_type: string
  is_active: boolean
  is_superuser: boolean
  is_verified: boolean
  profile_image_url: string | null
}

// Auth API functions
export const authService = {
  /**
   * Login user with email and password
   * Note: fastapi-users expects form-data with 'username' and 'password'
   */
  async login(email: string, password: string): Promise<LoginResponse> {
    const formData = new URLSearchParams()
    formData.append('username', email)
    formData.append('password', password)

    const response = await apiClient.post<LoginResponse>(
      '/auth/jwt/login',
      formData,
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    )
    return response.data
  },

  /**
   * Register a new user
   */
  async register(data: RegisterRequest): Promise<User> {
    const response = await apiClient.post<User>('/auth/register', data)
    return response.data
  },

  /**
   * Get current authenticated user
   */
  async getCurrentUser(): Promise<User> {
    const response = await apiClient.get<User>('/users/me')
    return response.data
  },

  /**
   * Logout user (invalidate token on server)
   */
  async logout(): Promise<void> {
    await apiClient.post('/auth/jwt/logout')
  },
}

export default authService
