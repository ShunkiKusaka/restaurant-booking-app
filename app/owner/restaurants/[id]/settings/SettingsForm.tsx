"use client";

import { useActionState } from "react";
import { updateRestaurantSettings, type OwnerFormState } from "../../../owner-actions.ts";
import { GENRES, WEEKDAY_LABELS } from "../../../../../lib/labels.ts";
import { ui } from "../../../../components/ui.tsx";

const initialState: OwnerFormState = {};

// 06:00〜23:30 を30分刻みで
const TIME_OPTIONS = Array.from({ length: 36 }, (_, i) => {
  const m = 6 * 60 + i * 30;
  return `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
});
const STAY_OPTIONS = [60, 90, 120, 150, 180];
const BOOKING_DEADLINE_OPTIONS = [
  { v: 0, t: "直前まで" },
  { v: 30, t: "30分前まで" },
  { v: 60, t: "1時間前まで" },
  { v: 120, t: "2時間前まで" },
  { v: 180, t: "3時間前まで" },
  { v: 1440, t: "前日の同じ時刻まで" },
];
const CANCEL_DEADLINE_OPTIONS = [
  { v: 0, t: "直前まで" },
  { v: 3, t: "3時間前まで" },
  { v: 6, t: "6時間前まで" },
  { v: 12, t: "12時間前まで" },
  { v: 24, t: "24時間前まで" },
  { v: 48, t: "2日前まで" },
  { v: 72, t: "3日前まで" },
];

export type SettingsValues = {
  name: string;
  genre: string | null;
  description: string | null;
  address: string;
  phoneNumber: string;
  seatCount: number;
  openTime: string;
  lastBookingTime: string;
  closedWeekdays: number[];
  stayMinutes: number;
  maxPartySize: number;
  bookingDeadlineMinutes: number;
  cancelDeadlineHours: number;
};

export default function SettingsForm({ restaurantId, values }: { restaurantId: string; values: SettingsValues }) {
  const [state, formAction, pending] = useActionState(
    updateRestaurantSettings.bind(null, restaurantId),
    initialState
  );

  return (
    <form action={formAction} className="space-y-8">
      <fieldset className={`${ui.card} space-y-4 p-5 sm:p-6`}>
        <legend className="px-1 text-base font-bold text-ink">店舗の情報</legend>
        <div className="grid gap-4 sm:grid-cols-[1fr_12rem]">
          <div>
            <label htmlFor="name" className={ui.label}>店舗名</label>
            <input id="name" name="name" required maxLength={80} defaultValue={values.name} className={ui.input} />
          </div>
          <div>
            <label htmlFor="genre" className={ui.label}>ジャンル</label>
            <select id="genre" name="genre" defaultValue={values.genre ?? ""} className={ui.input}>
              <option value="">未設定</option>
              {GENRES.map((g) => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <label htmlFor="description" className={ui.label}>紹介文</label>
          <textarea id="description" name="description" rows={3} maxLength={500} defaultValue={values.description ?? ""} className={ui.input} />
        </div>
        <div>
          <label htmlFor="address" className={ui.label}>住所</label>
          <input id="address" name="address" required maxLength={200} defaultValue={values.address} className={ui.input} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="phoneNumber" className={ui.label}>電話番号</label>
            <input id="phoneNumber" name="phoneNumber" type="tel" required defaultValue={values.phoneNumber} className={ui.input} />
          </div>
          <div>
            <label htmlFor="seatCount" className={ui.label}>席数</label>
            <input id="seatCount" name="seatCount" type="number" min={1} max={1000} required defaultValue={values.seatCount} className={ui.input} />
          </div>
        </div>
      </fieldset>

      <fieldset className={`${ui.card} space-y-5 p-5 sm:p-6`}>
        <legend className="px-1 text-base font-bold text-ink">予約の受付</legend>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="openTime" className={ui.label}>受付開始</label>
            <select id="openTime" name="openTime" defaultValue={values.openTime} className={ui.input}>
              {TIME_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="lastBookingTime" className={ui.label}>最終受付</label>
            <select id="lastBookingTime" name="lastBookingTime" defaultValue={values.lastBookingTime} className={ui.input}>
              {TIME_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        </div>
        <p className="-mt-2 text-xs text-muted">30分ごとに、受付開始から最終受付までの予約枠が作られます。</p>

        <fieldset>
          <legend className={ui.label}>定休日</legend>
          <div className="flex flex-wrap gap-2">
            {WEEKDAY_LABELS.map((w, i) => (
              <label
                key={w}
                className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-line px-3 py-2 text-sm has-[:checked]:border-brand has-[:checked]:bg-brand-soft"
              >
                <input type="checkbox" name="closedWeekdays" value={i} defaultChecked={values.closedWeekdays.includes(i)} />
                {w}
              </label>
            ))}
          </div>
        </fieldset>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="stayMinutes" className={ui.label}>1組の滞在時間</label>
            <select id="stayMinutes" name="stayMinutes" defaultValue={values.stayMinutes} className={ui.input}>
              {STAY_OPTIONS.map((m) => <option key={m} value={m}>{m}分</option>)}
            </select>
            <p className="mt-1 text-xs text-muted">空席の計算に使います</p>
          </div>
          <div>
            <label htmlFor="maxPartySize" className={ui.label}>Web予約の1組の最大人数</label>
            <input id="maxPartySize" name="maxPartySize" type="number" min={1} max={50} required defaultValue={values.maxPartySize} className={ui.input} />
            <p className="mt-1 text-xs text-muted">これより多い人数は、電話で受け付けます</p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="bookingDeadlineMinutes" className={ui.label}>予約の締め切り</label>
            <select id="bookingDeadlineMinutes" name="bookingDeadlineMinutes" defaultValue={values.bookingDeadlineMinutes} className={ui.input}>
              {BOOKING_DEADLINE_OPTIONS.map((o) => <option key={o.v} value={o.v}>来店の{o.t}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="cancelDeadlineHours" className={ui.label}>お客さん自身でのキャンセル</label>
            <select id="cancelDeadlineHours" name="cancelDeadlineHours" defaultValue={values.cancelDeadlineHours} className={ui.input}>
              {CANCEL_DEADLINE_OPTIONS.map((o) => <option key={o.v} value={o.v}>来店の{o.t}</option>)}
            </select>
          </div>
        </div>
      </fieldset>

      {state.error && (
        <p role="alert" className="rounded-lg bg-danger-soft px-4 py-3 text-sm text-danger">{state.error}</p>
      )}

      <div className="flex justify-end">
        <button type="submit" disabled={pending} className={ui.btnPrimary}>
          {pending ? "保存しています…" : "設定を保存する"}
        </button>
      </div>
    </form>
  );
}
