export type StatoUtente = "NON_VERIFICATO" | "ATTIVO" | "SOSPESO" | "CANCELLATO";

/**
 * AuthorSummaryDTO (GestioneAutori.listAuthors, RF3.2): `percentualeApprovazione` è
 * PUBBLICATO / (IN_ATTESA_APPROVAZIONE + PUBBLICATO + RIFIUTATO), frazione 0..1 non già in
 * percentuale — null (non 0) quando l'autore non ha mai sottomesso un articolo, da distinguere
 * da 0 ("sottomessi, tutti rifiutati o ancora in coda").
 */
export interface AuthorSummary {
  id: number;
  nome: string;
  cognome: string;
  email: string;
  numeroArticoli: number;
  stato: StatoUtente;
  percentualeApprovazione: number | null;
}

export interface PendingArticle {
  id: number;
  titolo: string;
  autoreNome: string;
  categoriaNome: string | null;
  dataInvio: string;
}

export interface ManagerDashboardStats {
  articoliPubblicati: number;
  inAttesaApprovazione: number;
  autoriAttivi: number;
  categorieTotali: number;
  articoliInCoda: PendingArticle[];
}

/**
 * PuntoAndamentoPubblicazioniDTO (GestioneAutori.andamentoPubblicazioni, RF3.1) — un giorno della
 * serie per il grafico "Andamento pubblicazioni" della Dashboard Manageriale. Array nudo,
 * zero-fill/clamp [1,90] lato server, stesso pattern di PuntoAndamentoVisite.
 */
export interface PuntoAndamentoPubblicazioni {
  data: string;
  numeroPubblicazioni: number;
}

/** PuntoAndamentoCategorieDTO (GestioneAutori.andamentoCategorie, RF3.1) — nuove categorie per giorno, bucket su Categoria.dataCreazione. */
export interface PuntoAndamentoCategorie {
  data: string;
  numeroCategorie: number;
}

/**
 * PuntoAndamentoApprovazioniDTO (GestioneAutori.andamentoApprovazioni, RF3.1) — due serie
 * (approvati/rifiutati) sullo stesso asse temporale, entrambe originate dalla stessa decisione
 * del Manager (approva()/rifiuta()) nello stesso istante.
 */
export interface PuntoAndamentoApprovazioni {
  data: string;
  approvati: number;
  rifiutati: number;
}

/**
 * CategoriaPiuLettaDTO (GestioneAutori.getCategoriePiuLette, RF3.1) — top 10 già ordinate
 * lato server (desc su totaleVisualizzazioni), rollup che include le sottocategorie: nessun
 * sort/limit da rifare qui.
 */
export interface CategoriaPiuLetta {
  categoriaId: number;
  nome: string;
  totaleVisualizzazioni: number;
}
