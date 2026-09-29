// 口コミ1件の表示(お店のページ・店主の口コミ一覧で使う)
import { toJstDateString } from "../../lib/datetime.ts";
import { reviewerName } from "../../lib/reviews.ts";
import { Stars } from "./Stars.tsx";

export type ReviewForCard = {
  rating: number;
  comment: string;
  isDemo: boolean;
  hidden: boolean;
  ownerReply: string | null;
  user: { name: string };
  reservation: { reservationDate: Date };
};

function visitMonth(d: Date): string {
  const [y, m] = toJstDateString(d).split("-").map(Number);
  return `${y}年${m}月`;
}

export default function ReviewCard({
  review,
  children,
}: {
  review: ReviewForCard;
  children?: React.ReactNode; // 店主の返信フォームなど、下に足すもの
}) {
  return (
    <article className="border-b border-line py-5 last:border-b-0">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <Stars value={review.rating} className="text-base" />
        <span className="text-sm font-bold text-ink">{reviewerName(review.user.name)}</span>
        <span className="text-xs text-muted">{visitMonth(review.reservation.reservationDate)}に来店</span>
        {review.hidden && (
          <span className="rounded bg-danger-soft px-2 py-0.5 text-xs font-bold text-danger">運営が非表示にしています</span>
        )}
      </div>
      <p className="mt-2 whitespace-pre-line text-sm leading-7 text-ink">{review.comment}</p>
      {review.isDemo && <p className="mt-1 text-xs text-muted">※ デモ用の架空の口コミです</p>}

      {review.ownerReply && (
        <div className="mt-3 rounded-lg bg-paper px-4 py-3">
          <p className="text-xs font-bold text-muted">お店からの返信</p>
          <p className="mt-1 whitespace-pre-line text-sm leading-7 text-ink">{review.ownerReply}</p>
        </div>
      )}
      {children}
    </article>
  );
}
