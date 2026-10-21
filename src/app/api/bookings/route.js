import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import {
  isValidDateStr,
  isWithinWindow,
  isPastSlot,
  toDbDate,
  MAX_ADVANCE_DAYS,
} from "@/lib/datetime";

const schema = z.object({
  restaurantId: z.string().min(1),
  slotId: z.string().min(1),
  date: z.string(),
  guests: z.coerce.number().int().min(1).max(20),
  specialRequest: z.string().trim().max(200).optional(),
});

export async function POST(request) {
  const session = await getSession();
  if (!session || session.role !== "CUSTOMER") {
    return NextResponse.json({ error: "Customer login is required to make a booking" }, { status: 401 });
  }

  // JWT 7 din valid rehta hai, isliye block hua user database se check karte hain
  const user = await prisma.user.findUnique({ where: { id: session.userId } });
  if (!user || user.isBlocked || !user.isVerified) {
    return NextResponse.json({ error: "Your account is not authorized to make bookings" }, { status: 403 });
  }

  const body = await request.json().catch(() => ({}));
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid booking details provided" }, { status: 400 });
  }
  const { restaurantId, slotId, date: dateStr, guests, specialRequest } = parsed.data;

  if (!isValidDateStr(dateStr) || !isWithinWindow(dateStr)) {
    return NextResponse.json(
      { error: `Please choose a date within ${MAX_ADVANCE_DAYS} days from today` },
      { status: 400 }
    );
  }

  const restaurant = await prisma.restaurant.findUnique({ where: { id: restaurantId } });
  if (!restaurant || restaurant.status !== "APPROVED") {
    return NextResponse.json({ error: "Restaurant not found" }, { status: 404 });
  }

  const slot = await prisma.slot.findFirst({
    where: { id: slotId, restaurantId, isActive: true },
  });
  if (!slot) {
    return NextResponse.json({ error: "This time slot is not available" }, { status: 400 });
  }
  if (isPastSlot(dateStr, slot.time)) {
    return NextResponse.json({ error: "This time slot has already passed" }, { status: 400 });
  }

  const date = toDbDate(dateStr);

  const closed = await prisma.closedDate.findUnique({
    where: { restaurantId_date: { restaurantId, date } },
  });
  if (closed) {
    return NextResponse.json({ error: "The restaurant is closed on the selected date" }, { status: 400 });
  }

  // Same customer, same restaurant, same date aur slot pe dobara booking nahi
  const duplicate = await prisma.booking.findFirst({
    where: { customerId: user.id, restaurantId, slotId, date, isActive: true },
  });
  if (duplicate) {
    return NextResponse.json({ error: "You already have an active booking for this time slot" }, { status: 409 });
  }

  // Khali tables jo itne guests ke liye kaafi bade hain, sabse chhota pehle
  const candidates = await prisma.restaurantTable.findMany({
    where: {
      restaurantId,
      isActive: true,
      capacity: { gte: guests },
      bookings: { none: { slotId, date, isActive: true } },
    },
    orderBy: [{ capacity: "asc" }, { tableNumber: "asc" }],
  });

  // Ek-ek table try karte hain. Agar kisi aur ne ussi pal wahi table le liya,
  // to database ka unique rule error dega (P2002) aur hum agla table try karenge.
  for (const table of candidates) {
    try {
      const booking = await prisma.booking.create({
        data: {
          customerId: user.id,
          restaurantId,
          tableId: table.id,
          slotId,
          date,
          guests,
          specialRequest: specialRequest || null,
        },
      });

      return NextResponse.json({
        ok: true,
        booking: {
          id: booking.id,
          tableNumber: table.tableNumber,
          date: dateStr,
          time: slot.time,
          guests,
        },
      });
    } catch (e) {
      if (e.code === "P2002") continue;
      throw e;
    }
  }

  return NextResponse.json(
    { error: "No tables are available in this slot. Please select a different time slot" },
    { status: 409 }
  );
}
