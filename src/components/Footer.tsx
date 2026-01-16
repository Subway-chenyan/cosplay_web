import { useState } from 'react'
import { Github, MessageSquare, X } from 'lucide-react'

interface FeedbackModalProps {
  isOpen: boolean
  onClose: () => void
}

function FeedbackModal({ isOpen, onClose }: FeedbackModalProps) {
  const [feedbackType, setFeedbackType] = useState('suggestion')
  const [content, setContent] = useState('')
  const [contactInfo, setContactInfo] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState<'success' | 'error'>('success')

  const handleSubmit = async () => {
    if (content.trim().length < 5) {
      setMessage('反馈内容至少需要5个字符')
      setMessageType('error')
      return
    }

    setSubmitting(true)
    try {
      const token = localStorage.getItem('access_token')
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      }
      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }

      const response = await fetch('/api/users/feedback/', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          feedback_type: feedbackType,
          content: content.trim(),
          contact_info: contactInfo.trim(),
        }),
      })

      if (response.ok) {
        setMessage('反馈提交成功，感谢您的反馈！')
        setMessageType('success')
        setTimeout(() => {
          onClose()
          setContent('')
          setContactInfo('')
          setFeedbackType('suggestion')
          setMessage('')
        }, 1500)
      } else {
        const errorData = await response.json()
        setMessage(errorData.detail || '提交失败，请稍后重试')
        setMessageType('error')
      }
    } catch {
      setMessage('网络错误，请检查连接')
      setMessageType('error')
    } finally {
      setSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* 背景遮罩 */}
      <div
        className="absolute inset-0 bg-black/70"
        onClick={onClose}
      />

      {/* 弹窗内容 */}
      <div className="relative z-10 w-full max-w-lg mx-4">
        {/* P5 风格装饰背景 */}
        <div className="absolute inset-0 bg-p5-red transform translate-x-3 translate-y-3 -skew-x-3" />

        <div className="relative bg-white border-4 border-black p-6 transform -skew-x-1">
          <div className="transform skew-x-1">
            {/* 标题栏 */}
            <div className="flex justify-between items-center mb-6 pb-4 border-b-4 border-black">
              <h2 className="text-2xl font-black uppercase italic flex items-center">
                <MessageSquare className="w-6 h-6 mr-2" />
                问题反馈 / FEEDBACK
              </h2>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 transition-colors border-2 border-black"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 提示信息 */}
            <p className="text-gray-600 font-bold mb-4 text-sm">
              您可以反馈对于站点的建议、社团或奖项信息问题
            </p>

            {/* 消息提示 */}
            {message && (
              <div className={`mb-4 p-3 border-2 ${
                messageType === 'success'
                  ? 'bg-green-50 border-green-500 text-green-800'
                  : 'bg-red-50 border-red-500 text-red-800'
              } font-bold text-sm`}>
                {message}
              </div>
            )}

            {/* 反馈类型 */}
            <div className="mb-4">
              <label className="block text-sm font-black text-gray-700 mb-2 uppercase italic">
                反馈类型 / TYPE
              </label>
              <select
                value={feedbackType}
                onChange={(e) => setFeedbackType(e.target.value)}
                className="w-full px-4 py-3 border-2 border-black font-bold focus:border-p5-red outline-none"
              >
                <option value="suggestion">站点建议</option>
                <option value="group_info">社团信息问题</option>
                <option value="award_info">奖项信息问题</option>
                <option value="other">其他</option>
              </select>
            </div>

            {/* 反馈内容 */}
            <div className="mb-4">
              <label className="block text-sm font-black text-gray-700 mb-2 uppercase italic">
                反馈内容 / CONTENT *
              </label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={4}
                className="w-full px-4 py-3 border-2 border-black font-bold focus:border-p5-red outline-none resize-none"
                placeholder="请详细描述您的问题或建议..."
              />
            </div>

            {/* 联系方式（可选） */}
            <div className="mb-6">
              <label className="block text-sm font-black text-gray-700 mb-2 uppercase italic">
                联系方式 / CONTACT (可选)
              </label>
              <input
                type="text"
                value={contactInfo}
                onChange={(e) => setContactInfo(e.target.value)}
                className="w-full px-4 py-3 border-2 border-black font-bold focus:border-p5-red outline-none"
                placeholder="QQ / 邮箱 / 微信等"
              />
            </div>

            {/* 按钮组 */}
            <div className="flex space-x-3">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-3 bg-gray-200 text-black font-black uppercase italic border-2 border-black hover:bg-gray-300 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="flex-1 px-4 py-3 bg-p5-red text-white font-black uppercase italic border-2 border-black hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {submitting ? '提交中...' : '提交反馈'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function Footer() {
  const [showFeedback, setShowFeedback] = useState(false)

  return (
    <>
      <footer className="relative bg-black border-t-4 border-p5-red">
        {/* P5 风格装饰 */}
        <div className="absolute top-0 right-0 w-[200px] h-full bg-p5-red opacity-20 transform skew-x-[-20deg] translate-x-16 pointer-events-none" />

        <div className="container mx-auto px-4 py-8 relative z-10">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            {/* 左侧：开发者信息 */}
            <div className="text-center md:text-left">
              <p className="text-white font-black text-lg uppercase italic mb-2">
                COSPLAY DRAMA
              </p>
              <p className="text-gray-400 font-bold text-sm">
                开发者: <span className="text-p5-red">沉言</span>
              </p>
              <p className="text-gray-400 font-bold text-sm">
                联系方式: QQ <span className="text-white">810170036</span>
              </p>
            </div>

            {/* 中间：链接按钮 */}
            <div className="flex flex-wrap justify-center gap-4">
              {/* GitHub 链接 */}
              <a
                href="https://github.com/Subway-chenyan/cosplay_web"
                target="_blank"
                rel="noopener noreferrer"
                className="group relative"
              >
                <div className="absolute inset-0 bg-p5-red transform translate-x-1 translate-y-1 group-hover:translate-x-2 group-hover:translate-y-2 transition-transform" />
                <div className="relative flex items-center px-4 py-2 bg-white border-2 border-black font-black uppercase italic text-sm hover:bg-gray-100 transition-colors">
                  <Github className="w-4 h-4 mr-2" />
                  GitHub
                </div>
              </a>

              {/* 问题反馈按钮 */}
              <button
                onClick={() => setShowFeedback(true)}
                className="group relative"
              >
                <div className="absolute inset-0 bg-white transform translate-x-1 translate-y-1 group-hover:translate-x-2 group-hover:translate-y-2 transition-transform" />
                <div className="relative flex items-center px-4 py-2 bg-p5-red text-white border-2 border-black font-black uppercase italic text-sm hover:bg-red-700 transition-colors">
                  <MessageSquare className="w-4 h-4 mr-2" />
                  问题反馈
                </div>
              </button>
            </div>

            {/* 右侧：版权信息 */}
            <div className="text-center md:text-right">
              <p className="text-gray-500 font-bold text-xs uppercase">
                &copy; {new Date().getFullYear()} COSPLAY DRAMA
              </p>
              <p className="text-gray-600 font-bold text-xs mt-1">
                Built with React + Django
              </p>
            </div>
          </div>
        </div>
      </footer>

      {/* 反馈弹窗 */}
      <FeedbackModal
        isOpen={showFeedback}
        onClose={() => setShowFeedback(false)}
      />
    </>
  )
}

export default Footer
