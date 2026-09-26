// 予約の「席が空いているか」の計算。DBに依存しない純粋な関数にしてあるので、単独でテストできる。

export const DEFAULT_STAY_MINUTES = 120; // 1組の滞在時間の目安
export const MAX_GUESTS_PER_BOOKING = 20;
export const BOOKING_WINDOW_DAYS = 90; // 何日先まで予約できるか

export type ExistingBooking = { start: Date; guests: number };

/**
 * 新しい予約 [start, start + stay) の間で、最も混んでいる瞬間に座っている人数を返す。
 * 滞在時間が全員同じなので、混雑のピークは「新しい予約の開始時刻」か
 * 「その間に始まる既存の予約の開始時刻」のどれかになる。
 */
export function peakOccupancy(
  existing: ExistingBooking[],
  start: Date,
  stayMinutes: number = DEFAULT_STAY_MINUTES
): number {
  const stayMs = stayMinutes * 60_000;
  const newStart = start.getTime();
  const newEnd = newStart + stayMs;

  const checkpoints = [newStart];
  for (const b of existing) {
    const s = b.start.getTime();
    if (s > newStart && s < newEnd) checkpoints.push(s);
  }

  let peak = 0;
  for (const t of checkpoints) {
    let occ = 0;
    for (const b of existing) {
      const s = b.start.getTime();
      if (s <= t && t < s + stayMs) occ += b.guests;
    }
    peak = Math.max(peak, occ);
  }
  return peak;
}

/** その時間に guests 人が座れるか */
export function hasCapacity(
  existing: ExistingBooking[],
  start: Date,
  guests: number,
  seatCount: number,
  stayMinutes: number = DEFAULT_STAY_MINUTES
): boolean {
  return peakOccupancy(existing, start, stayMinutes) + guests <= seatCount;
}
