"use client";

import { useState, useEffect } from "react";

export default function OtpForm({ phone, purpose, demoOtp, sentTo, onResend }) {
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [seconds, setSeconds] = useState(30);

  useEffect(() => {
    if (seconds <= 0) return;
    const t = setTimeout(() => setSeconds((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [seconds]);

  async function submit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const res = await fetch("/api/auth/verify-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone, otp, purpose }),
    });
    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error || "Something went wrong");
      return;
    }

    // ?next=/kuch wala link ho to wahan bhejo (sirf apni site ke andar)
    const next = new URLSearchParams(window.location.search).get("next");
    const safeNext = next && next.startsWith("/") && !next.startsWith("//");
    window.location.href = safeNext ? next : data.redirect;
  }

  async function resend() {
    setError("");
    const err = await onResend();
    if (err) setError(err);
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <p className="text-sm text-gray-600">
        {sentTo ? (
          <>
            A 6-digit OTP has been sent to <b>{sentTo}</b>. Check your <b>Spam</b> folder as well as your inbox.
          </>
        ) : (
          <>A 6-digit OTP has been sent.</>
        )}
      </p>

      {demoOtp && (
        <div className="rounded-lg border border-yellow-300 bg-yellow-50 p-3 text-sm">
          Demo mode: your OTP is <b className="text-lg tracking-widest">{demoOtp}</b>
        </div>
      )}

      <input
        value={otp}
        onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
        inputMode="numeric"
        placeholder="6 digit OTP"
        className="w-full rounded-lg border p-3 text-center text-xl tracking-widest"
        required
      />

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={loading || otp.length !== 6}
        className="w-full rounded-lg bg-orange-600 p-3 font-semibold text-white disabled:opacity-50"
      >
        {loading ? "Verifying..." : "Verify OTP"}
      </button>

      <button
        type="button"
        onClick={resend}
        disabled={seconds > 0}
        className="w-full text-sm text-orange-700 disabled:text-gray-400"
      >
        {seconds > 0 ? `Resend OTP (${seconds}s)` : "Resend OTP"}
      </button>
    </form>
  );
}
