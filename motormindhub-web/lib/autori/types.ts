export type StatoUtente = "NON_VERIFICATO" | "ATTIVO" | "SOSPESO" | "CANCELLATO";

export interface AuthorSummary {
  id: number;
  nome: string;
  cognome: string;
  email: string;
  numeroArticoli: number;
  stato: StatoUtente;
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
