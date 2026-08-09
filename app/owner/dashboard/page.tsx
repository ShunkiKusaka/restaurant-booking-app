import { auth } from "../../../auth.ts";
import { prisma } from "../../../lib/prisma.ts";
import { redirect } from "next/navigation";

export default async function OwnerDashboard() {
  const session = await auth();

  // ログインしてない、または owner じゃない場合ははじく
  if (!session?.user) {
    redirect("/login");
  }
  if (session.user.role !== "owner") {
    redirect("/");
  }

  // このオーナーが持ってる店舗の予約を、関連データ込みで取得
  const reservations = await prisma.reservation.findMany({
    where: {
      restaurant: {
        ownerId: session.user.id,
      },
    },
    include: {
      user: true,
      restaurant: true,
    },
    orderBy: {
      reservationDate: "asc",
    },
  });

  return (
    <main className="min-h-screen bg-gray-50 px-6 py-10">
      <div className="mx-auto max-w-3xl">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">予約管理</h1>
          
          <a href="/owner/restaurants/new"
            className="text-sm rounded-lg bg-gray-900 px-4 py-2 text-white hover:bg-gray-700"
          >
            + 店舗を登録
          </a>
        </div>
        {reservations.length === 0 ? (
          <p className="text-gray-400 text-sm">まだ予約はありません</p>
        ) : (
          <div className="space-y-3">
            {reservations.map((r) => (
              <div
                key={r.id}
                className="flex items-center justify-between rounded-lg border border-gray-200 bg-white px-4 py-3"
              >
                <div>
                  <p className="font-medium text-gray-900">
                    {r.restaurant.name} ・ {r.user.name} 様
                  </p>
                  <p className="text-sm text-gray-500">
                    {new Date(r.reservationDate).toLocaleString("ja-JP")} ／{" "}
                    {r.numberOfGuests}名
                  </p>
                </div>
                <span className="text-sm text-gray-500">{r.status}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}