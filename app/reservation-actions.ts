"use server";

import { prisma } from "../lib/prisma.ts";
import { auth } from "../auth.ts";
import { revalidatePath } from "next/cache";

export async function cancelReservation(reservationId: string) {
  const session = await auth();

  if (!session?.user) {
    throw new Error("ログインしてください");
  }

  // 本当に自分の予約かどうかを確認する
  const reservation = await prisma.reservation.findUnique({
    where: { id: reservationId },
  });

  if (!reservation || reservation.userId !== session.user.id) {
    throw new Error("この予約をキャンセルする権限がありません");
  }

  await prisma.reservation.delete({
    where: { id: reservationId },
  });

  revalidatePath("/reservations");
}