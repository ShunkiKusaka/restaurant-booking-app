"use client";

import { useActionState } from "react";
import { replyToReview, type ReplyFormState } from "../../../review-actions.ts";
import { OWNER_REPLY_MAX } from "../../../../../lib/reviews.ts";
import { ui } from "../../../../components/ui.tsx";

const initialState: ReplyFormState = {};

export default function ReplyForm({ reviewId }: { reviewId: string }) {
  const [state, formAction, pending] = useActionState(replyToReview, initialState);
  if (state.done) return null; // 返信が済んだら、ページの再表示で返信内容が出る

  return (
    <form action={formAction} className="mt-3 space-y-2">
      <input type="hidden" name="reviewId" value={reviewId} />
      <label htmlFor={`reply-${reviewId}`} className="block text-xs font-bold text-muted">
        お店からの返信(1回だけ送れます)
      </label>
      <textarea
        id={`reply-${reviewId}`}
        name="reply"
        required
        rows={3}
        maxLength={OWNER_REPLY_MAX}
        placeholder="ご来店ありがとうございました。"
        className={ui.input}
      />
      {state.error && <p role="alert" className="text-sm text-danger">{state.error}</p>}
      <button type="submit" disabled={pending} className={`${ui.btnSecondary} py-2`}>
        {pending ? "送信しています…" : "返信する"}
      </button>
    </form>
  );
}
