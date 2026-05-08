import { Editor } from '@tiptap/react'
import type { ReactNode } from 'react'
import { useRef, useState } from 'react'
import {
  Bold,
  Code,
  Code2,
  Heading1,
  Heading2,
  Heading3,
  Image as ImageIcon,
  Italic,
  Link as LinkIcon,
  List,
  ListOrdered,
  Loader2,
  Minus,
  Pilcrow,
  Quote,
  Redo,
  RemoveFormatting,
  Strikethrough,
  Underline,
  Undo,
} from 'lucide-react'
import { forumService } from '../../../services/forumService'

interface MenuBarProps {
  editor: Editor | null
}

interface ToolbarButton {
  icon: ReactNode
  title: string
  action: () => void
  isActive?: boolean
  disabled?: boolean
}

const MenuBar = ({ editor }: MenuBarProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isUploading, setIsUploading] = useState(false)

  if (!editor) {
    return null
  }

  const runCommand = (action: () => void) => {
    action()
    editor.commands.focus()
  }

  const setLink = () => {
    const previousUrl = editor.getAttributes('link').href || ''
    const url = window.prompt('输入链接地址', previousUrl)
    if (url === null) return
    if (url.trim() === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run()
      return
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url.trim() }).run()
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      alert('只能上传图片文件')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      alert('图片不能超过 5MB')
      return
    }

    setIsUploading(true)
    try {
      const response = await forumService.uploadAttachment(file)
      editor.chain().focus().setImage({ src: response.file_url || response.file }).run()
    } catch (error) {
      console.error('Failed to upload image:', error)
      alert('图片上传失败，请重试')
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const buttons: ToolbarButton[] = [
    {
      icon: <Bold className="w-4 h-4" />,
      title: '加粗',
      action: () => editor.chain().focus().toggleBold().run(),
      isActive: editor.isActive('bold'),
      disabled: !editor.can().chain().focus().toggleBold().run(),
    },
    {
      icon: <Italic className="w-4 h-4" />,
      title: '斜体',
      action: () => editor.chain().focus().toggleItalic().run(),
      isActive: editor.isActive('italic'),
      disabled: !editor.can().chain().focus().toggleItalic().run(),
    },
    {
      icon: <Underline className="w-4 h-4" />,
      title: '下划线',
      action: () => editor.chain().focus().toggleUnderline().run(),
      isActive: editor.isActive('underline'),
    },
    {
      icon: <Strikethrough className="w-4 h-4" />,
      title: '删除线',
      action: () => editor.chain().focus().toggleStrike().run(),
      isActive: editor.isActive('strike'),
      disabled: !editor.can().chain().focus().toggleStrike().run(),
    },
    {
      icon: <Heading1 className="w-4 h-4" />,
      title: '一级标题',
      action: () => editor.chain().focus().toggleHeading({ level: 1 }).run(),
      isActive: editor.isActive('heading', { level: 1 }),
    },
    {
      icon: <Heading2 className="w-4 h-4" />,
      title: '二级标题',
      action: () => editor.chain().focus().toggleHeading({ level: 2 }).run(),
      isActive: editor.isActive('heading', { level: 2 }),
    },
    {
      icon: <Heading3 className="w-4 h-4" />,
      title: '三级标题',
      action: () => editor.chain().focus().toggleHeading({ level: 3 }).run(),
      isActive: editor.isActive('heading', { level: 3 }),
    },
    {
      icon: <Pilcrow className="w-4 h-4" />,
      title: '正文段落',
      action: () => editor.chain().focus().setParagraph().run(),
      isActive: editor.isActive('paragraph'),
    },
    {
      icon: <List className="w-4 h-4" />,
      title: '无序列表',
      action: () => editor.chain().focus().toggleBulletList().run(),
      isActive: editor.isActive('bulletList'),
    },
    {
      icon: <ListOrdered className="w-4 h-4" />,
      title: '有序列表',
      action: () => editor.chain().focus().toggleOrderedList().run(),
      isActive: editor.isActive('orderedList'),
    },
    {
      icon: <Quote className="w-4 h-4" />,
      title: '引用',
      action: () => editor.chain().focus().toggleBlockquote().run(),
      isActive: editor.isActive('blockquote'),
    },
    {
      icon: <Code className="w-4 h-4" />,
      title: '行内代码',
      action: () => editor.chain().focus().toggleCode().run(),
      isActive: editor.isActive('code'),
      disabled: !editor.can().chain().focus().toggleCode().run(),
    },
    {
      icon: <Code2 className="w-4 h-4" />,
      title: '代码块',
      action: () => editor.chain().focus().toggleCodeBlock().run(),
      isActive: editor.isActive('codeBlock'),
    },
    {
      icon: <Minus className="w-4 h-4" />,
      title: '分割线',
      action: () => editor.chain().focus().setHorizontalRule().run(),
    },
    {
      icon: <LinkIcon className="w-4 h-4" />,
      title: '链接',
      action: setLink,
      isActive: editor.isActive('link'),
    },
    {
      icon: isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImageIcon className="w-4 h-4" />,
      title: '上传图片',
      action: () => fileInputRef.current?.click(),
      disabled: isUploading,
    },
    {
      icon: <RemoveFormatting className="w-4 h-4" />,
      title: '清除格式',
      action: () => editor.chain().focus().unsetAllMarks().clearNodes().run(),
    },
  ]

  const historyButtons: ToolbarButton[] = [
    {
      icon: <Undo className="w-4 h-4" />,
      title: '撤销',
      action: () => editor.chain().focus().undo().run(),
      disabled: !editor.can().chain().focus().undo().run(),
    },
    {
      icon: <Redo className="w-4 h-4" />,
      title: '重做',
      action: () => editor.chain().focus().redo().run(),
      disabled: !editor.can().chain().focus().redo().run(),
    },
  ]

  const renderButton = (btn: ToolbarButton, index: number) => (
    <button
      key={`${btn.title}-${index}`}
      type="button"
      onMouseDown={(e) => e.preventDefault()}
      onClick={() => runCommand(btn.action)}
      disabled={btn.disabled}
      className={`h-9 w-9 border-2 border-transparent inline-flex items-center justify-center transition-all ${
        btn.isActive
          ? 'bg-p5-red text-white border-white shadow-[2px_2px_0_0_white]'
          : 'text-white hover:text-p5-red hover:border-p5-red disabled:opacity-35 disabled:hover:text-white disabled:hover:border-transparent'
      }`}
      title={btn.title}
      aria-label={btn.title}
    >
      {btn.icon}
    </button>
  )

  return (
    <div className="flex flex-wrap items-center gap-1 p-2 bg-black border-b-2 border-p5-red">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
      />
      {buttons.map(renderButton)}
      <div className="min-h-8 w-px bg-white/20 mx-1" />
      {historyButtons.map(renderButton)}
    </div>
  )
}

export default MenuBar
