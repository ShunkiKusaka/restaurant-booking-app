import Link from "next/link";
import { prisma } from "../lib/prisma.ts";
import { auth } from "../auth.ts";
import { todayJst } from "../lib/datetime.ts";
import ReservationForm from "./components/ReservationForm.tsx";

export default async function Home() {
  const session = await auth();
  const restaurants = await prisma.restaurant.findMany({
    where: { status: "approved" },
    orderBy: { createdAt: "asc" },
  });
  const minDate = todayJst();
  const role = session?.user?.role;

  return (
    <main className="min-h-screen bg-gray-50 px-6 py-10">
      <div className="mx-auto max-w-4xl">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          飲食店を探す
        </h1>
        <p className="text-gray-500 mb-8">
          お近くのお店を検索して、その場で予約できます
        </p>

        {restaurants.length === 0 && (
          <p className="text-gray-400 text-sm">現在、予約できるお店はありません</p>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          {restaurants.map((restaurant) => (
            <div
              key={restaurant.id}
              className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm hover:shadow-md transition-shadow"
            >
              <h2 className="text-lg font-semibold text-gray-900">
                {restaurant.name}
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                {restaurant.description}
              </p>
              <p className="mt-1 text-sm text-gray-400">
                {restaurant.address}
              </p>
              <p className="mt-1 text-sm text-gray-400">
                席数: {restaurant.seatCount}席
              </p>

              {!session?.user ? (
                <Link
                  href="/login"
                  className="mt-4 block w-full rounded-lg border border-gray-300 py-2 text-center text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  ログインして予約する
                </Link>
              ) : role === "customer" ? (
                <ReservationForm
                  restaurantId={restaurant.id}
                  seatCount={restaurant.seatCount}
                  minDate={minDate}
                />
              ) : (
                <p className="mt-4 text-xs text-gray-400">
                  予約は一般ユーザーのアカウントで行えます
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
