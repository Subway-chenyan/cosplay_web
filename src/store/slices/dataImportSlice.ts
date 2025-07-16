import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'

export interface ImportTask {
  task_id: string
  status: 'pending' | 'processing' | 'success' | 'failed'
  total_records: number
  success_count: number
  error_count: number
  errors: Array<{ row?: number; field?: string; message: string }>
  warnings: Array<{ row?: number; message: string }>
  created_at: string
  completed_at?: string
}

interface DataImportState {
  currentTask: ImportTask | null
  isUploading: boolean
  history: ImportTask[]
  error: string | null
}

const initialState: DataImportState = {
  currentTask: null,
  isUploading: false,
  history: [],
  error: null
}

// 异步thunk：开始导入
export const startImport = createAsyncThunk(
  'dataImport/startImport',
  async (params: {
    file: File
    import_type: string
    validate_only: boolean
  }) => {
    const formData = new FormData()
    formData.append('file', params.file)
    formData.append('import_type', params.import_type)
    formData.append('validate_only', params.validate_only.toString())

    const response = await fetch('/api/videos/bulk-import/', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: formData
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || '导入失败')
    }

    return await response.json()
  }
)

// 异步thunk：查询任务状态
export const fetchTaskStatus = createAsyncThunk(
  'dataImport/fetchTaskStatus',
  async (taskId: string) => {
    const response = await fetch(`/api/videos/import-status/${taskId}/`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    })

    if (!response.ok) {
      throw new Error('查询任务状态失败')
    }

    return await response.json()
  }
)

// 异步thunk：下载模板
export const downloadTemplate = createAsyncThunk(
  'dataImport/downloadTemplate',
  async (importType: string) => {
    const response = await fetch(`/api/videos/import-template/?type=${importType}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    })
    
    if (!response.ok) {
      throw new Error('模板下载失败')
    }

    const blob = await response.blob()
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${importType}_import_template.xlsx`
    document.body.appendChild(a)
    a.click()
    window.URL.revokeObjectURL(url)
    document.body.removeChild(a)

    return { success: true }
  }
)

const dataImportSlice = createSlice({
  name: 'dataImport',
  initialState,
  reducers: {
    clearCurrentTask: (state) => {
      state.currentTask = null
      state.error = null
    },
    updateTaskStatus: (state, action: PayloadAction<ImportTask>) => {
      state.currentTask = action.payload
    },
    clearError: (state) => {
      state.error = null
    }
  },
  extraReducers: (builder) => {
    builder
      // 开始导入
      .addCase(startImport.pending, (state) => {
        state.isUploading = true
        state.error = null
      })
      .addCase(startImport.fulfilled, (state, action) => {
        state.isUploading = false
        state.currentTask = {
          task_id: action.payload.task_id,
          status: 'pending',
          total_records: 0,
          success_count: 0,
          error_count: 0,
          errors: [],
          warnings: [],
          created_at: new Date().toISOString()
        }
      })
      .addCase(startImport.rejected, (state, action) => {
        state.isUploading = false
        state.error = action.error.message || '导入失败'
      })
      // 查询任务状态
      .addCase(fetchTaskStatus.fulfilled, (state, action) => {
        state.currentTask = action.payload
        if (action.payload.status === 'success' || action.payload.status === 'failed') {
          state.history.unshift(action.payload)
        }
      })
      .addCase(fetchTaskStatus.rejected, (state, action) => {
        state.error = action.error.message || '查询任务状态失败'
      })
      // 下载模板
      .addCase(downloadTemplate.pending, (state) => {
        state.error = null
      })
      .addCase(downloadTemplate.rejected, (state, action) => {
        state.error = action.error.message || '模板下载失败'
      })
  }
})

export const { clearCurrentTask, updateTaskStatus, clearError } = dataImportSlice.actions
export default dataImportSlice.reducer 