"use client";

import { useActionState } from "react";
import { createRestaurant, type RestaurantFormState } from "../../restaurant-actions.ts";

const initialState: RestaurantFormState = {};
const inputClass = "w-full border border-gray-300 rounded-lg px-3 py-2 text-sm";

export default function RestaurantForm() {
  const [state, formAction, pending] = useActionState(createRestaurant, initialState);

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <label htmlFor="name" className="block text-sm text-gray-600 mb-1">店舗名</label>
        <input id="name" type="text" name="name" required maxLength={80} className={inputClass} />
      </div>

      <div>
        <label htmlFor="description" className="block text-sm text-gray-600 mb-1">紹介文</label>
        <textarea id="description" name="description" rows={3} maxLength={500} className={inputClass} />
      </div>

      <div>
        <label htmlFor="address" className="block text-sm text-gray-600 mb-1">住所</label>
        <input id="address" type="text" name="address" required maxLength={200} className={inputClass} />
      </div>

      <div>
        <label htmlFor="phoneNumber" className="block text-sm text-gray-600 mb-1">電話番号</label>
        <input
          id="phoneNumber"
          type="tel"
          name="phoneNumber"
          required
          placeholder="03-1234-5678"
          className={inputClass}
        />
      </div>

      <div>
        <label htmlFor="seatCount" className="block text-sm text-gray-600 mb-1">席数</label>
        <input id="seatCount" type="number" name="seatCount" min={1} max={1000} required className={inputClass} />
      </div>

      {state.error && (
        <p role="alert" className="text-sm text-red-600">{state.error}</p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-lg bg-gray-900 py-2 text-sm font-medium text-white hover:bg-gray-700 transition-colors disabled:opacity-60"
      >
        {pending ? "登録しています…" : "登録する(審査待ちになります)"}
      </button>
    </form>
  );
}
