import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireOwnedChild } from "@/lib/owner";
import { countUpcoming } from "@/lib/bookingChecks";

const schema = z.object({ isActive: z.boolean() });

export async function PATCH(request, { params }) {
  const { slotId } = await params;
  const g = await requireOwnedChild("slot", slotId);
  if (g.error) return g.error;

  const body = await request.json().catch(() => ({}));
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid data format provided" }, { status: 400 });
  }

  if (parsed.data.isActive === false && g.item.isActive) {
    const n = await countUpcoming({ slotId });
    if (n > 0) {
      return NextResponse.json(
        { error: `This slot has ${n} upcoming booking(s). Please cancel them from the Bookings page first` },
        { status: 409 }
      );
    }
  }

  await prisma.slot.update({ where: { id: slotId }, data: { isActive: parsed.data.isActive } });
  return NextResponse.json({ ok: true });
}

export async function DELETE(request, { params }) {
  const { slotId } = await params;
  const g = await requireOwnedChild("slot", slotId);
  if (g.error) return g.error;

  const upcoming = await countUpcoming({ slotId });
  if (upcoming > 0) {
    return NextResponse.json(
      { error: `This slot has ${upcoming} upcoming booking(s). Please cancel them first` },
      { status: 409 }
    );
  }

  const total = await prisma.booking.count({ where: { slotId } });
  if (total > 0) {
    return NextResponse.json(
      { error: "This slot contains historical booking records and cannot be deleted. Please deactivate it instead" },
      { status: 409 }
    );
  }

  await prisma.slot.delete({ where: { id: slotId } });
  return NextResponse.json({ ok: true });
}
