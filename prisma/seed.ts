import { PrismaClient } from "../app/generated/prisma/client.ts";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  // 運営ユーザー
  const admin = await prisma.user.create({
    data: {
      email: "admin@example.com",
      password: "dummy_hashed_password",
      name: "運営 太郎",
      role: "admin",
    },
  });

  // 店舗オーナー
  const owner = await prisma.user.create({
    data: {
      email: "owner@example.com",
      password: "dummy_hashed_password",
      name: "焼肉ひかり 店主",
      role: "owner",
    },
  });

  // 一般ユーザー
  const customer = await prisma.user.create({
    data: {
      email: "customer@example.com",
      password: "dummy_hashed_password",
      name: "田中 花子",
      role: "customer",
    },
  });

  // 店舗データ
  const restaurant = await prisma.restaurant.create({
    data: {
      ownerId: owner.id,
      name: "焼肉 ひかり",
      description: "厳選国産牛を使用した焼肉店です",
      address: "東京都渋谷区1-2-3",
      phoneNumber: "03-1234-5678",
      seatCount: 20,
      status: "approved",
    },
  });

  await prisma.restaurant.create({
    data: {
      ownerId: owner.id,
      name: "イタリアン Bella",
      description: "本格イタリアンをカジュアルに",
      address: "東京都新宿区4-5-6",
      phoneNumber: "03-2345-6789",
      seatCount: 15,
      status: "approved",
    },
  });

  // 予約データ
  await prisma.reservation.create({
    data: {
      userId: customer.id,
      restaurantId: restaurant.id,
      reservationDate: new Date("2026-08-15T19:00:00"),
      numberOfGuests: 4,
      status: "confirmed",
    },
  });

  console.log("シードデータの投入が完了しました");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });