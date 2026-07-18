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

    // 后端开启了 ROTATE_REFRESH_TOKENS，响应中会同时下发新的 refresh token
    const response = await api.post<{ access: string; refresh?: string }>('/token/refresh/', {
      refresh: refreshToken
    })

    // 更新access token
    if (response.access) {
      localStorage.setItem('access_token', response.access)
    }
    // 必须保存轮换后的 refresh token，否则旧 token 被加入黑名单后用户会被强制登出
    if (response.refresh) {
      localStorage.setItem('refresh_token', response.refresh)
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

  // 检查token是否即将过期（1小时内）
  isTokenExpiringSoon(): boolean {
    const accessToken = localStorage.getItem('access_token')
    if (!accessToken) return true

    try {
      // JWT通常包含过期时间（exp）
      const payload = JSON.parse(atob(accessToken.split('.')[1]))
      const now = Math.floor(Date.now() / 1000)
      const threshold = 3600 // 1小时
      return (payload.exp - now) < threshold
    } catch {
      return true
    }
  }

  // 确保token有效（如果即将过期则刷新）
  async ensureValidToken(): Promise<string> {
    if (this.isTokenExpiringSoon()) {
      return this.refreshToken()
    }
    return this.getAccessToken() || ''
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
