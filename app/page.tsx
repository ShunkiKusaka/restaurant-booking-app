import Link from "next/link";
import { prisma } from "../lib/prisma.ts";
import { GENRES, formatWeekdays } from "../lib/labels.ts";
import { PageContainer, ui } from "./components/ui.tsx";

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
      <section className="border-b border-line bg-surface">
        <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-14">
          <h1 className="text-2xl font-bold leading-snug text-ink sm:text-4xl">
            空いている時間が、
            <br className="sm:hidden" />
            その場で分かる。
          </h1>
          <p className="mt-3 text-sm text-muted sm:text-base">
            お店と日付を選ぶと、予約できる時間がすぐに表示されます。
          </p>

          <form action="/" method="get" className="mt-6 flex flex-col gap-2 sm:flex-row" role="search">
            <label htmlFor="q" className="sr-only">キーワード</label>
            <input
              id="q"
              name="q"
              defaultValue={q}
              placeholder="店名・エリアで探す(例:渋谷)"
              className={`${ui.input} sm:flex-1`}
            />
            <label htmlFor="genre" className="sr-only">ジャンル</label>
            <select id="genre" name="genre" defaultValue={genre} className={`${ui.input} sm:w-44`}>
              <option value="">すべてのジャンル</option>
              {GENRES.map((g) => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
            <button type="submit" className={ui.btnPrimary}>検索する</button>
          </form>
        </div>
      </section>

      <PageContainer>
        <div className="mb-4 flex items-baseline justify-between gap-4">
          <h2 className={ui.sectionTitle}>
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
          <ul className="grid gap-4 sm:grid-cols-2">
            {restaurants.map((r) => (
              <li key={r.id}>
                <Link
                  href={`/restaurants/${r.id}`}
                  className={`${ui.card} group flex h-full flex-col p-5 transition-colors hover:border-brand`}
                >
                  {r.genre && (
                    <span className="mb-2 self-start rounded-full bg-paper px-2.5 py-0.5 text-xs text-muted">
                      {r.genre}
                    </span>
                  )}
                  <h3 className="text-lg font-bold text-ink group-hover:text-brand">{r.name}</h3>
                  {r.description && (
                    <p className="mt-1 line-clamp-2 text-sm text-muted">{r.description}</p>
                  )}
                  <dl className="mt-4 grid grid-cols-[4.5rem_1fr] gap-y-1 text-sm">
                    <dt className="text-muted">住所</dt>
                    <dd className="text-ink">{r.address}</dd>
                    <dt className="text-muted">受付時間</dt>
                    <dd className="tabular text-ink">{r.openTime}〜{r.lastBookingTime}</dd>
                    <dt className="text-muted">定休日</dt>
                    <dd className="text-ink">{formatWeekdays(r.closedWeekdays)}</dd>
                  </dl>
                  <span className="mt-4 text-sm font-medium text-brand">空き状況を見る</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </PageContainer>
    </>
  );
}
