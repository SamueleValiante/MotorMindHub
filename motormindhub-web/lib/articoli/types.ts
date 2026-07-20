export type StatoArticolo = "BOZZA" | "IN_ATTESA_APPROVAZIONE" | "PUBBLICATO" | "RIFIUTATO";

export type OrdinamentoArticoli = "PIU_RECENTI" | "PIU_LETTI" | "IN_EVIDENZA";

export interface ArticleSummary {
  id: number;
  titolo: string;
  estratto: string | null;
  immagineCopertina: string | null;
  categoriaId: number;
  categoriaNome: string;
  autoreId: number;
  autoreNome: string;
  stato: StatoArticolo;
  tempoLetturaMinuti: number;
  numeroVisualizzazioni: number;
  dataUltimoAggiornamento: string;
}

export interface ArticleSearchResult {
  articoli: ArticleSummary[];
  totaleRisultati: number;
  pagina: number;
  dimensionePagina: number;
}

export interface SearchArticlesParams {
  query?: string;
  categoriaIds?: number[];
  pagina?: number;
  dimensionePagina?: number;
  ordinamento?: OrdinamentoArticoli;
}
