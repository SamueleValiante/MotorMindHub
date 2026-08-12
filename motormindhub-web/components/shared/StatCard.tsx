interface StatCardProps {
  value: number | string;
  label: string;
  variant?: "accent" | "critical" | "default";
}

const valueClassNameByVariant: Record<NonNullable<StatCardProps["variant"]>, string> = {
  accent: "text-accent",
  critical: "text-ember",
  default: "text-paper",
};

export function StatCard({ value, label, variant = "default" }: StatCardProps) {
  return (
    <div className="rounded-lg bg-carbon p-6">
      <p className={`font-heading text-3xl font-bold ${valueClassNameByVariant[variant]}`}>{value}</p>
      <p className="mt-1 text-sm uppercase tracking-wide text-fog">{label}</p>
    </div>
  );
}
