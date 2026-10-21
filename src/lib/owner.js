import { NextResponse } from "next/server";
import { prisma } from "./prisma";
import { getSession } from "./auth";

// Logged-in restaurant owner (database se check, taaki blocked user turant ruk jaye)
export async function getOwner() {
  const session = await getSession();
  if (!session || session.role !== "RESTAURANT") return null;

  const user = await prisma.user.findUnique({ where: { id: session.userId } });
  if (!user || user.role !== "RESTAURANT" || user.isBlocked || !user.isVerified) {
    return null;
  }
  return user;
}

// Restaurant tabhi milega jab woh isi owner ka ho
export async function getOwnedRestaurant(restaurantId, ownerId) {
  const restaurant = await prisma.restaurant.findUnique({ where: { id: restaurantId } });
  if (!restaurant || restaurant.ownerId !== ownerId) return null;
  return restaurant;
}

const fail = (message, status) => ({
  error: NextResponse.json({ error: message }, { status }),
});

// API routes mein use hota hai:
//   const g = await requireOwnedRestaurant(id);
//   if (g.error) return g.error;
export async function requireOwnedRestaurant(restaurantId) {
  const owner = await getOwner();
  if (!owner) return fail("Restaurant owner login is required", 401);

  const restaurant = await getOwnedRestaurant(restaurantId, owner.id);
  if (!restaurant) return fail("Restaurant not found", 404);

  if (restaurant.status === "BLOCKED") {
    return fail("This restaurant is blocked. Please contact admin", 403);
  }
  return { owner, restaurant };
}

const MODELS = {
  menuItem: prisma.menuItem,
  table: prisma.restaurantTable,
  slot: prisma.slot,
  closedDate: prisma.closedDate,
};

// Menu item / table / slot / holiday ke liye: check karta hai ki woh isi owner ke restaurant ka hai
export async function requireOwnedChild(model, childId) {
  const owner = await getOwner();
  if (!owner) return fail("Restaurant owner login is required", 401);

  const item = await MODELS[model].findUnique({ where: { id: childId } });
  if (!item) return fail("Resource not found", 404);

  const guard = await requireOwnedRestaurant(item.restaurantId);
  if (guard.error) return guard;

  return { ...guard, item };
}
