import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getOwner, getOwnedRestaurant } from "@/lib/owner";
import DashboardNav from "@/components/DashboardNav";
import RestaurantForm from "@/components/RestaurantForm";

export default async function EditRestaurantPage({ params }) {
  const { id } = await params;

  const owner = await getOwner();
  if (!owner) redirect("/login");

  const r = await getOwnedRestaurant(id, owner.id);
  if (!r) notFound();

  const cities = await prisma.city.findMany({ orderBy: { name: "asc" } });

  // Client component ko sirf zaroori plain fields bhejte hain
  const restaurant = {
    id: r.id,
    name: r.name,
    cityId: r.cityId,
    address: r.address,
    cuisine: r.cuisine,
    description: r.description,
    openingTime: r.openingTime,
    closingTime: r.closingTime,
    costForTwo: r.costForTwo,
    mapLink: r.mapLink,
  };

  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <Link href="/dashboard" className="text-sm text-orange-700 hover:underline">← Mere restaurants</Link>
      <h1 className="mt-2 mb-4 text-3xl font-bold">{r.name}</h1>
      <DashboardNav restaurantId={id} />
      <RestaurantForm cities={cities} restaurant={restaurant} />
    </main>
  );
}