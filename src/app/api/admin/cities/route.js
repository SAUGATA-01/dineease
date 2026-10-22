import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";

const schema = z.object({
  name: z.string().trim().min(2, "City name must be at least 2 letters long").max(40),
});

export async function POST(request) {
  const g = await requireAdmin();
  if (g.error) return g.error;

  const body = await request.json().catch(() => ({}));
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }
  const { name } = parsed.data;

  // Treat "pune" and "Pune" as the same city
  const dup = await prisma.city.findFirst({
    where: { name: { equals: name, mode: "insensitive" } },
  });
  if (dup) {
    return NextResponse.json({ error: "This city already exists" }, { status: 409 });
  }

  await prisma.city.create({ data: { name } });
  return NextResponse.json({ ok: true });
}