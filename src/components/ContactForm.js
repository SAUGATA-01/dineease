"use client";

import { useState } from "react";
import { callApi } from "@/lib/callApi";

export default function ContactForm({ defaultName = "" }) {
  const [form, setForm] = useState({ name: defaultName, email: "", phone: "", subject: "", message: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  function update(e) {
    let { name, value } = e.target;
    if (name === "phone") value = value.replace(/\D/g, "").slice(0, 10);
    setForm({ ...form, [name]: value });
  }

  async function submit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const { ok, data } = await callApi("/api/support", "POST", form);
    setLoading(false);
    if (!ok) {
      setError(data.error || "Failed to send message");
      return;
    }
    setDone(true);
  }

  if (done) {
    return (
      <div className="rounded-xl border border-green-300 bg-green-50 p-6 text-center">
        <div className="text-4xl">✅</div>
        <p className="mt-2 font-semibold text-green-800">Your message has been received!</p>
        <p className="text-sm text-gray-600">Our team will contact you soon.</p>
      </div>
    );
  }

  const input = "w-full rounded-lg border p-3";

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <input name="name" value={form.name} onChange={update} placeholder="Your name" className={input} required />
        <input name="email" type="email" value={form.email} onChange={update} placeholder="Email" className={input} required />
      </div>
      <input name="phone" value={form.phone} onChange={update} placeholder="Phone (optional)" inputMode="numeric" className={input} />
      <input name="subject" value={form.subject} onChange={update} maxLength={100} placeholder="Subject" className={input} required />
      <textarea name="message" value={form.message} onChange={update} maxLength={1000} rows={5} placeholder="Describe your problem or question" className={input} required />

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button disabled={loading} className="w-full rounded-lg bg-orange-600 p-3 font-semibold text-white disabled:opacity-50">
        {loading ? "Sending..." : "Send Message"}
      </button>
    </form>
  );
}