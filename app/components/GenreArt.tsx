// お店の写真がないときに表示する、ジャンルごとのイラスト。
// 写真を登録できるようにしたら、写真があるお店は写真を優先して表示する。

type Art = { bg: string; paths: string[]; circles?: [number, number, number][] };

const WARM = "bg-[#f3dcd3]";
const WHEAT = "bg-[#efe3cc]";
const STONE = "bg-[#e9e3d4]";

const ARTS: Record<string, Art> = {
  和食: { bg: STONE, paths: ["M12 32h40a20 20 0 0 1-40 0z", "M34 10l14 16M40 7l13 15"] },
  寿司: { bg: STONE, paths: ["M14 36h36a7 7 0 0 1 0 14H14a7 7 0 0 1 0-14z", "M10 38c6-14 38-14 44 0", "M30 30v20"] },
  焼肉: { bg: WARM, paths: ["M16 30h32M13 38h38M16 46h32", "M26 8c0 4 4 4 4 8M36 6c0 4 4 4 4 8"], circles: [[32, 36, 20]] },
  居酒屋: { bg: WARM, paths: ["M16 20h26v30a4 4 0 0 1-4 4H20a4 4 0 0 1-4-4z", "M42 26h5a4 4 0 0 1 4 4v10a4 4 0 0 1-4 4h-5", "M16 20c0-6 26-6 26 0"] },
  フレンチ: { bg: WHEAT, paths: ["M22 10h20c0 14-4 22-10 22s-10-8-10-22z", "M32 32v18", "M24 52h16"] },
  イタリアン: {
    bg: WHEAT,
    paths: ["M10 16c14-7 32-3 44 8L28 56z", "M10 16l18 40"],
    circles: [[30, 28, 3.5], [38, 38, 3], [27, 42, 2.5]],
  },
  中華: { bg: WARM, paths: ["M10 40c0-12 10-20 22-20s22 8 22 20z", "M24 23c1 4 1 8 0 12M32 20v15M40 23c-1 4-1 8 0 12"] },
  カフェ: { bg: WHEAT, paths: ["M14 24h30v14a10 10 0 0 1-10 10h-10a10 10 0 0 1-10-10z", "M44 28h4a6 6 0 0 1 0 12h-4", "M24 16c0-3 3-3 3-6M33 16c0-3 3-3 3-6"] },
  バー: { bg: STONE, paths: ["M14 14h36L32 34z", "M32 34v16", "M24 52h16", "M40 8l-5 10"] },
};

const DEFAULT_ART: Art = { bg: STONE, paths: ["M24 10v12a4 4 0 0 0 8 0V10M28 10v44", "M42 10c6 5 6 16 0 20v24"] };

export default function GenreArt({
  genre,
  className = "",
  size = 72,
}: {
  genre: string | null;
  className?: string;
  size?: number;
}) {
  const art = (genre && ARTS[genre]) || DEFAULT_ART;
  return (
    <div aria-hidden="true" className={`flex items-center justify-center ${art.bg} ${className}`}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 64 64"
        fill="none"
        stroke="var(--color-brand)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {art.circles?.map(([cx, cy, r]) => <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r={r} />)}
        {art.paths.map((d) => <path key={d} d={d} />)}
      </svg>
    </div>
  );
}
