// 口コミのルールと、お店の平均点の計算。
// 注意:"use server" は付けない(server action から呼ぶための部品)。
import type { Prisma } from "../app/generated/prisma/client.ts";

export const REVIEW_COMMENT_MAX = 500;
export const OWNER_REPLY_MAX = 500;

/** 星の数ごとの説明(入力フォームで使う) */
export const RATING_LABELS: Record<number, string> = {
  1: "不満",
  2: "やや不満",
  3: "ふつう",
  4: "満足",
  5: "大満足",
};

/**
 * 口コミに表示する名前。フルネームは出さず、名字だけにする。
 * 「田中 花子」→「田中 さん」。空白がない名前は、先頭の2文字だけ出す。
 */
export function reviewerName(name: string | null | undefined): string {
  const trimmed = (name ?? "").trim();
  if (!trimmed) return "ゲスト さん";
  const parts = trimmed.split(/[\s　]+/);
  const family = parts.length > 1 ? parts[0] : [...trimmed].slice(0, 2).join("");
  return `${family} さん`;
}

/** 星の数(フォームの値)を確認する。1〜5の整数だけ通す */
export function parseRating(value: unknown): number | null {
  const n = Number(value);
  return Number.isInteger(n) && n >= 1 && n <= 5 ? n : null;
}

/**
 * お店の口コミ件数と平均点を、表示している口コミから計算し直す。
 * 口コミを書く・直す・消す・非表示にするときに、同じトランザクションの中で呼ぶ。
 */
export async function refreshRestaurantRating(tx: Prisma.TransactionClient, restaurantId: string) {
  const agg = await tx.review.aggregate({
    where: { restaurantId, hidden: false },
    _avg: { rating: true },
    _count: { _all: true },
  });
  await tx.restaurant.update({
    where: { id: restaurantId },
    data: {
      reviewCount: agg._count._all,
      ratingAverage: agg._avg.rating ?? 0,
    },
  });
}
