"use server";

import { prisma } from "../lib/prisma.ts";
import { auth } from "../auth.ts";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { parseJstDateTime } from "../lib/datetime.ts";
import { checkBookingRequest } from "../lib/booking.ts";
import { OCCASIONS } from "../lib/labels.ts";
import { createReservationIfAvailable } from "../lib/create-reservation.ts";

export type ReservationState = { error?: string };

const PHONE_RE = /^[0-9+\-() ]{10,20}$/;

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
  const phone = String(formData.get("phone") ?? "").trim();
  const occasionInput = String(formData.get("occasion") ?? "");
  const note = String(formData.get("note") ?? "").trim();

  if (!PHONE_RE.test(phone)) {
    return { error: "当日連絡がつく電話番号を、数字とハイフンで入力してください" };
  }
  if (note.length > 300) {
    return { error: "ご要望は300文字以内で入力してください" };
  }
  const occasion = OCCASIONS.includes(occasionInput) ? occasionInput : null;

  // 公開中(承認済み)の店舗だけ予約できる
  const restaurant = await prisma.restaurant.findUnique({ where: { id: restaurantId } });
  if (!restaurant || restaurant.status !== "approved") {
    return { error: "このお店は現在予約を受け付けていません" };
  }

  // 日時は必ず日本時間として解釈する(サーバーはUTCで動いているため)
  const problem = checkBookingRequest(restaurant, date, time, guests, new Date());
  if (problem) return { error: problem };
  const start = parseJstDateTime(date, time)!;

  const reservation = await createReservationIfAvailable({
    restaurantId,
    seatCount: restaurant.seatCount,
    stayMinutes: restaurant.stayMinutes,
    start,
    guests,
    data: {
      userId: session.user.id,
      source: "web",
      guestPhone: phone,
      occasion,
      note: note || null,
    },
  });

  if (!reservation) {
    return { error: "申し訳ありません。ちょうど満席になりました。別の時間をお選びください" };
  }

  revalidatePath("/reservations");
  revalidatePath(`/restaurants/${restaurantId}`);
  redirect(`/reservations/${reservation.id}?new=1`);
}
