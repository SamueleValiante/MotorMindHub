import type { JSONContent } from "@tiptap/core";

/**
 * Conversione bidirezionale tra il documento TipTap (ProseMirror JSON) e il
 * Markdown persistito in Articolo.testo — solo per il sottoinsieme che
 * ArticleBodyEditor espone davvero (H2/H3, paragrafo, grassetto, corsivo,
 * immagine, elenchi puntati/numerati a un livello, citazioni, tabelle GFM):
 * niente codice/liste annidate, quelle estensioni sono disattivate
 * nell'editor (ArticleBodyEditor.tsx) apposta, cosi' questo modulo non deve
 * saperle serializzare. react-markdown lato lettura
 * (ArticleDetailContent.tsx) resta un parser CommonMark/GFM completo — se
 * in futuro arrivasse altro Markdown da fuori questo editor (import,
 * modifica diretta nel DB) verrebbe comunque reso correttamente, solo non
 * ri-editabile pixel-perfect qui.
 *
 * Non e' un parser Markdown generico: e' il round-trip simmetrico di
 * doc -> markdown qui sotto. Per questo il parser riconosce solo i pattern
 * che il serializzatore stesso produce (## , ### , ![alt](src) su una riga
 * a se', marcatori di grassetto/corsivo/entrambi) e tratta tutto il resto
 * (compreso testo semplice preesistente, i due articoli di test) come
 * paragrafo semplice — lo stesso comportamento del vecchio rendering
 * plain-text, solo capace in piu' di riconoscere il proprio output.
 */

type MarkNode = { type: "text"; text: string; marks?: Array<{ type: string }> };
type ContentNode = JSONContent;

// Un solo tokenizer con tre alternative in ordine di priorita' (piu' lunga
// prima, altrimenti "***x***" verrebbe letto come "*" + "**x**" + "*"):
// grassetto+corsivo, grassetto, corsivo.
const INLINE_TOKEN_RE = /\*\*\*(.+?)\*\*\*|\*\*(.+?)\*\*|\*(.+?)\*/g;

/** \* letterale nel testo dell'autore non deve essere scambiato per un delimitatore al reload. */
function escapeLiteralAsterisks(text: string): string {
  return text.replace(/\*/g, "\\*");
}
function unescapeLiteralAsterisks(text: string): string {
  return text.replace(/\\\*/g, "\x00").replace(/\*/g, "*").replace(/\x00/g, "*");
}

// ---------------------------------------------------------------------------
// doc TipTap -> markdown
// ---------------------------------------------------------------------------

function hasMark(node: MarkNode, type: string): boolean {
  return !!node.marks?.some((m) => m.type === type);
}

/** Serializza il content[] di un paragrafo/heading (text + hardBreak) in una stringa markdown su una o piu' righe (hardBreak -> \n singolo). */
function serializeInline(content: ContentNode[] | undefined): string {
  if (!content) return "";
  return content
    .map((node) => {
      // "\" + newline, non un semplice "\n": CommonMark (react-markdown lato
      // lettura) tratta un "\n" nudo dentro un paragrafo come soft break
      // (reso come uno spazio, non un vero a-capo) - un a-capo voluto
      // dall'autore (Shift+Invio in TipTap) andrebbe perso alla pubblicazione.
      // "\" + newline è invece un hard break CommonMark esplicito.
      if (node.type === "hardBreak") return "\\\n";
      if (node.type !== "text" || typeof node.text !== "string") return "";
      const text = escapeLiteralAsterisks(node.text);
      const textNode = node as MarkNode;
      const bold = hasMark(textNode, "bold");
      const italic = hasMark(textNode, "italic");
      if (bold && italic) return `***${text}***`;
      if (bold) return `**${text}**`;
      if (italic) return `*${text}*`;
      return text;
    })
    .join("");
}

/** editor.getJSON() -> markdown persistito in Articolo.testo. */
export function docToMarkdown(doc: ContentNode): string {
  const blocks = (doc.content ?? []).map((node) => {
    if (node.type === "heading") {
      const level = (node.attrs?.level as number) ?? 2;
      const prefix = level >= 3 ? "###" : "##";
      return `${prefix} ${serializeInline(node.content)}`;
    }
    if (node.type === "image") {
      const alt = (node.attrs?.alt as string | null) ?? "";
      const src = (node.attrs?.src as string | null) ?? "";
      return `![${alt}](${src})`;
    }
    if (node.type === "bulletList" || node.type === "orderedList") {
      return serializeList(node);
    }
    if (node.type === "blockquote") {
      return serializeBlockquote(node);
    }
    if (node.type === "table") {
      return serializeTable(node);
    }
    // paragraph (o qualunque altro nodo blocco non gestito: reso come testo semplice)
    return serializeInline(node.content);
  });
  return blocks.join("\n\n");
}

