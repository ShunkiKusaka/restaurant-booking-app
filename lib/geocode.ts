// 住所から緯度・経度を調べる(サーバー側だけで使う)。
// OpenStreetMap の Nominatim を使う。利用ルール:
//   ・1秒に1回まで ・アプリ名が分かる User-Agent を付ける ・結果は保存して使い回す
//   ・地図データの出典(© OpenStreetMap contributors)を表示する(フッターに表示している)
// お店の登録・設定の保存のときに、住所が変わった場合だけ呼ぶ(ページを開くたびには呼ばない)。
// 注意:"use server" は付けない。
import type { LatLng } from "./geo.ts";

const ENDPOINT = "https://nominatim.openstreetmap.org/search";
const USER_AGENT = "restaurant-booking-demo/1.0 (+https://github.com/ShunkiKusaka/restaurant-booking-app)";

// 都道府県+市区町村+町名まで(番地より前)。番地まででは見つからないときに使う
const TOWN_RE = /^((?:東京都|北海道|(?:京都|大阪)府|.{2,3}県)?.+?[市区町村][^\d０-９\-－ー−]*)/;

async function search(query: string): Promise<LatLng | null> {
  const url = `${ENDPOINT}?${new URLSearchParams({
    format: "jsonv2",
    limit: "1",
    countrycodes: "jp",
    "accept-language": "ja",
    q: query,
  })}`;
  const res = await fetch(url, {
    headers: { "User-Agent": USER_AGENT },
    signal: AbortSignal.timeout(5000),
    cache: "no-store",
  });
  if (!res.ok) return null;
  const data: unknown = await res.json();
  if (!Array.isArray(data) || data.length === 0) return null;
  const lat = Number(data[0]?.lat);
  const lng = Number(data[0]?.lon);
  return Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : null;
}

/** 住所の候補(まず番地まで、見つからなければ町名まで) */
export function geocodeQueries(address: string): string[] {
  const full = address.trim();
  const town = full.match(TOWN_RE)?.[1]?.trim();
  return town && town !== full ? [full, town] : [full];
}

/** 住所 → 緯度・経度。見つからない、または通信できないときは null(エラーにはしない) */
export async function geocodeAddress(address: string): Promise<LatLng | null> {
  const queries = geocodeQueries(address);
  for (const [i, q] of queries.entries()) {
    try {
      if (i > 0) await new Promise((r) => setTimeout(r, 1100)); // 1秒に1回まで
      const hit = await search(q);
      if (hit) return hit;
    } catch {
      return null;
    }
  }
  return null;
}
