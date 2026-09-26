// デモ用データの投入・リセット。
// 何回実行しても同じ状態に戻る(デモ用アカウントとその店舗・予約だけを作り直す)。
//   npx prisma db seed
// デモ用アカウントのパスワードはすべて password123(ログイン画面のボタンからも入れる)。
import { PrismaClient } from "../app/generated/prisma/client.ts";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import { parseJstDateTime, todayJst } from "../lib/datetime.ts";
import { addDays, isClosedDay } from "../lib/booking.ts";
import { generateReservationCode } from "../lib/reservation-code.ts";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const DEMO_USERS = [
  { email: "admin@example.com", name: "運営 太郎", role: "admin" },
  { email: "owner@example.com", name: "日向 誠", role: "owner" },
  { email: "customer@example.com", name: "田中 花子", role: "customer" },
  { email: "customer2@example.com", name: "佐藤 健", role: "customer" },
] as const;

const RESTAURANTS = [
  {
    name: "焼肉 ひかり",
    genre: "焼肉",
    description: "厳選した国産黒毛和牛を、一頭買いならではの価格で。掘りごたつの個室もあります。",
    address: "東京都渋谷区道玄坂1-2-3",
    phoneNumber: "03-1234-5678",
    seatCount: 30,
    openTime: "17:00",
    lastBookingTime: "21:30",
    closedWeekdays: [2],
    stayMinutes: 120,
    maxPartySize: 8,
    cancelDeadlineHours: 24,
    status: "approved",
  },
  {
    name: "トラットリア ベッラ",
    genre: "イタリアン",
    description: "薪窯で焼くナポリピッツァと、自家製の手打ちパスタ。ランチからディナーまで通しで営業しています。",
    address: "東京都新宿区新宿3-4-5",
    phoneNumber: "03-2345-6789",
    seatCount: 24,
    openTime: "11:30",
    lastBookingTime: "20:30",
    closedWeekdays: [1],
    stayMinutes: 90,
    maxPartySize: 6,
    cancelDeadlineHours: 12,
    status: "approved",
  },
  {
    name: "鮨 みなと",
    genre: "寿司",
    description: "カウンター10席だけの小さな鮨店。その日に仕入れた魚で、おまかせのみをお出しします。",
    address: "東京都中央区銀座6-7-8",
    phoneNumber: "03-3456-7890",
    seatCount: 10,
    openTime: "17:30",
    lastBookingTime: "20:30",
    closedWeekdays: [0, 3],
    stayMinutes: 120,
    maxPartySize: 4,
    cancelDeadlineHours: 48,
    status: "approved",
  },
  {
    name: "大衆酒場 あかり",
    genre: "居酒屋",
    description: "駅から徒歩1分。最大40名までの宴会もお受けします。",
    address: "東京都豊島区西池袋1-9-9",
    phoneNumber: "03-4567-8901",
    seatCount: 60,
    openTime: "17:00",
    lastBookingTime: "22:30",
    closedWeekdays: [],
    stayMinutes: 120,
    maxPartySize: 20,
    cancelDeadlineHours: 6,
    status: "approved",
  },
  {
    name: "喫茶 こもれび",
    genre: "カフェ",
    description: "自家焙煎のコーヒーと、季節のタルト。(審査中の店舗のサンプルです)",
    address: "東京都武蔵野市吉祥寺本町2-1-1",
    phoneNumber: "0422-12-3456",
    seatCount: 16,
    openTime: "10:00",
    lastBookingTime: "17:00",
    closedWeekdays: [4],
    stayMinutes: 90,
    maxPartySize: 4,
    cancelDeadlineHours: 3,
    status: "pending",
  },
];

// 電話予約のお客さんの名前
const PHONE_GUESTS = ["山本", "中村", "小林", "加藤", "吉田", "山田", "松本", "井上", "木村", "林"];
const NOTES = [
  null,
  null,
  "えびアレルギーの方が1名います",
  "誕生日なので、デザートプレートをお願いします",
  "ベビーカーで伺います",
  null,
  "窓側の席を希望します",
];

async function main() {
  const hashedPassword = await bcrypt.hash("password123", 10);

  // ---- デモ用アカウント(あれば更新、なければ作成) ----
  const users: Record<string, { id: string }> = {};
  for (const u of DEMO_USERS) {
    users[u.email] = await prisma.user.upsert({
      where: { email: u.email },
      update: { name: u.name, role: u.role, password: hashedPassword },
      create: { email: u.email, name: u.name, role: u.role, password: hashedPassword },
    });
  }
  const owner = users["owner@example.com"];
  const customer = users["customer@example.com"];
  const customer2 = users["customer2@example.com"];

  // ---- デモのオーナーの店舗と、関係する予約を消して作り直す ----
  await prisma.reservation.deleteMany({
    where: {
      OR: [
        { restaurant: { ownerId: owner.id } },
        { userId: { in: [customer.id, customer2.id] } },
      ],
    },
  });
  await prisma.restaurant.deleteMany({ where: { ownerId: owner.id } });

  const created = [];
  for (const r of RESTAURANTS) {
    created.push(await prisma.restaurant.create({ data: { ...r, ownerId: owner.id } }));
  }

  // ---- 予約:今日を中心に、前後の日付に作る ----
  const today = todayJst();
  const now = Date.now();
  let n = 0;

  for (const restaurant of created.filter((r) => r.status === "approved")) {
    for (let offset = -6; offset <= 10; offset++) {
      const date = addDays(today, offset);
      if (isClosedDay(restaurant, date)) continue;

      // 1日に入れる予約:[時刻のずれ(枠の番号), 人数]。席数を超えないように少なめに
      const small = restaurant.seatCount <= 12;
      const plan: [number, number][] = small
        ? [[0, 2], [1, 2], [3, 3]]
        : [[0, 4], [1, 2], [2, 6], [3, 2], [4, 4], [5, 3]];

      for (const [slotIndex, guests] of plan) {
        n++;
        // 日によって少しずつ入り方を変える
        if ((n + offset) % 4 === 0) continue;
        const [h, m] = restaurant.openTime.split(":").map(Number);
        const minutes = h * 60 + m + slotIndex * 30 + (offset % 2 === 0 ? 30 : 0);
        const time = `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
        const start = parseJstDateTime(date, time);
        if (!start) continue;

        const isPast = start.getTime() < now;
        const byPhone = n % 3 === 0;
        let status = isPast ? "completed" : "confirmed";
        if (n % 11 === 0) status = "cancelled";
        if (isPast && n % 17 === 0) status = "no_show";

        const user = byPhone ? null : n % 2 === 0 ? customer : customer2;
        await prisma.reservation.create({
          data: {
            code: generateReservationCode(),
            restaurantId: restaurant.id,
            userId: user?.id ?? null,
            source: byPhone ? "phone" : "web",
            guestName: byPhone ? PHONE_GUESTS[n % PHONE_GUESTS.length] : null,
            guestPhone: `090-${String(1000 + (n * 37) % 9000)}-${String(1000 + (n * 91) % 9000)}`,
            occasion: n % 5 === 0 ? "誕生日" : n % 7 === 0 ? "接待" : "食事",
            note: NOTES[n % NOTES.length],
            reservationDate: start,
            numberOfGuests: Math.min(guests, restaurant.maxPartySize),
            status,
            cancelledAt: status === "cancelled" ? new Date() : null,
          },
        });
      }
    }
  }

  const count = await prisma.reservation.count({ where: { restaurant: { ownerId: owner.id } } });
  console.log(`デモデータを作り直しました:店舗 ${created.length}件、予約 ${count}件(パスワード: password123)`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
