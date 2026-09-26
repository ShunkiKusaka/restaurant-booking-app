// 日本時間(JST)での日時の扱いをまとめたファイル。
// Vercelのサーバーは世界標準時(UTC)で動くので、
// 「19:00」をそのまま new Date() すると、UTCの19:00(日本時間の翌朝4:00)になってしまう。
// ここでは必ず「+09:00」を付けて、日本時間として解釈する。

export const TIME_ZONE = "Asia/Tokyo";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

/** "2026-10-01" と "19:00" から、日本時間のDateを作る。形式がおかしければ null */
export function parseJstDateTime(date: string, time: string): Date | null {
  if (!DATE_RE.test(date) || !TIME_RE.test(time)) return null;
  const d = new Date(`${date}T${time}:00+09:00`);
  if (Number.isNaN(d.getTime())) return null;
  // 2026-02-31 のような存在しない日付を弾く(自動で翌月にずれるため)
  if (toJstDateString(d) !== date) return null;
  return d;
}

/** Date → 日本時間の "YYYY-MM-DD" */
export function toJstDateString(d: Date): string {
  // en-CA は YYYY-MM-DD 形式で出力される
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}

/** Date → 日本時間の "HH:MM" */
export function toJstTimeString(d: Date): string {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: TIME_ZONE,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(d);
}

/** 今日の日付(日本時間)。<input type="date"> の min などに使う */
export function todayJst(): string {
  return toJstDateString(new Date());
}

/** 画面表示用:「2026年10月1日(水) 19:00」 */
export function formatJstDateTime(d: Date): string {
  const date = new Intl.DateTimeFormat("ja-JP", {
    timeZone: TIME_ZONE,
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "short",
  }).format(d);
  return `${date} ${toJstTimeString(d)}`;
}
