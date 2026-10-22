import { getSession } from "@/lib/auth";
import ContactForm from "@/components/ContactForm";

export const metadata = { title: "Contact - DineEase" };

export default async function ContactPage() {
  const session = await getSession();

  return (
    <main className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="mb-4 text-3xl font-bold">Contact Us</h1>
      <p className="mb-6 text-gray-700">If you have any questions or problems, feel free to contact us.</p>

      <div className="mb-8 space-y-3 rounded-xl border p-6">
        <p>📧 <b>Email:</b> support@dineease.com</p>
        <p>📞 <b>Phone:</b> +91 99999 99999</p>
        <p>🕒 <b>Hours:</b> 10 AM to 8 PM</p>
      </div>

      <h2 className="mb-4 text-xl font-semibold">Or Send Us a Message Directly</h2>
      <ContactForm defaultName={session?.name || ""} />
    </main>
  );
}