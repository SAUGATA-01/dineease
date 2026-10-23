import { NextResponse } from "next/server";
import { prisma } from "./prisma";
import { getSession } from "./auth";

// Get the logged-in restaurant owner and verify their account status.
export async function getOwner() {
  const session = await getSession();
  if (!session || session.role !== "RESTAURANT") return null;

  const user = await prisma.user.findUnique({ where: { id: session.userId } });
  if (!user || user.role !== "RESTAURANT" || user.isBlocked || !user.isVerified) {
    return null;
  }
  return user;
}

// Return a restaurant only if it belongs to the specified owner.
export async function getOwnedRestaurant(restaurantId, ownerId) {
  const restaurant = await prisma.restaurant.findUnique({ where: { id: restaurantId } });
  if (!restaurant || restaurant.ownerId !== ownerId) return null;
  return restaurant;
}

const fail = (message, status) => ({
  error: NextResponse.json({ error: message }, { status }),
});

// Used in API routes:
//   const g = await requireOwnedRestaurant(id);
//   if (g.error) return g.error;
export async function requireOwnedRestaurant(restaurantId) {
  const owner = await getOwner();
  if (!owner) return fail("Restaurant owner login required", 401);

  const restaurant = await getOwnedRestaurant(restaurantId, owner.id);
  if (!restaurant) return fail("Restaurant not found", 404);

  if (restaurant.status === "BLOCKED") {
    return fail("This restaurant is blocked. Please contact the administrator", 403);
  }
  return { owner, restaurant };
}

const MODELS = {
  menuItem: prisma.menuItem,
  table: prisma.restaurantTable,
  slot: prisma.slot,
  closedDate: prisma.closedDate,
};

// Check whether a menu item, table, slot, or closed date belongs to the owner's restaurant.
export async function requireOwnedChild(model, childId) {
  const owner = await getOwner();
  if (!owner) return fail("Restaurant owner login required", 401);

  const item = await MODELS[model].findUnique({ where: { id: childId } });
  if (!item) return fail("Resource not found", 404);

  const guard = await requireOwnedRestaurant(item.restaurantId);
  if (guard.error) return guard;

  return { ...guard, item };
}