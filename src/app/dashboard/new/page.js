import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getOwner } from "@/lib/owner";
import RestaurantForm from "@/components/RestaurantForm";

export const metadata = { title: "New Restaurant - DineEase" };

export default async function NewRestaurantPage() {
  const owner = await getOwner();
  if (!owner) redirect("/login");

  const cities = await prisma.city.findMany({ orderBy: { name: "asc" } });

  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <Link href="/dashboard" className="text-sm text-orange-700 hover:underline">← Dashboard</Link>
      <h1 className="mt-2 mb-2 text-3xl font-bold">Add New Restaurant</h1>
      <p className="mb-6 text-sm text-gray-600">
        After submission, your request will wait for admin approval. The restaurant will become visible to customers only after it is approved.
      </p>
      <RestaurantForm cities={cities} />
    </main>
  );
}
