// 画面に出す日本語のラベル。DBには英語のまま保存し、表示のときだけ変換する。

export const RESERVATION_STATUS_LABELS: Record<string, string> = {
  confirmed: "予約確定",
  completed: "来店済み",
  cancelled: "キャンセル",
  no_show: "無断キャンセル",
};

export const RESTAURANT_STATUS_LABELS: Record<string, string> = {
  pending: "審査中",
  approved: "公開中",
  rejected: "却下",
};

export const ROLE_LABELS: Record<string, string> = {
  customer: "一般",
  owner: "店舗オーナー",
  admin: "運営",
};

export const SOURCE_LABELS: Record<string, string> = {
  web: "Web",
  phone: "電話",
};

export const WEEKDAY_LABELS = ["日", "月", "火", "水", "木", "金", "土"];

// 利用目的の選択肢(予約フォームで選ぶ)
export const OCCASIONS = ["食事", "誕生日", "記念日", "接待", "デート", "家族", "女子会・同窓会", "その他"];

export const GENRES = [
  "和食", "寿司", "焼肉", "居酒屋", "フレンチ", "イタリアン", "中華", "カフェ", "バー", "その他",
];

export function label(map: Record<string, string>, key: string): string {
  return map[key] ?? key;
}

/** [0, 3] → "日・水曜"。なければ "なし" */
export function formatWeekdays(days: number[]): string {
  if (days.length === 0) return "なし";
  return [...days].sort((a, b) => a - b).map((d) => WEEKDAY_LABELS[d]).join("・") + "曜";
}
