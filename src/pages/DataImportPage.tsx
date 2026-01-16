import React, { useState, useRef, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Upload, Download, AlertCircle, Loader2, FileText, Database } from 'lucide-react'
import { RootState, AppDispatch } from '../store/store'
import {
    startImport,
    fetchTaskStatus,
    downloadTemplate,
    clearError
} from '../store/slices/dataImportSlice'

const DataImportPage: React.FC = () => {
    const dispatch = useDispatch<AppDispatch>()
    const {
        currentTask,
        isUploading,
        error
    } = useSelector((state: RootState) => state.dataImport)

    const [selectedFile, setSelectedFile] = useState<File | null>(null)
    const [validateOnly, setValidateOnly] = useState(false)
    const importType = 'video' // 固定为视频数据导入
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

    const handleDownloadTemplate = () => {
        dispatch(downloadTemplate({
            importType
        }))
    }

    const handleStartImport = () => {
        if (!selectedFile) return

        dispatch(startImport({
            file: selectedFile,
            import_type: importType,
            validate_only: validateOnly
        }))
    }

    const pollTaskStatus = (taskId: string) => {
        if (pollIntervalRef.current) {
            clearInterval(pollIntervalRef.current)
        }

        pollIntervalRef.current = setInterval(() => {
            dispatch(fetchTaskStatus(taskId))
        }, 2000)
    }

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
    }, [currentTask, dispatch])

    // 清理错误信息
    useEffect(() => {
        if (error) {
            const timer = setTimeout(() => {
                dispatch(clearError())
            }, 5000)
            return () => clearTimeout(timer)
        }
    }, [error, dispatch])

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
            <div className="mb-12 relative">
                <div className="absolute -left-4 top-0 w-1 h-full bg-p5-red transform -skew-x-12"></div>
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-4xl font-black text-black mb-2 uppercase italic transform -skew-x-6" style={{ textShadow: '2px 2px 0px #d90614' }}>
                            DATA IMPORT / 数据导入
                        </h1>
                        <p className="text-gray-600 font-bold border-b-2 border-black inline-block pb-1">
                            支持CSV、Excel格式文件的批量视频数据导入
                        </p>
                    </div>
                </div>

                {/* 错误信息显示 */}
                {error && (
                    <div className="mt-6 p-4 bg-black border-l-8 border-p5-red transform -skew-x-2">
                        <div className="flex items-center transform skew-x-2">
                            <AlertCircle className="h-6 w-6 text-p5-red mr-3" />
                            <p className="text-sm text-white font-black uppercase italic tracking-wider">{error}</p>
                        </div>
                    </div>
                )}
            </div>

            {/* 数据导入界面 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                    {/* 导入配置 */}
                    <div className="space-y-8">
                        <div className="relative group">
                            <div className="absolute inset-0 bg-black transform translate-x-1 translate-y-1 -skew-x-2 z-0 shadow-lg"></div>
                            <div className="relative z-10 bg-white border-2 border-black p-8 transform -skew-x-2">
                                <div className="flex items-center space-x-3 mb-8 border-b-4 border-black pb-2">
                                    <div className="bg-p5-red p-2 transform rotate-12 border-2 border-black">
                                        <Database className="h-6 w-6 text-white transform -rotate-12" />
                                    </div>
                                    <h2 className="text-2xl font-black text-black uppercase italic tracking-tighter">
                                        CONFIG / 导入设置
                                    </h2>
                                </div>

                                <div className="space-y-6">
                                    <div className="bg-gray-50 p-4 border-l-4 border-black transform -skew-x-2">
                                        <label className="flex items-center space-x-3 cursor-pointer group/check">
                                            <div className="relative">
                                                <input
                                                    type="checkbox"
                                                    checked={validateOnly}
                                                    onChange={(e) => setValidateOnly(e.target.checked)}
                                                    className="sr-only"
                                                />
                                                <div className={`w-6 h-6 border-4 border-black transition-colors ${validateOnly ? 'bg-p5-red' : 'bg-white'}`}>
                                                    {validateOnly && (
                                                        <div className="w-full h-full flex items-center justify-center">
                                                            <div className="w-2 h-2 bg-white transform rotate-45"></div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            <span className="text-sm font-black text-black uppercase italic tracking-wider group-hover/check:text-p5-red transition-colors">
                                                VALIDATE ONLY / 仅验证数据 (不实际导入)
                                            </span>
                                        </label>
                                    </div>

                                    <div>
                                        <button
                                            onClick={handleDownloadTemplate}
                                            className="w-full flex items-center justify-center px-6 py-4 bg-black text-white font-black uppercase italic transform -skew-x-12 border-2 border-white hover:bg-p5-red hover:shadow-[4px_4px_0_0_black] transition-all"
                                        >
                                            <Download className="mr-3 h-5 w-5 text-p5-red" />
                                            GET TEMPLATE / 下载视频数据模板
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* 文件上传 */}
                        <div className="relative group">
                            <div className="absolute inset-0 bg-p5-red transform translate-x-1 translate-y-1 -skew-x-2 z-0"></div>
                            <div className="relative z-10 bg-white border-2 border-black p-8 transform -skew-x-2 overflow-hidden">
                                <div className="p5-halftone absolute inset-0 opacity-5 pointer-events-none"></div>

                                <div className="relative z-10">
                                    <div className="flex items-center space-x-3 mb-8 border-b-4 border-p5-red pb-2">
                                        <div className="bg-black p-2 transform -rotate-12 border-2 border-white">
                                            <Upload className="h-6 w-6 text-white transform rotate-12" />
                                        </div>
                                        <h2 className="text-2xl font-black text-black uppercase italic tracking-tighter">
                                            UPLOADER / 文件上传
                                        </h2>
                                    </div>

                                    <div
                                        className="relative border-4 border-dashed border-black p-10 text-center cursor-pointer hover:bg-black group/upload transition-all"
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
                                            <div className="space-y-4 transform skew-x-2">
                                                <div className="bg-p5-red inline-block p-4 transform rotate-12 border-2 border-black shadow-[4px_4px_0_0_black]">
                                                    <FileText className="h-10 w-10 text-white transform -rotate-12" />
                                                </div>
                                                <p className="text-lg font-black text-black uppercase italic tracking-tighter group-hover/upload:text-white">
                                                    {selectedFile.name}
                                                </p>
                                                <p className="bg-black text-white px-3 py-1 inline-block font-black text-xs transform -skew-x-12">
                                                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                                                </p>
                                            </div>
                                        ) : (
                                            <div className="space-y-4 transform skew-x-2">
                                                <div className="bg-white inline-block p-4 transform rotate-6 border-2 border-black shadow-[4px_4px_0_0_black] group-hover/upload:bg-p5-red group-hover/upload:border-white transition-colors">
                                                    <Upload className="h-10 w-10 text-black transform -rotate-6 group-hover/upload:text-white" />
                                                </div>
                                                <p className="text-sm font-black text-black uppercase italic tracking-wider group-hover/upload:text-white">
                                                    DRAG & DROP OR SCAN / 点击或拖拽文件到此处
                                                </p>
                                                <p className="text-xs font-bold text-gray-400 group-hover/upload:text-gray-300">
                                                    LIMIT: CSV/EXCEL UP TO 50MB
                                                </p>
                                            </div>
                                        )}
                                    </div>

                                    <button
                                        onClick={handleStartImport}
                                        disabled={!selectedFile || isUploading}
                                        className="w-full mt-8 flex items-center justify-center px-6 py-5 bg-p5-red text-white font-black uppercase italic text-xl transform -skew-x-12 border-4 border-black hover:bg-black hover:border-p5-red hover:shadow-[8px_8px_0_0_#d90614] transition-all disabled:bg-gray-400 disabled:cursor-not-allowed group/btn"
                                    >
                                        {isUploading ? (
                                            <>
                                                <Loader2 className="mr-4 h-8 w-8 animate-spin" />
                                                ANALYZING... / 上传中...
                                            </>
                                        ) : (
                                            <>
                                                <Database className="mr-4 h-8 w-8 transform group-hover/btn:rotate-12 transition-transform" />
                                                DEPLOY DATA / 开始导入
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 导入结果 & 说明 */}
                    <div className="space-y-8">
                        {currentTask && (
                            <div className="relative group">
                                <div className="absolute inset-0 bg-black transform translate-x-2 translate-y-2 z-0"></div>
                                <div className="relative z-10 bg-white border-4 border-black p-8 overflow-hidden">
                                    <div className="bg-black text-white px-4 py-1 transform -skew-x-12 mb-8 inline-block">
                                        <h2 className="text-xl font-black uppercase italic tracking-tighter transform skew-x-12">MISSION REPORT / 导入结果</h2>
                                    </div>

                                    <div className="space-y-6">
                                        <div className="flex items-center justify-between bg-gray-50 p-4 transform -skew-x-2 border-l-8 border-black">
                                            <span className="text-sm font-black text-gray-500 uppercase italic">STATUS / 任务状态</span>
                                            <span className={`text-xl font-black italic uppercase flex items-center ${getStatusColor(currentTask.status)}`}>
                                                {currentTask.status === 'processing' && (
                                                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                                )}
                                                {getStatusText(currentTask.status)}
                                            </span>
                                        </div>

                                        {currentTask.total_records > 0 && (
                                            <div className="grid grid-cols-1 gap-4">
                                                <div className="bg-black p-4 flex justify-between items-center shadow-[4px_4px_0_0_#d90614]">
                                                    <span className="text-xs font-black text-p5-red uppercase italic">TOTAL / 总记录数</span>
                                                    <span className="text-3xl font-black text-white italic">{currentTask.total_records}</span>
                                                </div>

                                                <div className="flex gap-4">
                                                    <div className="flex-1 bg-white border-4 border-green-500 p-4 flex flex-col">
                                                        <span className="text-[10px] font-black text-green-500 uppercase italic">SUCCESS / 成功</span>
                                                        <span className="text-2xl font-black text-black italic">{currentTask.success_count}</span>
                                                    </div>
                                                    <div className="flex-1 bg-white border-4 border-p5-red p-4 flex flex-col">
                                                        <span className="text-[10px] font-black text-p5-red uppercase italic">FAILED / 失败</span>
                                                        <span className="text-2xl font-black text-black italic">{currentTask.error_count}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* 错误详情 */}
                                        {currentTask.errors.length > 0 && (
                                            <div className="p-4 bg-red-50 border-2 border-p5-red">
                                                <h3 className="text-sm font-black text-p5-red mb-4 flex items-center uppercase italic">
                                                    <AlertCircle className="mr-2 h-5 w-5" />
                                                    CRITICAL ERRORS / 错误详情
                                                </h3>
                                                <div className="max-h-60 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                                                    {currentTask.errors.map((error, index) => (
                                                        <div key={index} className="text-xs font-bold text-black border-l-4 border-black pl-3 py-1 bg-white/50">
                                                            <span className="text-p5-red">{error.row ? `[ROW ${error.row}] ` : ''}</span>
                                                            <span className="font-black uppercase">{error.field ? `${error.field}: ` : ''}</span>
                                                            {error.message}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* 警告信息 */}
                                        {currentTask.warnings.length > 0 && (
                                            <div className="p-4 bg-yellow-50 border-2 border-yellow-500">
                                                <h3 className="text-sm font-black text-yellow-600 mb-4 flex items-center uppercase italic">
                                                    <AlertCircle className="mr-2 h-5 w-5" />
                                                    TACTICAL WARNINGS / 警告信息
                                                </h3>
                                                <div className="max-h-60 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                                                    {currentTask.warnings.map((warning, index) => (
                                                        <div key={index} className="text-xs font-bold text-black border-l-4 border-yellow-500 pl-3 py-1 bg-white/50">
                                                            <span className="text-yellow-600">{warning.row ? `[ROW ${warning.row}] ` : ''}</span>
                                                            {warning.message}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* 使用说明 */}
                        <div className="relative transform rotate-1">
                            <div className="absolute inset-0 bg-p5-red transform -skew-x-6 z-0"></div>
                            <div className="relative z-10 bg-black text-white p-8 transform -skew-x-6 border-2 border-white shadow-[4px_4px_0_0_black]">
                                <h3 className="text-xl font-black uppercase italic mb-6 border-b-2 border-p5-red inline-block transform skew-x-6">
                                    INTEL BRIEFING / 使用说明
                                </h3>
                                <ul className="text-sm font-bold space-y-3 transform skew-x-6">
                                    <li className="flex items-start">
                                        <span className="text-p5-red mr-3 font-black">01</span>
                                        <span>请先下载视频数据导入模板，确保格式一致。</span>
                                    </li>
                                    <li className="flex items-start">
                                        <span className="text-p5-red mr-3 font-black">02</span>
                                        <span>按照模板格式填写视频信息，不要修改表头。</span>
                                    </li>
                                    <li className="flex items-start">
                                        <span className="text-p5-red mr-3 font-black">03</span>
                                        <span className="text-p5-red">BV号、标题、URL为核心字段，必须填写。</span>
                                    </li>
                                    <li className="flex items-start">
                                        <span className="text-p5-red mr-3 font-black">04</span>
                                        <span>重复的BV号将被系统自动跳过导入。</span>
                                    </li>
                                    <li className="flex items-start">
                                        <span className="text-p5-red mr-3 font-black">05</span>
                                        <span>建议先选择"仅验证数据"模式进行初步测试。</span>
                                    </li>
                                    <li className="flex items-start">
                                        <span className="text-p5-red mr-3 font-black">06</span>
                                        <span>单个文件最大容量限制为 50MB。</span>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
        </div>
    )
}

export default DataImportPage