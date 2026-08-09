"use server";

import { prisma } from "../lib/prisma.ts";
import { revalidatePath } from "next/cache";

export async function createReservation(formData: FormData) {
  const restaurantId = formData.get("restaurantId") as string;
  const date = formData.get("date") as string;
  const time = formData.get("time") as string;
  const guests = Number(formData.get("guests"));

  // 今回は仮で、シードデータの customer ユーザーを使う
  const customer = await prisma.user.findUnique({
    where: { email: "customer@example.com" },
  });

  if (!customer) {
    throw new Error("ユーザーが見つかりません");
  }

  const reservationDate = new Date(`${date}T${time}:00`);

  await prisma.reservation.create({
    data: {
      userId: customer.id,
      restaurantId,
      reservationDate,
      numberOfGuests: guests,
      status: "confirmed",
    },
  });

  revalidatePath("/");
}