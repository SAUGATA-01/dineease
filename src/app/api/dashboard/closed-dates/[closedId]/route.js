import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireOwnedChild } from "@/lib/owner";

export async function DELETE(request, { params }) {
  const { closedId } = await params;
  const g = await requireOwnedChild("closedDate", closedId);
  if (g.error) return g.error;

  await prisma.closedDate.delete({ where: { id: closedId } });
  return NextResponse.json({ ok: true });
}