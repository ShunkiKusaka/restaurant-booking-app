// 食べ物のアイコン(どんぶり、コーヒー、フォークとナイフ、おにぎり)を薄く並べた背景。
// 親要素に relative と overflow-hidden を付けて、その中に置く。
export default function FoodPattern({ id = "food-pattern" }: { id?: string }) {
  return (
    <svg aria-hidden="true" className="pointer-events-none absolute inset-0 h-full w-full">
      <defs>
        <pattern id={id} width="120" height="120" patternUnits="userSpaceOnUse" patternTransform="rotate(-12)">
          <g
            fill="none"
            stroke="var(--color-pattern)"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            {/* どんぶりと箸 */}
            <path d="M10 26h30a15 15 0 0 1-30 0z" />
            <path d="M28 10l14 12M33 7l13 11" />
            {/* コーヒー */}
            <path d="M72 22h22v12a9 9 0 0 1-9 9h-4a9 9 0 0 1-9-9z" />
            <path d="M94 26h3a5 5 0 0 1 0 10h-3" />
            <path d="M78 14c0-3 3-3 3-6M86 14c0-3 3-3 3-6" />
            {/* フォークとナイフ */}
            <path d="M20 66v10a4 4 0 0 0 8 0V66M24 66v30" />
            <path d="M38 66c6 4 6 14 0 17v13" />
            {/* おにぎり */}
            <path d="M86 68l14 24H72z" />
            <path d="M80 84h12v8H80z" />
          </g>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${id})`} />
    </svg>
  );
}
