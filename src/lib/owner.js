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