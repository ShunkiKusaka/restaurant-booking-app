"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { auth } from "../../auth.ts";
import { prisma } from "../../lib/prisma.ts";
import { parseJstDateTime } from "../../lib/datetime.ts";
import { ABSOLUTE_MAX_PARTY, checkBookingRequest, timeToMinutes } from "../../lib/booking.ts";
import { GENRES, OCCASIONS } from "../../lib/labels.ts";
import { createReservationIfAvailable } from "../../lib/create-reservation.ts";
import { geocodeAddress } from "../../lib/geocode.ts";

export type OwnerFormState = { error?: string };

/** ログイン中のオーナーが、その店舗の持ち主か確認する。違えば null */
async function ownedRestaurant(restaurantId: string) {
  const session = await auth();
  if (!session?.user || session.user.role !== "owner") return null;
  return prisma.restaurant.findFirst({ where: { id: restaurantId, ownerId: session.user.id } });
}

// ---------- 予約のステータス変更(来店・無断キャンセル・キャンセル・元に戻す) ----------

const STATUS_CHANGES: Record<string, string[]> = {
  // 今のステータス → 変更できる先
  confirmed: ["completed", "no_show", "cancelled"],
  completed: ["confirmed"],
  no_show: ["confirmed"],
  cancelled: ["confirmed"],
};

export async function updateReservationStatus(
  reservationId: string,
  nextStatus: string,
  _formData?: FormData
) {
  const reservation = await prisma.reservation.findUnique({ where: { id: reservationId } });
  if (!reservation) return;
  const restaurant = await ownedRestaurant(reservation.restaurantId);
  if (!restaurant) return;
  if (!STATUS_CHANGES[reservation.status]?.includes(nextStatus)) return;

  await prisma.reservation.update({
    where: { id: reservationId },
    data: {
      status: nextStatus,
      cancelledAt: nextStatus === "cancelled" ? new Date() : null,
    },
  });

  revalidatePath(`/owner/restaurants/${restaurant.id}/reservations`);
  revalidatePath("/owner/dashboard");
  revalidatePath(`/restaurants/${restaurant.id}`);
}

// ---------- 電話予約の登録 ----------

const PHONE_RE = /^[0-9+\-() ]{10,20}$/;

export async function createPhoneReservation(
  restaurantId: string,
  _prevState: OwnerFormState,
  formData: FormData
): Promise<OwnerFormState> {
  const restaurant = await ownedRestaurant(restaurantId);
  if (!restaurant) return { error: "この店舗の予約を登録する権限がありません" };

  const date = String(formData.get("date") ?? "");
  const time = String(formData.get("time") ?? "");
  const guests = Number(formData.get("guests"));
  const guestName = String(formData.get("guestName") ?? "").trim();
  const guestPhone = String(formData.get("guestPhone") ?? "").trim();
  const occasionInput = String(formData.get("occasion") ?? "");
  const note = String(formData.get("note") ?? "").trim();

  if (!guestName || guestName.length > 50) return { error: "お客さまのお名前を入力してください" };
  if (guestPhone && !PHONE_RE.test(guestPhone)) {
    return { error: "電話番号は数字とハイフンで入力してください" };
  }
  if (note.length > 300) return { error: "ご要望は300文字以内で入力してください" };

  const problem = checkBookingRequest(restaurant, date, time, guests, new Date(), { byStaff: true });
  if (problem) return { error: problem };

  const reservation = await createReservationIfAvailable({
    restaurantId,
    seatCount: restaurant.seatCount,
    stayMinutes: restaurant.stayMinutes,
    start: parseJstDateTime(date, time)!,
    guests,
    data: {
      userId: null,
      source: "phone",
      guestName,
      guestPhone: guestPhone || null,
      occasion: OCCASIONS.includes(occasionInput) ? occasionInput : null,
      note: note || null,
    },
  });
  if (!reservation) return { error: "その時間は席が足りません。別の時間を選んでください" };

  revalidatePath(`/owner/restaurants/${restaurantId}/reservations`);
  revalidatePath("/owner/dashboard");
  revalidatePath(`/restaurants/${restaurantId}`);
  redirect(`/owner/restaurants/${restaurantId}/reservations?date=${date}&added=1`);
}

// ---------- 店舗の設定 ----------

