import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { todayIST, addDays, MAX_ADVANCE_DAYS } from "@/lib/datetime";
import BookingForm from "@/components/BookingForm";

export default async function BookPage({ params }) {
  const { id } = await params;

  const session = await getSession();
  if (!session) redirect(`/login?next=/restaurants/${id}/book`);

  const restaurant = await prisma.restaurant.findUnique({ where: { id } });
  if (!restaurant || restaurant.status !== "APPROVED") notFound();

  if (session.role !== "CUSTOMER") {
    return (
      <main className="mx-auto max-w-xl px-4 py-12 text-center">
        <p className="text-gray-700">Please log in with a customer account to book a table.</p>
      </main>
    );
  }

  const biggest = await prisma.restaurantTable.aggregate({
    where: { restaurantId: id, isActive: true },
    _max: { capacity: true },
  });
  const maxGuests = Math.min(biggest._max.capacity || 0, 20);

  const today = todayIST();

  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <Link href={`/restaurants/${id}`} className="text-sm text-orange-700 hover:underline">
        ← {restaurant.name}
      </Link>
      <h1 className="mt-2 mb-6 text-2xl font-bold">Book a Table at {restaurant.name}</h1>

      {maxGuests === 0 ? (
        <p className="text-gray-500">This restaurant has not added any tables yet.</p>
      ) : (
        <BookingForm
          restaurantId={id}
          minDate={today}
          maxDate={addDays(today, MAX_ADVANCE_DAYS)}
          maxGuests={maxGuests}
        />
      )}
    </main>
  );
}
