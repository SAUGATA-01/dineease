import { prisma } from "./prisma";
import { toDbDate, isPastSlot } from "./datetime";

// Ek date ke liye har slot pe kitne tables khali hain
export async function getAvailability(restaurantId, dateStr, guests) {
  const date = toDbDate(dateStr);

  const closed = await prisma.closedDate.findUnique({
    where: { restaurantId_date: { restaurantId, date } },
  });
  if (closed) return { closed: true, reason: closed.reason, slots: [] };

  const [tables, slots, booked] = await Promise.all([
    prisma.restaurantTable.findMany({ where: { restaurantId, isActive: true } }),
    prisma.slot.findMany({
      where: { restaurantId, isActive: true },
      orderBy: { time: "asc" },
    }),
    prisma.booking.findMany({
      where: { restaurantId, date, isActive: true },
      select: { tableId: true, slotId: true },
    }),
  ]);

  const result = slots.map((slot) => {
    const bookedIds = new Set(
      booked.filter((b) => b.slotId === slot.id).map((b) => b.tableId)
    );
    const freeTables = tables.filter((t) => !bookedIds.has(t.id));
    const fitting = freeTables.filter((t) => t.capacity >= guests);
    const past = isPastSlot(dateStr, slot.time);

    return {
      id: slot.id,
      time: slot.time,
      past,
      totalTables: tables.length,
      freeTables: freeTables.length, // is slot mein kul khali tables
      fittingTables: fitting.length, // jo itne guests ke liye kaafi bade hain
      available: !past && fitting.length > 0,
    };
  });

  return { closed: false, slots: result };
}