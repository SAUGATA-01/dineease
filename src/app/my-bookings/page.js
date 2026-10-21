import { getSession } from "@/lib/auth";
import LogoutButton from "@/components/LogoutButton";

export default async function AdminPage() {
  const session = await getSession();
  return (
    <main className="space-y-4 p-6">
      <h1 className="text-2xl font-bold">My Bookings (placeholder)</h1>
      <p>Hello {session?.name}, role: {session?.role}</p>
      <LogoutButton />
    </main>
  );
}