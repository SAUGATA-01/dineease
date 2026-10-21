export const metadata = { title: "Contact - DineEase" };

export default function ContactPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="mb-4 text-3xl font-bold">Contact Us</h1>
      <p className="mb-6 text-gray-700">
        If you have any questions or encounter any issues, please feel free to reach out to us.
      </p>
      <div className="space-y-3 rounded-xl border p-6">
        <p>📧 <b>Email:</b> support@dineease.com</p>
        <p>📞 <b>Phone:</b> +91 99999 99999</p>
        <p>🕒 <b>Hours:</b> 10:00 AM to 8:00 PM</p>
      </div>
    </main>
  );
}
