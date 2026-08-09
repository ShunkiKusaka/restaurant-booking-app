"use server";

import { prisma } from "../../lib/prisma.ts";
import { auth } from "../../auth.ts";
import { redirect } from "next/navigation";

export async function createRestaurant(formData: FormData) {
  const session = await auth();

  if (!session?.user || session.user.role !== "owner") {
    throw new Error("権限がありません");
  }

  const name = formData.get("name") as string;
  const description = formData.get("description") as string;
  const address = formData.get("address") as string;
  const phoneNumber = formData.get("phoneNumber") as string;
  const seatCount = Number(formData.get("seatCount"));

  //DBに保存する作業
  await prisma.restaurant.create({
    data: {
      ownerId: session.user.id,
      name,
      description,
      address,
      phoneNumber,
      seatCount,
      status: "pending",
    },
  });

  redirect("/owner/dashboard");
}