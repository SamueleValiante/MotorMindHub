import type { CategoryAncestor } from "@/lib/categorie/types";

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

/**
 * AuthorArticleSummaryDTO (GestioneArticoli.getArticlesByAuthor, RF2.1, GET /api/v1/articoli/me) —
 * risposta REALE confermata su Swagger: array nudo di `{articolo: ArticleSummaryDTO,
 * numeroSalvataggi}`, NON un ArticleSummaryDTO piatto — useMyArticles appiattisce questa forma in
 * MyArticle per i consumer, non rifare il merge altrove.
 */
export interface MyArticle extends ArticleSummary {
  numeroSalvataggi: number;
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

export interface ArticleDetail {
  id: number;
  titolo: string;
  testo: string;
  immagineCopertina: string | null;
  tag: string[];
  categoriaId: number;
  categoriaNome: string;
  /** Catena radice -> foglia della categoria (GestioneCategorie.getCategoryPath, ODD 2.3), per il
   *  breadcrumb del Dettaglio Articolo. Vuota se l'articolo non ha categoria. */
  categoriaAntenati: CategoryAncestor[];
  autoreId: number;
  autoreNome: string;
  stato: StatoArticolo;
  tempoLetturaMinuti: number;
  numeroVisualizzazioni: number;
  dataCreazione: string;
  dataUltimoAggiornamento: string;
  /** Valorizzato solo se stato = RIFIUTATO (ODD 2.2 Articolo.rifiuta), null altrimenti. */
  motivazioneRifiuto: string | null;
}

export type TipoLista = "PREFERITI" | "LEGGI_PIU_TARDI";

export interface SavedArticle {
  articolo: ArticleSummary;
  tipoLista: TipoLista;
  dataSalvataggio: string;
}
