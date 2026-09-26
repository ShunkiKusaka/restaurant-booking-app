import Link from "next/link";
import { auth } from "../../../auth.ts";
import { prisma } from "../../../lib/prisma.ts";
import { redirect } from "next/navigation";
import { formatJstDateTime } from "../../../lib/datetime.ts";
import {
  RESERVATION_STATUS_LABELS,
  RESTAURANT_STATUS_LABELS,
  label,
} from "../../../lib/labels.ts";

const RESTAURANT_BADGE: Record<string, string> = {
  pending: "bg-amber-50 text-amber-700",
  approved: "bg-emerald-50 text-emerald-700",
  rejected: "bg-gray-100 text-gray-600",
};

export default async function OwnerDashboard({ searchParams }: PageProps<"/owner/dashboard">) {
  const session = await auth();

  // ログインしてない、または owner じゃない場合ははじく
  if (!session?.user) {
    redirect("/login");
  }
  if (session.user.role !== "owner") {
    redirect("/");
  }

  const { created } = await searchParams;

  const [restaurants, reservations] = await Promise.all([
    prisma.restaurant.findMany({
      where: { ownerId: session.user.id },
      orderBy: { createdAt: "asc" },
    }),
    // このオーナーが持ってる店舗の、これからの予約を関連データ込みで取得
    prisma.reservation.findMany({
      where: {
        restaurant: { ownerId: session.user.id },
        reservationDate: { gte: new Date() },
      },
      include: { user: true, restaurant: true },
      orderBy: { reservationDate: "asc" },
    }),
  ]);

  return (
    <main className="min-h-screen bg-gray-50 px-6 py-10">
      <div className="mx-auto max-w-3xl">
        <div className="flex items-center justify-between gap-4 mb-6">
          <h1 className="text-2xl font-bold text-gray-900">店舗管理</h1>
          <Link
            href="/owner/restaurants/new"
            className="shrink-0 text-sm rounded-lg bg-gray-900 px-4 py-2 text-white hover:bg-gray-700"
          >
            + 店舗を登録
          </Link>
        </div>

        {created === "1" && (
          <p role="status" className="mb-6 rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            店舗を登録しました。運営の審査が終わると、予約の受付が始まります。
          </p>
        )}

        <h2 className="text-sm font-bold text-gray-700 mb-3">あなたの店舗</h2>
        {restaurants.length === 0 ? (
          <p className="text-gray-400 text-sm mb-8">まだ店舗が登録されていません</p>
        ) : (
          <div className="space-y-2 mb-8">
            {restaurants.map((r) => (
              <div
                key={r.id}
                className="flex items-center justify-between gap-4 rounded-lg border border-gray-200 bg-white px-4 py-3"
              >
                <div>
                  <p className="font-medium text-gray-900">{r.name}</p>
                  <p className="text-sm text-gray-500">{r.address} ／ {r.seatCount}席</p>
                </div>
                <span
                  className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium ${RESTAURANT_BADGE[r.status] ?? ""}`}
                >
                  {label(RESTAURANT_STATUS_LABELS, r.status)}
                </span>
              </div>
            ))}
          </div>
        )}

        <h2 className="text-sm font-bold text-gray-700 mb-3">これからの予約</h2>
        {reservations.length === 0 ? (
          <p className="text-gray-400 text-sm">これからの予約はありません</p>
        ) : (
          <div className="space-y-3">
            {reservations.map((r) => (
              <div
                key={r.id}
                className={`flex items-center justify-between gap-4 rounded-lg border border-gray-200 bg-white px-4 py-3 ${r.status === "cancelled" ? "opacity-60" : ""}`}
              >
                <div>
                  <p className="font-medium text-gray-900">
                    {r.restaurant.name} ・ {r.user.name} 様
                  </p>
                  <p className="text-sm text-gray-500">
                    {formatJstDateTime(r.reservationDate)} ／ {r.numberOfGuests}名
                  </p>
                </div>
                <span className="shrink-0 text-sm text-gray-500">
                  {label(RESERVATION_STATUS_LABELS, r.status)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
