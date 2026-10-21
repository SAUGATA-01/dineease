"use client";

import { useState } from "react";
import Link from "next/link";
import OtpForm from "@/components/OtpForm";

export default function SignupPage() {
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    password: "",
    role: "CUSTOMER",
  });
  const [step, setStep] = useState("form");
  const [demoOtp, setDemoOtp] = useState(null);
  const [counter, setCounter] = useState(0);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function update(e) {
    let { name, value } = e.target;
    if (name === "phone") value = value.replace(/\D/g, "").slice(0, 10);
    setForm({ ...form, [name]: value });
  }

  // Error string return karta hai, ya success pe null
  async function send() {
    const res = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (!res.ok) return data.error || "Something went wrong";
    setDemoOtp(data.demoOtp || null);
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
      <h1 className="mb-6 text-2xl font-bold">Create a new account</h1>

      {step === "form" ? (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex gap-2">
            {[
              ["CUSTOMER", "Customer"],
              ["RESTAURANT", "Restaurant Owner"],
            ].map(([value, label]) => (
              <button
                type="button"
                key={value}
                onClick={() => setForm({ ...form, role: value })}
                className={`flex-1 rounded-lg border p-3 ${
                  form.role === value ? "border-orange-600 bg-orange-50 font-semibold" : ""
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <input name="name" value={form.name} onChange={update} placeholder="Full name" className={input} required />
          <input name="phone" value={form.phone} onChange={update} placeholder="Phone number (10 digits)" inputMode="numeric" className={input} required />
          <input name="email" type="email" value={form.email} onChange={update} placeholder="Email address (optional)" className={input} />
          <input name="password" type="password" value={form.password} onChange={update} placeholder="Password (minimum 8 characters)" className={input} required />

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-orange-600 p-3 font-semibold text-white disabled:opacity-50"
          >
            {loading ? "Sending..." : "Send OTP"}
          </button>

          <p className="text-center text-sm">
            Already have an account?{" "}
            <Link href="/login" className="text-orange-700 underline">Login here</Link>
          </p>
        </form>
      ) : (
        <>
          <OtpForm
            key={counter}
            phone={form.phone}
            purpose="SIGNUP"
            demoOtp={demoOtp}
            onResend={send}
          />
          <button onClick={() => setStep("form")} className="mt-4 w-full text-sm text-gray-500">
            ← Change details
          </button>
        </>
      )}
    </main>
  );
}
