import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getOwner, getOwnedRestaurant } from "@/lib/owner";
import DashboardNav from "@/components/DashboardNav";
import MenuManager from "@/components/MenuManager";

export default async function MenuPage({ params }) {
  const { id } = await params;

  const owner = await getOwner();
  if (!owner) redirect("/login");
  const restaurant = await getOwnedRestaurant(id, owner.id);
  if (!restaurant) notFound();

  const rows = await prisma.menuItem.findMany({
    where: { restaurantId: id },
    orderBy: [{ category: "asc" }, { name: "asc" }],
  });
  const items = rows.map((i) => ({
    id: i.id,
    name: i.name,
    description: i.description,
    category: i.category,
    price: i.price,
    isVeg: i.isVeg,
    isAvailable: i.isAvailable,
  }));

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <Link href="/dashboard" className="text-sm text-orange-700 hover:underline">← My Restaurants</Link>
      <h1 className="mt-2 mb-4 text-3xl font-bold">{restaurant.name}</h1>
      <DashboardNav restaurantId={id} />
      <MenuManager restaurantId={id} items={items} />
    </main>
  );
}
