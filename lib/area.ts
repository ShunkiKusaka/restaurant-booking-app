// 住所から「渋谷区 道玄坂」のような短いエリア名を作る(一覧のカード用)。
// 都道府県と番地を省き、市区町村と町名だけを残す。形が合わない住所は、そのまま返す。
const AREA_RE = /^(?:東京都|北海道|(?:京都|大阪)府|.{2,3}県)?(.+?[市区町村])([^\d０-９\-－ー−]*)/;

export function shortArea(address: string): string {
  const m = address.trim().match(AREA_RE);
  if (!m) return address;
  const city = m[1];
  const town = m[2].trim();
  return town ? `${city} ${town}` : city;
}
