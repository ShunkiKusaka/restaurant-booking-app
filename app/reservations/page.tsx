import { auth } from "../../auth.ts";
import { prisma } from "../../lib/prisma.ts";
import { redirect } from "next/navigation";
import { cancelReservation } from "../reservation-actions.ts";
import { formatJstDateTime } from "../../lib/datetime.ts";
import { RESERVATION_STATUS_LABELS, label } from "../../lib/labels.ts";

export default async function MyReservationsPage({ searchParams }: PageProps<"/reservations">) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const { booked } = await searchParams;

  const reservations = await prisma.reservation.findMany({
    where: { userId: session.user.id },
    include: { restaurant: true }, // 予約に紐づく店舗情報も取得
    orderBy: { reservationDate: "asc" },
  });

  const now = Date.now();
  const upcoming = reservations.filter(
    (r) => r.reservationDate.getTime() > now && r.status === "confirmed"
  );
  const others = reservations
    .filter((r) => !upcoming.includes(r))
    .reverse(); // 過去・キャンセル済みは新しい順

  return (
    <main className="min-h-screen bg-gray-50 px-6 py-10">
      <div className="mx-auto max-w-2xl">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">あなたの予約</h1>

        {booked === "1" && (
          <p role="status" className="mb-6 rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            予約が完了しました。
          </p>
        )}

        <h2 className="text-sm font-bold text-gray-700 mb-3">これからの予約</h2>
        {upcoming.length === 0 ? (
          <p className="text-gray-400 text-sm mb-8">これからの予約はありません</p>
        ) : (
          <div className="space-y-3 mb-8">
            {upcoming.map((r) => (
              <div
                key={r.id}
                className="flex items-center justify-between gap-4 rounded-lg border border-gray-200 bg-white px-4 py-3"
              >
                <div>
                  <p className="font-medium text-gray-900">{r.restaurant.name}</p>
                  <p className="text-sm text-gray-500">
                    {formatJstDateTime(r.reservationDate)} ／ {r.numberOfGuests}名
                  </p>
                </div>
                <form action={cancelReservation.bind(null, r.id)}>
                  <button type="submit" className="text-sm text-red-600 hover:underline">
                    キャンセル
                  </button>
                </form>
              </div>
            ))}
          </div>
        )}

        {others.length > 0 && (
          <>
            <h2 className="text-sm font-bold text-gray-700 mb-3">過去・キャンセル済み</h2>
            <div className="space-y-3">
              {others.map((r) => (
                <div
                  key={r.id}
                  className="flex items-center justify-between gap-4 rounded-lg border border-gray-200 bg-white px-4 py-3 opacity-80"
                >
                  <div>
                    <p className="font-medium text-gray-900">{r.restaurant.name}</p>
                    <p className="text-sm text-gray-500">
                      {formatJstDateTime(r.reservationDate)} ／ {r.numberOfGuests}名
                    </p>
                  </div>
                  <span className="text-sm text-gray-500">
                    {r.status === "confirmed" ? "来店日を過ぎました" : label(RESERVATION_STATUS_LABELS, r.status)}
                  </span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </main>
  );
}
