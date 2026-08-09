"use server";

import { prisma } from "../lib/prisma.ts";
import { auth } from "../auth.ts";
import { revalidatePath } from "next/cache";

export async function createReservation(formData: FormData) {
  const session = await auth();

  if (!session?.user?.id) {
    throw new Error("ログインしてください");
  }

  const restaurantId = formData.get("restaurantId") as string;
  const date = formData.get("date") as string;
  const time = formData.get("time") as string;
  const guests = Number(formData.get("guests"));

  const reservationDate = new Date(`${date}T${time}:00`);

  await prisma.reservation.create({
    data: {
      userId: session.user.id,
      restaurantId,
      reservationDate,
      numberOfGuests: guests,
      status: "confirmed",
    },
  });

  revalidatePath("/");
}