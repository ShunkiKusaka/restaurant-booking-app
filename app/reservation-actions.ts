"use server";

import { prisma } from "../lib/prisma.ts";
import { auth } from "../auth.ts";
import { revalidatePath } from "next/cache";
import { canCustomerCancel } from "../lib/booking.ts";

// お客さん自身による予約のキャンセル。記録を残すため、削除せずに「キャンセル」に変える。
// フォームから呼ばれるので、2つ目の引数に FormData が渡ってくる(使わない)。
export async function cancelReservation(reservationId: string, _formData?: FormData) {
  const session = await auth();
  if (!session?.user) return;

  const reservation = await prisma.reservation.findUnique({
    where: { id: reservationId },
    include: { restaurant: true },
  });

  // 本人の予約で、「予約確定」のもの、かつキャンセル期限の前だけキャンセルできる
  if (
    !reservation ||
    reservation.userId !== session.user.id ||
    reservation.status !== "confirmed" ||
    !canCustomerCancel(reservation.reservationDate, reservation.restaurant.cancelDeadlineHours, new Date())
  ) {
    return;
  }

  await prisma.reservation.update({
    where: { id: reservationId },
    data: { status: "cancelled", cancelledAt: new Date() },
  });

  revalidatePath("/reservations");
  revalidatePath(`/reservations/${reservationId}`);
  revalidatePath(`/restaurants/${reservation.restaurantId}`);
}
