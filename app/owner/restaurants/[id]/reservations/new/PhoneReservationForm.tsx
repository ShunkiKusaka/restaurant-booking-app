"use client";

import Link from "next/link";
import { useActionState } from "react";
import { createPhoneReservation, type OwnerFormState } from "../../../../owner-actions.ts";
import { OCCASIONS } from "../../../../../../lib/labels.ts";
import { ui } from "../../../../../components/ui.tsx";

const initialState: OwnerFormState = {};

type Props = {
  restaurantId: string;
  defaultDate: string;
  minDate: string;
  times: string[];
  maxGuests: number;
};

export default function PhoneReservationForm({ restaurantId, defaultDate, minDate, times, maxGuests }: Props) {
  const [state, formAction, pending] = useActionState(
    createPhoneReservation.bind(null, restaurantId),
    initialState
  );

  return (
    <form action={formAction} className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label htmlFor="date" className={ui.label}>日付</label>
          <input id="date" type="date" name="date" required defaultValue={defaultDate} min={minDate} className={ui.input} />
        </div>
        <div>
          <label htmlFor="time" className={ui.label}>時間</label>
          <select id="time" name="time" required className={ui.input}>
            {times.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="guests" className={ui.label}>人数</label>
          <select id="guests" name="guests" defaultValue={2} className={ui.input}>
            {Array.from({ length: maxGuests }, (_, i) => i + 1).map((n) => (
              <option key={n} value={n}>{n}名</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="guestName" className={ui.label}>
            お名前 <span className="text-xs font-normal text-danger">必須</span>
          </label>
          <input id="guestName" name="guestName" required maxLength={50} placeholder="山田" className={ui.input} />
        </div>
        <div>
          <label htmlFor="guestPhone" className={ui.label}>電話番号</label>
          <input id="guestPhone" name="guestPhone" type="tel" placeholder="090-1234-5678" className={ui.input} />
        </div>
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
        <label htmlFor="note" className={ui.label}>メモ・ご要望</label>
        <textarea id="note" name="note" rows={3} maxLength={300} placeholder="アレルギー、席の希望など" className={ui.input} />
      </div>

      {state.error && (
        <p role="alert" className="rounded-lg bg-danger-soft px-4 py-3 text-sm text-danger">{state.error}</p>
      )}

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Link href={`/owner/restaurants/${restaurantId}/reservations?date=${defaultDate}`} className={ui.btnSecondary}>
          台帳に戻る
        </Link>
        <button type="submit" disabled={pending} className={ui.btnPrimary}>
          {pending ? "登録しています…" : "予約を登録する"}
        </button>
      </div>
    </form>
  );
}
