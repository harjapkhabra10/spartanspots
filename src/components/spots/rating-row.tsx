export function RatingRow({
  label,
  value,
}: {
  label: string;
  value: number | null;
}) {
  const percentage = value ? (value / 5) * 100 : 0;

  return (
    <div className="grid gap-2 sm:grid-cols-[120px_1fr_40px] sm:items-center">
      <p className="text-sm text-zinc-600">{label}</p>

      <div className="h-2 rounded-full bg-zinc-200">
        <div
          className="h-2 rounded-full bg-emerald-700"
          style={{ width: `${percentage}%` }}
        />
      </div>

      <p className="text-sm font-medium text-zinc-900">
        {value ? value.toFixed(1) : "-"}
      </p>
    </div>
  );
}