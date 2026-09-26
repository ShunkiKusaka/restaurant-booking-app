import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "../../../auth.ts";
import { prisma } from "../../../lib/prisma.ts";
import { formatJstDateTime } from "../../../lib/datetime.ts";
import { canCustomerCancel } from "../../../lib/booking.ts";
import { formatReservationCode } from "../../../lib/reservation-code.ts";
import { cancelReservation } from "../../reservation-actions.ts";
import { Notice, PageContainer, ReservationStatusBadge, ui } from "../../components/ui.tsx";
import ConfirmButton from "../../components/ConfirmButton.tsx";

export default async function ReservationDetailPage({ params, searchParams }: PageProps<"/reservations/[id]">) {
  const { id } = await params;
  const { new: isNew } = await searchParams;

  const session = await auth();
  if (!session?.user) redirect("/login");

  const r = await prisma.reservation.findUnique({
    where: { id },
    include: { restaurant: true },
  });
  // 他人の予約は、存在しないものとして扱う
  if (!r || r.userId !== session.user.id) notFound();

  const upcoming = r.status === "confirmed" && r.reservationDate.getTime() > Date.now();
  const cancellable = upcoming && canCustomerCancel(r.reservationDate, r.restaurant.cancelDeadlineHours, new Date());

  return (
    <PageContainer width="medium">
      <Link href="/reservations" className="text-sm text-muted hover:text-ink">← 予約の一覧</Link>

      {isNew === "1" && (
        <div className="mt-4">
          <Notice>予約が完了しました。当日はお気をつけてお越しください。</Notice>
        </div>
      )}

      <section className={`${ui.card} mt-4 overflow-hidden`}>
        <div className="flex items-start justify-between gap-4 border-b border-line bg-paper/60 px-5 py-4">
          <div>
            <p className="text-xs text-muted">予約番号</p>
            <p className="tabular text-2xl font-bold tracking-wider text-ink">{formatReservationCode(r.code)}</p>
          </div>
          <ReservationStatusBadge status={r.status} />
        </div>
        <dl className="grid grid-cols-[6rem_1fr] gap-y-3 px-5 py-5 text-sm">
          <dt className="text-muted">お店</dt>
          <dd>
            <Link href={`/restaurants/${r.restaurantId}`} className="font-medium text-ink underline">
              {r.restaurant.name}
            </Link>
          </dd>
          <dt className="text-muted">日時</dt>
          <dd className="tabular font-medium text-ink">{formatJstDateTime(r.reservationDate)}</dd>
          <dt className="text-muted">人数</dt>
          <dd className="text-ink">{r.numberOfGuests}名</dd>
          <dt className="text-muted">ご利用の目的</dt>
          <dd className="text-ink">{r.occasion ?? "―"}</dd>
          <dt className="text-muted">ご要望</dt>
          <dd className="whitespace-pre-line text-ink">{r.note ?? "―"}</dd>
          <dt className="text-muted">電話番号</dt>
          <dd className="tabular text-ink">{r.guestPhone ?? "―"}</dd>
          <dt className="text-muted">お店の住所</dt>
          <dd className="text-ink">{r.restaurant.address}</dd>
        </dl>
      </section>

      {cancellable && (
        <form action={cancelReservation.bind(null, r.id)} className="mt-6">
          <p className="mb-3 text-sm text-muted">
            キャンセルは来店の{r.restaurant.cancelDeadlineHours}時間前までです。
          </p>
          <ConfirmButton message="この予約をキャンセルします。よろしいですか?" className={ui.btnDanger}>
            この予約をキャンセルする
          </ConfirmButton>
        </form>
      )}
      {upcoming && !cancellable && (
        <div className="mt-6">
          <Notice tone="info">
            キャンセル期限(来店の{r.restaurant.cancelDeadlineHours}時間前)を過ぎています。
            変更・キャンセルは、お店に直接お電話ください(
            <a href={`tel:${r.restaurant.phoneNumber}`} className="underline">{r.restaurant.phoneNumber}</a>
            )。
          </Notice>
        </div>
      )}
    </PageContainer>
  );
}
