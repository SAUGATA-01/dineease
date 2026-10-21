import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOwner, getOwnedRestaurant } from "@/lib/owner";
import { restaurantSchema } from "@/lib/restaurantSchema";

export async function PATCH(request, { params }) {
  const { id } = await params;

  const owner = await getOwner();
  if (!owner) {
    return NextResponse.json({ error: "Restaurant owner login is required" }, { status: 401 });
  }

  const restaurant = await getOwnedRestaurant(id, owner.id);
  if (!restaurant) {
    return NextResponse.json({ error: "Restaurant not found" }, { status: 404 });
  }
  if (restaurant.status === "BLOCKED") {
    return NextResponse.json({ error: "This restaurant is blocked. Please contact admin" }, { status: 403 });
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

  // status, ownerId jaise fields yahan nahi badalte, sirf details
  await prisma.restaurant.update({
    where: { id },
    data: {
      cityId: d.cityId,
      name: d.name,
      address: d.address,
      cuisine: d.cuisine,
      description: d.description || null,
      openingTime: d.openingTime,
      closingTime: d.closingTime,
      costForTwo: d.costForTwo,
      mapLink: d.mapLink || null,
    },
  });

  return NextResponse.json({ ok: true, id });
}
