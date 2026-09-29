// 星の表示。0.1刻みの平均点も、星の塗りの幅で表す。

const STAR_PATH =
  "M12 2.8l2.8 5.8 6.3.9-4.6 4.4 1.1 6.3L12 17.2l-5.6 3 1.1-6.3-4.6-4.4 6.3-.9z";

function StarRow({ className }: { className: string }) {
  return (
    <span className={`flex ${className}`}>
      {[0, 1, 2, 3, 4].map((i) => (
        <svg key={i} viewBox="0 0 24 24" className="h-[1em] w-[1em] shrink-0" fill="currentColor">
          <path d={STAR_PATH} />
        </svg>
      ))}
    </span>
  );
}

/** 星5つの表示(value は 0〜5) */
export function Stars({ value, className = "" }: { value: number; className?: string }) {
  const percent = Math.max(0, Math.min(5, value)) * 20;
  return (
    <span className={`relative inline-flex align-[-0.125em] ${className}`}>
      <span aria-hidden="true">
        <StarRow className="text-line" />
      </span>
      <span aria-hidden="true" className="absolute inset-0 overflow-hidden" style={{ width: `${percent}%` }}>
        <StarRow className="text-accent" />
      </span>
      <span className="sr-only">5点中{value.toFixed(1)}点</span>
    </span>
  );
}

/** 一覧のカード用:「★★★★☆ 4.2(18件)」。口コミがなければ、その旨を出す */
export function RatingSummary({
  average,
  count,
  className = "",
}: {
  average: number;
  count: number;
  className?: string;
}) {
  if (count === 0) {
    return <p className={`text-xs text-muted ${className}`}>口コミはまだありません</p>;
  }
  return (
    <p className={`flex items-center gap-1.5 text-sm ${className}`}>
      <Stars value={average} />
      <span className="tabular font-bold text-ink">{average.toFixed(1)}</span>
      <span className="tabular text-xs text-muted">({count}件)</span>
    </p>
  );
}
