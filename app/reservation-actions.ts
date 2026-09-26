"use server";

import { prisma } from "../lib/prisma.ts";
import { auth } from "../auth.ts";
import { revalidatePath } from "next/cache";

// 予約のキャンセル。記録を残すため、削除せずに「キャンセル済み」に変える。
// フォームから呼ばれるので、2つ目の引数に FormData が渡ってくる(使わない)。
export async function cancelReservation(reservationId: string, _formData?: FormData) {
  const session = await auth();
  if (!session?.user) return;

  const reservation = await prisma.reservation.findUnique({
    where: { id: reservationId },
  });

  // 本人の予約で、まだ来店前の「予約確定」のものだけキャンセルできる
  if (
    !reservation ||
    reservation.userId !== session.user.id ||
    reservation.status !== "confirmed" ||
    reservation.reservationDate.getTime() <= Date.now()
  ) {
    return;
  }

  await prisma.reservation.update({
    where: { id: reservationId },
    data: { status: "cancelled" },
  });

  revalidatePath("/reservations");
  revalidatePath("/owner/dashboard");
}
