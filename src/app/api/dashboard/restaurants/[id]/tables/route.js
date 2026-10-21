import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireOwnedRestaurant } from "@/lib/owner";

const schema = z.object({
  tableNumber: z.number().int("Table number must be a whole number").min(1).max(999),
  capacity: z.number().int("Capacity must be a whole number").min(1, "Capacity must be at least 1").max(20, "Capacity cannot exceed 20"),
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

  const count = await prisma.restaurantTable.count({ where: { restaurantId: id } });
  if (count >= 50) {
    return NextResponse.json({ error: "A maximum of 50 tables can be added" }, { status: 400 });
  }

  try {
    await prisma.restaurantTable.create({
      data: { restaurantId: id, ...parsed.data },
    });
  } catch (e) {
    if (e.code === "P2002") {
      return NextResponse.json({ error: "This table number already exists" }, { status: 409 });
    }
    throw e;
  }

  return NextResponse.json({ ok: true });
}
