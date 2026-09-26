"use client";

import Link from "next/link";
import { useActionState } from "react";
import { createReservation, type ReservationState } from "../../../actions.ts";
import { OCCASIONS } from "../../../../lib/labels.ts";
import { ui } from "../../../components/ui.tsx";

const initialState: ReservationState = {};

type Props = {
  restaurantId: string;
  date: string;
  time: string;
  guests: number;
  backHref: string;
  cancelDeadlineHours: number;
};

export default function ReserveForm({ restaurantId, date, time, guests, backHref, cancelDeadlineHours }: Props) {
  const [state, formAction, pending] = useActionState(createReservation, initialState);

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="restaurantId" value={restaurantId} />
      <input type="hidden" name="date" value={date} />
      <input type="hidden" name="time" value={time} />
      <input type="hidden" name="guests" value={guests} />

      <div>
        <label htmlFor="phone" className={ui.label}>
          電話番号 <span className="text-xs font-normal text-danger">必須</span>
        </label>
        <input
          id="phone"
          name="phone"
          type="tel"
          required
          autoComplete="tel"
          placeholder="090-1234-5678"
          className={ui.input}
        />
        <p className="mt-1 text-xs text-muted">当日、お店から連絡することがあります</p>
      </div>

      <div>
        <label htmlFor="occasion" className={ui.label}>ご利用の目的</label>
        <select id="occasion" name="occasion" defaultValue="食事" className={ui.input}>
          {OCCASIONS.map((o) => (
            <option key={o} value={o}>{o}</option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="note" className={ui.label}>ご要望</label>
        <textarea
          id="note"
          name="note"
          rows={3}
          maxLength={300}
          placeholder="アレルギー、お祝いのプレート、お子さま連れ など"
          className={ui.input}
        />
      </div>

      <p className="rounded-lg bg-paper px-4 py-3 text-xs leading-6 text-muted">
        キャンセルは、来店の{cancelDeadlineHours}時間前まで「予約の確認」画面からできます。
        それ以降は、お店に直接お電話ください。
      </p>

      {state.error && (
        <p role="alert" className="rounded-lg bg-danger-soft px-4 py-3 text-sm text-danger">
          {state.error}
        </p>
      )}

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Link href={backHref} className={ui.btnSecondary}>日時を選び直す</Link>
        <button type="submit" disabled={pending} className={ui.btnPrimary}>
          {pending ? "予約しています…" : "この内容で予約する"}
        </button>
      </div>
    </form>
  );
}
