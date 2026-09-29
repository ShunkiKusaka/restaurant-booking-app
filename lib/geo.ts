// 位置情報の計算(距離、範囲、URLの値の確認)。画面とサーバーのどちらからも使える。

export const RADIUS_CHOICES = [1, 3, 5, 10]; // 「現在地から○km以内」の選択肢
export const DEFAULT_RADIUS = 3;

export type LatLng = { lat: number; lng: number };

/** URLの lat / lng を確認する。日本の範囲外や数字でないものは null */
export function parseLatLng(lat: unknown, lng: unknown): LatLng | null {
  const la = Number(lat);
  const ln = Number(lng);
  if (!Number.isFinite(la) || !Number.isFinite(ln)) return null;
  if (la < 20 || la > 46 || ln < 122 || ln > 154) return null;
  return { lat: la, lng: ln };
}

export function parseRadius(value: unknown): number {
  const n = Number(value);
  return RADIUS_CHOICES.includes(n) ? n : DEFAULT_RADIUS;
}

/** 2点間の距離(km)。地球を球として計算する(ハバーサインの公式) */
export function distanceKm(a: LatLng, b: LatLng): number {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

/**
 * 中心から半径 radiusKm の円を囲む四角形。
 * データベースでまず四角形の中のお店だけに絞り、そのあと正確な距離で絞る。
 */
export function boundingBox(center: LatLng, radiusKm: number) {
  const dLat = radiusKm / 111.32;
  const dLng = radiusKm / (111.32 * Math.cos((center.lat * Math.PI) / 180));
  return {
    minLat: center.lat - dLat,
    maxLat: center.lat + dLat,
    minLng: center.lng - dLng,
    maxLng: center.lng + dLng,
  };
}

/** 「約350m」「約1.2km」 */
export function formatDistance(km: number): string {
  if (km < 1) return `約${Math.max(50, Math.round((km * 1000) / 50) * 50)}m`;
  return `約${km < 10 ? km.toFixed(1) : Math.round(km)}km`;
}
