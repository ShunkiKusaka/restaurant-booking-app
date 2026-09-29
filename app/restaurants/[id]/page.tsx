import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "../../../auth.ts";
import { prisma } from "../../../lib/prisma.ts";
import { todayJst } from "../../../lib/datetime.ts";
import {
  BOOKING_WINDOW_DAYS,
  SEAT_OCCUPYING_STATUSES,
  addDays,
  dayQueryRange,
  getDaySlots,
  isClosedDay,
  weekdayOf,
} from "../../../lib/booking.ts";
import { WEEKDAY_LABELS, formatWeekdays } from "../../../lib/labels.ts";
import { shortArea } from "../../../lib/area.ts";
import { Notice, PageContainer, ui } from "../../components/ui.tsx";
import GenreArt from "../../components/GenreArt.tsx";

const DATE_CHIPS = 14;

function first(v: string | string[] | undefined): string {
  return (Array.isArray(v) ? v[0] : v) ?? "";
}

export default async function RestaurantPage({ params, searchParams }: PageProps<"/restaurants/[id]">) {
  const { id } = await params;
  const sp = await searchParams;
  const session = await auth();

  const restaurant = await prisma.restaurant.findUnique({ where: { id } });
  if (!restaurant) notFound();

  // 公開前の店舗は、オーナー本人だけが確認用に見られる
  const isOwnerPreview = session?.user?.id === restaurant.ownerId;
  if (restaurant.status !== "approved" && !isOwnerPreview) notFound();

  const today = todayJst();
  const maxParty = Math.min(restaurant.maxPartySize, restaurant.seatCount);

  // 日付:指定がなければ、今日以降で最初の営業日
  let date = first(sp.date);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || date < today || date > addDays(today, BOOKING_WINDOW_DAYS)) {
    date = today;
    for (let i = 0; i < 7 && isClosedDay(restaurant, date); i++) date = addDays(date, 1);
  }
  const guestsParam = Number(first(sp.guests));
  const guests = Number.isInteger(guestsParam) && guestsParam >= 1 && guestsParam <= maxParty
    ? guestsParam
    : Math.min(2, maxParty);

  const existing = await prisma.reservation.findMany({
    where: {
      restaurantId: restaurant.id,
      status: { in: SEAT_OCCUPYING_STATUSES },
      reservationDate: dayQueryRange(restaurant, date),
    },
    select: { reservationDate: true, numberOfGuests: true },
  });
  const { closed, slots } = getDaySlots(
    restaurant,
    date,
    guests,
    existing.map((r) => ({ start: r.reservationDate, guests: r.numberOfGuests })),
    new Date()
  );
  const availableCount = slots.filter((s) => s.status === "available").length;

  const chips = Array.from({ length: DATE_CHIPS }, (_, i) => {
    const d = addDays(today, i);
    return { date: d, closed: isClosedDay(restaurant, d), weekday: weekdayOf(d) };
  });
  const [, selMonth, selDay] = date.split("-").map(Number);

  return (
    <PageContainer>
      <Link href="/" className="text-sm text-muted hover:text-ink">← お店一覧に戻る</Link>

      {isOwnerPreview && restaurant.status !== "approved" && (
        <div className="mt-4">
          <Notice tone="info">
            このページは、公開前の確認用です。運営の審査が終わると、お客さんが予約できるようになります。
          </Notice>
        </div>
      )}

      <div className="mt-4 grid gap-8 lg:grid-cols-[1fr_20rem]">
        <div>
          <GenreArt genre={restaurant.genre} size={96} className="mb-5 h-40 rounded-lg sm:h-52" />
          <div className="flex flex-wrap items-center gap-2">
            {restaurant.genre && (
              <span className="rounded bg-brand-soft px-2.5 py-0.5 text-xs font-bold text-brand-dark">
                {restaurant.genre}
              </span>
            )}
            <span className="text-xs text-muted">{shortArea(restaurant.address)}</span>
          </div>
          <h1 className="mt-2 font-display text-3xl text-ink sm:text-4xl">{restaurant.name}</h1>
          {restaurant.description && (
            <p className="mt-3 whitespace-pre-line text-sm leading-7 text-muted">{restaurant.description}</p>
          )}

          {/* ---- 予約の条件を選ぶ ---- */}
          <section aria-labelledby="booking-title" className={`${ui.card} mt-8 p-5 sm:p-6`}>
            <h2 id="booking-title" className={ui.sectionTitle}>空き状況から予約する</h2>

            <form action={`/restaurants/${restaurant.id}`} method="get" className="mt-4 flex flex-wrap items-end gap-2">
              <input type="hidden" name="date" value={date} />
              <div>
                <label htmlFor="guests" className={ui.label}>人数</label>
                <select id="guests" name="guests" defaultValue={guests} className={`${ui.input} w-32`}>
                  {Array.from({ length: maxParty }, (_, i) => i + 1).map((n) => (
                    <option key={n} value={n}>{n}名</option>
                  ))}
                </select>
              </div>
              <button type="submit" className={ui.btnSecondary}>人数を変更</button>
            </form>
            {restaurant.maxPartySize < restaurant.seatCount && (
              <p className="mt-2 text-xs text-muted">
                {restaurant.maxPartySize + 1}名以上のご予約は、お電話({restaurant.phoneNumber})でご相談ください。
              </p>
            )}

            <h3 className="mt-6 mb-2 text-sm font-medium text-ink">日付</h3>
            <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-2">
              {chips.map((c) => {
                const [, m, d] = c.date.split("-").map(Number);
                const selected = c.date === date;
                const weekdayColor = c.weekday === 0 ? "text-danger" : c.weekday === 6 ? "text-sky-700" : "";
                if (c.closed) {
                  return (
                    <span
                      key={c.date}
                      aria-disabled="true"
                      className="flex w-14 shrink-0 flex-col items-center rounded-lg border border-dashed border-line bg-paper py-2 text-xs text-muted"
                    >
                      <span className="tabular">{m}/{d}</span>
                      <span>休</span>
                    </span>
                  );
                }
                return (
                  <Link
                    key={c.date}
                    href={`/restaurants/${restaurant.id}?date=${c.date}&guests=${guests}`}
                    aria-current={selected ? "date" : undefined}
                    scroll={false}
                    className={`flex w-14 shrink-0 flex-col items-center rounded-lg border py-2 text-xs transition-colors ${
                      selected
                        ? "border-brand bg-brand text-white"
                        : "border-line bg-surface text-ink hover:border-brand"
                    }`}
                  >
                    <span className="tabular font-medium">{m}/{d}</span>
                    <span className={selected ? "" : weekdayColor}>{WEEKDAY_LABELS[c.weekday]}</span>
                  </Link>
                );
              })}
            </div>
            <form action={`/restaurants/${restaurant.id}`} method="get" className="mt-2 flex flex-wrap items-center gap-2 text-sm">
              <input type="hidden" name="guests" value={guests} />
              <label htmlFor="other-date" className="text-muted">ほかの日付</label>
              <input
                id="other-date"
                type="date"
                name="date"
                defaultValue={date}
                min={today}
                max={addDays(today, BOOKING_WINDOW_DAYS)}
                className="rounded-lg border border-line bg-surface px-2 py-1.5 text-sm"
              />
              <button type="submit" className="text-brand underline">表示</button>
            </form>

            <h3 className="mt-6 mb-2 text-sm font-medium text-ink">
              {selMonth}月{selDay}日({WEEKDAY_LABELS[weekdayOf(date)]})・{guests}名の空き状況
            </h3>
            {closed ? (
              <Notice tone="info">この日は定休日です。別の日付をお選びください。</Notice>
            ) : slots.length === 0 ? (
              <Notice tone="info">この日は予約を受け付けていません。</Notice>
            ) : (
              <>
                <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                  {slots.map((s) => (
                    <li key={s.time}>
                      {s.status === "available" ? (
                        <Link
                          href={`/restaurants/${restaurant.id}/reserve?date=${date}&time=${s.time}&guests=${guests}`}
                          className={`flex min-h-14 flex-col items-center justify-center rounded-lg border border-brand py-2 transition-colors hover:bg-brand hover:text-white ${
                            s.remainingSeats <= 6 ? "bg-brand-soft text-brand-dark" : "bg-surface text-brand"
                          }`}
                        >
                          <span className="tabular text-base font-bold">{s.time}</span>
                          <span className="text-xs">{s.remainingSeats <= 6 ? `残り${s.remainingSeats}席` : "空きあり"}</span>
                        </Link>
                      ) : (
                        <span
                          aria-disabled="true"
                          className="flex min-h-14 flex-col items-center justify-center rounded-lg border border-line bg-paper py-2 text-muted"
                        >
                          <span className="tabular text-base">{s.time}</span>
                          <span className="text-xs">{s.status === "full" ? "満席" : "受付終了"}</span>
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
                {availableCount === 0 && (
                  <p className="mt-3 text-sm text-muted">この日は、{guests}名で予約できる時間がありません。</p>
                )}
              </>
            )}
          </section>
        </div>

        {/* ---- 店舗情報 ---- */}
        <aside className={`${ui.card} h-fit p-5`}>
          <h2 className={ui.sectionTitle}>店舗情報</h2>
          <dl className="mt-3 space-y-3 text-sm">
            <div>
              <dt className="text-muted">住所</dt>
              <dd className="text-ink">{restaurant.address}</dd>
            </div>
            <div>
              <dt className="text-muted">電話番号</dt>
              <dd>
                <a href={`tel:${restaurant.phoneNumber}`} className="tabular text-ink underline">
                  {restaurant.phoneNumber}
                </a>
              </dd>
            </div>
            <div>
              <dt className="text-muted">予約受付</dt>
              <dd className="tabular text-ink">{restaurant.openTime}〜{restaurant.lastBookingTime}(最終受付)</dd>
            </div>
            <div>
              <dt className="text-muted">定休日</dt>
              <dd className="text-ink">{formatWeekdays(restaurant.closedWeekdays)}</dd>
            </div>
            <div>
              <dt className="text-muted">席数</dt>
              <dd className="text-ink">{restaurant.seatCount}席(ご利用は{restaurant.stayMinutes}分が目安です)</dd>
            </div>
            <div>
              <dt className="text-muted">キャンセル</dt>
              <dd className="text-ink">
                来店の{restaurant.cancelDeadlineHours}時間前まで、予約の確認画面からキャンセルできます
              </dd>
            </div>
          </dl>
        </aside>
      </div>
    </PageContainer>
  );
}
