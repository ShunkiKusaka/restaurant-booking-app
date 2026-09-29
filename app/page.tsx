import Link from "next/link";
import { prisma } from "../lib/prisma.ts";
import { GENRES, formatWeekdays } from "../lib/labels.ts";
import { shortArea } from "../lib/area.ts";
import { PageContainer, ui } from "./components/ui.tsx";
import FoodPattern from "./components/FoodPattern.tsx";
import GenreArt from "./components/GenreArt.tsx";
import { RatingSummary } from "./components/Stars.tsx";

// 見出しの下に並べる、よく使うジャンルのボタン
const QUICK_GENRES = ["焼肉", "寿司", "和食", "イタリアン", "居酒屋", "カフェ"];

function first(v: string | string[] | undefined): string {
  return (Array.isArray(v) ? v[0] : v)?.trim() ?? "";
}

export default async function Home({ searchParams }: PageProps<"/">) {
  const params = await searchParams;
  const q = first(params.q).slice(0, 50);
  const genre = first(params.genre);

  const restaurants = await prisma.restaurant.findMany({
    where: {
      status: "approved",
      ...(genre ? { genre } : {}),
      ...(q
        ? {
            OR: [
              { name: { contains: q, mode: "insensitive" } },
              { description: { contains: q, mode: "insensitive" } },
              { address: { contains: q, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    orderBy: { createdAt: "asc" },
  });

  const searching = Boolean(q || genre);

  return (
    <>
      {/* ---- 見出しと検索 ---- */}
      <section className="relative overflow-hidden border-b-[3px] border-brand bg-hero">
        <FoodPattern />
        <div className="relative mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-16">
          <p className="text-sm font-bold tracking-wider text-brand">今夜のお店、いまから予約</p>
          <h1 className="mt-3 font-display text-3xl leading-snug text-ink sm:text-5xl sm:leading-tight">
            空いている時間が、
            <br />
            その場で分かる。
          </h1>
          <p className="mt-4 text-sm leading-7 text-muted sm:text-base">
            お店と日付を選ぶと、予約できる時間がすぐに表示されます。
          </p>

          <form
            action="/"
            method="get"
            role="search"
            className="mt-6 flex max-w-3xl flex-col gap-2 rounded-lg border border-line bg-surface p-3 sm:flex-row sm:items-end"
          >
            <div className="sm:flex-1">
              <label htmlFor="q" className="mb-1 block text-xs font-bold text-muted">店名・エリア</label>
              <input id="q" name="q" defaultValue={q} placeholder="例:渋谷、焼肉 ひかり" className={`${ui.input} bg-paper`} />
            </div>
            <div className="sm:w-44">
              <label htmlFor="genre" className="mb-1 block text-xs font-bold text-muted">ジャンル</label>
              <select id="genre" name="genre" defaultValue={genre} className={`${ui.input} bg-paper`}>
                <option value="">すべて</option>
                {GENRES.map((g) => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
            </div>
            <button type="submit" className={`${ui.btnPrimary} min-h-12 sm:px-6`}>お店を探す</button>
          </form>

          <ul className="mt-4 flex flex-wrap gap-2" aria-label="ジャンルから探す">
            {QUICK_GENRES.map((g) => {
              const active = genre === g && !q;
              return (
                <li key={g}>
                  <Link
                    href={active ? "/" : `/?genre=${encodeURIComponent(g)}`}
                    aria-current={active ? "true" : undefined}
                    className={`flex min-h-10 items-center rounded-md border px-4 text-sm transition-colors ${
                      active
                        ? "border-brand bg-brand text-white"
                        : "border-line bg-surface text-ink hover:border-brand hover:text-brand"
                    }`}
                  >
                    {g}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      {/* ---- お店の一覧 ---- */}
      <PageContainer>
        <div className="mb-5 flex items-baseline justify-between gap-4">
          <h2 className="font-display text-xl text-ink sm:text-2xl">
            {searching ? `検索結果 ${restaurants.length}件` : "予約できるお店"}
          </h2>
          {searching && (
            <Link href="/" className="text-sm text-muted underline">条件をクリア</Link>
          )}
        </div>

        {restaurants.length === 0 ? (
          <p className="text-sm text-muted">
            {searching ? "条件に合うお店が見つかりませんでした。" : "現在、予約できるお店はありません。"}
          </p>
        ) : (
          <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {restaurants.map((r) => (
              <li key={r.id}>
                <Link
                  href={`/restaurants/${r.id}`}
                  className={`${ui.card} group flex h-full flex-col overflow-hidden transition-shadow hover:shadow-md hover:shadow-brand/10`}
                >
                  <GenreArt genre={r.genre} className="h-36" />
                  <div className="flex flex-1 flex-col gap-1.5 p-4">
                    <div className="flex flex-wrap items-center gap-2">
                      {r.genre && (
                        <span className="rounded bg-brand-soft px-2.5 py-0.5 text-xs font-bold text-brand-dark">
                          {r.genre}
                        </span>
                      )}
                      <span className="text-xs text-muted">{shortArea(r.address)}</span>
                    </div>
                    <h3 className="font-display text-lg text-ink group-hover:text-brand">{r.name}</h3>
                    <RatingSummary average={r.ratingAverage} count={r.reviewCount} />
                    {r.description && (
                      <p className="line-clamp-2 text-sm leading-6 text-muted">{r.description}</p>
                    )}
                    <div className="mt-auto flex items-end justify-between gap-3 pt-3">
                      <p className="text-xs leading-5 text-muted">
                        <span className="tabular">受付 {r.openTime}〜{r.lastBookingTime}</span>
                        <br />
                        定休日 {formatWeekdays(r.closedWeekdays)}
                      </p>
                      <span className="shrink-0 text-sm font-bold text-brand">空き状況を見る →</span>
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </PageContainer>
    </>
  );
}
