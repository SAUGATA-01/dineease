"use client";

import { useState } from "react";
import Link from "next/link";
import OtpForm from "@/components/OtpForm";

export default function LoginPage() {
  const [form, setForm] = useState({ phone: "", password: "" });
  const [step, setStep] = useState("form");
  const [demoOtp, setDemoOtp] = useState(null);
  const [counter, setCounter] = useState(0);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [sentTo, setSentTo] = useState(null);

  function update(e) {
    let { name, value } = e.target;
    if (name === "phone") value = value.replace(/\D/g, "").slice(0, 10);
    setForm({ ...form, [name]: value });
  }

  async function send() {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (!res.ok) return data.error || "Something went wrong";
    setDemoOtp(data.demoOtp || null);
    setSentTo(data.sentTo || null);
    setCounter((c) => c + 1);
    setStep("otp");
    return null;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const err = await send();
    setLoading(false);
    if (err) setError(err);
  }

  const input = "w-full rounded-lg border p-3";

  return (
    <main className="mx-auto max-w-md p-6">
      <h1 className="mb-6 text-2xl font-bold">Login</h1>

      {step === "form" ? (
        <form onSubmit={handleSubmit} className="space-y-4">
          <input name="phone" value={form.phone} onChange={update} placeholder="Phone number" inputMode="numeric" className={input} required />
          <input name="password" type="password" value={form.password} onChange={update} placeholder="Password" className={input} required />

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-orange-600 p-3 font-semibold text-white disabled:opacity-50"
          >
            {loading ? "Checking details..." : "Login"}
          </button>

          <p className="text-center text-sm">
            New user?{" "}
            <Link href="/signup" className="text-orange-700 underline">Create an account</Link>
          </p>
        </form>
      ) : (
        <>
          <OtpForm
            key={counter}
            phone={form.phone}
            purpose="LOGIN"
            demoOtp={demoOtp}
            sentTo={sentTo}
            onResend={send}
          />
          <button onClick={() => setStep("form")} className="mt-4 w-full text-sm text-gray-500">
            ← Go back
          </button>
        </>
      )}
    </main>
  );
}
