"use client";

import { useActionState } from "react";
import { createRestaurant, type RestaurantFormState } from "../../restaurant-actions.ts";
import { GENRES } from "../../../../lib/labels.ts";
import { ui } from "../../../components/ui.tsx";

const initialState: RestaurantFormState = {};

export default function RestaurantForm() {
  const [state, formAction, pending] = useActionState(createRestaurant, initialState);

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <label htmlFor="name" className={ui.label}>店舗名</label>
        <input id="name" type="text" name="name" required maxLength={80} className={ui.input} />
      </div>

      <div>
        <label htmlFor="genre" className={ui.label}>ジャンル</label>
        <select id="genre" name="genre" defaultValue="" className={ui.input}>
          <option value="">選択してください</option>
          {GENRES.map((g) => (
            <option key={g} value={g}>{g}</option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="description" className={ui.label}>紹介文</label>
        <textarea id="description" name="description" rows={3} maxLength={500} className={ui.input} />
      </div>

      <div>
        <label htmlFor="address" className={ui.label}>住所</label>
        <input id="address" type="text" name="address" required maxLength={200} className={ui.input} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="phoneNumber" className={ui.label}>電話番号</label>
          <input id="phoneNumber" type="tel" name="phoneNumber" required placeholder="03-1234-5678" className={ui.input} />
        </div>
        <div>
          <label htmlFor="seatCount" className={ui.label}>席数</label>
          <input id="seatCount" type="number" name="seatCount" min={1} max={1000} required className={ui.input} />
        </div>
      </div>

      <p className="text-xs text-muted">営業時間や定休日は、登録のあと「予約の設定」で変更できます。</p>

      {state.error && (
        <p role="alert" className="rounded-lg bg-danger-soft px-4 py-3 text-sm text-danger">{state.error}</p>
      )}

      <button type="submit" disabled={pending} className={`${ui.btnPrimary} w-full`}>
        {pending ? "登録しています…" : "登録する(審査待ちになります)"}
      </button>
    </form>
  );
}
