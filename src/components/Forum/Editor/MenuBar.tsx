import { Editor } from '@tiptap/react'
import { useRef } from 'react'
import {
  Bold,
  Italic,
  Heading1,
  Heading2,
  List,
  ListOrdered,
  Quote,
  Undo,
  Redo,
  Image as ImageIcon,
  Loader2,
} from 'lucide-react'
import { forumService } from '../../../services/forumService'
import { useState } from 'react'

interface MenuBarProps {
  editor: Editor | null
}

const MenuBar = ({ editor }: MenuBarProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isUploading, setIsUploading] = useState(false)

  if (!editor) {
    return null
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    try {
      const response = await forumService.uploadAttachment(file)
      editor.chain().focus().setImage({ src: response.file }).run()
    } catch (error) {
      console.error('Failed to upload image:', error)
      alert('图片上传失败，请重试')
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const buttons = [
    {
      icon: <Bold className="w-4 h-4" />,
      title: 'Bold',
      action: () => editor.chain().focus().toggleBold().run(),
      isActive: editor.isActive('bold'),
    },
    {
      icon: <Italic className="w-4 h-4" />,
      title: 'Italic',
      action: () => editor.chain().focus().toggleItalic().run(),
      isActive: editor.isActive('italic'),
    },
    {
      icon: <Heading1 className="w-4 h-4" />,
      title: 'Heading 1',
      action: () => editor.chain().focus().toggleHeading({ level: 1 }).run(),
      isActive: editor.isActive('heading', { level: 1 }),
    },
    {
      icon: <Heading2 className="w-4 h-4" />,
      title: 'Heading 2',
      action: () => editor.chain().focus().toggleHeading({ level: 2 }).run(),
      isActive: editor.isActive('heading', { level: 2 }),
    },
    {
      icon: <List className="w-4 h-4" />,
      title: 'Bullet List',
      action: () => editor.chain().focus().toggleBulletList().run(),
      isActive: editor.isActive('bulletList'),
    },
    {
      icon: <ListOrdered className="w-4 h-4" />,
      title: 'Ordered List',
      action: () => editor.chain().focus().toggleOrderedList().run(),
      isActive: editor.isActive('orderedList'),
    },
    {
      icon: <Quote className="w-4 h-4" />,
      title: 'Blockquote',
      action: () => editor.chain().focus().toggleBlockquote().run(),
      isActive: editor.isActive('blockquote'),
    },
    {
      icon: isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImageIcon className="w-4 h-4" />,
      title: 'Upload Image',
      action: () => fileInputRef.current?.click(),
      isActive: false,
      disabled: isUploading
    },
  ]

  return (
    <div className="flex flex-wrap items-center gap-1 p-2 bg-black border-b-2 border-p5-red mb-2">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
      />
      {buttons.map((btn, index) => (
        <button
          key={index}
          onClick={(e) => {
            e.preventDefault()
            btn.action()
          }}
          disabled={btn.disabled}
          className={`p-2 transition-all transform hover:scale-110 ${
            btn.isActive
              ? 'bg-p5-red text-white -rotate-3 scale-110 shadow-[2px_2px_0_0_white]'
              : 'text-white hover:text-p5-red disabled:opacity-50'
          }`}
          title={btn.title}
        >
          {btn.icon}
        </button>
      ))}
      <div className="flex-grow" />
      <button
        onClick={(e) => {
          e.preventDefault()
          editor.chain().focus().undo().run()
        }}
        className="p-2 text-white hover:text-p5-red"
      >
        <Undo className="w-4 h-4" />
      </button>
      <button
        onClick={(e) => {
          e.preventDefault()
          editor.chain().focus().redo().run()
        }}
        className="p-2 text-white hover:text-p5-red"
      >
        <Redo className="w-4 h-4" />
      </button>
    </div>
  )
}

export default MenuBar
