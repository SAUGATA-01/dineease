import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireOwnedRestaurant } from "@/lib/owner";
import { menuSchema } from "@/lib/menuSchema";

export async function POST(request, { params }) {
  const { id } = await params;
  const g = await requireOwnedRestaurant(id);
  if (g.error) return g.error;

  const body = await request.json().catch(() => ({}));
  const parsed = menuSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }
  const d = parsed.data;

  const count = await prisma.menuItem.count({ where: { restaurantId: id } });
  if (count >= 200) {
    return NextResponse.json({ error: "A menu can contain a maximum of 200 items" }, { status: 400 });
  }

  await prisma.menuItem.create({
    data: {
      restaurantId: id,
      name: d.name,
      description: d.description || null,
      category: d.category,
      price: d.price,
      isVeg: d.isVeg,
      isAvailable: d.isAvailable,
    },
  });

  return NextResponse.json({ ok: true });
}
