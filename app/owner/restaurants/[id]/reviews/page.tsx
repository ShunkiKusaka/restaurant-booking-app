import Link from "next/link";
import { prisma } from "../../../../../lib/prisma.ts";
import { getOwnedRestaurant } from "../../../../../lib/owner.ts";
import { PageContainer, ui } from "../../../../components/ui.tsx";
import { RatingSummary } from "../../../../components/Stars.tsx";
import ReviewCard from "../../../../components/ReviewCard.tsx";
import ReplyForm from "./ReplyForm.tsx";

export default async function OwnerReviewsPage({ params }: PageProps<"/owner/restaurants/[id]/reviews">) {
  const { id } = await params;
  // 自分のお店でなければ、見つからない扱いになる
  const { restaurant } = await getOwnedRestaurant(id);

  // 店主には、運営が非表示にした口コミも(その旨を付けて)見せる
  const reviews = await prisma.review.findMany({
    where: { restaurantId: restaurant.id },
    include: {
      user: { select: { name: true } },
      reservation: { select: { reservationDate: true } },
    },
    orderBy: { createdAt: "desc" },
  });
  const unanswered = reviews.filter((r) => !r.ownerReply && !r.hidden).length;

  return (
    <PageContainer width="medium">
      <Link href="/owner/dashboard" className="text-sm text-muted hover:text-ink">← 店舗管理に戻る</Link>
      <h1 className="mt-3 text-2xl font-bold text-ink">{restaurant.name} の口コミ</h1>
      <div className="mt-2 flex flex-wrap items-center gap-4">
        <RatingSummary average={restaurant.ratingAverage} count={restaurant.reviewCount} />
        {unanswered > 0 && <span className="text-sm font-bold text-brand">未返信 {unanswered}件</span>}
      </div>

      <section className={`${ui.card} mt-6 px-5`}>
        {reviews.length === 0 ? (
          <p className="py-6 text-sm text-muted">まだ口コミはありません。</p>
        ) : (
          reviews.map((rv) => (
            <ReviewCard key={rv.id} review={rv}>
              {!rv.ownerReply && !rv.hidden && <ReplyForm reviewId={rv.id} />}
            </ReviewCard>
          ))
        )}
      </section>
    </PageContainer>
  );
}
