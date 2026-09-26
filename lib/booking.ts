// 予約の空き状況の計算。DBに依存しない純粋な関数にしてあるので、単独でテストできる。
import { parseJstDateTime, toJstDateString } from "./datetime.ts";

export const SLOT_MINUTES = 30; // 予約枠の間隔
export const BOOKING_WINDOW_DAYS = 60; // 何日先まで予約できるか
export const ABSOLUTE_MAX_PARTY = 50; // 電話予約も含めた1組の上限

export type ExistingBooking = { start: Date; guests: number };

export type BookingSettings = {
  seatCount: number;
  openTime: string;
  lastBookingTime: string;
  closedWeekdays: number[];
  stayMinutes: number;
  maxPartySize: number;
  bookingDeadlineMinutes: number;
};

export type SlotStatus = "available" | "full" | "closed_for_booking";
export type Slot = {
  time: string;
  start: Date;
  status: SlotStatus;
  remainingSeats: number;
};

// ---------- 時刻の小さな道具 ----------

export function timeToMinutes(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

export function minutesToTime(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/** "YYYY-MM-DD" の曜日(0=日曜)。サーバーのタイムゾーンに左右されない */
export function weekdayOf(date: string): number {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}

/** "YYYY-MM-DD" に日数を足す */
export function addDays(date: string, days: number): string {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10);
}

/** 受付開始〜最終受付までの枠の時刻の一覧 */
export function slotTimes(openTime: string, lastBookingTime: string): string[] {
  const start = timeToMinutes(openTime);
  const end = timeToMinutes(lastBookingTime);
  const times: string[] = [];
  for (let m = start; m <= end; m += SLOT_MINUTES) times.push(minutesToTime(m));
  return times;
}

// ---------- 混雑の計算 ----------

/** 時刻 t の瞬間に座っている人数 */
export function occupancyAt(existing: ExistingBooking[], t: number, stayMinutes: number): number {
  const stayMs = stayMinutes * 60_000;
  let occ = 0;
  for (const b of existing) {
    const s = b.start.getTime();
    if (s <= t && t < s + stayMs) occ += b.guests;
  }
  return occ;
}

/**
 * 新しい予約 [start, start + stay) の間で、最も混んでいる瞬間に座っている人数。
 * 滞在時間が全員同じなので、混雑のピークは「新しい予約の開始時刻」か
 * 「その間に始まる既存の予約の開始時刻」のどれかになる。
 */
export function peakOccupancy(existing: ExistingBooking[], start: Date, stayMinutes: number): number {
  const stayMs = stayMinutes * 60_000;
  const newStart = start.getTime();
  const newEnd = newStart + stayMs;

  let peak = occupancyAt(existing, newStart, stayMinutes);
  for (const b of existing) {
    const s = b.start.getTime();
    if (s > newStart && s < newEnd) {
      peak = Math.max(peak, occupancyAt(existing, s, stayMinutes));
    }
  }
  return peak;
}

// ---------- 1日分の空き枠 ----------

export function isClosedDay(settings: Pick<BookingSettings, "closedWeekdays">, date: string): boolean {
  return settings.closedWeekdays.includes(weekdayOf(date));
}

export function getDaySlots(
  settings: BookingSettings,
  date: string,
  guests: number,
  existing: ExistingBooking[],
  now: Date
): { closed: boolean; slots: Slot[] } {
  if (isClosedDay(settings, date)) return { closed: true, slots: [] };

  const deadline = now.getTime() + settings.bookingDeadlineMinutes * 60_000;
  const slots: Slot[] = [];
  for (const time of slotTimes(settings.openTime, settings.lastBookingTime)) {
    const start = parseJstDateTime(date, time);
    if (!start) continue;
    const remainingSeats = Math.max(
      0,
      settings.seatCount - peakOccupancy(existing, start, settings.stayMinutes)
    );
    let status: SlotStatus = "available";
    if (start.getTime() < deadline) status = "closed_for_booking";
    else if (remainingSeats < guests) status = "full";
    slots.push({ time, start, status, remainingSeats });
  }
  return { closed: false, slots };
}

/** DBから取り出す範囲:その日の枠と重なる可能性がある予約 */
export function dayQueryRange(settings: BookingSettings, date: string) {
  const first = parseJstDateTime(date, settings.openTime)!;
  const last = parseJstDateTime(date, settings.lastBookingTime)!;
  const stayMs = settings.stayMinutes * 60_000;
  return { gt: new Date(first.getTime() - stayMs), lt: new Date(last.getTime() + stayMs) };
}

// ---------- 予約内容のチェック ----------

export type BookingCheckOptions = {
  /** 電話予約などお店側の登録。1組の人数上限と締め切りを無視する */
  byStaff?: boolean;
};

/** 予約の日時・人数が受付条件に合っているか。問題なければ null、あればエラー文 */
export function checkBookingRequest(
  settings: BookingSettings,
  date: string,
  time: string,
  guests: number,
  now: Date,
  opts: BookingCheckOptions = {}
): string | null {
  const start = parseJstDateTime(date, time);
  if (!start) return "日付と時間を正しく選んでください";

  const maxParty = opts.byStaff
    ? Math.min(settings.seatCount, ABSOLUTE_MAX_PARTY)
    : Math.min(settings.maxPartySize, settings.seatCount);
  if (!Number.isInteger(guests) || guests < 1 || guests > maxParty) {
    return `人数は1〜${maxParty}名で選んでください`;
  }

  if (isClosedDay(settings, date)) return "この日は定休日です";
  if (!slotTimes(settings.openTime, settings.lastBookingTime).includes(time)) {
    return "受付時間外の時刻です";
  }

  const today = toJstDateString(now);
  if (date > addDays(today, BOOKING_WINDOW_DAYS)) {
    return `予約は${BOOKING_WINDOW_DAYS}日先までです`;
  }

  if (opts.byStaff) {
    if (start.getTime() < now.getTime() - 60 * 60_000) return "過去の日時は登録できません";
  } else if (start.getTime() < now.getTime() + settings.bookingDeadlineMinutes * 60_000) {
    return "この時間の予約受付は終了しました";
  }
  return null;
}

/** お客さん自身がキャンセルできる期限を過ぎていないか */
export function canCustomerCancel(start: Date, cancelDeadlineHours: number, now: Date): boolean {
  return start.getTime() - now.getTime() >= cancelDeadlineHours * 60 * 60_000;
}

/** 席を使っている状態(キャンセル・無断キャンセルは席を使わない) */
export const SEAT_OCCUPYING_STATUSES = ["confirmed", "completed"];
