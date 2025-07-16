import axios, { AxiosInstance, AxiosRequestConfig } from 'axios'
import { PaginatedResponse } from '../types'

// 创建axios实例
const axiosInstance: AxiosInstance = axios.create({
  baseURL: 'http://localhost:8000/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// 请求拦截器
axiosInstance.interceptors.request.use(
  (config) => {
    // 如果有token，添加到请求头
    const token = localStorage.getItem('access_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// 响应拦截器
axiosInstance.interceptors.response.use(
  (response) => {
    return response
  },
  (error) => {
    if (error.response) {
      // 处理错误响应
      if (error.response.status === 401) {
        // token过期或无效，清除token
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
        // 可以在这里触发重新登录
      }
    }
    return Promise.reject(error)
  }
)

// 通用的API请求类
class ApiService {
  // GET请求
  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await axiosInstance.get<T>(url, config)
    return response.data
  }

  // POST请求
  async post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await axiosInstance.post<T>(url, data, config)
    return response.data
  }

  // PUT请求
  async put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await axiosInstance.put<T>(url, data, config)
    return response.data
  }

  // PATCH请求
  async patch<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await axiosInstance.patch<T>(url, data, config)
    return response.data
  }

  // DELETE请求
  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await axiosInstance.delete<T>(url, config)
    return response.data
  }

  // 构建查询参数
  buildQueryParams(params: Record<string, any>): string {
    const searchParams = new URLSearchParams()
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        if (Array.isArray(value)) {
          value.forEach((v) => searchParams.append(key, String(v)))
        } else {
          searchParams.append(key, String(value))
        }
      }
    })
    const queryString = searchParams.toString()
    return queryString ? `?${queryString}` : ''
  }
}

export const api = new ApiService()
export default axiosInstance 