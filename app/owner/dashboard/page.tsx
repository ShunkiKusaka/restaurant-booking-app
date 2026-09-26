import Link from "next/link";
import { prisma } from "../../../lib/prisma.ts";
import { requireOwner } from "../../../lib/owner.ts";
import { parseJstDateTime, todayJst, toJstTimeString } from "../../../lib/datetime.ts";
import { addDays, SEAT_OCCUPYING_STATUSES } from "../../../lib/booking.ts";
import { formatWeekdays } from "../../../lib/labels.ts";
import { Notice, PageContainer, RestaurantStatusBadge, ui } from "../../components/ui.tsx";

export default async function OwnerDashboard({ searchParams }: PageProps<"/owner/dashboard">) {
  // ログインしてない、または owner じゃない場合ははじく
  const user = await requireOwner();
  const { created } = await searchParams;

  const today = todayJst();
  const dayStart = parseJstDateTime(today, "00:00")!;
  const dayEnd = parseJstDateTime(addDays(today, 1), "00:00")!;

  const [restaurants, todays] = await Promise.all([
    prisma.restaurant.findMany({
      where: { ownerId: user.id },
      orderBy: { createdAt: "asc" },
    }),
    // 今日の予約(席を使うものだけ)
    prisma.reservation.findMany({
      where: {
        restaurant: { ownerId: user.id },
        status: { in: SEAT_OCCUPYING_STATUSES },
        reservationDate: { gte: dayStart, lt: dayEnd },
      },
      select: { restaurantId: true, numberOfGuests: true, reservationDate: true, status: true },
      orderBy: { reservationDate: "asc" },
    }),
  ]);

  const now = Date.now();

  return (
    <PageContainer>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-ink">店舗管理</h1>
        <Link href="/owner/restaurants/new" className={ui.btnPrimary}>+ 店舗を登録</Link>
      </div>

      {created === "1" && (
        <div className="mt-4">
          <Notice>
            店舗を登録しました。運営の審査が終わると、予約の受付が始まります。
            審査の間に、「予約の設定」で営業時間や定休日を設定しておいてください。
          </Notice>
        </div>
      )}

      {restaurants.length === 0 ? (
        <p className="mt-8 text-sm text-muted">まだ店舗が登録されていません。</p>
      ) : (
        <ul className="mt-6 grid gap-4 md:grid-cols-2">
          {restaurants.map((r) => {
            const mine = todays.filter((t) => t.restaurantId === r.id);
            const groups = mine.length;
            const guests = mine.reduce((sum, t) => sum + t.numberOfGuests, 0);
            const next = mine.find((t) => t.status === "confirmed" && t.reservationDate.getTime() >= now);
            return (
              <li key={r.id} className={`${ui.card} flex flex-col p-5`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="truncate text-lg font-bold text-ink">{r.name}</h2>
                    <p className="text-sm text-muted">
                      {r.genre ? `${r.genre} ／ ` : ""}{r.seatCount}席 ／ 定休日 {formatWeekdays(r.closedWeekdays)}
                    </p>
                  </div>
                  <RestaurantStatusBadge status={r.status} />
                </div>

                <dl className="mt-4 grid grid-cols-3 gap-2 rounded-lg bg-paper p-3 text-center">
                  <div>
                    <dt className="text-xs text-muted">今日の予約</dt>
                    <dd className="tabular text-xl font-bold text-ink">{groups}<span className="ml-0.5 text-xs font-normal">組</span></dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted">人数</dt>
                    <dd className="tabular text-xl font-bold text-ink">{guests}<span className="ml-0.5 text-xs font-normal">名</span></dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted">次の来店</dt>
                    <dd className="tabular text-xl font-bold text-ink">
                      {next ? toJstTimeString(next.reservationDate) : "―"}
                    </dd>
                  </div>
                </dl>

                <div className="mt-4 flex flex-wrap gap-2">
                  <Link href={`/owner/restaurants/${r.id}/reservations`} className={ui.btnPrimary}>予約台帳</Link>
                  <Link href={`/owner/restaurants/${r.id}/reservations/new`} className={ui.btnSecondary}>電話予約を登録</Link>
                  <Link href={`/owner/restaurants/${r.id}/settings`} className={ui.btnSecondary}>予約の設定</Link>
                </div>
                <Link href={`/restaurants/${r.id}`} className="mt-3 text-xs text-muted underline">
                  お客さんから見たページを確認する
                </Link>
                {r.status === "rejected" && (
                  <p className="mt-3 text-xs text-danger">
                    審査で却下されました。内容を見直して、運営にお問い合わせください。
                  </p>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </PageContainer>
  );
}
