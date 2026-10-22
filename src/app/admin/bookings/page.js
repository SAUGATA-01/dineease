import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { isValidDateStr, toDbDate, fromDbDate, formatDate, formatTime } from "@/lib/datetime";

export const metadata = { title: "Bookings - Admin" };

const STATUSES = ["ALL", "CONFIRMED", "COMPLETED", "CANCELLED", "NO_SHOW"];

const STATUS = {
  CONFIRMED: { label: "Confirmed", cls: "bg-green-100 text-green-800" },
  CANCELLED: { label: "Cancelled", cls: "bg-red-100 text-red-700" },
  COMPLETED: { label: "Completed", cls: "bg-blue-100 text-blue-800" },
  NO_SHOW: { label: "No show", cls: "bg-gray-200 text-gray-700" },
};

export default async function AdminBookingsPage({ searchParams }) {
  const sp = await searchParams;
  const status = STATUSES.includes(sp?.status) ? sp.status : "ALL";
  const dateStr = isValidDateStr(sp?.date) ? sp.date : "";
  const q = (sp?.q || "").trim();

  const bookings = await prisma.booking.findMany({
    where: {
      ...(status !== "ALL" && { status }),
      ...(dateStr && { date: toDbDate(dateStr) }),
      ...(q && {
        OR: [
          { restaurant: { name: { contains: q, mode: "insensitive" } } },
          { customer: { name: { contains: q, mode: "insensitive" } } },
          { customer: { phone: { contains: q } } },
        ],
      }),
    },
    orderBy: [{ date: "desc" }, { createdAt: "desc" }],
    take: 100,
    include: {
      customer: { select: { name: true, phone: true } },
      restaurant: { select: { name: true, city: { select: { name: true } } } },
      slot: true,
      table: true,
    },
  });

  return (
    <div>
      <div className="mb-4 flex flex-wrap gap-2">
        {STATUSES.map((s) => (
          <Link
            key={s}
            href={`/admin/bookings?status=${s}${dateStr ? `&date=${dateStr}` : ""}${q ? `&q=${encodeURIComponent(q)}` : ""}`}
            className={`rounded-full px-4 py-1 text-sm ${
              status === s ? "bg-gray-900 text-white" : "border hover:bg-gray-50"
            }`}
          >
            {s === "ALL" ? "All" : STATUS[s].label}
          </Link>
        ))}
      </div>

      <form className="mb-5 flex flex-wrap items-end gap-2">
        <input type="hidden" name="status" value={status} />
        <label className="block text-sm">
          <span className="mb-1 block font-medium">Date</span>
          <input type="date" name="date" defaultValue={dateStr} className="rounded-lg border p-2" />
        </label>
        <input
          name="q"
          defaultValue={q}
          placeholder="Restaurant, customer name, or phone"
          className="min-w-[220px] flex-1 rounded-lg border p-2"
        />
        <button className="rounded-lg bg-orange-600 px-5 py-2 font-semibold text-white">Filter</button>
        <Link href="/admin/bookings" className="px-3 py-2 text-sm text-gray-500 underline">Reset</Link>
      </form>

      {bookings.length === 0 ? (
        <p className="rounded-xl border p-10 text-center text-gray-500">No bookings found.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border">
          <table className="w-full min-w-[860px] text-left text-sm">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="p-3">Date and Time</th>
                <th className="p-3">Restaurant</th>
                <th className="p-3">Customer</th>
                <th className="p-3">Guests</th>
                <th className="p-3">Table</th>
                <th className="p-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((b) => {
                const st = STATUS[b.status];
                return (
                  <tr key={b.id} className="border-t align-top">
                    <td className="p-3">
                      <p className="font-medium">{formatDate(fromDbDate(b.date))}</p>
                      <p className="text-gray-500">{formatTime(b.slot.time)}</p>
                    </td>
                    <td className="p-3">
                      {b.restaurant.name}
                      <p className="text-xs text-gray-500">{b.restaurant.city.name}</p>
                    </td>
                    <td className="p-3">
                      {b.customer.name}
                      <p className="text-xs text-gray-500">+91 {b.customer.phone}</p>
                    </td>
                    <td className="p-3">{b.guests}</td>
                    <td className="p-3">#{b.table.tableNumber}</td>
                    <td className="p-3">
                      <span className={`rounded-full px-2 py-1 text-xs font-semibold ${st.cls}`}>{st.label}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      <p className="mt-3 text-xs text-gray-400">The 100 most recent bookings matching the filters are displayed.</p>
    </div>
  );
}