import React, { useState, useRef, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Upload, Download, AlertCircle, Loader2, FileText, Database, Key, Lock } from 'lucide-react'
import { RootState, AppDispatch } from '../store/store'
import { 
  verifyUploadKey,
  startImport, 
  fetchTaskStatus, 
  downloadTemplate, 
  clearCurrentTask, 
  clearError,
  resetKeyValidation 
} from '../store/slices/dataImportSlice'

const DataImportPage: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>()
  const { 
    currentTask, 
    isUploading, 
    isVerifyingKey, 
    isKeyValid, 
    uploadKey, 
    error 
  } = useSelector((state: RootState) => state.dataImport)
  
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [validateOnly, setValidateOnly] = useState(false)
  const importType = 'video' // 固定为视频数据导入
  const [inputKey, setInputKey] = useState('')
  const [step, setStep] = useState<'key' | 'upload'>('key')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null)

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setSelectedFile(file)
    }
  }

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault()
  }

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault()
    const files = event.dataTransfer.files
    if (files.length > 0) {
      setSelectedFile(files[0])
    }
  }

  const handleVerifyKey = () => {
    if (!inputKey.trim()) return
    dispatch(verifyUploadKey(inputKey.trim()))
  }

  const handleDownloadTemplate = () => {
    if (!uploadKey) return
    dispatch(downloadTemplate({
      importType,
      uploadKey
    }))
  }

  const handleStartImport = () => {
    if (!selectedFile || !uploadKey) return
    
    dispatch(startImport({
      file: selectedFile,
      import_type: importType,
      validate_only: validateOnly,
      upload_key: uploadKey
    }))
  }

  const pollTaskStatus = (taskId: string) => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current)
    }
    
    pollIntervalRef.current = setInterval(() => {
      dispatch(fetchTaskStatus({
        taskId,
        uploadKey
      }))
    }, 2000)
  }

  // 监听密钥验证状态
  useEffect(() => {
    if (isKeyValid) {
      setStep('upload')
    }
  }, [isKeyValid])

  // 监听currentTask变化，开始轮询
  useEffect(() => {
    if (currentTask?.task_id && (currentTask.status === 'pending' || currentTask.status === 'processing')) {
      pollTaskStatus(currentTask.task_id)
    } else if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current)
      pollIntervalRef.current = null
    }
    
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current)
      }
    }
  }, [currentTask, uploadKey])

  // 清理错误信息
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        dispatch(clearError())
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [error, dispatch])

  const handleResetKey = () => {
    dispatch(resetKeyValidation())
    setInputKey('')
    setStep('key')
    setSelectedFile(null)
    dispatch(clearCurrentTask())
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'text-yellow-600'
      case 'processing': return 'text-blue-600'
      case 'success': return 'text-green-600'
      case 'failed': return 'text-red-600'
      default: return 'text-gray-600'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return '等待处理'
      case 'processing': return '处理中'
      case 'success': return '成功'
      case 'failed': return '失败'
      default: return '未知'
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">视频数据批量导入</h1>
            <p className="text-gray-600">
              支持CSV、Excel格式文件的批量视频数据导入
            </p>
          </div>
          
          {isKeyValid && (
            <button
              onClick={handleResetKey}
              className="flex items-center px-3 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
            >
              <Lock className="h-4 w-4 mr-1" />
              更换密钥
            </button>
          )}
        </div>
        
        {/* 错误信息显示 */}
        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-red-400 mr-2" />
              <p className="text-sm text-red-800">{error}</p>
            </div>
          </div>
        )}
      </div>

      {step === 'key' ? (
        /* 密钥验证界面 */
        <div className="max-w-md mx-auto">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-center mb-6">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 mb-4">
                <Key className="h-6 w-6 text-blue-600" />
              </div>
                              <h2 className="text-lg font-semibold text-gray-900">安全验证</h2>
                <p className="text-sm text-gray-600">请输入视频数据导入密钥以继续</p>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  视频数据导入密钥
                </label>
                <input
                  type="password"
                  value={inputKey}
                  onChange={(e) => setInputKey(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleVerifyKey()}
                  placeholder="请输入密钥"
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <button
                onClick={handleVerifyKey}
                disabled={!inputKey.trim() || isVerifyingKey}
                className="w-full flex items-center justify-center px-4 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                {isVerifyingKey ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    验证中...
                  </>
                ) : (
                  <>
                    <Key className="mr-2 h-4 w-4" />
                    验证密钥
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* 数据导入界面 */
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* 导入配置 */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center">
                <Database className="mr-2 h-5 w-5" />
                导入设置
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={validateOnly}
                      onChange={(e) => setValidateOnly(e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">仅验证数据（不实际导入）</span>
                  </label>
                </div>

                <div>
                  <button
                    onClick={handleDownloadTemplate}
                    className="w-full flex items-center justify-center px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
                  >
                    <Download className="mr-2 h-4 w-4" />
                    下载视频数据模板
                  </button>
                </div>
              </div>
            </div>

          {/* 文件上传 */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center">
              <Upload className="mr-2 h-5 w-5" />
              文件上传
            </h2>
            
            <div
              className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-blue-400 transition-colors"
              onClick={() => fileInputRef.current?.click()}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={handleFileSelect}
                className="hidden"
              />
              
              {selectedFile ? (
                <div className="space-y-2">
                  <FileText className="mx-auto h-8 w-8 text-blue-500" />
                  <p className="text-sm font-medium text-gray-900">{selectedFile.name}</p>
                  <p className="text-xs text-gray-500">
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <Upload className="mx-auto h-8 w-8 text-gray-400" />
                  <p className="text-sm text-gray-600">
                    点击选择文件或拖拽文件到此处
                  </p>
                  <p className="text-xs text-gray-500">
                    支持 CSV、Excel 格式，最大 50MB
                  </p>
                </div>
              )}
            </div>

            <button
              onClick={handleStartImport}
              disabled={!selectedFile || isUploading}
              className="w-full mt-4 flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              {isUploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  上传中...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  开始导入
                </>
              )}
            </button>
          </div>
        </div>

        {/* 导入结果 */}
        <div className="space-y-6">
          {currentTask && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4">导入结果</h2>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">任务状态</span>
                  <span className={`text-sm font-medium ${getStatusColor(currentTask.status)}`}>
                    {currentTask.status === 'processing' && (
                      <Loader2 className="inline mr-1 h-4 w-4 animate-spin" />
                    )}
                    {getStatusText(currentTask.status)}
                  </span>
                </div>

                {currentTask.total_records > 0 && (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">总记录数</span>
                      <span className="text-sm font-medium">{currentTask.total_records}</span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">成功数量</span>
                      <span className="text-sm font-medium text-green-600">
                        {currentTask.success_count}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">失败数量</span>
                      <span className="text-sm font-medium text-red-600">
                        {currentTask.error_count}
                      </span>
                    </div>
                  </>
                )}

                {/* 错误信息 */}
                {currentTask.errors.length > 0 && (
                  <div className="mt-4">
                    <h3 className="text-sm font-medium text-red-600 mb-2 flex items-center">
                      <AlertCircle className="mr-1 h-4 w-4" />
                      错误详情
                    </h3>
                    <div className="max-h-40 overflow-y-auto bg-red-50 rounded p-2">
                      {currentTask.errors.map((error, index) => (
                        <div key={index} className="text-xs text-red-700 mb-1">
                          {error.row && `第${error.row}行: `}
                          {error.field && `${error.field} - `}
                          {error.message}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 警告信息 */}
                {currentTask.warnings.length > 0 && (
                  <div className="mt-4">
                    <h3 className="text-sm font-medium text-yellow-600 mb-2 flex items-center">
                      <AlertCircle className="mr-1 h-4 w-4" />
                      警告信息
                    </h3>
                    <div className="max-h-40 overflow-y-auto bg-yellow-50 rounded p-2">
                      {currentTask.warnings.map((warning, index) => (
                        <div key={index} className="text-xs text-yellow-700 mb-1">
                          {warning.row && `第${warning.row}行: `}
                          {warning.message}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 使用说明 */}
          <div className="bg-blue-50 rounded-lg p-6">
            <h3 className="text-sm font-medium text-blue-900 mb-2">使用说明</h3>
            <ul className="text-xs text-blue-800 space-y-1">
              <li>• 请先下载视频数据导入模板</li>
              <li>• 按照模板格式填写视频信息</li>
              <li>• BV号、标题、URL为必填字段</li>
              <li>• 重复的BV号将被跳过</li>
              <li>• 建议先选择"仅验证数据"测试</li>
              <li>• 单个文件最大支持50MB</li>
            </ul>
          </div>
        </div>
      </div>
      )}
    </div>
  )
}

export default DataImportPage