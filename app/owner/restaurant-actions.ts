"use server";

import { prisma } from "../../lib/prisma.ts";
import { auth } from "../../auth.ts";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

export type RestaurantFormState = { error?: string };

export async function createRestaurant(
  _prevState: RestaurantFormState,
  formData: FormData
): Promise<RestaurantFormState> {
  const session = await auth();

  if (!session?.user || session.user.role !== "owner") {
    return { error: "店舗を登録できるのは、店舗オーナーのアカウントだけです" };
  }

  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const address = String(formData.get("address") ?? "").trim();
  const phoneNumber = String(formData.get("phoneNumber") ?? "").trim();
  const seatCount = Number(formData.get("seatCount"));

  if (!name || name.length > 80) return { error: "店舗名は1〜80文字で入力してください" };
  if (description.length > 500) return { error: "紹介文は500文字以内で入力してください" };
  if (!address || address.length > 200) return { error: "住所を入力してください" };
  if (!/^[0-9+\-() ]{6,20}$/.test(phoneNumber)) {
    return { error: "電話番号は数字とハイフンで入力してください" };
  }
  if (!Number.isInteger(seatCount) || seatCount < 1 || seatCount > 1000) {
    return { error: "席数は1〜1000の数字で入力してください" };
  }

  // DBに保存する作業(運営の審査が終わるまでは「審査中」)
  await prisma.restaurant.create({
    data: {
      ownerId: session.user.id,
      name,
      description: description || null,
      address,
      phoneNumber,
      seatCount,
      status: "pending",
    },
  });

  revalidatePath("/owner/dashboard");
  revalidatePath("/admin/dashboard");
  redirect("/owner/dashboard?created=1");
}
