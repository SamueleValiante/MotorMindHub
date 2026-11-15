import { describe, expect, it } from "vitest";
import { docToMarkdown, markdownToDoc } from "./markdown";

const roundTrip = (md: string) => docToMarkdown(markdownToDoc(md));

describe("markdown <-> doc: elenchi, citazioni, tabelle", () => {
  it("elenco puntato: round-trip e struttura", () => {
    const md = "- **Uno:** primo\n- due";
    const doc = markdownToDoc(md);
    expect(doc.content?.[0].type).toBe("bulletList");
    expect(doc.content?.[0].content).toHaveLength(2);
    expect(roundTrip(md)).toBe(md);
  });

  it("elenco numerato: round-trip", () => {
    const md = "1. primo\n2. secondo\n3. terzo";
    expect(markdownToDoc(md).content?.[0].type).toBe("orderedList");
    expect(roundTrip(md)).toBe(md);
  });

  it("un paragrafo che inizia con un trattino ma ha righe non-voce resta paragrafo", () => {
    expect(markdownToDoc("- voce\nriga attaccata").content?.[0].type).toBe("paragraph");
  });

  it("citazione: round-trip, anche con piu' paragrafi", () => {
    const md = "> **Attenzione** — testo\n>\n> secondo paragrafo";
    const doc = markdownToDoc(md);
    expect(doc.content?.[0].type).toBe("blockquote");
    expect(doc.content?.[0].content).toHaveLength(2);
    expect(roundTrip(md)).toBe(md);
  });

  it("tabella GFM: intestazione, righe e round-trip", () => {
    const md = "| Fonte | Cifra |\n| --- | --- |\n| Al Volante | 22.200 euro |\n| Sicurauto | 22.700 euro |";
    const table = markdownToDoc(md).content?.[0];
    expect(table?.type).toBe("table");
    expect(table?.content).toHaveLength(3);
    expect(table?.content?.[0].content?.[0].type).toBe("tableHeader");
    expect(table?.content?.[1].content?.[0].type).toBe("tableCell");
    expect(roundTrip(md)).toBe(md);
  });

  it("tabella: il pipe escapato nella cella sopravvive", () => {
    const md = "| A | B |\n| --- | --- |\n| x \\| y | z |";
    expect(roundTrip(md)).toBe(md);
  });

  it("documento misto: l'ordine dei blocchi e' preservato", () => {
    const md = "## Titolo\n\nTesto.\n\n- a\n- b\n\n> nota\n\n| A |\n| --- |\n| 1 |";
    expect(roundTrip(md)).toBe(md);
  });

  it("titolo seguito subito dal testo (senza riga vuota) resta un titolo", () => {
    const doc = markdownToDoc("## Titolo\nTesto subito sotto.");
    expect(doc.content?.map((n) => n.type)).toEqual(["heading", "paragraph"]);
  });

  it("il Markdown di prima (H2/H3, immagine, grassetto) non cambia", () => {
    const md = "## Titolo\n\nTesto **forte** e *corsivo*.\n\n![alt](https://x/y.png)";
    expect(roundTrip(md)).toBe(md);
  });
});
