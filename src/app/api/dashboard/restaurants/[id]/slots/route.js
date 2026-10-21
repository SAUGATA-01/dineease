import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireOwnedRestaurant } from "@/lib/owner";

const schema = z.object({
  time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d\$/, "Time must be in HH:MM format (e.g., 19:00)"),
});

export async function POST(request, { params }) {
  const { id } = await params;
  const g = await requireOwnedRestaurant(id);
  if (g.error) return g.error;

  const body = await request.json().catch(() => ({}));
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }
  const { time } = parsed.data;

  const { openingTime, closingTime } = g.restaurant;
  if (time < openingTime || time >= closingTime) {
    return NextResponse.json(
      { error: `Slot time must be between operating hours (${openingTime} and ${closingTime})` },
      { status: 400 }
    );
  }

  const count = await prisma.slot.count({ where: { restaurantId: id } });
  if (count >= 24) {
    return NextResponse.json({ error: "A maximum of 24 slots can be added" }, { status: 400 });
  }

  try {
    await prisma.slot.create({ data: { restaurantId: id, time } });
  } catch (e) {
    if (e.code === "P2002") {
      return NextResponse.json({ error: "This time slot already exists" }, { status: 409 });
    }
    throw e;
  }

  return NextResponse.json({ ok: true });
}
