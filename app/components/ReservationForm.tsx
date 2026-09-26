"use client";

import { useActionState } from "react";
import { createReservation, type ReservationState } from "../actions.ts";

const initialState: ReservationState = {};

type Props = {
  restaurantId: string;
  seatCount: number;
  minDate: string;
};

export default function ReservationForm({ restaurantId, seatCount, minDate }: Props) {
  const [state, formAction, pending] = useActionState(createReservation, initialState);
  const maxGuests = Math.min(seatCount, 20);

  return (
    <form action={formAction} className="mt-4 space-y-2">
      <input type="hidden" name="restaurantId" value={restaurantId} />
      <label className="block text-xs text-gray-500">
        日付
        <input
          type="date"
          name="date"
          required
          min={minDate}
          className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900"
        />
      </label>
      <label className="block text-xs text-gray-500">
        時間
        <input
          type="time"
          name="time"
          required
          step={1800}
          className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900"
        />
      </label>
      <label className="block text-xs text-gray-500">
        人数
        <input
          type="number"
          name="guests"
          min={1}
          max={maxGuests}
          defaultValue={2}
          required
          className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900"
        />
      </label>

      {state.error && (
        <p role="alert" className="text-sm text-red-600">{state.error}</p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-lg bg-gray-900 py-2 text-sm font-medium text-white hover:bg-gray-700 transition-colors disabled:opacity-60"
      >
        {pending ? "予約しています…" : "予約する"}
      </button>
    </form>
  );
}
