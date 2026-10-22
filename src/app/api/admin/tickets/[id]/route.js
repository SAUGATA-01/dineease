import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";

const schema = z.object({
  status: z.enum(["OPEN", "CLOSED"]),
  adminNote: z.string().trim().max(500, "Keep the note under 500 characters").optional().default(""),
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
  const { status, adminNote } = parsed.data;

  const ticket = await prisma.supportTicket.findUnique({ where: { id } });
  if (!ticket) {
    return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
  }

  await prisma.supportTicket.update({
    where: { id },
    data: {
      status,
      adminNote: adminNote || null,
      closedAt: status === "CLOSED" ? ticket.closedAt || new Date() : null,
    },
  });

  return NextResponse.json({ ok: true });
}