import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireOwnedRestaurant } from "@/lib/owner";
import { isValidDateStr, todayIST, addDays, toDbDate } from "@/lib/datetime";

const schema = z.object({
  date: z.string(),
  reason: z.string().trim().max(100).optional().default(""),
});

export async function POST(request, { params }) {
  const { id } = await params;
  const g = await requireOwnedRestaurant(id);
  if (g.error) return g.error;

  const body = await request.json().catch(() => ({}));
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid details provided" }, { status: 400 });
  }
  const { date: dateStr, reason } = parsed.data;

  const today = todayIST();
  if (!isValidDateStr(dateStr) || dateStr < today || dateStr > addDays(today, 365)) {
    return NextResponse.json({ error: "Please choose a date within 1 year from today" }, { status: 400 });
  }

  const date = toDbDate(dateStr);

  // Agar us din confirmed bookings hain to band nahi kar sakte
  const n = await prisma.booking.count({
    where: { restaurantId: id, date, status: "CONFIRMED", isActive: true },
  });
  if (n > 0) {
    return NextResponse.json(
      { error: `There are ${n} confirmed booking(s) on that day. Please cancel them first before closing the restaurant` },
      { status: 409 }
    );
  }

  try {
    await prisma.closedDate.create({
      data: { restaurantId: id, date, reason: reason || null },
    });
  } catch (e) {
    if (e.code === "P2002") {
      return NextResponse.json({ error: "This date is already marked as closed" }, { status: 409 });
    }
    throw e;
  }

  return NextResponse.json({ ok: true });
}
