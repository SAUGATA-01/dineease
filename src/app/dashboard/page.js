import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getOwner } from "@/lib/owner";
import { todayIST, toDbDate } from "@/lib/datetime";

export const metadata = { title: "Dashboard - DineEase" };

const BADGE = {
  PENDING: { label: "Approval pending", cls: "bg-yellow-100 text-yellow-800" },
  APPROVED: { label: "Live", cls: "bg-green-100 text-green-800" },
  BLOCKED: { label: "Blocked", cls: "bg-red-100 text-red-700" },
};

export default async function DashboardPage() {
  const owner = await getOwner();
  if (!owner) redirect("/login");

  const today = toDbDate(todayIST());

  const restaurants = await prisma.restaurant.findMany({
    where: { ownerId: owner.id },
    orderBy: { createdAt: "desc" },
    include: {
      city: true,
      _count: { select: { bookings: { where: { date: today, isActive: true } } } },
    },
  });

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-bold">My Restaurants</h1>
        <Link href="/dashboard/new" className="rounded-lg bg-orange-600 px-5 py-2 font-semibold text-white hover:bg-orange-700">
          + Add New Restaurant
        </Link>
      </div>

      {restaurants.length === 0 ? (
        <div className="rounded-xl border p-10 text-center text-gray-600">
          You haven't added any restaurants yet. Use the button above to get started.
        </div>
      ) : (
        <ul className="space-y-4">
          {restaurants.map((r) => {
            const b = BADGE[r.status];
            return (
              <li key={r.id} className="rounded-xl border p-5 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <h2 className="text-xl font-semibold">{r.name}</h2>
                    <p className="text-sm text-gray-500">{r.city.name} · {r.cuisine}</p>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${b.cls}`}>{b.label}</span>
                </div>
                <p className="mt-2 text-sm text-gray-700">
                  Today's Bookings: <b>{r._count.bookings}</b>
                </p>
                <Link href={`/dashboard/${r.id}`} className="mt-3 inline-block rounded-lg border border-orange-600 px-4 py-2 text-sm font-medium text-orange-700 hover:bg-orange-50">
                  Manage →
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
