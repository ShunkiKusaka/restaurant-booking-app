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