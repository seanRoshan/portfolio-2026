"use client"

import { useState } from "react"
import { useEditor, EditorContent } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import TiptapImage from "@tiptap/extension-image"
import Youtube from "@tiptap/extension-youtube"
import Link from "@tiptap/extension-link"
import Placeholder from "@tiptap/extension-placeholder"
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight"
import Typography from "@tiptap/extension-typography"
import TextAlign from "@tiptap/extension-text-align"
import UnderlineExtension from "@tiptap/extension-underline"
import { TextStyle } from "@tiptap/extension-text-style"
import Color from "@tiptap/extension-color"
import Highlight from "@tiptap/extension-highlight"
import { common, createLowlight } from "lowlight"
import { EditorToolbar } from "./editor-toolbar"
import { ImageUploadDialog } from "./image-upload-dialog"
import { YouTubeEmbedDialog } from "./youtube-embed-dialog"

const lowlight = createLowlight(common)

interface BlogEditorProps {
  content: string
  onChange: (html: string) => void
  postId?: string
}

export function BlogEditor({ content, onChange, postId }: BlogEditorProps) {
  const [showImageDialog, setShowImageDialog] = useState(false)
  const [showYoutubeDialog, setShowYoutubeDialog] = useState(false)

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        codeBlock: false,
      }),
      TiptapImage.configure({
        allowBase64: false,
        HTMLAttributes: { class: "rounded-lg max-w-full" },
      }),
      Youtube.configure({ width: 640, height: 360, HTMLAttributes: { class: "rounded-lg" } }),
      Link.configure({ openOnClick: false, HTMLAttributes: { class: "text-primary underline" } }),
      Placeholder.configure({ placeholder: "Start writing your blog post..." }),
      CodeBlockLowlight.configure({ lowlight }),
      Typography,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      UnderlineExtension,
      TextStyle,
      Color,
      Highlight.configure({ multicolor: true }),
    ],
    content,
    immediatelyRender: false,
    onUpdate({ editor: e }) {
      onChange(e.getHTML())
    },
    editorProps: {
      attributes: {
        class:
          "prose prose-sm sm:prose dark:prose-invert max-w-none min-h-[400px] p-4 focus:outline-none",
      },
    },
  })

  if (!editor) return null

  return (
    <div>
      <EditorToolbar
        editor={editor}
        onImageClick={() => setShowImageDialog(true)}
        onYoutubeClick={() => setShowYoutubeDialog(true)}
      />
      <div className="rounded-b-md border">
        <EditorContent editor={editor} />
      </div>

      <ImageUploadDialog
        open={showImageDialog}
        onOpenChange={setShowImageDialog}
        onInsert={(url, alt) => {
          editor.chain().focus().setImage({ src: url, alt }).run()
        }}
        postId={postId}
      />
      <YouTubeEmbedDialog
        open={showYoutubeDialog}
        onOpenChange={setShowYoutubeDialog}
        onInsert={(url) => {
          editor.commands.setYoutubeVideo({ src: url })
        }}
      />
    </div>
  )
}
