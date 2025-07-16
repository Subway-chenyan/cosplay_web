import { api } from './api'

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
  // 登录
  async login(data: LoginData): Promise<TokenResponse> {
    const response = await api.post<TokenResponse>('/token/', data)
    
    // 保存token到localStorage
    if (response.access) {
      localStorage.setItem('access_token', response.access)
      localStorage.setItem('refresh_token', response.refresh)
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

  // 获取当前用户信息
  async getCurrentUser(): Promise<UserInfo> {
    return api.get<UserInfo>('/users/me/')
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