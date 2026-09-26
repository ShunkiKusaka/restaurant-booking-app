import Link from "next/link";
import { getOwnedRestaurant } from "../../../../../../lib/owner.ts";
import { parseJstDateTime, todayJst } from "../../../../../../lib/datetime.ts";
import { ABSOLUTE_MAX_PARTY, slotTimes } from "../../../../../../lib/booking.ts";
import { PageContainer, ui } from "../../../../../components/ui.tsx";
import PhoneReservationForm from "./PhoneReservationForm.tsx";

export default async function NewPhoneReservationPage({ params, searchParams }: PageProps<"/owner/restaurants/[id]/reservations/new">) {
  const { id } = await params;
  const { date } = await searchParams;
  const { restaurant } = await getOwnedRestaurant(id);

  const today = todayJst();
  const defaultDate =
    typeof date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(date) && parseJstDateTime(date, "00:00") && date >= today
      ? date
      : today;

  return (
    <PageContainer width="medium">
      <Link href={`/owner/restaurants/${restaurant.id}/reservations?date=${defaultDate}`} className="text-sm text-muted hover:text-ink">
        ← 予約台帳
      </Link>
      <h1 className="mt-3 text-2xl font-bold text-ink">電話予約を登録</h1>
      <p className="mt-1 text-sm text-muted">
        {restaurant.name}。お店側の登録なので、Web予約の人数上限や締め切りに関係なく登録できます(席数は確認します)。
      </p>

      <section className={`${ui.card} mt-6 p-5 sm:p-6`}>
        <PhoneReservationForm
          restaurantId={restaurant.id}
          defaultDate={defaultDate}
          minDate={today}
          times={slotTimes(restaurant.openTime, restaurant.lastBookingTime)}
          maxGuests={Math.min(restaurant.seatCount, ABSOLUTE_MAX_PARTY)}
        />
      </section>
    </PageContainer>
  );
}
