"use client";

import { useRef, useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import TiptapImage from "@tiptap/extension-image";
import { Table, TableRow, TableHeader, TableCell } from "@tiptap/extension-table";
import { docToMarkdown, markdownToDoc } from "@/lib/articoli/markdown";
import { uploadInlineImage } from "@/lib/articoli/uploadInlineImage";
import { InsertImageAltModal } from "@/components/articoli/InsertImageAltModal";
import { ImageIcon } from "@/components/autore/icons";
import { toast } from "@/lib/toast/toast";

interface ArticleBodyEditorProps {
  value: string;
  onChange: (markdown: string) => void;
}

const toolbarButtonClassName =
  "flex h-9 min-w-9 items-center justify-center rounded-md px-2 font-heading text-xs font-bold uppercase tracking-wide text-chrome hover:text-paper disabled:opacity-40";
const toolbarButtonActiveClassName = "bg-surface-raised text-paper";
const dividerClassName = "mx-1 h-5 w-px bg-paper/10";

/**
 * Editor Markdown (H2/H3, paragrafo, grassetto, corsivo, elenchi, citazione, tabella, immagine inline) —
 * sostituisce il <textarea> di testo semplice. `value`/`onChange` sono
 * Markdown, non lo stato interno di TipTap: al mount il documento viene
 * costruito una volta da markdownToDoc(value) (coerente con come
 * ArticleEditorForm inizializza già titolo/categoria da useState, non da
 * prop controllate ad ogni render); da lì in poi la sorgente di verità è
 * l'editor stesso, che propaga in Markdown via onChange ad ogni modifica —
 * un TipTap davvero controllato (setContent ad ogni render dal genitore)
 * richiederebbe di diffare/preservare la selezione, complessità che qui
 * nessun chiamante ha mai bisogno di riscrivere `value` dall'esterno dopo
 * il mount (remount già gestito a monte da ArticleEditor.tsx via key).
 */
export function ArticleBodyEditor({ value, onChange }: ArticleBodyEditorProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [pendingImage, setPendingImage] = useState<string | null>(null);
  // useEditorState (@tiptap/react) non va bene qui: il suo EditorStateManager
  // viene creato una sola volta al primo render, quando editor è ancora null
  // (immediatelyRender: false) - lo snapshot che restituisce si aggiorna solo
  // su eventi transaction/update dell'editor stesso, non semplicemente perché
  // editor è diventato non-null al mount, quindi restava null per sempre
  // finché l'autore non scriveva un primo carattere (verificato dal vivo: il
  // componente non renderizzava affatto finché non toccato). onTransaction
  // + un contatore locale forza invece un re-render ad ogni transazione
  // (incluso il mount stesso, che ne emette una), da cui si legge
  // editor.isActive(...) sempre fresco direttamente in JSX.
  const [, forceToolbarUpdate] = useState(0);

  const editor = useEditor({
    immediatelyRender: false,
    onTransaction: () => forceToolbarUpdate((n) => n + 1),
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
        code: false,
        codeBlock: false,
        horizontalRule: false,
        strike: false,
        underline: false,
        link: false,
      }),
      TiptapImage,
      // Tabelle GFM: prima riga sempre di intestazione (docToMarkdown la serializza cosi'); niente celle unite ne' ridimensionamento colonne.
      Table.configure({ resizable: false }),
      TableRow,
      TableHeader,
      TableCell,
    ],
    content: markdownToDoc(value),
    onUpdate: ({ editor: instance }) => onChange(docToMarkdown(instance.getJSON())),
    editorProps: {
      attributes: {
        id: "editor-testo",
        role: "textbox",
        "aria-multiline": "true",
        "aria-label": "Testo dell'articolo",
        class:
          // Stessa scala h2/h3 di ArticleMarkdownBody.tsx (text-2xl/text-xl,
          // non text-xl/text-lg: un gradino intero, non due punti troppo
          // vicini per leggersi come gerarchia distinta) - l'anteprima in
          // scrittura deve rispecchiare come apparirà pubblicato, altrimenti
          // è un terzo punto di rendering pronto a disallinearsi in silenzio.
          "min-h-64 rounded-b-md bg-surface-raised px-4 py-3 text-base leading-loose text-paper outline-none focus:ring-2 focus:ring-accent [&_h2]:font-heading [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:uppercase [&_h2]:tracking-wide [&_h3]:font-heading [&_h3]:text-xl [&_h3]:font-bold [&_h3]:uppercase [&_h3]:tracking-wide [&_img]:my-2 [&_img]:w-full [&_img]:rounded-md [&_p+p]:mt-4 [&_ul]:my-4 [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:my-4 [&_ol]:list-decimal [&_ol]:pl-6 [&_blockquote]:my-6 [&_blockquote]:border-l-4 [&_blockquote]:border-paper/30 [&_blockquote]:bg-paper/5 [&_blockquote]:px-4 [&_blockquote]:py-3 [&_table]:my-6 [&_table]:w-full [&_table]:border-collapse [&_th]:border [&_th]:border-paper/10 [&_th]:bg-paper/5 [&_th]:px-3 [&_th]:py-2 [&_th]:text-left [&_td]:border [&_td]:border-paper/10 [&_td]:px-3 [&_td]:py-2 [&_td]:align-top",
      },
    },
  });

  const handleFileSelected = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setUploading(true);
    try {
      const url = await uploadInlineImage(file);
      setPendingImage(url);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Non è stato possibile caricare l'immagine. Riprova.");
    } finally {
      setUploading(false);
    }
  };

  const handleConfirmImage = (alt: string) => {
    if (pendingImage) {
      editor?.chain().focus().setImage({ src: pendingImage, alt }).run();
    }
    setPendingImage(null);
  };

  if (!editor) return null;

  return (
    <div className="flex flex-col">
      <div className="flex flex-wrap items-center gap-1 rounded-t-md border-b border-paper/10 bg-carbon p-2">
        <button
          type="button"
          onClick={() => editor.chain().focus().setParagraph().run()}
          aria-pressed={editor.isActive("paragraph")}
          className={`${toolbarButtonClassName} ${editor.isActive("paragraph") ? toolbarButtonActiveClassName : ""}`}
        >
          Testo
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          aria-pressed={editor.isActive("heading", { level: 2 })}
          className={`${toolbarButtonClassName} ${editor.isActive("heading", { level: 2 }) ? toolbarButtonActiveClassName : ""}`}
        >
          H2
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          aria-pressed={editor.isActive("heading", { level: 3 })}
          className={`${toolbarButtonClassName} ${editor.isActive("heading", { level: 3 }) ? toolbarButtonActiveClassName : ""}`}
        >
          H3
        </button>

        <span aria-hidden="true" className={dividerClassName} />

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          aria-pressed={editor.isActive("bold")}
          aria-label="Grassetto"
          className={`${toolbarButtonClassName} ${editor.isActive("bold") ? toolbarButtonActiveClassName : ""}`}
        >
          B
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          aria-pressed={editor.isActive("italic")}
          aria-label="Corsivo"
          className={`${toolbarButtonClassName} italic ${editor.isActive("italic") ? toolbarButtonActiveClassName : ""}`}
        >
          I
        </button>

        <span aria-hidden="true" className={dividerClassName} />

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          aria-pressed={editor.isActive("bulletList")}
          aria-label="Elenco puntato"
          className={`${toolbarButtonClassName} ${editor.isActive("bulletList") ? toolbarButtonActiveClassName : ""}`}
        >
          • Elenco
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          aria-pressed={editor.isActive("orderedList")}
          aria-label="Elenco numerato"
          className={`${toolbarButtonClassName} ${editor.isActive("orderedList") ? toolbarButtonActiveClassName : ""}`}
        >
          1. Elenco
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          aria-pressed={editor.isActive("blockquote")}
          aria-label="Citazione"
          className={`${toolbarButtonClassName} ${editor.isActive("blockquote") ? toolbarButtonActiveClassName : ""}`}
        >
          Citazione
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
          aria-pressed={editor.isActive("table")}
          aria-label="Inserisci tabella"
          className={`${toolbarButtonClassName} ${editor.isActive("table") ? toolbarButtonActiveClassName : ""}`}
        >
          Tabella
        </button>
        {editor.isActive("table") && (
          <>
            <button type="button" onClick={() => editor.chain().focus().addRowAfter().run()} aria-label="Aggiungi riga" className={toolbarButtonClassName}>
              + Riga
            </button>
            <button type="button" onClick={() => editor.chain().focus().addColumnAfter().run()} aria-label="Aggiungi colonna" className={toolbarButtonClassName}>
              + Colonna
            </button>
            <button type="button" onClick={() => editor.chain().focus().deleteRow().run()} aria-label="Elimina riga" className={toolbarButtonClassName}>
              − Riga
            </button>
            <button type="button" onClick={() => editor.chain().focus().deleteColumn().run()} aria-label="Elimina colonna" className={toolbarButtonClassName}>
              − Colonna
            </button>
            <button type="button" onClick={() => editor.chain().focus().deleteTable().run()} aria-label="Elimina tabella" className={toolbarButtonClassName}>
              Elimina tabella
            </button>
          </>
        )}

        <span aria-hidden="true" className={dividerClassName} />

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          aria-label="Inserisci immagine"
          className={toolbarButtonClassName}
        >
          {uploading ? "…" : <ImageIcon className="h-4 w-4" />}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          hidden
          data-testid="inline-image-input"
          onChange={(event) => void handleFileSelected(event)}
        />
      </div>

      <EditorContent editor={editor} />

      {pendingImage && (
        <InsertImageAltModal
          imageUrl={pendingImage}
          onConfirm={handleConfirmImage}
          onCancel={() => setPendingImage(null)}
        />
      )}
    </div>
  );
}
