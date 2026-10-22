"use client";

import { useState } from "react";
import { callApi } from "@/lib/callApi";

export default function ChangePasswordForm() {
  const [form, setForm] = useState({ currentPassword: "", newPassword: "", confirm: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  function update(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function submit(e) {
    e.preventDefault();
    setError("");
    setDone(false);
    if (form.newPassword !== form.confirm) {
      setError("New password and confirmation password do not match");
      return;
    }
    setLoading(true);
    const { ok, data } = await callApi("/api/auth/change-password", "POST", {
      currentPassword: form.currentPassword,
      newPassword: form.newPassword,
    });
    setLoading(false);
    if (!ok) {
      setError(data.error || "Failed to change password");
      return;
    }
    setForm({ currentPassword: "", newPassword: "", confirm: "" });
    setDone(true);
  }

  const input = "w-full rounded-lg border p-3";

  return (
    <form onSubmit={submit} className="space-y-4">
      <input name="currentPassword" type="password" value={form.currentPassword} onChange={update} placeholder="Current password" className={input} required />
      <input name="newPassword" type="password" value={form.newPassword} onChange={update} placeholder="New password (8+ characters, letter + number)" className={input} required />
      <input name="confirm" type="password" value={form.confirm} onChange={update} placeholder="Enter new password again" className={input} required />

      {error && <p className="text-sm text-red-600">{error}</p>}
      {done && <p className="text-sm text-green-700">Password changed successfully ✅</p>}

      <button disabled={loading} className="w-full rounded-lg bg-orange-600 p-3 font-semibold text-white disabled:opacity-50">
        {loading ? "Changing..." : "Change Password"}
      </button>
    </form>
  );
}