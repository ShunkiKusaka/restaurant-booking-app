import Link from "next/link";
import { auth } from "../../auth.ts";
import { prisma } from "../../lib/prisma.ts";
import { redirect } from "next/navigation";
import { formatJstDateTime } from "../../lib/datetime.ts";
import { formatReservationCode } from "../../lib/reservation-code.ts";
import { PageContainer, ReservationStatusBadge, ui } from "../components/ui.tsx";

export default async function MyReservationsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const reservations = await prisma.reservation.findMany({
    where: { userId: session.user.id },
    include: { restaurant: true }, // 予約に紐づく店舗情報も取得
    orderBy: { reservationDate: "asc" },
  });

  const now = Date.now();
  const upcoming = reservations.filter(
    (r) => r.status === "confirmed" && r.reservationDate.getTime() > now
  );
  const history = reservations.filter((r) => !upcoming.includes(r)).reverse();

  const Row = ({ r }: { r: (typeof reservations)[number] }) => (
    <li>
      <Link
        href={`/reservations/${r.id}`}
        className={`${ui.card} flex items-center justify-between gap-4 px-4 py-3 transition-colors hover:border-brand`}
      >
        <div className="min-w-0">
          <p className="truncate font-medium text-ink">{r.restaurant.name}</p>
          <p className="tabular text-sm text-muted">
            {formatJstDateTime(r.reservationDate)} ／ {r.numberOfGuests}名
          </p>
          <p className="tabular text-xs text-muted">予約番号 {formatReservationCode(r.code)}</p>
        </div>
        <ReservationStatusBadge status={r.status} />
      </Link>
    </li>
  );

  return (
    <PageContainer width="medium">
      <h1 className="text-2xl font-bold text-ink">予約の確認</h1>

      <h2 className={`${ui.sectionTitle} mt-8 mb-3`}>これからの予約</h2>
      {upcoming.length === 0 ? (
        <div className="space-y-3">
          <p className="text-sm text-muted">これからの予約はありません。</p>
          <Link href="/" className={ui.btnPrimary}>お店を探す</Link>
        </div>
      ) : (
        <ul className="space-y-2">
          {upcoming.map((r) => <Row key={r.id} r={r} />)}
        </ul>
      )}

      {history.length > 0 && (
        <>
          <h2 className={`${ui.sectionTitle} mt-10 mb-3`}>過去・キャンセルした予約</h2>
          <ul className="space-y-2 opacity-90">
            {history.map((r) => <Row key={r.id} r={r} />)}
          </ul>
        </>
      )}
    </PageContainer>
  );
}
