"use server";

import { prisma } from "../lib/prisma.ts";
import { auth } from "../auth.ts";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { parseJstDateTime } from "../lib/datetime.ts";
import {
  BOOKING_WINDOW_DAYS,
  DEFAULT_STAY_MINUTES,
  MAX_GUESTS_PER_BOOKING,
  hasCapacity,
} from "../lib/booking.ts";

export type ReservationState = { error?: string };

export async function createReservation(
  _prevState: ReservationState,
  formData: FormData
): Promise<ReservationState> {
  const session = await auth();

  if (!session?.user?.id) {
    return { error: "予約するには、ログインしてください" };
  }
  if (session.user.role !== "customer") {
    return { error: "予約は一般ユーザーのアカウントで行ってください" };
  }

  const restaurantId = String(formData.get("restaurantId") ?? "");
  const date = String(formData.get("date") ?? "");
  const time = String(formData.get("time") ?? "");
  const guests = Number(formData.get("guests"));

  // 日時は必ず日本時間として解釈する(サーバーはUTCで動いているため)
  const reservationDate = parseJstDateTime(date, time);
  if (!reservationDate) {
    return { error: "日付と時間を正しく入力してください" };
  }

  const now = Date.now();
  if (reservationDate.getTime() <= now) {
    return { error: "過去の日時は予約できません" };
  }
  if (reservationDate.getTime() > now + BOOKING_WINDOW_DAYS * 24 * 60 * 60_000) {
    return { error: `予約は${BOOKING_WINDOW_DAYS}日先までです` };
  }

  if (!Number.isInteger(guests) || guests < 1 || guests > MAX_GUESTS_PER_BOOKING) {
    return { error: `人数は1〜${MAX_GUESTS_PER_BOOKING}名で入力してください` };
  }

  // 公開中(承認済み)の店舗だけ予約できる
  const restaurant = await prisma.restaurant.findUnique({ where: { id: restaurantId } });
  if (!restaurant || restaurant.status !== "approved") {
    return { error: "このお店は現在予約を受け付けていません" };
  }
  if (guests > restaurant.seatCount) {
    return { error: `このお店は${restaurant.seatCount}名までです` };
  }

  // その時間帯に重なる予約を取り出して、席が足りるか確認する
  const stayMs = DEFAULT_STAY_MINUTES * 60_000;
  const overlapping = await prisma.reservation.findMany({
    where: {
      restaurantId,
      status: "confirmed",
      reservationDate: {
        gt: new Date(reservationDate.getTime() - stayMs),
        lt: new Date(reservationDate.getTime() + stayMs),
      },
    },
    select: { reservationDate: true, numberOfGuests: true },
  });

  const existing = overlapping.map((r) => ({
    start: r.reservationDate,
    guests: r.numberOfGuests,
  }));
  if (!hasCapacity(existing, reservationDate, guests, restaurant.seatCount)) {
    return { error: "その時間は満席です。別の時間をお選びください" };
  }

  await prisma.reservation.create({
    data: {
      userId: session.user.id,
      restaurantId,
      reservationDate,
      numberOfGuests: guests,
      status: "confirmed",
    },
  });

  revalidatePath("/reservations");
  redirect("/reservations?booked=1");
}
