import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";

/**
 * Scala tipografica riusata dal resto del sito, non inventata qui: text-2xl
 * è già la dimensione degli h1 di pagina (es. app/autore/page.tsx), text-xl
 * quella di sotto-titoli/h1 secondari (es. PublicProfileContent.tsx) - un
 * intero gradino Tailwind tra h2/h3 (24px/20px, non 20px/18px come nella
 * prima versione) li rende visivamente distinguibili, dove prima erano
 * troppo vicini per leggersi come una gerarchia reale. h1 dell'articolo
 * (text-3xl sm:text-4xl, invariato) resta sopra entrambi.
 *
 * p/strong/em non hanno bisogno di uno stile esplicito qui: ereditano
 * color/font-size/line-height dal wrapper del chiamante per normale
 * cascata CSS - aggiungere qui una regola identica sarebbe ridondante.
 * alt e' obbligatorio lato editor (InsertImageAltModal), quindi qui non
 * serve un fallback per le immagini.
 */
const markdownComponents: Components = {
  h2: ({ children }) => (
    <h2 className="mt-8 font-heading text-2xl font-bold uppercase tracking-wide text-paper">{children}</h2>
  ),
  h3: ({ children }) => (
    <h3 className="mt-6 font-heading text-xl font-bold uppercase tracking-wide text-paper">{children}</h3>
  ),
  img: ({ src, alt }) => (
    // eslint-disable-next-line @next/next/no-img-element -- URL Cloudinary arbitraria inserita dall'autore, stesso pattern della copertina
    <img src={typeof src === "string" ? src : undefined} alt={alt ?? ""} className="my-2 w-full rounded-lg" />
  ),
};

/**
 * Rendering Markdown del corpo articolo (Articolo.testo), condiviso tra
 * ArticleDetailContent.tsx (lettura pubblica) e la pagina di revisione
 * Manager (app/manager/articoli-in-attesa/[articleId]/page.tsx): il
 * Manager deve vedere esattamente l'articolo come apparirà pubblicato,
 * non un'approssimazione in testo semplice - un secondo rendering
 * indipendente (quello che c'era prima) rischia di disallinearsi silenziosamente
 * ogni volta che questo si evolve, esattamente quanto successo qui.
 */
export function ArticleMarkdownBody({ testo }: { testo: string }) {
  return (
    <div data-testid="articolo-corpo" className="text-base leading-loose text-paper [&_p+p]:mt-6">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
        {testo}
      </ReactMarkdown>
    </div>
  );
}
