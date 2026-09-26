import Link from "next/link";
import { getOwnedRestaurant } from "../../../../../lib/owner.ts";
import { Notice, PageContainer, RestaurantStatusBadge } from "../../../../components/ui.tsx";
import SettingsForm from "./SettingsForm.tsx";

export default async function RestaurantSettingsPage({ params, searchParams }: PageProps<"/owner/restaurants/[id]/settings">) {
  const { id } = await params;
  const { saved } = await searchParams;
  const { restaurant } = await getOwnedRestaurant(id);

  return (
    <PageContainer width="medium">
      <Link href="/owner/dashboard" className="text-sm text-muted hover:text-ink">← 店舗管理</Link>
      <div className="mt-3 flex items-center gap-3">
        <h1 className="text-2xl font-bold text-ink">予約の設定</h1>
        <RestaurantStatusBadge status={restaurant.status} />
      </div>
      <p className="mt-1 text-sm text-muted">{restaurant.name}</p>

      {saved === "1" && (
        <div className="mt-4"><Notice>設定を保存しました。お客さんの予約画面にも反映されています。</Notice></div>
      )}

      <div className="mt-6">
        <SettingsForm
          restaurantId={restaurant.id}
          values={{
            name: restaurant.name,
            genre: restaurant.genre,
            description: restaurant.description,
            address: restaurant.address,
            phoneNumber: restaurant.phoneNumber,
            seatCount: restaurant.seatCount,
            openTime: restaurant.openTime,
            lastBookingTime: restaurant.lastBookingTime,
            closedWeekdays: restaurant.closedWeekdays,
            stayMinutes: restaurant.stayMinutes,
            maxPartySize: restaurant.maxPartySize,
            bookingDeadlineMinutes: restaurant.bookingDeadlineMinutes,
            cancelDeadlineHours: restaurant.cancelDeadlineHours,
          }}
        />
      </div>
    </PageContainer>
  );
}
