import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import TextAlign from "@tiptap/extension-text-align";
import {
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  Heading2,
  Heading3,
  Quote,
  Undo2,
  Redo2,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Link as LinkIcon,
  Unlink,
} from "lucide-react";
import type { RichNode, Media } from "@veca/content";
import { useCallback, useEffect, useState } from "react";
import { Modal } from "../../components/Modal";
import { Button, Field, Notice } from "../../components/ui";
const ProjectImage = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      mediaId: { default: null },
      layout: { default: "wide" },
    };
  },
});
export function RichEditor({
  value,
  onChange,
  onReady,
  label = "Contenido del proyecto",
  disabled = false,
}: {
  value: RichNode;
  onChange: (node: RichNode) => void;
  onReady?: (insert: (image: Media, layout: string) => void) => void;
  label?: string;
  disabled?: boolean;
}) {
  const [linkOpen, setLinkOpen] = useState(false),
    [linkValue, setLinkValue] = useState(""),
    [linkError, setLinkError] = useState("");
  const closeLink = useCallback(() => setLinkOpen(false), []);
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
        link: { openOnClick: false, protocols: ["https", "http"] },
      }),
      ...(onReady ? [ProjectImage] : []),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
    ],
    content: value,
    immediatelyRender: false,
    onUpdate: ({ editor }) => onChange(editor.getJSON() as RichNode),
    editorProps: {
      attributes: {
        class: "rich-document",
        "aria-label": label,
        role: "textbox",
        "aria-multiline": "true",
      },
    },
  });
  useEffect(() => {
    if (editor && JSON.stringify(editor.getJSON()) !== JSON.stringify(value)) {
      editor.commands.setContent(value, { emitUpdate: false });
    }
  }, [editor, value]);
  useEffect(() => {
    if (editor && onReady)
      onReady((image, layout) =>
        editor
          .chain()
          .focus()
          .insertContent({
            type: "image",
            attrs: {
              src: image.url,
              alt: image.alt,
              mediaId: image.id,
              layout,
            },
          })
          .run(),
      );
  }, [editor, onReady]);
  useEffect(() => {
    editor?.setEditable(!disabled, false);
  }, [editor, disabled]);
  if (!editor) return <p>Cargando editor…</p>;
  const tools = [
    {
      name: "Negrita",
      Icon: Bold,
      run: () => editor.chain().focus().toggleBold().run(),
      active: editor.isActive("bold"),
    },
    {
      name: "Cursiva",
      Icon: Italic,
      run: () => editor.chain().focus().toggleItalic().run(),
      active: editor.isActive("italic"),
    },
    {
      name: "Subrayado",
      Icon: Underline,
      run: () => editor.chain().focus().toggleUnderline().run(),
      active: editor.isActive("underline"),
    },
    {
      name: "Subtítulo",
      Icon: Heading2,
      run: () => editor.chain().focus().toggleHeading({ level: 2 }).run(),
      active: editor.isActive("heading", { level: 2 }),
    },
    {
      name: "Subtítulo pequeño",
      Icon: Heading3,
      run: () => editor.chain().focus().toggleHeading({ level: 3 }).run(),
      active: editor.isActive("heading", { level: 3 }),
    },
    {
      name: "Lista",
      Icon: List,
      run: () => editor.chain().focus().toggleBulletList().run(),
      active: editor.isActive("bulletList"),
    },
    {
      name: "Lista numerada",
      Icon: ListOrdered,
      run: () => editor.chain().focus().toggleOrderedList().run(),
      active: editor.isActive("orderedList"),
    },
    {
      name: "Cita",
      Icon: Quote,
      run: () => editor.chain().focus().toggleBlockquote().run(),
      active: editor.isActive("blockquote"),
    },
    {
      name: "Alinear a la izquierda",
      Icon: AlignLeft,
      run: () => editor.chain().focus().setTextAlign("left").run(),
    },
    {
      name: "Centrar",
      Icon: AlignCenter,
      run: () => editor.chain().focus().setTextAlign("center").run(),
    },
    {
      name: "Alinear a la derecha",
      Icon: AlignRight,
      run: () => editor.chain().focus().setTextAlign("right").run(),
    },
    {
      name: "Añadir enlace",
      Icon: LinkIcon,
      run: () => {
        setLinkValue(String(editor.getAttributes("link").href || "https://"));
        setLinkError("");
        setLinkOpen(true);
      },
    },
    {
      name: "Quitar enlace",
      Icon: Unlink,
      run: () => editor.chain().focus().unsetLink().run(),
    },
    {
      name: "Deshacer",
      Icon: Undo2,
      run: () => editor.chain().focus().undo().run(),
    },
    {
      name: "Rehacer",
      Icon: Redo2,
      run: () => editor.chain().focus().redo().run(),
    },
  ];
  function applyLink() {
    try {
      const url = new URL(linkValue.trim());
      if (!["https:", "http:"].includes(url.protocol)) throw Error();
      editor!
        .chain()
        .focus()
        .extendMarkRange("link")
        .setLink({ href: url.href })
        .run();
      closeLink();
    } catch {
      setLinkError(
        "Escribe un enlace completo que empiece con https:// o http://.",
      );
    }
  }
  return (
    <div className="rich-editor">
      <div
        className="editor-toolbar"
        role="toolbar"
        aria-label="Formato de texto"
      >
        {tools.map(({ name, Icon, run, active }) => (
          <button
            key={name}
            type="button"
            disabled={disabled}
            aria-label={name}
            title={name}
            aria-pressed={!!active}
            onClick={run}
          >
            <Icon size={17} />
          </button>
        ))}
      </div>
      <EditorContent editor={editor} />
      <p className="editor-tip">
        {onReady
          ? "Cuenta el reto, la solución y el resultado. Inserta fotos desde la biblioteca."
          : "Da formato al texto. Elige debajo las fotos que acompañan esta sección."}
      </p>
      {linkOpen && (
        <Modal
          title="Añadir enlace"
          description="Selecciona el texto que quieras enlazar y escribe la dirección completa."
          onClose={closeLink}
          footer={
            <footer className="ve-modal-actions">
              <Button variant="ghost" onClick={closeLink}>
                Cancelar
              </Button>
              <Button onClick={applyLink}>Aplicar enlace</Button>
            </footer>
          }
        >
          <Field label="Dirección del enlace">
            <input
              type="url"
              value={linkValue}
              onChange={(event) => setLinkValue(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  applyLink();
                }
              }}
              placeholder="https://…"
            />
          </Field>
          {linkError && <Notice error>{linkError}</Notice>}
        </Modal>
      )}
    </div>
  );
}
