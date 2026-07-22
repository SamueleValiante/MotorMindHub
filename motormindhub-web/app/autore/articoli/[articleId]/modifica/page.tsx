import { ArticleEditor } from "@/components/articoli/ArticleEditor";

/** Modifica Articolo (mockup 24) — condivide ArticleEditor con la pagina di creazione, il comportamento varia in base allo stato dell'articolo caricato. */
export default async function ModificaArticoloPage({
  params,
}: {
  params: Promise<{ articleId: string }>;
}) {
  const { articleId } = await params;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="font-heading text-xs uppercase tracking-wide text-fog">Area Autore</p>
        <h1 className="font-heading text-2xl font-bold uppercase tracking-wide text-paper sm:text-3xl">
          Modifica Articolo
        </h1>
      </div>

      <ArticleEditor articleId={Number(articleId)} />
    </div>
  );
}
