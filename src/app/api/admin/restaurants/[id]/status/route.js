import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";

const schema = z.object({
  action: z.enum(["approve", "reject", "block", "unblock"]),
});

const RULES = {
  approve: { from: ["PENDING"], to: "APPROVED" },
  reject: { from: ["PENDING"], to: "BLOCKED" },
  block: { from: ["APPROVED"], to: "BLOCKED" },
  unblock: { from: ["BLOCKED"], to: "APPROVED" },
};

export async function PATCH(request, { params }) {
  const { id } = await params;
  const g = await requireAdmin();
  if (g.error) return g.error;

  const body = await request.json().catch(() => ({}));
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }
  const rule = RULES[parsed.data.action];

  const exists = await prisma.restaurant.findUnique({ where: { id } });
  if (!exists) {
    return NextResponse.json({ error: "Restaurant not found" }, { status: 404 });
  }

  // The status check and update happen together to prevent issues when two admins click at the same time.
  const result = await prisma.restaurant.updateMany({
    where: { id, status: { in: rule.from } },
    data: { status: rule.to },
  });
  if (result.count === 0) {
    return NextResponse.json(
      { error: "The restaurant status has already changed. Please refresh the page." },
      { status: 409 }
    );
  }

  return NextResponse.json({ ok: true });
}