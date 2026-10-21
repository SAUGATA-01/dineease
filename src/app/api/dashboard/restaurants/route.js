import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOwner } from "@/lib/owner";
import { restaurantSchema } from "@/lib/restaurantSchema";

const DEFAULT_SLOTS = ["12:00", "13:00", "14:00", "19:00", "20:00", "21:00"];

export async function POST(request) {
  const owner = await getOwner();
  if (!owner) {
    return NextResponse.json({ error: "Restaurant owner login is required" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const parsed = restaurantSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }
  const d = parsed.data;

  const city = await prisma.city.findUnique({ where: { id: d.cityId } });
  if (!city) {
    return NextResponse.json({ error: "Invalid city selected" }, { status: 400 });
  }

  // Spam rokne ke liye limit
  const count = await prisma.restaurant.count({ where: { ownerId: owner.id } });
  if (count >= 5) {
    return NextResponse.json({ error: "An owner can add a maximum of 5 restaurants" }, { status: 400 });
  }

  const restaurant = await prisma.restaurant.create({
    data: {
      ownerId: owner.id,
      cityId: d.cityId,
      name: d.name,
      address: d.address,
      cuisine: d.cuisine,
      description: d.description || null,
      openingTime: d.openingTime,
      closingTime: d.closingTime,
      costForTwo: d.costForTwo,
      mapLink: d.mapLink || null,
      status: "PENDING", // admin approve karega tab public hoga
      slots: { create: DEFAULT_SLOTS.map((time) => ({ time })) },
    },
  });

  return NextResponse.json({ ok: true, id: restaurant.id });
}
