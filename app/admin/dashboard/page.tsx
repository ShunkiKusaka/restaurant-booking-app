import { auth } from "../../../auth.ts";
import { prisma } from "../../../lib/prisma.ts";
import { redirect } from "next/navigation";
import { updateRestaurantStatus } from "../../admin-actions.ts";

export default async function AdminDashboard() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }
  if (session.user.role !== "admin") {
    redirect("/");
  }

  const pendingRestaurants = await prisma.restaurant.findMany({
    where: { status: "pending" },
    include: { owner: true },
    orderBy: { createdAt: "asc" },
  });

  // 4つの集計は互いに関係ないので、同時に問い合わせる
  const [totalRestaurants, pendingCount, totalReservations, totalUsers] = await Promise.all([
    prisma.restaurant.count(),
    prisma.restaurant.count({ where: { status: "pending" } }),
    prisma.reservation.count(),
    prisma.user.count(),
  ]);
  const stats = { totalRestaurants, pendingCount, totalReservations, totalUsers };

  return (
    <main className="min-h-screen bg-gray-50 px-6 py-10">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">運営管理</h1>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10">
          <div className="rounded-lg bg-white border border-gray-200 p-4">
            <p className="text-xs text-gray-500">登録店舗</p>
            <p className="text-xl font-bold text-gray-900">{stats.totalRestaurants}</p>
          </div>
          <div className="rounded-lg bg-white border border-gray-200 p-4">
            <p className="text-xs text-gray-500">審査待ち</p>
            <p className="text-xl font-bold text-amber-500">{stats.pendingCount}</p>
          </div>
          <div className="rounded-lg bg-white border border-gray-200 p-4">
            <p className="text-xs text-gray-500">総予約数</p>
            <p className="text-xl font-bold text-gray-900">{stats.totalReservations}</p>
          </div>
          <div className="rounded-lg bg-white border border-gray-200 p-4">
            <p className="text-xs text-gray-500">利用者数</p>
            <p className="text-xl font-bold text-gray-900">{stats.totalUsers}</p>
          </div>
        </div>

        <h2 className="text-lg font-bold text-gray-900 mb-4">審査待ちの店舗</h2>

        {pendingRestaurants.length === 0 ? (
          <p className="text-gray-400 text-sm">審査待ちの店舗はありません</p>
        ) : (
          <div className="space-y-3">
            {pendingRestaurants.map((restaurant) => (
              <div
                key={restaurant.id}
                className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-lg border border-gray-200 bg-white px-4 py-3"
              >
                <div>
                  <p className="font-medium text-gray-900">{restaurant.name}</p>
                  <p className="text-sm text-gray-500">
                    {restaurant.address} ・ オーナー: {restaurant.owner.name}
                  </p>
                </div>
                <div className="flex gap-2">
                  <form
                    action={async () => {
                      "use server";
                      await updateRestaurantStatus(restaurant.id, "approved");
                    }}
                  >
                    <button
                      type="submit"
                      className="px-3 py-1.5 text-sm rounded-lg bg-emerald-600 text-white hover:bg-emerald-700"
                    >
                      承認
                    </button>
                  </form>
                  <form
                    action={async () => {
                      "use server";
                      await updateRestaurantStatus(restaurant.id, "rejected");
                    }}
                  >
                    <button
                      type="submit"
                      className="px-3 py-1.5 text-sm rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50"
                    >
                      却下
                    </button>
                  </form>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}