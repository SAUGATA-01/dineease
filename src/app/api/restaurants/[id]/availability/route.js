import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAvailability } from "@/lib/availability";
import { isValidDateStr, isWithinWindow, MAX_ADVANCE_DAYS } from "@/lib/datetime";

export async function GET(request, { params }) {
  const { id } = await params;
  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date");
  const guests = parseInt(searchParams.get("guests") || "2", 10);

  if (!isValidDateStr(date)) {
    return NextResponse.json({ error: "Please enter a valid date" }, { status: 400 });
  }
  if (!isWithinWindow(date)) {
    return NextResponse.json(
      { error: `Bookings can only be made up to ${MAX_ADVANCE_DAYS} days in advance from today` },
      { status: 400 }
    );
  }
  if (!Number.isInteger(guests) || guests < 1 || guests > 20) {
    return NextResponse.json({ error: "Number of guests must be between 1 and 20" }, { status: 400 });
  }

  const restaurant = await prisma.restaurant.findUnique({ where: { id } });
  if (!restaurant || restaurant.status !== "APPROVED") {
    return NextResponse.json({ error: "Restaurant not found" }, { status: 404 });
  }

  const data = await getAvailability(id, date, guests);
  return NextResponse.json(data);
}
