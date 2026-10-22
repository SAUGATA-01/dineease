import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import ChangePasswordForm from "@/components/ChangePasswordForm";

export const metadata = { title: "Password badlo - DineEase" };

export default async function ChangePasswordPage() {
  const session = await getSession();
  if (!session) redirect("/login?next=/change-password");

  return (
    <main className="mx-auto max-w-md px-4 py-10">
      <h1 className="mb-6 text-2xl font-bold">Change Password</h1>
      <ChangePasswordForm />
    </main>
  );
}