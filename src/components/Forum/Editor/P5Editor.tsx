import { useEditor, EditorContent } from '@tiptap/react'
import type { Editor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import Placeholder from '@tiptap/extension-placeholder'
import MenuBar from './MenuBar'
import { useEffect, useRef } from 'react'
import { forumService } from '../../../services/forumService'

interface P5EditorProps {
  content: string
  onChange: (content: string) => void
  placeholder?: string
}

const P5Editor = ({ content, onChange, placeholder = '开始创作...' }: P5EditorProps) => {
  const editorRef = useRef<Editor | null>(null)

  const insertImageFile = async (file: File) => {
    const activeEditor = editorRef.current
    if (!activeEditor || !file.type.startsWith('image/')) return false
    const response = await forumService.uploadAttachment(file)
    activeEditor.chain().focus().setImage({ src: response.file_url || response.file }).run()
    return true
  }

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
        link: {
          autolink: true,
          openOnClick: false,
          linkOnPaste: true,
          HTMLAttributes: {
            rel: 'noopener noreferrer nofollow',
            target: '_blank',
          },
        },
      }),
      Placeholder.configure({
        placeholder,
        emptyEditorClass: 'is-editor-empty',
      }),
      Image.configure({
        inline: false,
        allowBase64: false,
      }),
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
    editorProps: {
      attributes: {
        class: 'p5-rich-editor focus:outline-none min-h-[320px] p-5 text-white font-medium',
      },
      handlePaste: (_view, event) => {
        const file = Array.from(event.clipboardData?.files || []).find((item) => item.type.startsWith('image/'))
        if (!file) return false
        event.preventDefault()
        insertImageFile(file).catch(() => alert('图片上传失败，请重试'))
        return true
      },
      handleDrop: (_view, event) => {
        const file = Array.from(event.dataTransfer?.files || []).find((item) => item.type.startsWith('image/'))
        if (!file) return false
        event.preventDefault()
        insertImageFile(file).catch(() => alert('图片上传失败，请重试'))
        return true
      },
    },
  })

  useEffect(() => {
    editorRef.current = editor
    return () => {
      if (editorRef.current === editor) {
        editorRef.current = null
      }
    }
  }, [editor])

  // 当外部内容更改且与编辑器内容不一致时，更新编辑器内容
  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content)
    }
  }, [content, editor])

  return (
    <div className="relative group">
      {/* 装饰性背景 */}
      <div className="absolute inset-0 bg-black transform -rotate-1 border-4 border-p5-red shadow-[8px_8px_0_0_rgba(217,6,20,0.3)]"></div>

      <div className="relative z-10 bg-black/90 border-2 border-white overflow-hidden transform rotate-1 transition-transform group-hover:rotate-0">
        <MenuBar editor={editor} />
        <EditorContent editor={editor} className="p5-editor-shell" />
      </div>

      {/* 装饰性角标 */}
      <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-p5-red transform rotate-45 border-2 border-white z-20"></div>
    </div>
  )
}

export default P5Editor