/** Testo di un blocco contenitore (listItem/blockquote/cella): i suoi paragrafi uniti in uno solo, un hardBreak separa quelli successivi. */
function serializeContainerInline(children: ContentNode[] | undefined): string {
  return (children ?? [])
    .map((child) => serializeInline(child.content))
    .filter((text) => text.length > 0)
    .join("\\\n");
}

function serializeList(list: ContentNode): string {
  const ordered = list.type === "orderedList";
  return (list.content ?? [])
    .map((item, i) => {
      const marker = ordered ? `${i + 1}. ` : "- ";
      // Righe di continuazione (hardBreak dentro la voce) indentate come il marcatore.
      const text = serializeContainerInline(item.content).replace(/\\\n/g, `\\\n${" ".repeat(marker.length)}`);
      return `${marker}${text}`;
    })
    .join("\n");
}

function serializeBlockquote(quote: ContentNode): string {
  return (quote.content ?? [])
    .map((child) => serializeInline(child.content).split("\n").map((line) => `> ${line}`).join("\n"))
    .join("\n>\n");
}

function serializeTableCell(cell: ContentNode): string {
  // Una cella GFM sta su una sola riga: i paragrafi si uniscono con uno spazio e il "|" letterale va protetto.
  const text = (cell.content ?? [])
    .map((child) => serializeInline(child.content).replace(/\\\n/g, " "))
    .filter((t) => t.length > 0)
    .join(" ");
  return text.replace(/\|/g, "\\|");
}

function serializeTable(table: ContentNode): string {
  const rows = (table.content ?? []).map((row) => (row.content ?? []).map(serializeTableCell));
  if (rows.length === 0) return "";
  const columns = Math.max(...rows.map((r) => r.length));
  const pad = (r: string[]) => Array.from({ length: columns }, (_, i) => r[i] ?? "");
  const line = (r: string[]) => `| ${pad(r).join(" | ")} |`;
  // GFM richiede una riga di intestazione: la prima riga lo e' sempre (nell'editor e' una riga di tableHeader).
  return [line(rows[0]), `|${Array.from({ length: columns }, () => " --- ").join("|")}|`, ...rows.slice(1).map(line)].join("\n");
}

// ---------------------------------------------------------------------------
// markdown -> doc TipTap
// ---------------------------------------------------------------------------

/** Una riga di markdown (dentro un blocco paragrafo/heading) -> content[] TipTap (text con marks + hardBreak tra righe). */
function parseInlineLine(line: string): ContentNode[] {
  const nodes: ContentNode[] = [];
  let lastIndex = 0;
  INLINE_TOKEN_RE.lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = INLINE_TOKEN_RE.exec(line)) !== null) {
    if (match.index > lastIndex) {
      nodes.push({ type: "text", text: unescapeLiteralAsterisks(line.slice(lastIndex, match.index)) });
    }
    const [, boldItalic, bold, italic] = match;
    if (boldItalic !== undefined) {
      nodes.push({
        type: "text",
        text: unescapeLiteralAsterisks(boldItalic),
        marks: [{ type: "bold" }, { type: "italic" }],
      });
    } else if (bold !== undefined) {
      nodes.push({ type: "text", text: unescapeLiteralAsterisks(bold), marks: [{ type: "bold" }] });
    } else if (italic !== undefined) {
      nodes.push({ type: "text", text: unescapeLiteralAsterisks(italic), marks: [{ type: "italic" }] });
    }
    lastIndex = INLINE_TOKEN_RE.lastIndex;
  }
  if (lastIndex < line.length) {
    nodes.push({ type: "text", text: unescapeLiteralAsterisks(line.slice(lastIndex)) });
  }
  return nodes;
}

const HARD_BREAK_RE = /\\\n/;

/**
 * Un blocco (possibili piu' righe unite da "\" + newline = hardBreak, stesso
 * marcatore prodotto da serializeInline sopra) -> content[] TipTap. Un "\n"
 * nudo residuo (testo preesistente non scritto da questo editor, es. i due
 * articoli di test) non e' un hardBreak: diventa uno spazio, lo stesso soft
 * break che react-markdown gli darebbe in lettura - l'editor deve mostrare
 * lo stesso risultato che verra' poi pubblicato.
 */
function parseInlineBlock(block: string): ContentNode[] {
  const lines = block.split(HARD_BREAK_RE);
  const content: ContentNode[] = [];
  lines.forEach((line, i) => {
    if (i > 0) content.push({ type: "hardBreak" });
    content.push(...parseInlineLine(line.replace(/\n/g, " ")));
  });
  // Un content[] vuoto (blocco vuoto) non e' un nodo TipTap valido per paragraph/heading.
  return content.length > 0 ? content : [{ type: "text", text: "" }];
}

const HEADING_RE = /^(#{2,3})\s+(.*)$/;
const BULLET_RE = /^[-*+] +(.*)$/;
const ORDERED_RE = /^\d+[.)] +(.*)$/;
const TABLE_SEPARATOR_RE = /^\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)*\|?$/;
const IMAGE_ONLY_RE = /^!\[([^\]]*)\]\(([^)\s]+)\)$/;

