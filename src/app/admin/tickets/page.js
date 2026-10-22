import Link from "next/link";
import { prisma } from "@/lib/prisma";
import TicketActions from "@/components/TicketActions";

export const metadata = { title: "Tickets - Admin" };

const TABS = [
  { value: "OPEN", label: "Open" },
  { value: "CLOSED", label: "Closed" },
  { value: "ALL", label: "All" },
];

export default async function AdminTicketsPage({ searchParams }) {
  const sp = await searchParams;
  const status = TABS.some((t) => t.value === sp?.status) ? sp.status : "OPEN";

  const tickets = await prisma.supportTicket.findMany({
    where: status === "ALL" ? {} : { status },
    orderBy: { createdAt: "desc" },
    take: 100,
    include: { user: { select: { role: true } } },
  });

  return (
    <div>
      <div className="mb-5 flex flex-wrap gap-2">
        {TABS.map((t) => (
          <Link
            key={t.value}
            href={`/admin/tickets?status=${t.value}`}
            className={`rounded-full px-4 py-1 text-sm ${
              status === t.value ? "bg-gray-900 text-white" : "border hover:bg-gray-50"
            }`}
          >
            {t.label}
          </Link>
        ))}
      </div>

      {tickets.length === 0 ? (
        <p className="rounded-xl border p-10 text-center text-gray-500">No tickets found.</p>
      ) : (
        <ul className="space-y-4">
          {tickets.map((t) => (
            <li key={t.id} className="rounded-xl border p-5 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <h2 className="text-lg font-semibold">{t.subject}</h2>
                  <p className="text-sm text-gray-600">
                    {t.name} · {t.email}
                    {t.phone && ` · +91 ${t.phone}`}
                  </p>
                  <p className="text-xs text-gray-400">
                    {t.createdAt.toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}
                    {t.user ? ` · registered ${t.user.role === "RESTAURANT" ? "owner" : "user"}` : " · guest"}
                  </p>
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    t.status === "OPEN" ? "bg-yellow-100 text-yellow-800" : "bg-green-100 text-green-800"
                  }`}
                >
                  {t.status === "OPEN" ? "Open" : "Closed"}
                </span>
              </div>

              <p className="mt-3 whitespace-pre-wrap rounded-lg bg-gray-50 p-3 text-gray-800">{t.message}</p>

              <TicketActions ticketId={t.id} status={t.status} adminNote={t.adminNote} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}