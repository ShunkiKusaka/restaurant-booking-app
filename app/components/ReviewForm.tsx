"use client";

import { useActionState } from "react";
import { saveReview, type ReviewFormState } from "../review-actions.ts";
import { RATING_LABELS, REVIEW_COMMENT_MAX } from "../../lib/reviews.ts";
import { ui } from "./ui.tsx";

const initialState: ReviewFormState = {};

export default function ReviewForm({
  reservationId,
  defaultRating,
  defaultComment,
  submitLabel = "口コミを投稿する",
}: {
  reservationId: string;
  defaultRating?: number;
  defaultComment?: string;
  submitLabel?: string;
}) {
  const [state, formAction, pending] = useActionState(saveReview, initialState);

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="reservationId" value={reservationId} />

      <fieldset>
        <legend className={ui.label}>満足度</legend>
        <div className="grid grid-cols-5 gap-1.5">
          {[1, 2, 3, 4, 5].map((n) => (
            <label
              key={n}
              className="flex min-h-14 cursor-pointer flex-col items-center justify-center rounded-lg border border-line bg-surface text-muted transition-colors has-[:checked]:border-accent has-[:checked]:bg-[#f7ecd6] has-[:checked]:text-ink has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-brand"
            >
              <input
                type="radio"
                name="rating"
                value={n}
                defaultChecked={defaultRating === n}
                required
                className="sr-only"
              />
              <span className="tabular text-base font-bold">
                <span aria-hidden="true" className="text-accent">★</span>{n}
              </span>
              <span className="text-[11px]">{RATING_LABELS[n]}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <div>
        <label htmlFor={`comment-${reservationId}`} className={ui.label}>コメント</label>
        <textarea
          id={`comment-${reservationId}`}
          name="comment"
          required
          rows={5}
          maxLength={REVIEW_COMMENT_MAX}
          defaultValue={defaultComment}
          placeholder="お料理やお店の雰囲気、接客など、よかったところを教えてください"
          className={ui.input}
        />
        <p className="mt-1 text-xs text-muted">{REVIEW_COMMENT_MAX}文字まで。名字だけが表示されます(例:田中 さん)。</p>
      </div>

      {state.error && <p role="alert" className="text-sm text-danger">{state.error}</p>}

      <button type="submit" disabled={pending} className={ui.btnPrimary}>
        {pending ? "送信しています…" : submitLabel}
      </button>
    </form>
  );
}
