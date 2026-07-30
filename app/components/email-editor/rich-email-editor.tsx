import { forwardRef, useEffect, useImperativeHandle } from 'react'
import { EditorContent, EditorContext, useEditor, type Editor } from '@tiptap/react'
import { Placeholder } from '@tiptap/extension-placeholder'
import { StarterKit } from '@react-email/editor/extensions'
import { EmailTheming, useEditorImage, imageSlashCommand } from '@react-email/editor/plugins'
import { SlashCommand, BubbleMenu, Inspector, defaultSlashCommands } from '@react-email/editor/ui'
import { composeReactEmail } from '@react-email/editor/core'
import '@react-email/editor/themes/default.css'
import '@react-email/editor/styles/bubble-menu.css'
import '@react-email/editor/styles/slash-command.css'
import '@react-email/editor/styles/inspector.css'
import './inspector-theme.css'
import './canvas-theme.css'

// Works around a bug in @react-email/editor: the structural root "container"
// node (auto-inserted around all document content) exports with
// `align: style.align || "center"` — the fallback wins regardless of theme
// settings, so every export centers the whole document. This targets only
// that node's table (identified by its unique align+width+role combination
// from react-email's own Container component), leaving any table the user
// actually inserted untouched.
function stripRootContainerCentering(html: string): string {
  return html.replace(
    /(<table(?=[^>]*\brole="presentation")(?=[^>]*\bwidth="100%")[^>]*?\balign=")center(")/,
    '$1left$2'
  )
}

// composeReactEmail/render() produces a full standalone HTML document
// (<html><head>...</head><body>...</body></html>), but this app substitutes
// Template.html into a Layout's ${content} slot — it needs to be a content
// fragment, not a nested document. This drops the doctype/html/head/body
// wrapper tags (and the theme's <style> block along with them), keeping
// just the body's content.
function stripHtmlDocumentWrapper(html: string): string {
  if (typeof DOMParser === 'undefined') return html
  const doc = new DOMParser().parseFromString(html, 'text/html')
  return doc.body?.innerHTML ?? html
}

const BACKGROUND_STRIP_SELECTOR = 'table, td'

// The editor theme bakes a `background-color` (or `background`) into these
// elements' inline styles by default (e.g. the root container table renders
// with `background-color:#ffffff`). Since Template.html gets substituted
// into a Layout's ${content} slot, a hardcoded background here paints over
// the layout's own background. Strip it so the layout controls it instead.
function stripBackgroundColors(html: string): string {
  if (typeof DOMParser === 'undefined') return html
  const doc = new DOMParser().parseFromString(html, 'text/html')
  doc.querySelectorAll<HTMLElement>(BACKGROUND_STRIP_SELECTOR).forEach((el) => {
    el.style.removeProperty('background-color')
    el.style.removeProperty('background')
  })
  return doc.body?.innerHTML ?? html
}

async function defaultUploadImageStub(file: File) {
  // Stub: no storage backend exists yet (see issue #50). We use a data: URL
  // instead of URL.createObjectURL because blob: URLs are origin-scoped —
  // they fail to load inside the sandboxed Preview iframe (opaque origin)
  // and don't survive a page reload. data: URLs are self-contained (the
  // bytes are embedded in the URL itself), so they work everywhere the HTML
  // goes, at the cost of bloating the stored HTML until real storage lands.
  return new Promise<{ url: string }>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve({ url: reader.result as string })
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
}

export interface RichEmailEditorRef {
  getHTML: () => Promise<string>
  setContent: (html: string) => void
  editor: Editor | null
}

export interface RichEmailEditorProps {
  onUploadImage?: (file: File) => Promise<{ url: string }>
  onReady?: () => void
  placeholder?: string
  height?: string
  className?: string
  editable?: boolean
}

export const RichEmailEditor = forwardRef<RichEmailEditorRef, RichEmailEditorProps>(
  function RichEmailEditor(
    {
      onUploadImage = defaultUploadImageStub,
      onReady,
      placeholder = "Press '/' for commands",
      height = '550px',
      className,
      editable = true,
    },
    ref
  ) {
    const imageExtension = useEditorImage({ uploadImage: onUploadImage })

    const editor = useEditor({
      extensions: [
        StarterKit,
        Placeholder.configure({
          placeholder: ({
            node,
          }: {
            node: { type: { name: string }; attrs: { level?: number } }
          }) => (node.type.name === 'heading' ? `Heading ${node.attrs.level}` : placeholder),
          includeChildren: true,
        }),
        EmailTheming.configure({ theme: 'basic' }),
        imageExtension,
      ],
      content: '',
      editable,
      immediatelyRender: false,
    })

    useEffect(() => {
      editor?.setEditable(editable)
    }, [editor, editable])

    useEffect(() => {
      if (editor) onReady?.()
    }, [editor, onReady])

    useImperativeHandle(
      ref,
      () => ({
        getHTML: async () => {
          if (!editor) return ''
          const { html } = await composeReactEmail({ editor })
          return stripBackgroundColors(stripRootContainerCentering(stripHtmlDocumentWrapper(html)))
        },
        setContent: (html: string) => {
          editor?.commands.setContent(html)
        },
        editor,
      }),
      [editor]
    )

    return (
      <EditorContext.Provider value={{ editor }}>
        <div className="flex" style={{ height }}>
          <div className={`min-w-0 flex-1 overflow-y-auto ${className ?? ''}`}>
            <EditorContent editor={editor} className="re-canvas p-4 bg-white rounded-md" />
          </div>

          {editor && (
            <Inspector.Root
              className="re-inspector w-96! shrink-0 overflow-y-auto border-l p-3 text-sm">
              <Inspector.Breadcrumb />
              <Inspector.Document />
              <Inspector.Node />
              <Inspector.Text />
            </Inspector.Root>
          )}
        </div>

        <SlashCommand items={[...defaultSlashCommands, imageSlashCommand]} />
        <BubbleMenu
          hideWhenActiveNodes={['button', 'horizontalRule']}
          hideWhenActiveMarks={['link']}
        />
        <BubbleMenu.LinkDefault />
        <BubbleMenu.ButtonDefault />
        <BubbleMenu.ImageDefault />
      </EditorContext.Provider>
    )
  }
)
