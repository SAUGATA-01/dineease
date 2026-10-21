import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getOwner, getOwnedRestaurant } from "@/lib/owner";
import { fromDbDate, isPastSlot } from "@/lib/datetime";

const schema = z.object({
  status: z.enum(["COMPLETED", "NO_SHOW", "CANCELLED"]),
});

export async function PATCH(request, { params }) {
  const { id } = await params;

  const owner = await getOwner();
  if (!owner) {
    return NextResponse.json({ error: "Restaurant owner login is required" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid status value provided" }, { status: 400 });
  }
  const { status } = parsed.data;

  const booking = await prisma.booking.findUnique({
    where: { id },
    include: { slot: true },
  });
  if (!booking) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }

  // Booking is owner ke restaurant ki honi chahiye
  const owned = await getOwnedRestaurant(booking.restaurantId, owner.id);
  if (!owned) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }

  if (booking.status !== "CONFIRMED") {
    return NextResponse.json({ error: "The status of this booking can no longer be changed" }, { status: 400 });
  }

  if (status !== "CANCELLED" && !isPastSlot(fromDbDate(booking.date), booking.slot.time)) {
    return NextResponse.json(
      { error: "You can only mark a booking as Completed or No-show after the slot time has started" },
      { status: 400 }
    );
  }

  // Cancel pe isActive null hota hai taaki table dobara book ho sake
  const data = status === "CANCELLED" ? { status, isActive: null } : { status };

  const result = await prisma.booking.updateMany({
    where: { id, status: "CONFIRMED" },
    data,
  });
  if (result.count === 0) {
    return NextResponse.json({ error: "Booking has already been updated, please refresh the page" }, { status: 409 });
  }

  return NextResponse.json({ ok: true });
}
