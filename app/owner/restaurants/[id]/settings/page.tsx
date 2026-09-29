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

      {/* 地図上の位置(「現在地から探す」で使う) */}
      <div className="mt-4">
        {restaurant.latitude === null || restaurant.longitude === null ? (
          <Notice tone="info">
            この住所の地図上の位置が見つかりませんでした。このままだと、お客さんが「現在地から探す」を使ったときに表示されません。
            住所を「東京都渋谷区道玄坂1-2-3」のように、都道府県から入力して保存し直してください。
          </Notice>
        ) : (
          <p className="text-xs text-muted">
            地図上の位置:登録済み(
            <a
              href={`https://www.openstreetmap.org/?mlat=${restaurant.latitude}&mlon=${restaurant.longitude}#map=17/${restaurant.latitude}/${restaurant.longitude}`}
              target="_blank"
              rel="noopener noreferrer"
              className="underline"
            >
              地図で確認する
            </a>
            )
          </p>
        )}
      </div>

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
