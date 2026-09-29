"use server";

import { prisma } from "../lib/prisma.ts";
import { auth } from "../auth.ts";
import { revalidatePath } from "next/cache";
import { refreshRestaurantRating } from "../lib/reviews.ts";

/** 不適切な口コミを非表示にする(hidden = false で再表示) */
export async function setReviewHidden(reviewId: string, hidden: boolean, _formData?: FormData) {
  const session = await auth();
  if (!session?.user || session.user.role !== "admin") {
    throw new Error("権限がありません");
  }
  if (typeof hidden !== "boolean") {
    throw new Error("不正な値です");
  }

  const review = await prisma.review.findUnique({ where: { id: reviewId } });
  if (!review) return;

  // 非表示の口コミは平均点に入れないので、件数と平均点も計算し直す
  await prisma.$transaction(async (tx) => {
    await tx.review.update({ where: { id: review.id }, data: { hidden } });
    await refreshRestaurantRating(tx, review.restaurantId);
  });

  revalidatePath("/admin/dashboard");
  revalidatePath("/");
  revalidatePath(`/restaurants/${review.restaurantId}`);
  revalidatePath(`/owner/restaurants/${review.restaurantId}/reviews`);
  revalidatePath(`/reservations/${review.reservationId}`);
}

export async function updateRestaurantStatus(
  restaurantId: string,
  newStatus: "approved" | "rejected",
  _formData?: FormData
) {
  const session = await auth();

  if (!session?.user || session.user.role !== "admin") {
    throw new Error("権限がありません");
  }

  // 引数が想定外の値だった場合に備えて、サーバー側でも確認する
  if (newStatus !== "approved" && newStatus !== "rejected") {
    throw new Error("不正なステータスです");
  }

  await prisma.restaurant.update({
    where: { id: restaurantId },
    data: { status: newStatus },
  });

  revalidatePath("/admin/dashboard");//このページのサーバーのキャッシュを削除
  revalidatePath("/")
  //このページのサーバーのキャッシュを削除 
  //topページのキャッシュも削除しないと他ページでやった処理の結果がここにも反映されない
  //例えば他のページでやったCRUD処理の結果など
  revalidatePath(`/restaurants/${restaurantId}`); // 店舗ページとオーナーの画面にも審査結果を反映
  revalidatePath("/owner/dashboard");
}
