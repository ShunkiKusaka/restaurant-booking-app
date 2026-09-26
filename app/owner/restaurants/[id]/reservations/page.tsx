import Link from "next/link";
import { prisma } from "../../../../../lib/prisma.ts";
import { getOwnedRestaurant } from "../../../../../lib/owner.ts";
import { parseJstDateTime, todayJst, toJstTimeString } from "../../../../../lib/datetime.ts";
import {
  SEAT_OCCUPYING_STATUSES,
  addDays,
  isClosedDay,
  occupancyAt,
  slotTimes,
  weekdayOf,
} from "../../../../../lib/booking.ts";
import { SOURCE_LABELS, WEEKDAY_LABELS, label } from "../../../../../lib/labels.ts";
import { formatReservationCode } from "../../../../../lib/reservation-code.ts";
import { updateReservationStatus } from "../../../../owner/owner-actions.ts";
import { Notice, PageContainer, ReservationStatusBadge, RestaurantStatusBadge, ui } from "../../../../components/ui.tsx";
import ConfirmButton from "../../../../components/ConfirmButton.tsx";

function first(v: string | string[] | undefined): string {
  return (Array.isArray(v) ? v[0] : v) ?? "";
}

export default async function LedgerPage({ params, searchParams }: PageProps<"/owner/restaurants/[id]/reservations">) {
  const { id } = await params;
  const sp = await searchParams;
  const { restaurant } = await getOwnedRestaurant(id);

  const today = todayJst();
  const dateParam = first(sp.date);
  const date = /^\d{4}-\d{2}-\d{2}$/.test(dateParam) && parseJstDateTime(dateParam, "00:00") ? dateParam : today;
  const dayStart = parseJstDateTime(date, "00:00")!;
  const dayEnd = parseJstDateTime(addDays(date, 1), "00:00")!;

  const reservations = await prisma.reservation.findMany({
    where: { restaurantId: restaurant.id, reservationDate: { gte: dayStart, lt: dayEnd } },
    include: { user: { select: { name: true, email: true } } },
    orderBy: [{ reservationDate: "asc" }, { createdAt: "asc" }],
  });

  const active = reservations.filter((r) => SEAT_OCCUPYING_STATUSES.includes(r.status));
  const totalGuests = active.reduce((s, r) => s + r.numberOfGuests, 0);
  const cancelled = reservations.filter((r) => r.status === "cancelled").length;
  const noShow = reservations.filter((r) => r.status === "no_show").length;

  // 時間帯ごとの席の埋まり具合(その時刻に座っている人数)
  const booked = active.map((r) => ({ start: r.reservationDate, guests: r.numberOfGuests }));
  const timeline = slotTimes(restaurant.openTime, restaurant.lastBookingTime).map((t) => {
    const at = parseJstDateTime(date, t)!;
    const seated = occupancyAt(booked, at.getTime(), restaurant.stayMinutes);
    return { time: t, seated, ratio: Math.min(1, seated / restaurant.seatCount) };
  });

  const [, m, d] = date.split("-").map(Number);
  const closed = isClosedDay(restaurant, date);
  const nav = (target: string) => `/owner/restaurants/${restaurant.id}/reservations?date=${target}`;

  return (
    <PageContainer>
      <Link href="/owner/dashboard" className="text-sm text-muted hover:text-ink">← 店舗管理</Link>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-ink">予約台帳</h1>
          <RestaurantStatusBadge status={restaurant.status} />
        </div>
        <Link href={`/owner/restaurants/${restaurant.id}/reservations/new?date=${date}`} className={ui.btnPrimary}>
          + 電話予約を登録
        </Link>
      </div>
      <p className="mt-1 text-sm text-muted">{restaurant.name}(全{restaurant.seatCount}席)</p>

      {first(sp.added) === "1" && (
        <div className="mt-4"><Notice>電話予約を登録しました。</Notice></div>
      )}

      {/* ---- 日付の移動 ---- */}
      <div className="mt-6 flex flex-wrap items-center gap-2">
        <Link href={nav(addDays(date, -1))} className={ui.btnSecondary} aria-label="前の日">‹ 前日</Link>
        <Link href={nav(today)} className={ui.btnSecondary}>今日</Link>
        <Link href={nav(addDays(date, 1))} className={ui.btnSecondary} aria-label="次の日">翌日 ›</Link>
        <form action={`/owner/restaurants/${restaurant.id}/reservations`} method="get" className="flex items-center gap-2">
          <label htmlFor="date" className="sr-only">日付を選ぶ</label>
          <input id="date" type="date" name="date" defaultValue={date} className="rounded-lg border border-line bg-surface px-2 py-2 text-sm" />
          <button type="submit" className="text-sm text-brand underline">移動</button>
        </form>
      </div>

      <h2 className="mt-6 text-xl font-bold text-ink">
        {m}月{d}日({WEEKDAY_LABELS[weekdayOf(date)]})
        {date === today && <span className="ml-2 align-middle text-sm font-normal text-brand">今日</span>}
        {closed && <span className="ml-2 align-middle text-sm font-normal text-muted">定休日</span>}
      </h2>

      {/* ---- その日のまとめ ---- */}
      <dl className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { k: "予約", v: active.length, u: "組" },
          { k: "人数", v: totalGuests, u: "名" },
          { k: "キャンセル", v: cancelled, u: "組" },
          { k: "無断キャンセル", v: noShow, u: "組" },
        ].map((s) => (
          <div key={s.k} className={`${ui.card} p-4`}>
            <dt className="text-xs text-muted">{s.k}</dt>
            <dd className="tabular mt-1 text-2xl font-bold text-ink">
              {s.v}<span className="ml-0.5 text-sm font-normal text-muted">{s.u}</span>
            </dd>
          </div>
        ))}
      </dl>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_17rem]">
        {/* ---- 予約の一覧 ---- */}
        <section aria-labelledby="list-title">
          <h3 id="list-title" className={`${ui.sectionTitle} mb-3`}>予約一覧</h3>
          {reservations.length === 0 ? (
            <p className="text-sm text-muted">この日の予約はありません。</p>
          ) : (
            <ul className="space-y-2">
              {reservations.map((r) => {
                const name = r.user?.name ?? r.guestName ?? "(名前なし)";
                const dim = r.status === "cancelled" || r.status === "no_show";
                return (
                  <li key={r.id} className={`${ui.card} p-4 ${dim ? "opacity-60" : ""}`}>
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="flex items-start gap-4">
                        <p className="tabular w-14 shrink-0 text-lg font-bold text-ink">
                          {toJstTimeString(r.reservationDate)}
                        </p>
                        <div className="min-w-0">
                          <p className="font-medium text-ink">
                            {name} 様
                            <span className="ml-2 text-sm font-normal text-muted">{r.numberOfGuests}名</span>
                          </p>
                          <p className="mt-0.5 text-xs text-muted">
                            <span className="mr-2 rounded bg-paper px-1.5 py-0.5">{label(SOURCE_LABELS, r.source)}</span>
                            <span className="tabular">No.{formatReservationCode(r.code)}</span>
                            {r.guestPhone && (
                              <a href={`tel:${r.guestPhone}`} className="tabular ml-2 underline">{r.guestPhone}</a>
                            )}
                          </p>
                          {(r.occasion || r.note) && (
                            <p className="mt-2 whitespace-pre-line rounded bg-paper px-2 py-1.5 text-sm text-ink">
                              {r.occasion && <span className="mr-2 font-medium">【{r.occasion}】</span>}
                              {r.note}
                            </p>
                          )}
                        </div>
                      </div>
                      <ReservationStatusBadge status={r.status} />
                    </div>

                    <div className="mt-3 flex flex-wrap justify-end gap-2">
                      {r.status === "confirmed" ? (
                        <>
                          <form action={updateReservationStatus.bind(null, r.id, "completed")}>
                            <button type="submit" className={`${ui.btnPrimary} px-3 py-1.5`}>来店</button>
                          </form>
                          <form action={updateReservationStatus.bind(null, r.id, "no_show")}>
                            <ConfirmButton
                              message={`${name} 様を「無断キャンセル」にします。よろしいですか?`}
                              className={`${ui.btnSecondary} px-3 py-1.5`}
                            >
                              無断キャンセル
                            </ConfirmButton>
                          </form>
                          <form action={updateReservationStatus.bind(null, r.id, "cancelled")}>
                            <ConfirmButton
                              message={`${name} 様の予約をキャンセルします。よろしいですか?`}
                              className={`${ui.btnDanger} px-3 py-1.5`}
                            >
                              キャンセル
                            </ConfirmButton>
                          </form>
                        </>
                      ) : (
                        <form action={updateReservationStatus.bind(null, r.id, "confirmed")}>
                          <button type="submit" className="text-sm text-muted underline">予約確定に戻す</button>
                        </form>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {/* ---- 時間帯ごとの混み具合 ---- */}
        <section aria-labelledby="timeline-title" className={`${ui.card} h-fit p-4`}>
          <h3 id="timeline-title" className={ui.sectionTitle}>時間帯ごとの席の埋まり</h3>
          <p className="mt-1 text-xs text-muted">その時刻に座っている人数(滞在{restaurant.stayMinutes}分で計算)</p>
          <ul className="mt-3 space-y-1.5">
            {timeline.map((t) => (
              <li key={t.time} className="grid grid-cols-[3rem_1fr_4.5rem] items-center gap-2 text-xs">
                <span className="tabular text-muted">{t.time}</span>
                <span
                  className="h-3 overflow-hidden rounded bg-paper"
                  title={`${t.time} ${t.seated}/${restaurant.seatCount}席`}
                >
                  <span
                    className="block h-full rounded bg-brand"
                    style={{ width: `${Math.round(t.ratio * 100)}%` }}
                  />
                </span>
                <span className="tabular text-right text-ink">
                  {t.seated}/{restaurant.seatCount}席
                </span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </PageContainer>
  );
}
