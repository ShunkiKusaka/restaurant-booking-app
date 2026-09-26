// 画面に出す日本語のラベル。DBには英語のまま保存し、表示のときだけ変換する。

export const RESERVATION_STATUS_LABELS: Record<string, string> = {
  confirmed: "予約確定",
  cancelled: "キャンセル済み",
  completed: "来店済み",
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

export function label(map: Record<string, string>, key: string): string {
  return map[key] ?? key;
}
