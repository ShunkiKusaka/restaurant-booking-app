import { notFound, redirect } from "next/navigation";
import { auth } from "../auth.ts";
import { prisma } from "./prisma.ts";

/** ログイン中の店舗オーナーを確認する。違えばログイン画面かトップへ */
export async function requireOwner() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role !== "owner") redirect("/");
  return session.user;
}

/**
 * 店舗IDから、ログイン中のオーナー自身の店舗を取り出す。
 * 他人の店舗のIDをURLに入れても、見つからない扱いにする。
 */
export async function getOwnedRestaurant(restaurantId: string) {
  const user = await requireOwner();
  const restaurant = await prisma.restaurant.findFirst({
    where: { id: restaurantId, ownerId: user.id },
  });
  if (!restaurant) notFound();
  return { user, restaurant };
}
