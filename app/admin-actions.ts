"use server";

import { prisma } from "../lib/prisma.ts";
import { auth } from "../auth.ts";
import { revalidatePath } from "next/cache";

export async function updateRestaurantStatus(
  restaurantId: string,
  newStatus: "approved" | "rejected"
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
}