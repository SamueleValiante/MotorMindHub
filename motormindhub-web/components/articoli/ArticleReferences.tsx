import type { ArticleDetail } from "@/lib/articoli/types";

function formatData(iso: string): string {
  return new Date(iso).toLocaleDateString("it-IT", { day: "numeric", month: "long", year: "numeric" });
}

/**
 * Riferimenti e note legali in calce a ogni articolo (pagina pubblica e
 * anteprima Manager, via ArticleView). Testo uguale per tutti: marchi
 * di terzi, uso informativo, verifica dei dati con la documentazione
 * ufficiale. Non elenca fonti per articolo perché il modello dati non le
 * prevede: nessuna fonte inventata.
 */
export function ArticleReferences({ articolo }: { articolo: ArticleDetail }) {
  return (
    <aside
      data-testid="articolo-riferimenti"
      aria-labelledby="riferimenti-titolo"
      className="mt-12 rounded-lg border border-paper/10 bg-carbon p-6"
    >
      <h2 id="riferimenti-titolo" className="font-heading text-sm font-bold uppercase tracking-wide text-paper">
        Riferimenti e note legali
      </h2>

      <dl className="mt-4 grid gap-4 text-sm leading-relaxed text-fog sm:grid-cols-[10rem_1fr]">
        <dt className="font-heading text-xs font-semibold uppercase tracking-wide text-chrome">Autore</dt>
        <dd>
          {articolo.autoreNome} · pubblicato il {formatData(articolo.dataCreazione)}, ultimo aggiornamento il{" "}
          {formatData(articolo.dataUltimoAggiornamento)}.
        </dd>

        <dt className="font-heading text-xs font-semibold uppercase tracking-wide text-chrome">Fonti di riferimento</dt>
        <dd>
          Documentazione e comunicati ufficiali del costruttore ({articolo.categoriaNome}), manuali d&apos;uso e
          manutenzione, listini e dati pubblici di settore. Per valori tecnici, prezzi e disponibilità fa fede
          sempre la documentazione ufficiale più recente.
        </dd>

        <dt className="font-heading text-xs font-semibold uppercase tracking-wide text-chrome">Marchi</dt>
        <dd>
          Marchi, nomi di modelli e loghi citati appartengono ai rispettivi titolari e sono usati a solo scopo
          informativo. MotorMindHub non è affiliato né sponsorizzato dai costruttori citati.
        </dd>

        <dt className="font-heading text-xs font-semibold uppercase tracking-wide text-chrome">Avvertenze</dt>
        <dd>
          Contenuto a carattere informativo, non sostituisce il parere di un tecnico qualificato. Prima di
          interventi su sicurezza, freni, impianto elettrico o sistemi ad alta tensione rivolgersi a
          un&apos;officina autorizzata.
        </dd>

        <dt className="font-heading text-xs font-semibold uppercase tracking-wide text-chrome">Diritti</dt>
        <dd>
          Testi e impaginazione © MotorMindHub. Le immagini restano di proprietà dei rispettivi autori. Chi ritiene
          che un contenuto violi i propri diritti può segnalarlo e lo faremo verificare e, se dovuto, rimuovere.
        </dd>
      </dl>
    </aside>
  );
}
