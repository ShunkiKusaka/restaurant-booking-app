// 予約を作る処理の本体。
// 注意:このファイルには "use server" を付けない。
// "use server" のファイルから export した関数は、ブラウザから直接呼べる窓口になってしまうため、
// チェックを済ませた server action(app/actions.ts など)の中からだけ呼ぶ。
import { prisma } from "./prisma.ts";
import { SEAT_OCCUPYING_STATUSES, peakOccupancy } from "./booking.ts";
import { generateReservationCode } from "./reservation-code.ts";

/**
 * 席に空きがあるか確認してから、予約を1件作る。
 * 同じお店の予約は1件ずつ順番に処理する(同時に2人が最後の1席を取る「二重予約」を防ぐ)。
 * 満席なら null を返す。
 */
export async function createReservationIfAvailable(input: {
  restaurantId: string;
  seatCount: number;
  stayMinutes: number;
  start: Date;
  guests: number;
  data: {
    userId?: string | null;
    source: "web" | "phone";
    guestName?: string | null;
    guestPhone?: string | null;
    occasion?: string | null;
    note?: string | null;
  };
}) {
  const stayMs = input.stayMinutes * 60_000;

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      return await prisma.$transaction(async (tx) => {
        // このお店の予約処理を、トランザクションが終わるまで1件ずつにする
        await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${input.restaurantId}))`;

        const overlapping = await tx.reservation.findMany({
          where: {
            restaurantId: input.restaurantId,
            status: { in: SEAT_OCCUPYING_STATUSES },
            reservationDate: {
              gt: new Date(input.start.getTime() - stayMs),
              lt: new Date(input.start.getTime() + stayMs),
            },
          },
          select: { reservationDate: true, numberOfGuests: true },
        });
        const peak = peakOccupancy(
          overlapping.map((r) => ({ start: r.reservationDate, guests: r.numberOfGuests })),
          input.start,
          input.stayMinutes
        );
        if (peak + input.guests > input.seatCount) return null;

        return tx.reservation.create({
          data: {
            ...input.data,
            code: generateReservationCode(),
            restaurantId: input.restaurantId,
            reservationDate: input.start,
            numberOfGuests: input.guests,
            status: "confirmed",
          },
        });
      });
    } catch (e) {
      // 予約番号がたまたま重複したときだけ、番号を変えてやり直す
      const isCodeConflict =
        typeof e === "object" && e !== null && "code" in e && e.code === "P2002";
      if (!isCodeConflict || attempt === 2) throw e;
    }
  }
  return null;
}

