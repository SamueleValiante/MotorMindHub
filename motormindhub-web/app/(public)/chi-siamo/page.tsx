export default function ChiSiamoPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <p className="mb-3 flex items-center gap-2 font-heading text-xs font-bold uppercase tracking-wide text-accent">
        <span aria-hidden="true" className="h-px w-6 bg-accent" />
        Chi siamo
      </p>
      <h1 className="font-heading text-3xl font-bold uppercase leading-tight tracking-wide text-paper sm:text-4xl">
        La conoscenza automotive, senza rumore di fondo.
      </h1>
      <p className="mt-4 max-w-xl text-sm text-fog">
        MotorMindHub nasce per centralizzare e rendere accessibile la conoscenza tecnica
        automobilistica, dal guidatore occasionale al professionista meccatronico.
      </p>

      <hr className="my-8 border-paper/10" />

      <p className="max-w-xl text-sm text-fog">
        MotorMindHub è un progetto indipendente, sviluppato e mantenuto come iniziativa
        personale.
        <br />
        Per contatti: supporto@motormindhub.com
      </p>
    </div>
  );
}
