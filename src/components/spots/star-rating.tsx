export function StarDisplay({ value }: { value: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <span
          key={star}
          className={star <= value ? "text-yellow-400" : "text-zinc-300"}
        >
          ★
        </span>
      ))}
    </div>
  );
}

export function StarRating({
  value,
  onChange,
}: {
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      {[1, 2, 3, 4, 5].map((star) => {
        const isFilled = star <= value;

        return (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            className="text-2xl leading-none transition hover:scale-105"
          >
            <span className={isFilled ? "text-yellow-400" : "text-zinc-300"}>
              ★
            </span>
          </button>
        );
      })}

      <span className="ml-2 text-sm font-medium text-zinc-700">
        {value}/5
      </span>
    </div>
  );
}