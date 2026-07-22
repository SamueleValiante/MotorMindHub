import { ArticleEditor } from "@/components/articoli/ArticleEditor";

/** Nuovo Articolo (mockup 23). */
export default function NuovoArticoloPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="font-heading text-xs uppercase tracking-wide text-fog">Area Autore</p>
        <h1 className="font-heading text-2xl font-bold uppercase tracking-wide text-paper sm:text-3xl">
          Nuovo Articolo
        </h1>
      </div>

      <ArticleEditor articleId={null} />
    </div>
  );
}
