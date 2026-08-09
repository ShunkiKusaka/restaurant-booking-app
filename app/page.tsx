import { prisma } from "../lib/prisma.ts";
import { createReservation } from "./actions.ts";

export default async function Home() {
  const restaurants = await prisma.restaurant.findMany({
    where: { status: "approved" },
  });

  return (
    <main className="min-h-screen bg-gray-50 px-6 py-10">
      <div className="mx-auto max-w-4xl">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          飲食店を探す
        </h1>
        <p className="text-gray-500 mb-8">
          お近くのお店を検索して、その場で予約できます
        </p>

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

              <form action={createReservation} className="mt-4 space-y-2">
                <input type="hidden" name="restaurantId" value={restaurant.id} />
                <input
                  type="date"
                  name="date"
                  required
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                />
                <input
                  type="time"
                  name="time"
                  required
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                />
                <input
                  type="number"
                  name="guests"
                  min={1}
                  defaultValue={2}
                  required
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                />
                <button
                  type="submit"
                  className="w-full rounded-lg bg-gray-900 py-2 text-sm font-medium text-white hover:bg-gray-700 transition-colors"
                >
                  予約する
                </button>
              </form>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}