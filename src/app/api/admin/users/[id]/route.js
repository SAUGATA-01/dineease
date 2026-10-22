import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";

const schema = z.object({ isBlocked: z.boolean() });

export async function PATCH(request, { params }) {
  const { id } = await params;
  const g = await requireAdmin();
  if (g.error) return g.error;

  const body = await request.json().catch(() => ({}));
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid data" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // Admins cannot be blocked from the panel (including themselves)
  if (user.role === "ADMIN" || user.id === g.admin.id) {
    return NextResponse.json({ error: "Admin accounts cannot be blocked" }, { status: 400 });
  }

  await prisma.user.update({
    where: { id },
    data: { isBlocked: parsed.data.isBlocked },
  });

  return NextResponse.json({ ok: true });
}