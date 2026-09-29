// 「今すぐ入れるお店」の判定。予約台帳から自動で計算する(店主がボタンを押す必要はない)。
import { getDaySlots, type BookingSettings, type ExistingBooking } from "./booking.ts";

export const NOW_WINDOW_MINUTES = 90; // 今から何分以内に入れれば「今すぐ」とするか
export const NOW_GUESTS = 2; // 何名で入れるかを見る

/**
 * 今日、今から90分以内に2名で予約できる一番早い時間(例:"19:30")。なければ null。
 * 予約の締め切り(来店の○分前まで)も、ふだんの予約画面と同じように守る。
 */
export function soonestAvailableTime(
  settings: BookingSettings,
  today: string,
  existing: ExistingBooking[],
  now: Date
): string | null {
  const guests = Math.min(NOW_GUESTS, settings.maxPartySize, settings.seatCount);
  const { closed, slots } = getDaySlots(settings, today, guests, existing, now);
  if (closed) return null;
  const limit = now.getTime() + NOW_WINDOW_MINUTES * 60_000;
  const slot = slots.find((s) => s.status === "available" && s.start.getTime() <= limit);
  return slot ? slot.time : null;
}
