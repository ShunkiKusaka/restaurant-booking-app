import Link from "next/link";
import { auth } from "../../../auth.ts";
import { prisma } from "../../../lib/prisma.ts";
import { redirect } from "next/navigation";
import { setReviewHidden, updateRestaurantStatus } from "../../admin-actions.ts";
import { reviewerName } from "../../../lib/reviews.ts";
import { Stars } from "../../components/Stars.tsx";
import { formatJstDateTime } from "../../../lib/datetime.ts";
import { PageContainer, RestaurantStatusBadge, ui } from "../../components/ui.tsx";
import ConfirmButton from "../../components/ConfirmButton.tsx";

export default async function AdminDashboard() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }
  if (session.user.role !== "admin") {
    redirect("/");
  }

  // 集計と一覧は互いに関係ないので、同時に問い合わせる
  const [restaurants, totalRestaurants, pendingCount, upcomingReservations, totalUsers, recentReviews] = await Promise.all([
    prisma.restaurant.findMany({
      include: { owner: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.restaurant.count(),
    prisma.restaurant.count({ where: { status: "pending" } }),
    prisma.reservation.count({ where: { status: "confirmed", reservationDate: { gte: new Date() } } }),
    prisma.user.count(),
    // 最近の口コミ(非表示にしたものも含む)
    prisma.review.findMany({
      include: { restaurant: { select: { name: true } }, user: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
      take: 30,
    }),
  ]);

  const pending = restaurants.filter((r) => r.status === "pending");
  const others = restaurants.filter((r) => r.status !== "pending");

  const stats = [
    { k: "登録店舗", v: totalRestaurants },
    { k: "審査待ち", v: pendingCount, highlight: pendingCount > 0 },
    { k: "これからの予約", v: upcomingReservations },
    { k: "利用者数", v: totalUsers },
  ];

  return (
    <PageContainer>
      <h1 className="text-2xl font-bold text-ink">運営管理</h1>

      <dl className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {stats.map((s) => (
          <div key={s.k} className={`${ui.card} p-4`}>
            <dt className="text-xs text-muted">{s.k}</dt>
            <dd className={`tabular mt-1 text-2xl font-bold ${s.highlight ? "text-accent" : "text-ink"}`}>{s.v}</dd>
          </div>
        ))}
      </dl>

      <h2 className={`${ui.sectionTitle} mt-10 mb-3`}>審査待ちの店舗</h2>
      {pending.length === 0 ? (
        <p className="text-sm text-muted">審査待ちの店舗はありません。</p>
      ) : (
        <ul className="space-y-2">
          {pending.map((r) => (
            <li key={r.id} className={`${ui.card} flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between`}>
              <div className="min-w-0">
                <p className="font-medium text-ink">
                  {r.name}
                  {r.genre && <span className="ml-2 text-sm font-normal text-muted">{r.genre}</span>}
                </p>
                <p className="text-sm text-muted">
                  {r.address} ／ {r.seatCount}席 ／ オーナー: {r.owner.name}
                </p>
                <p className="text-xs text-muted">申請 {formatJstDateTime(r.createdAt)}</p>
                <Link href={`/restaurants/${r.id}`} className="text-xs text-muted underline">
                  ページを確認
                </Link>
              </div>
              <div className="flex shrink-0 gap-2">
                <form action={updateRestaurantStatus.bind(null, r.id, "approved")}>
                  <button type="submit" className={`${ui.btnPrimary} px-3 py-1.5`}>承認</button>
                </form>
                <form action={updateRestaurantStatus.bind(null, r.id, "rejected")}>
                  <ConfirmButton message={`「${r.name}」を却下します。よろしいですか?`} className={`${ui.btnSecondary} px-3 py-1.5`}>
                    却下
                  </ConfirmButton>
                </form>
              </div>
            </li>
          ))}
        </ul>
      )}

      <h2 className={`${ui.sectionTitle} mt-10 mb-3`}>すべての店舗</h2>
      <ul className="space-y-2">
        {others.map((r) => (
          <li key={r.id} className={`${ui.card} flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between`}>
            <div className="min-w-0">
              <p className="font-medium text-ink">{r.name}</p>
              <p className="text-sm text-muted">{r.address} ／ オーナー: {r.owner.name}</p>
            </div>
            <div className="flex shrink-0 items-center gap-3">
              <RestaurantStatusBadge status={r.status} />
              {r.status === "approved" ? (
                <form action={updateRestaurantStatus.bind(null, r.id, "rejected")}>
                  <ConfirmButton message={`「${r.name}」の公開を停止します。よろしいですか?`} className="text-sm text-muted underline">
                    公開を停止
                  </ConfirmButton>
                </form>
              ) : (
                <form action={updateRestaurantStatus.bind(null, r.id, "approved")}>
                  <button type="submit" className="text-sm text-brand underline">承認する</button>
                </form>
              )}
            </div>
          </li>
        ))}
      </ul>

      <h2 className={`${ui.sectionTitle} mt-10 mb-1`}>最近の口コミ</h2>
      <p className="mb-3 text-xs text-muted">
        不適切な口コミは非表示にできます。非表示にした口コミは、お店の平均点にも入りません。
      </p>
      {recentReviews.length === 0 ? (
        <p className="text-sm text-muted">口コミはまだありません。</p>
      ) : (
        <ul className="space-y-2">
          {recentReviews.map((rv) => (
            <li
              key={rv.id}
              className={`${ui.card} flex flex-col gap-3 p-4 sm:flex-row sm:items-start sm:justify-between ${rv.hidden ? "opacity-70" : ""}`}
            >
              <div className="min-w-0">
                <p className="flex flex-wrap items-center gap-2 text-sm">
                  <Stars value={rv.rating} />
                  <span className="font-medium text-ink">{rv.restaurant.name}</span>
                  <span className="text-muted">{reviewerName(rv.user.name)}</span>
                  {rv.hidden && (
                    <span className="rounded bg-danger-soft px-2 py-0.5 text-xs font-bold text-danger">非表示中</span>
                  )}
                </p>
                <p className="mt-1 line-clamp-3 whitespace-pre-line text-sm text-ink">{rv.comment}</p>
                <p className="mt-1 text-xs text-muted">投稿 {formatJstDateTime(rv.createdAt)}</p>
              </div>
              <form action={setReviewHidden.bind(null, rv.id, !rv.hidden)} className="shrink-0">
                {rv.hidden ? (
                  <button type="submit" className="text-sm text-brand underline">再表示する</button>
                ) : (
                  <ConfirmButton message="この口コミを非表示にします。よろしいですか?" className="text-sm text-muted underline">
                    非表示にする
                  </ConfirmButton>
                )}
              </form>
            </li>
          ))}
        </ul>
      )}
    </PageContainer>
  );
}
