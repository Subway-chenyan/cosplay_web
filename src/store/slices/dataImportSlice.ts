import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import { api } from '../../services/api'

export interface ImportTask {
  task_id: string
  import_type: string
  status: 'pending' | 'processing' | 'success' | 'failed'
  total_records: number
  success_count: number
  error_count: number
  errors: Array<{ row?: number; field?: string; message: string }>
  warnings: Array<{ row?: number; message: string }>
  created_at: string
  updated_at: string
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
    const result = await api.startImport(params)
    return { ...result, import_type: params.import_type }
  }
)

// 异步thunk：查询任务状态
export const fetchTaskStatus = createAsyncThunk(
  'dataImport/fetchTaskStatus',
  async (taskId: string) => {
    return await api.getImportStatus(taskId)
  }
)

// 异步thunk：下载模板
export const downloadTemplate = createAsyncThunk(
  'dataImport/downloadTemplate',
  async (params: { importType: string }) => {
    const blob = await api.downloadTemplate(params.importType)

    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${params.importType}_import_template.xlsx`
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
          import_type: action.payload.import_type,
          status: 'pending' as const,
          total_records: 0,
          success_count: 0,
          error_count: 0,
          errors: [],
          warnings: [],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      })
      .addCase(startImport.rejected, (state, action) => {
        state.isUploading = false
        state.error = action.error.message || '导入失败'
      })
      // 查询任务状态
      .addCase(fetchTaskStatus.fulfilled, (state, action) => {
        const task = action.payload as ImportTask
        state.currentTask = task
        if (task.status === 'success' || task.status === 'failed') {
          const existingIndex = state.history.findIndex(h => h.task_id === task.task_id)
          if (existingIndex >= 0) {
            state.history[existingIndex] = task
          } else {
            state.history.unshift(task)
          }
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

export const {
  clearCurrentTask,
  updateTaskStatus,
  clearError
} = dataImportSlice.actions
export default dataImportSlice.reducer
