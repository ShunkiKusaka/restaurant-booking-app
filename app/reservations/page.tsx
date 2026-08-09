import { auth } from "../../auth.ts";
import { prisma } from "../../lib/prisma.ts";
import { redirect } from "next/navigation";
import { cancelReservation } from "../reservation-actions.ts";

export default async function MyReservationsPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const reservations = await prisma.reservation.findMany({
    where: { userId: session.user.id },
    include: { restaurant: true }, //予約に紐づく店舗情報も取得
    orderBy: { reservationDate: "asc" },
  });

  return (
    <main className="min-h-screen bg-gray-50 px-6 py-10">
      <div className="mx-auto max-w-2xl">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">あなたの予約</h1>

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
                  <p className="font-medium text-gray-900">{r.restaurant.name}</p>
                  <p className="text-sm text-gray-500">
                    {new Date(r.reservationDate).toLocaleString("ja-JP")} ／{" "}
                    {r.numberOfGuests}名
                  </p>
                </div>
                <span className="text-sm text-gray-500">{r.status}</span>
                <form
                  action={async () => {
                    "use server";
                    await cancelReservation(r.id);
                  }}
                >
                  <button
                    type="submit"
                    className="text-sm text-red-500 hover:underline"
                  >
                    キャンセル
                  </button>
                </form>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}