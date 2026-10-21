import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireOwnedChild } from "@/lib/owner";
import { menuSchema } from "@/lib/menuSchema";

export async function PATCH(request, { params }) {
  const { itemId } = await params;
  const g = await requireOwnedChild("menuItem", itemId);
  if (g.error) return g.error;

  const body = await request.json().catch(() => ({}));
  const parsed = menuSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }
  const d = parsed.data;

  await prisma.menuItem.update({
    where: { id: itemId },
    data: {
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

export async function DELETE(request, { params }) {
  const { itemId } = await params;
  const g = await requireOwnedChild("menuItem", itemId);
  if (g.error) return g.error;

  await prisma.menuItem.delete({ where: { id: itemId } });
  return NextResponse.json({ ok: true });
}