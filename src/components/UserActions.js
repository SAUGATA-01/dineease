"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { callApi } from "@/lib/callApi";

export default function UserActions({ userId, isBlocked, name }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function toggle() {
    if (!isBlocked && !confirm(`Are you sure you want to block ${name}? They will not be able to log in or make bookings.`)) return;
    setLoading(true);
    const { ok, data } = await callApi(`/api/admin/users/${userId}`, "PATCH", { isBlocked: !isBlocked });
    setLoading(false);
    if (!ok) {
      alert(data.error || "Update failed");
      return;
    }
    router.refresh();
  }

  return (
    <button
      disabled={loading}
      onClick={toggle}
      className={`rounded border px-3 py-1 text-xs disabled:opacity-50 ${
        isBlocked ? "border-green-600 text-green-700" : "border-red-500 text-red-600"
      }`}
    >
      {isBlocked ? "Unblock" : "Block"}
    </button>
  );
}