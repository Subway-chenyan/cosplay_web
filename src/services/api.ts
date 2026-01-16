import axios, { AxiosInstance, AxiosRequestConfig } from 'axios'
// import { PaginatedResponse } from '../types'

// 根据环境配置API基础URL
const getBaseURL = () => {
  // 在开发环境中使用Vite代理
  if (import.meta.env.DEV) {
    return '/api'
  }
  // 在预览模式下，检查是否为本地环境
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return 'http://localhost:8000/api'
  }
  // 在生产环境中使用完整域名
  return 'https://data.cosdrama.cn/api'
}

// 创建axios实例
const axiosInstance: AxiosInstance = axios.create({
  baseURL: getBaseURL(),
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

  // 数据导入相关API
  async verifyUploadKey(uploadKey: string): Promise<{valid: boolean, message: string}> {
    const response = await axiosInstance.post('/videos/import/verify-key/', {
      upload_key: uploadKey
    })
    return response.data
  }

  // 验证管理权限密钥
  async verifyManagementKey(managementKey: string): Promise<{valid: boolean, message: string, token?: string}> {
    const response = await axiosInstance.post('/auth/verify-management-key/', {
      management_key: managementKey
    })
    return response.data
  }

  async downloadTemplate(importType: string): Promise<Blob> {
    const response = await axiosInstance.get(`/videos/import/template/?type=${importType}`, {
      responseType: 'blob'
    })
    return response.data
  }

  async startImport(params: {
    file: File
    import_type: string
    validate_only?: boolean
  }): Promise<{task_id: string, message: string}> {
    const formData = new FormData()
    formData.append('file', params.file)
    formData.append('import_type', params.import_type)
    formData.append('validate_only', params.validate_only ? 'true' : 'false')

    const response = await axiosInstance.post('/videos/import/start/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
    return response.data
  }

  async getImportStatus(taskId: string): Promise<{
    task_id: string
    import_type: string
    status: string
    total_records: number
    success_count: number
    error_count: number
    errors: Array<{row?: number, field?: string, message: string}>
    warnings: Array<{row?: number, message: string}>
    created_at: string
    updated_at: string
  }> {
    const response = await axiosInstance.get(`/videos/import/status/${taskId}/`)
    return response.data
  }
}

export const api = new ApiService()
export default axiosInstance