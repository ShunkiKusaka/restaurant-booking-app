// 予約番号。読み間違えやすい文字(0/O、1/I/L)を除いた8文字。
const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

export function generateReservationCode(): string {
  const bytes = new Uint8Array(8);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => ALPHABET[b % ALPHABET.length]).join("");
}

/** 表示用:"ABCD2345" → "ABCD-2345" */
export function formatReservationCode(code: string | null | undefined): string {
  if (!code) return "―";
  return code.length === 8 ? `${code.slice(0, 4)}-${code.slice(4)}` : code;
}
