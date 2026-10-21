import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireOwnedChild } from "@/lib/owner";
import { countUpcoming } from "@/lib/bookingChecks";

const schema = z
  .object({
    capacity: z.number().int().min(1).max(20).optional(),
    isActive: z.boolean().optional(),
  })
  .refine((d) => d.capacity !== undefined || d.isActive !== undefined, {
    message: "Please provide at least one field to update",
  });

export async function PATCH(request, { params }) {
  const { tableId } = await params;
  const g = await requireOwnedChild("table", tableId);
  if (g.error) return g.error;
  const table = g.item;

  const body = await request.json().catch(() => ({}));
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }
  const d = parsed.data;

  // Table band karna ya capacity ghatana tabhi allowed hai jab aane wali booking na ho
  const risky =
    (d.isActive === false && table.isActive) ||
    (d.capacity !== undefined && d.capacity < table.capacity);

  if (risky) {
    const n = await countUpcoming({ tableId });
    if (n > 0) {
      return NextResponse.json(
        { error: `This table has ${n} upcoming booking(s). Please cancel them from the Bookings page first` },
        { status: 409 }
      );
    }
  }

  await prisma.restaurantTable.update({ where: { id: tableId }, data: d });
  return NextResponse.json({ ok: true });
}

export async function DELETE(request, { params }) {
  const { tableId } = await params;
  const g = await requireOwnedChild("table", tableId);
  if (g.error) return g.error;

  const upcoming = await countUpcoming({ tableId });
  if (upcoming > 0) {
    return NextResponse.json(
      { error: `This table has ${upcoming} upcoming booking(s). Please cancel them first` },
      { status: 409 }
    );
  }

  // Purani bookings ka record bachana hai, isliye us case mein delete ki jagah band karna hoga
  const total = await prisma.booking.count({ where: { tableId } });
  if (total > 0) {
    return NextResponse.json(
      { error: "This table contains historical booking records and cannot be deleted. Please deactivate it instead" },
      { status: 409 }
    );
  }

  await prisma.restaurantTable.delete({ where: { id: tableId } });
  return NextResponse.json({ ok: true });
}
