import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "../../../../auth.ts";
import { prisma } from "../../../../lib/prisma.ts";
import { formatJstDateTime, parseJstDateTime } from "../../../../lib/datetime.ts";
import { checkBookingRequest } from "../../../../lib/booking.ts";
import { Notice, PageContainer, ui } from "../../../components/ui.tsx";
import ReserveForm from "./ReserveForm.tsx";

function first(v: string | string[] | undefined): string {
  return (Array.isArray(v) ? v[0] : v) ?? "";
}

export default async function ReservePage({ params, searchParams }: PageProps<"/restaurants/[id]/reserve">) {
  const { id } = await params;
  const sp = await searchParams;
  const date = first(sp.date);
  const time = first(sp.time);
  const guests = Number(first(sp.guests));

  const session = await auth();
  if (!session?.user) {
    const back = `/restaurants/${id}/reserve?date=${date}&time=${time}&guests=${guests}`;
    redirect(`/login?callbackUrl=${encodeURIComponent(back)}`);
  }

  const restaurant = await prisma.restaurant.findUnique({ where: { id } });
  if (!restaurant || restaurant.status !== "approved") notFound();

  const backHref = `/restaurants/${id}?date=${date}&guests=${Number.isInteger(guests) ? guests : 2}`;
  const problem = checkBookingRequest(restaurant, date, time, guests, new Date());
  const start = parseJstDateTime(date, time);

  return (
    <PageContainer width="medium">
      <Link href={backHref} className="text-sm text-muted hover:text-ink">← 空き状況に戻る</Link>
      <h1 className="mt-4 text-2xl font-bold text-ink">予約内容の入力</h1>

      {session.user.role !== "customer" ? (
        <div className="mt-6">
          <Notice tone="info">予約は一般ユーザーのアカウントで行えます。</Notice>
        </div>
      ) : problem || !start ? (
        <div className="mt-6 space-y-4">
          <Notice tone="error">{problem ?? "日時を選び直してください"}</Notice>
          <Link href={backHref} className={ui.btnSecondary}>空き状況に戻る</Link>
        </div>
      ) : (
        <div className="mt-6 grid gap-6 md:grid-cols-[1fr_16rem]">
          <section className={`${ui.card} p-5 sm:p-6`}>
            <ReserveForm
              restaurantId={restaurant.id}
              date={date}
              time={time}
              guests={guests}
              backHref={backHref}
              cancelDeadlineHours={restaurant.cancelDeadlineHours}
            />
          </section>

          <aside className={`${ui.card} h-fit p-5 md:order-first md:col-start-2 md:row-start-1`}>
            <h2 className="text-sm font-bold text-ink">予約内容</h2>
            <dl className="mt-3 space-y-3 text-sm">
              <div>
                <dt className="text-muted">お店</dt>
                <dd className="font-medium text-ink">{restaurant.name}</dd>
              </div>
              <div>
                <dt className="text-muted">日時</dt>
                <dd className="tabular font-medium text-ink">{formatJstDateTime(start)}</dd>
              </div>
              <div>
                <dt className="text-muted">人数</dt>
                <dd className="font-medium text-ink">{guests}名</dd>
              </div>
              <div>
                <dt className="text-muted">お名前</dt>
                <dd className="text-ink">{session.user.name} 様</dd>
              </div>
            </dl>
          </aside>
        </div>
      )}
    </PageContainer>
  );
}
