import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";

const schema = z.object({
  name: z.string().trim().min(2, "City name must be at least 2 letters long").max(40),
});

export async function PATCH(request, { params }) {
  const { id } = await params;
  const g = await requireAdmin();
  if (g.error) return g.error;

  const body = await request.json().catch(() => ({}));
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }
  const { name } = parsed.data;

  const city = await prisma.city.findUnique({ where: { id } });
  if (!city) {
    return NextResponse.json({ error: "City not found" }, { status: 404 });
  }

  const dup = await prisma.city.findFirst({
    where: { name: { equals: name, mode: "insensitive" }, NOT: { id } },
  });
  if (dup) {
    return NextResponse.json({ error: "A city with this name already exists" }, { status: 409 });
  }

  await prisma.city.update({ where: { id }, data: { name } });
  return NextResponse.json({ ok: true });
}

export async function DELETE(request, { params }) {
  const { id } = await params;
  const g = await requireAdmin();
  if (g.error) return g.error;

  const city = await prisma.city.findUnique({ where: { id } });
  if (!city) {
    return NextResponse.json({ error: "City not found" }, { status: 404 });
  }

  // Cities that have restaurants cannot be deleted
  const n = await prisma.restaurant.count({ where: { cityId: id } });
  if (n > 0) {
    return NextResponse.json(
      { error: `There are ${n} restaurants in this city, so it cannot be deleted` },
      { status: 409 }
    );
  }

  await prisma.city.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}