import { api, getBaseURL } from './api'
import { PaginatedResponse, UserSearchResult } from '../types'

interface LoginData {
  username: string
  password: string
}

interface TokenResponse {
  access: string
  refresh: string
}

interface UserInfo {
  id: string
  username: string
  email: string
  is_staff: boolean
  is_superuser: boolean
}

class AuthService {
  storeTokens(access: string, refresh: string): void {
    localStorage.setItem('access_token', access)
    localStorage.setItem('refresh_token', refresh)
  }

  // 登录
  async login(data: LoginData): Promise<TokenResponse> {
    const response = await api.post<TokenResponse>('/token/', data)
    
    // 保存token到localStorage
    if (response.access) {
      this.storeTokens(response.access, response.refresh)
    }
    
    return response
  }

  // 刷新token
  async refreshToken(): Promise<string> {
    const refreshToken = localStorage.getItem('refresh_token')
    if (!refreshToken) {
      throw new Error('No refresh token available')
    }

    const response = await api.post<{ access: string }>('/token/refresh/', {
      refresh: refreshToken
    })
    
    // 更新access token
    if (response.access) {
      localStorage.setItem('access_token', response.access)
    }
    
    return response.access
  }

  // 登出
  logout(): void {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
  }

  getQQLoginUrl(callbackUrl?: string): string {
    const params = new URLSearchParams()
    if (callbackUrl) {
      params.set('next', callbackUrl)
    }

    const query = params.toString()
    const suffix = query ? `?${query}` : ''
    return `${getBaseURL()}/auth/qq/login/${suffix}`
  }

  // 获取当前用户信息
  async getCurrentUser(): Promise<UserInfo> {
    return api.get<UserInfo>('/users/me/')
  }

  async searchUsers(query: string): Promise<PaginatedResponse<UserSearchResult>> {
    const queryString = api.buildQueryParams({ search: query, page_size: 20 })
    return api.get<PaginatedResponse<UserSearchResult>>(`/users/search/${queryString}`)
  }

  // 检查是否已登录
  isAuthenticated(): boolean {
    return !!localStorage.getItem('access_token')
  }

  // 获取访问令牌
  getAccessToken(): string | null {
    return localStorage.getItem('access_token')
  }

  // 注册
  async register(data: {
    username: string
    email: string
    password: string
    password2: string
  }): Promise<UserInfo> {
    return api.post<UserInfo>('/users/register/', data)
  }

  // 修改密码
  async changePassword(data: {
    old_password: string
    new_password: string
    new_password2: string
  }): Promise<{ detail: string }> {
    return api.post<{ detail: string }>('/users/change-password/', data)
  }
}

export const authService = new AuthService() 
