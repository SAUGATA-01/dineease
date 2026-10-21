import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { fromDbDate, isPastSlot } from "@/lib/datetime";

const schema = z.object({
  restaurantId: z.string().min(1),
  rating: z.coerce.number().int().min(1, "Please select a rating").max(5),
  comment: z.string().trim().max(500, "Review must be under 500 characters").optional(),
});

export async function POST(request) {
  const session = await getSession();
  if (!session || session.role !== "CUSTOMER") {
    return NextResponse.json({ error: "Please log in to continue" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }
  const { restaurantId, rating, comment } = parsed.data;

  // Review sirf wahi de sakta hai jo wahan gaya ho (booking ka time nikal chuka ho)
  const bookings = await prisma.booking.findMany({
    where: {
      customerId: session.userId,
      restaurantId,
      status: { in: ["CONFIRMED", "COMPLETED"] },
    },
    include: { slot: true },
  });
  const visited = bookings.some(
    (b) => b.status === "COMPLETED" || isPastSlot(fromDbDate(b.date), b.slot.time)
  );
  if (!visited) {
    return NextResponse.json(
      { error: "You can only leave a review after your scheduled booking time has passed" },
      { status: 403 }
    );
  }

  await prisma.review.upsert({
    where: { customerId_restaurantId: { customerId: session.userId, restaurantId } },
    update: { rating, comment: comment || null },
    create: { customerId: session.userId, restaurantId, rating, comment: comment || null },
  });

  return NextResponse.json({ ok: true });
}
