import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { fromDbDate, isPastSlot } from "@/lib/datetime";

export async function POST(request, { params }) {
  const { id } = await params;
  const session = await getSession();
  if (!session || session.role !== "CUSTOMER") {
    return NextResponse.json({ error: "Please log in to continue" }, { status: 401 });
  }

  const booking = await prisma.booking.findUnique({
    where: { id },
    include: { slot: true },
  });

  // Doosre ki booking cancel nahi kar sakte
  if (!booking || booking.customerId !== session.userId) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }
  if (booking.status !== "CONFIRMED") {
    return NextResponse.json({ error: "This booking cannot be cancelled" }, { status: 400 });
  }
  if (isPastSlot(fromDbDate(booking.date), booking.slot.time)) {
    return NextResponse.json({ error: "The booking time has already passed and cannot be cancelled" }, { status: 400 });
  }

  // isActive null karne se wahi table dobara book ho sakta hai
  await prisma.booking.update({
    where: { id },
    data: { status: "CANCELLED", isActive: null },
  });

  return NextResponse.json({ ok: true });
}
