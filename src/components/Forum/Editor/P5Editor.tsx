import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import MenuBar from './MenuBar'

interface P5EditorProps {
  content: string
  onChange: (content: string) => void
  placeholder?: string
}

const P5Editor = ({ content, onChange }: P5EditorProps) => {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Image.configure({
        inline: true,
        allowBase64: true,
      }),
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
    editorProps: {
      attributes: {
        class: 'prose prose-invert max-w-none focus:outline-none min-h-[300px] p-4 text-white font-medium',
      },
    },
  })

  return (
    <div className="relative group">
      {/* 装饰性背景 */}
      <div className="absolute inset-0 bg-black transform -rotate-1 border-4 border-p5-red shadow-[8px_8px_0_0_rgba(217,6,20,0.3)]"></div>

      <div className="relative z-10 bg-black/90 border-2 border-white overflow-hidden transform rotate-1 transition-transform group-hover:rotate-0">
        <MenuBar editor={editor} />
        <EditorContent editor={editor} />
      </div>

      {/* 装饰性角标 */}
      <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-p5-red transform rotate-45 border-2 border-white z-20"></div>
    </div>
  )
}

export default P5Editor
