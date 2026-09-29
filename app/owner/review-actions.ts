"use server";

// 店主が口コミに返信するための処理
import { revalidatePath } from "next/cache";
import { auth } from "../../auth.ts";
import { prisma } from "../../lib/prisma.ts";
import { OWNER_REPLY_MAX } from "../../lib/reviews.ts";

export type ReplyFormState = { error?: string; done?: boolean };

/** 口コミに返信する(1件につき1回だけ) */
export async function replyToReview(_prev: ReplyFormState, formData: FormData): Promise<ReplyFormState> {
  const session = await auth();
  if (!session?.user || session.user.role !== "owner") return { error: "権限がありません" };

  const reviewId = String(formData.get("reviewId") ?? "");
  const reply = String(formData.get("reply") ?? "").trim();
  if (!reply) return { error: "返信を入力してください" };
  if (reply.length > OWNER_REPLY_MAX) return { error: `返信は${OWNER_REPLY_MAX}文字以内で入力してください` };

  const review = await prisma.review.findUnique({
    where: { id: reviewId },
    include: { restaurant: { select: { ownerId: true } } },
  });
  // 自分のお店の口コミでなければ、存在しないものとして扱う
  if (!review || review.restaurant.ownerId !== session.user.id) return { error: "口コミが見つかりません" };

  // まだ返信していない口コミだけ更新する(同時に2回送っても、1回目だけが残る)
  const result = await prisma.review.updateMany({
    where: { id: review.id, ownerReply: null },
    data: { ownerReply: reply, ownerRepliedAt: new Date() },
  });
  if (result.count === 0) return { error: "この口コミには、すでに返信しています" };

  revalidatePath(`/owner/restaurants/${review.restaurantId}/reviews`);
  revalidatePath(`/restaurants/${review.restaurantId}`);
  revalidatePath(`/reservations/${review.reservationId}`);
  return { done: true };
}