const TIME_RE = /^([01]\d|2[0-3]):(00|30)$/;
const STAY_CHOICES = [60, 90, 120, 150, 180];
const BOOKING_DEADLINE_CHOICES = [0, 30, 60, 120, 180, 1440];
const CANCEL_DEADLINE_CHOICES = [0, 3, 6, 12, 24, 48, 72];

export async function updateRestaurantSettings(
  restaurantId: string,
  _prevState: OwnerFormState,
  formData: FormData
): Promise<OwnerFormState> {
  const restaurant = await ownedRestaurant(restaurantId);
  if (!restaurant) return { error: "この店舗を編集する権限がありません" };

  const str = (k: string) => String(formData.get(k) ?? "").trim();
  const num = (k: string) => Number(formData.get(k));

  const name = str("name");
  const genre = str("genre");
  const description = str("description");
  const address = str("address");
  const phoneNumber = str("phoneNumber");
  const seatCount = num("seatCount");
  const openTime = str("openTime");
  const lastBookingTime = str("lastBookingTime");
  const closedWeekdays = formData
    .getAll("closedWeekdays")
    .map(Number)
    .filter((d) => Number.isInteger(d) && d >= 0 && d <= 6);
  const stayMinutes = num("stayMinutes");
  const maxPartySize = num("maxPartySize");
  const bookingDeadlineMinutes = num("bookingDeadlineMinutes");
  const cancelDeadlineHours = num("cancelDeadlineHours");

  if (!name || name.length > 80) return { error: "店舗名は1〜80文字で入力してください" };
  if (genre && !GENRES.includes(genre)) return { error: "ジャンルを選び直してください" };
  if (description.length > 500) return { error: "紹介文は500文字以内で入力してください" };
  if (!address || address.length > 200) return { error: "住所を入力してください" };
  if (!/^[0-9+\-() ]{6,20}$/.test(phoneNumber)) return { error: "電話番号は数字とハイフンで入力してください" };
  if (!Number.isInteger(seatCount) || seatCount < 1 || seatCount > 1000) {
    return { error: "席数は1〜1000の数字で入力してください" };
  }
  if (!TIME_RE.test(openTime) || !TIME_RE.test(lastBookingTime)) {
    return { error: "受付時間は30分単位で選んでください" };
  }
  if (timeToMinutes(lastBookingTime) < timeToMinutes(openTime)) {
    return { error: "最終受付は、受付開始より後の時刻にしてください" };
  }
  if (closedWeekdays.length === 7) return { error: "すべての曜日を定休日にはできません" };
  if (!STAY_CHOICES.includes(stayMinutes)) return { error: "滞在時間を選び直してください" };
  if (!Number.isInteger(maxPartySize) || maxPartySize < 1 || maxPartySize > ABSOLUTE_MAX_PARTY) {
    return { error: `Web予約の最大人数は1〜${ABSOLUTE_MAX_PARTY}名で入力してください` };
  }
  if (!BOOKING_DEADLINE_CHOICES.includes(bookingDeadlineMinutes)) {
    return { error: "予約の締め切りを選び直してください" };
  }
  if (!CANCEL_DEADLINE_CHOICES.includes(cancelDeadlineHours)) {
    return { error: "キャンセル期限を選び直してください" };
  }

  // 住所が変わったとき、または位置がまだ分からないときだけ、地図上の位置を調べ直す
  let locationData = {};
  if (address !== restaurant.geocodedAddress || restaurant.latitude === null) {
    const location = await geocodeAddress(address);
    locationData = {
      latitude: location?.lat ?? null,
      longitude: location?.lng ?? null,
      geocodedAddress: address,
    };
  }

  await prisma.restaurant.update({
    where: { id: restaurantId },
    data: {
      ...locationData,
      name,
      genre: genre || null,
      description: description || null,
      address,
      phoneNumber,
      seatCount,
      openTime,
      lastBookingTime,
      closedWeekdays: [...new Set(closedWeekdays)].sort((a, b) => a - b),
      stayMinutes,
      maxPartySize,
      bookingDeadlineMinutes,
      cancelDeadlineHours,
    },
  });

  revalidatePath(`/restaurants/${restaurantId}`);
  revalidatePath("/owner/dashboard");
  revalidatePath("/");
  redirect(`/owner/restaurants/${restaurantId}/settings?saved=1`);
}
