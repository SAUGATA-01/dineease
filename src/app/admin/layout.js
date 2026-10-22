import { redirect } from "next/navigation";
import { getAdmin } from "@/lib/admin";
import AdminNav from "@/components/AdminNav";

export default async function AdminLayout({ children }) {
  const admin = await getAdmin();
  if (!admin) redirect("/login");

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="mb-4 text-3xl font-bold">Admin Panel</h1>
      <AdminNav />
      {children}
    </div>
  );
}