import Link from "next/link";
import { prisma } from "@/lib/prisma";
import UserActions from "@/components/UserActions";

export const metadata = { title: "Users - Admin" };

const TABS = [
  { value: "ALL", label: "All" },
  { value: "CUSTOMER", label: "Customers" },
  { value: "RESTAURANT", label: "Owners" },
  { value: "ADMIN", label: "Admins" },
];

const ROLE_LABEL = { CUSTOMER: "Customer", RESTAURANT: "Owner", ADMIN: "Admin" };

export default async function AdminUsersPage({ searchParams }) {
  const sp = await searchParams;
  const role = TABS.some((t) => t.value === sp?.role) ? sp.role : "ALL";
  const q = (sp?.q || "").trim();

  const users = await prisma.user.findMany({
    where: {
      ...(role !== "ALL" && { role }),
      ...(q && {
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { phone: { contains: q } },
          { email: { contains: q, mode: "insensitive" } },
        ],
      }),
    },
    orderBy: { createdAt: "desc" },
    take: 100,
    include: { _count: { select: { bookings: true, restaurants: true } } },
  });

  return (
    <div>
      <div className="mb-4 flex flex-wrap gap-2">
        {TABS.map((t) => (
          <Link
            key={t.value}
            href={`/admin/users?role=${t.value}${q ? `&q=${encodeURIComponent(q)}` : ""}`}
            className={`rounded-full px-4 py-1 text-sm ${
              role === t.value ? "bg-gray-900 text-white" : "border hover:bg-gray-50"
            }`}
          >
            {t.label}
          </Link>
        ))}
      </div>

      <form className="mb-5 flex gap-2">
        <input type="hidden" name="role" value={role} />
        <input
          name="q"
          defaultValue={q}
          placeholder="Search by name, phone, or email"
          className="flex-1 rounded-lg border p-3"
        />
        <button className="rounded-lg bg-orange-600 px-5 font-semibold text-white">Search</button>
      </form>

      {users.length === 0 ? (
        <p className="rounded-xl border p-10 text-center text-gray-500">No users found.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="p-3">Name</th>
                <th className="p-3">Phone</th>
                <th className="p-3">Email</th>
                <th className="p-3">Role</th>
                <th className="p-3">Activity</th>
                <th className="p-3">Status</th>
                <th className="p-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-t align-top">
                  <td className="p-3 font-medium">
                    {u.name}
                    <p className="text-xs font-normal text-gray-400">{u.createdAt.toLocaleDateString("en-IN")}</p>
                  </td>
                  <td className="p-3">+91 {u.phone}</td>
                  <td className="p-3">{u.email || "—"}</td>
                  <td className="p-3">{ROLE_LABEL[u.role]}</td>
                  <td className="p-3 text-gray-600">
                    {u.role === "CUSTOMER" && `${u._count.bookings} bookings`}
                    {u.role === "RESTAURANT" && `${u._count.restaurants} restaurants`}
                    {u.role === "ADMIN" && "—"}
                  </td>
                  <td className="p-3">
                    {u.isBlocked ? (
                      <span className="rounded-full bg-red-100 px-2 py-1 text-xs font-semibold text-red-700">Blocked</span>
                    ) : !u.isVerified ? (
                      <span className="rounded-full bg-yellow-100 px-2 py-1 text-xs font-semibold text-yellow-800">Unverified</span>
                    ) : (
                      <span className="rounded-full bg-green-100 px-2 py-1 text-xs font-semibold text-green-800">Active</span>
                    )}
                  </td>
                  <td className="p-3">
                    {u.role === "ADMIN" ? (
                      <span className="text-gray-400">—</span>
                    ) : (
                      <UserActions userId={u.id} isBlocked={u.isBlocked} name={u.name} />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <p className="mt-3 text-xs text-gray-400">The 100 most recent users are displayed. Use search to find someone.</p>
    </div>
  );
}