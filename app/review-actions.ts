"use server";

// お客さんが口コミを書く・直す・消すための処理。
// 画面にボタンが出ていなくても直接呼べてしまうので、条件はすべてここで確認する。
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { auth } from "../auth.ts";
import { prisma } from "../lib/prisma.ts";
import { REVIEW_COMMENT_MAX, parseRating, refreshRestaurantRating } from "../lib/reviews.ts";

export type ReviewFormState = { error?: string };

function revalidateReviewPages(restaurantId: string, reservationId: string) {
  revalidatePath("/");
  revalidatePath(`/restaurants/${restaurantId}`);
  revalidatePath("/reservations");
  revalidatePath(`/reservations/${reservationId}`);
  revalidatePath(`/owner/restaurants/${restaurantId}/reviews`);
}

/** 口コミを書く(まだなければ新しく、あれば書き直す) */
export async function saveReview(_prev: ReviewFormState, formData: FormData): Promise<ReviewFormState> {
  const session = await auth();
  if (!session?.user) return { error: "ログインしてください" };
  const userId = session.user.id;

  const reservationId = String(formData.get("reservationId") ?? "");
  const rating = parseRating(formData.get("rating"));
  const comment = String(formData.get("comment") ?? "").trim();

  if (!rating) return { error: "星の数を選んでください" };
  if (!comment) return { error: "コメントを入力してください" };
  if (comment.length > REVIEW_COMMENT_MAX) {
    return { error: `コメントは${REVIEW_COMMENT_MAX}文字以内で入力してください` };
  }

  const reservation = await prisma.reservation.findUnique({
    where: { id: reservationId },
    include: { review: true },
  });
  // 本人の予約でなければ、存在しないものとして扱う
  if (!reservation || reservation.userId !== userId) {
    return { error: "予約が見つかりません" };
  }

  if (reservation.review) {
    // すでにある口コミの書き直し
    const reviewId = reservation.review.id;
    await prisma.$transaction(async (tx) => {
      await tx.review.update({ where: { id: reviewId }, data: { rating, comment } });
      await refreshRestaurantRating(tx, reservation.restaurantId);
    });
  } else {
    // 新しく書けるのは、お店が「来店済み」にした予約だけ
    if (reservation.status !== "completed") {
      return { error: "口コミは、来店済みの予約にだけ書けます" };
    }
    try {
      await prisma.$transaction(async (tx) => {
        await tx.review.create({
          data: {
            reservationId: reservation.id,
            restaurantId: reservation.restaurantId,
            userId,
            rating,
            comment,
          },
        });
        await refreshRestaurantRating(tx, reservation.restaurantId);
      });
    } catch (e) {
      // 2つの画面から同時に送ったときなど。1件目だけが保存される
      if (typeof e === "object" && e !== null && "code" in e && e.code === "P2002") {
        return { error: "この予約の口コミは、すでに投稿されています" };
      }
      throw e;
    }
  }

  revalidateReviewPages(reservation.restaurantId, reservation.id);
  redirect(`/reservations/${reservation.id}?reviewed=1`);
}

/** 自分の口コミを消す */
export async function deleteReview(reviewId: string, _formData?: FormData) {
  const session = await auth();
  if (!session?.user) return;

  const review = await prisma.review.findUnique({ where: { id: reviewId } });
  if (!review || review.userId !== session.user.id) return;

  await prisma.$transaction(async (tx) => {
    await tx.review.delete({ where: { id: review.id } });
    await refreshRestaurantRating(tx, review.restaurantId);
  });

  revalidateReviewPages(review.restaurantId, review.reservationId);
}
