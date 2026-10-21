import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getOwner, getOwnedRestaurant } from "@/lib/owner";
import {
  todayIST,
  addDays,
  isValidDateStr,
  toDbDate,
  formatDate,
  formatTime,
  isPastSlot,
} from "@/lib/datetime";
import DashboardNav from "@/components/DashboardNav";
import BookingActions from "@/components/BookingActions";

const STATUS = {
  CONFIRMED: { label: "Confirmed", cls: "bg-green-100 text-green-800" },
  CANCELLED: { label: "Cancelled", cls: "bg-red-100 text-red-700" },
  COMPLETED: { label: "Completed", cls: "bg-blue-100 text-blue-800" },
  NO_SHOW: { label: "No show", cls: "bg-gray-200 text-gray-700" },
};

export default async function RestaurantBookingsPage({ params, searchParams }) {
  const { id } = await params;
  const sp = await searchParams;

  const owner = await getOwner();
  if (!owner) redirect("/login");

  const restaurant = await getOwnedRestaurant(id, owner.id);
  if (!restaurant) notFound();

  const today = todayIST();
  const dateStr = isValidDateStr(sp?.date) ? sp.date : today;
  const date = toDbDate(dateStr);

  const [bookings, totalTables, slots, closed] = await Promise.all([
    prisma.booking.findMany({
      where: { restaurantId: id, date },
      include: {
        customer: { select: { name: true, phone: true } },
        slot: true,
        table: true,
      },
    }),
    prisma.restaurantTable.count({ where: { restaurantId: id, isActive: true } }),
    prisma.slot.findMany({
      where: { restaurantId: id, isActive: true },
      orderBy: { time: "asc" },
    }),
    prisma.closedDate.findUnique({
      where: { restaurantId_date: { restaurantId: id, date } },
    }),
  ]);

  // Cancelled ko chhodke baaki sab "table ghere hue" hain
  const active = bookings.filter((b) => b.isActive);
  const totalGuests = active.reduce((sum, b) => sum + b.guests, 0);

  const sorted = [...bookings].sort(
    (a, b) =>
      a.slot.time.localeCompare(b.slot.time) || a.table.tableNumber - b.table.tableNumber
  );

  const slotSummary = slots.map((s) => {
    const inSlot = active.filter((b) => b.slotId === s.id);
    return {
      id: s.id,
      time: s.time,
      booked: inSlot.length,
      free: Math.max(totalTables - inSlot.length, 0),
      guests: inSlot.reduce((sum, b) => sum + b.guests, 0),
    };
  });

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <Link href="/dashboard" className="text-sm text-orange-700 hover:underline">← My Restaurants</Link>
      <h1 className="mt-2 text-3xl font-bold">{restaurant.name}</h1>

      {restaurant.status === "PENDING" && (
        <p className="mt-3 rounded-lg bg-yellow-50 p-3 text-sm text-yellow-800">
          Your restaurant is pending admin approval. It will not be visible to customers until it is approved.
        </p>
      )}
      {restaurant.status === "BLOCKED" && (
        <p className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">
          This restaurant is blocked. Please contact the administrator.
        </p>
      )}

      <div className="mt-4">
        <DashboardNav restaurantId={id} />
      </div>

      {/* Date chunne ka section */}
      <div className="mb-6 flex flex-wrap items-end gap-3">
        <form className="flex items-end gap-2">
          <label className="block">
            <span className="mb-1 block text-sm font-medium">Select Date</span>
            <input type="date" name="date" defaultValue={dateStr} className="rounded-lg border p-2" />
          </label>
          <button className="rounded-lg bg-orange-600 px-4 py-2 font-semibold text-white">View</button>
        </form>
        <Link href={`/dashboard/${id}?date=${today}`} className="rounded-lg border px-3 py-2 text-sm hover:bg-gray-50">Today</Link>
        <Link href={`/dashboard/${id}?date=${addDays(today, 1)}`} className="rounded-lg border px-3 py-2 text-sm hover:bg-gray-50">Tomorrow</Link>
      </div>

      <h2 className="mb-3 text-xl font-semibold">{formatDate(dateStr)}</h2>

      {closed && (
        <p className="mb-4 rounded-lg bg-red-50 p-3 text-red-700">
          The restaurant is closed on this day{closed.reason ? ` (${closed.reason})` : ""}.
        </p>
      )}

      {/* Summary */}
      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border p-4 text-center">
          <p className="text-3xl font-bold">{active.length}</p>
          <p className="text-sm text-gray-500">Bookings</p>
        </div>
        <div className="rounded-xl border p-4 text-center">
          <p className="text-3xl font-bold">{totalGuests}</p>
          <p className="text-sm text-gray-500">Total Guests</p>
        </div>
        <div className="rounded-xl border p-4 text-center">
          <p className="text-3xl font-bold">{totalTables}</p>
          <p className="text-sm text-gray-500">Total Tables</p>
        </div>
      </div>

      {/* Slot-wise khali tables */}
      {slotSummary.length > 0 && (
        <div className="mb-8">
          <h3 className="mb-2 font-semibold">Tables by Slot</h3>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {slotSummary.map((s) => (
              <div key={s.id} className="rounded-lg border p-3 text-center">
                <p className="font-semibold">{formatTime(s.time)}</p>
                <p className="text-sm text-gray-600">{s.booked} booked · {s.free} vacant</p>
                <p className="text-xs text-gray-400">{s.guests} guests</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Bookings list */}
      <h3 className="mb-2 font-semibold">Bookings for this Day</h3>
      {sorted.length === 0 ? (
        <p className="rounded-xl border p-8 text-center text-gray-500">There are no bookings for this day.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="p-3">Time</th>
                <th className="p-3">Customer</th>
                <th className="p-3">Phone</th>
                <th className="p-3">Guests</th>
                <th className="p-3">Table</th>
                <th className="p-3">Status</th>
                <th className="p-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((b) => {
                const st = STATUS[b.status];
                const canMark = isPastSlot(dateStr, b.slot.time);
                return (
                  <tr key={b.id} className={`border-t align-top ${b.status === "CANCELLED" ? "opacity-50" : ""}`}>
                    <td className="p-3 font-medium">{formatTime(b.slot.time)}</td>
                    <td className="p-3">
                      {b.customer.name}
                      {b.specialRequest && (
                        <p className="text-xs text-gray-500">Request: {b.specialRequest}</p>
                      )}
                    </td>
                    <td className="p-3">+91 {b.customer.phone}</td>
                    <td className="p-3">{b.guests}</td>
                    <td className="p-3">#{b.table.tableNumber} ({b.table.capacity} seater)</td>
                    <td className="p-3">
                      <span className={`rounded-full px-2 py-1 text-xs font-semibold ${st.cls}`}>{st.label}</span>
                    </td>
                    <td className="p-3">
                      {b.status === "CONFIRMED" ? (
                        <BookingActions bookingId={b.id} canMark={canMark} />
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
