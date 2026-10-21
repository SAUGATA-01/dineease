import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getOwner, getOwnedRestaurant } from "@/lib/owner";
import DashboardNav from "@/components/DashboardNav";
import PhotoUploader from "@/components/PhotoUploader";

export default async function PhotoPage({ params }) {
  const { id } = await params;

  const owner = await getOwner();
  if (!owner) redirect("/login");
  const restaurant = await getOwnedRestaurant(id, owner.id);
  if (!restaurant) notFound();

  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <Link href="/dashboard" className="text-sm text-orange-700 hover:underline">← My restaurants</Link>
      <h1 className="mt-2 mb-4 text-3xl font-bold">{restaurant.name}</h1>
      <DashboardNav restaurantId={id} />
      <PhotoUploader restaurantId={id} currentUrl={restaurant.photoUrl} name={restaurant.name} />
    </main>
  );
}