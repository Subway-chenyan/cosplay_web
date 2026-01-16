import { Editor } from '@tiptap/react'
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
} from 'lucide-react'

interface MenuBarProps {
  editor: Editor | null
}

const MenuBar = ({ editor }: MenuBarProps) => {
  if (!editor) {
    return null
  }

  const addImage = () => {
    const url = window.prompt('URL')
    if (url) {
      editor.chain().focus().setImage({ src: url }).run()
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
      icon: <ImageIcon className="w-4 h-4" />,
      title: 'Image',
      action: addImage,
      isActive: false,
    },
  ]

  return (
    <div className="flex flex-wrap items-center gap-1 p-2 bg-black border-b-2 border-p5-red mb-2">
      {buttons.map((btn, index) => (
        <button
          key={index}
          onClick={(e) => {
            e.preventDefault()
            btn.action()
          }}
          className={`p-2 transition-all transform hover:scale-110 ${
            btn.isActive
              ? 'bg-p5-red text-white -rotate-3 scale-110 shadow-[2px_2px_0_0_white]'
              : 'text-white hover:text-p5-red'
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