/** markdown persistito -> content iniziale per useEditor({ content: ... }). */
export function markdownToDoc(markdown: string): ContentNode {
  const trimmed = markdown.trim();
  if (!trimmed) {
    return { type: "doc", content: [{ type: "paragraph" }] };
  }

  // Stesso split di paragrafi gia' in uso per il rendering plain-text
  // (ArticleDetailContent.tsx, prima di react-markdown): una riga vuota
  // separa i blocchi, coerente col testo esistente in produzione.
  // Un titolo H2/H3 e' sempre un blocco a se': Markdown scritto altrove (import, API) puo' avere il
  // testo attaccato alla riga del titolo; senza questa separazione il titolo si fonderebbe col paragrafo.
  const blocks = trimmed.replace(/^(#{2,3} [^\n]*)\n(?=[^\n])/gm, "$1\n\n").split(/\n{2,}/);

  const content: ContentNode[] = blocks.map((block) => {
    const headingMatch = block.match(HEADING_RE);
    if (headingMatch) {
      const level = headingMatch[1].length; // "##" -> 2, "###" -> 3
      return { type: "heading", attrs: { level }, content: parseInlineBlock(headingMatch[2]) };
    }
    const imageMatch = block.match(IMAGE_ONLY_RE);
    if (imageMatch) {
      return { type: "image", attrs: { src: imageMatch[2], alt: imageMatch[1] || null } };
    }
    const table = parseTable(block);
    if (table) return table;
    const list = parseList(block);
    if (list) return list;
    const quote = parseBlockquote(block);
    if (quote) return quote;
    return { type: "paragraph", content: parseInlineBlock(block) };
  });

  return { type: "doc", content };
}


// ---------------------------------------------------------------------------
// blocchi contenitore: elenchi, citazioni, tabelle
// ---------------------------------------------------------------------------

/** Elenco a un solo livello: ogni riga e' una voce, le righe indentate continuano la voce precedente. Altrimenti null (resta un paragrafo). */
function parseList(block: string): ContentNode | null {
  const lines = block.split("\n");
  const first = lines[0];
  const ordered = ORDERED_RE.test(first);
  if (!ordered && !BULLET_RE.test(first)) return null;
  const itemRe = ordered ? ORDERED_RE : BULLET_RE;

  const items: string[] = [];
  for (const line of lines) {
    const m = line.match(itemRe);
    if (m) items.push(m[1]);
    else if (/^\s+\S/.test(line) && items.length > 0) items[items.length - 1] += `\n${line.trim()}`;
    else return null; // riga non riconosciuta (es. paragrafo attaccato all'elenco): niente trasformazione parziale
  }
  return {
    type: ordered ? "orderedList" : "bulletList",
    content: items.map((text) => ({
      type: "listItem",
      content: [{ type: "paragraph", content: parseInlineBlock(text) }],
    })),
  };
}

function parseBlockquote(block: string): ContentNode | null {
  const lines = block.split("\n");
  if (!lines.every((line) => /^>/.test(line))) return null;
  const stripped = lines.map((line) => line.replace(/^> ?/, ""));
  const paragraphs: string[] = [];
  let current: string[] = [];
  for (const line of stripped) {
    if (line.trim() === "") {
      if (current.length > 0) paragraphs.push(current.join("\n"));
      current = [];
    } else {
      current.push(line);
    }
  }
  if (current.length > 0) paragraphs.push(current.join("\n"));
  if (paragraphs.length === 0) return null;
  return {
    type: "blockquote",
    content: paragraphs.map((p) => ({ type: "paragraph", content: parseInlineBlock(p) })),
  };
}

/** Separa le celle di una riga GFM sui "|" non preceduti da "\". */
function splitTableRow(line: string): string[] {
  const body = line.trim().replace(/^\|/, "").replace(/\|$/, "");
  const cells: string[] = [];
  let current = "";
  for (let i = 0; i < body.length; i++) {
    if (body[i] === "\\" && body[i + 1] === "|") {
      current += "|";
      i++;
    } else if (body[i] === "|") {
      cells.push(current.trim());
      current = "";
    } else {
      current += body[i];
    }
  }
  cells.push(current.trim());
  return cells;
}

function parseTable(block: string): ContentNode | null {
  const lines = block.split("\n");
  if (lines.length < 2 || !lines[0].includes("|") || !TABLE_SEPARATOR_RE.test(lines[1].trim())) return null;
  const header = splitTableRow(lines[0]);
  const columns = header.length;
  const makeRow = (cells: string[], cellType: "tableHeader" | "tableCell"): ContentNode => ({
    type: "tableRow",
    content: Array.from({ length: columns }, (_, i) => ({
      type: cellType,
      content: [{ type: "paragraph", content: parseInlineBlock(cells[i] ?? "") }],
    })),
  });
  return {
    type: "table",
    content: [makeRow(header, "tableHeader"), ...lines.slice(2).map((line) => makeRow(splitTableRow(line), "tableCell"))],
  };
}
