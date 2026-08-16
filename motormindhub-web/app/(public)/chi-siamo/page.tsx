const INFO_SOCIETARIE = [
  { label: "Ragione sociale", value: "MotorMindHub S.r.l." },
  { label: "Sede legale", value: "Via dell'Innovazione 12, Salerno (IT)" },
  { label: "P.IVA", value: "00000000000" },
  { label: "Contatti", value: "info@motormindhub.com" },
];

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

      <h2 className="font-heading text-lg font-bold text-paper">Informazioni societarie</h2>
      <dl className="mt-4 divide-y divide-paper/10 rounded-lg border border-paper/10">
        {INFO_SOCIETARIE.map(({ label, value }) => (
          <div key={label} className="flex flex-col gap-1 px-5 py-4 sm:flex-row sm:items-center sm:gap-6">
            <dt className="w-40 shrink-0 text-sm text-fog">{label}</dt>
            <dd className="text-sm text-paper">{value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
