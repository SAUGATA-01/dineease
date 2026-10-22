"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { callApi } from "@/lib/callApi";

export default function RestaurantStatusActions({ restaurantId, status }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function act(action, confirmMsg) {
    if (confirmMsg && !confirm(confirmMsg)) return;
    setLoading(true);
    setError("");
    const { ok, data } = await callApi(`/api/admin/restaurants/${restaurantId}/status`, "PATCH", { action });
    setLoading(false);
    if (!ok) {
      setError(data.error || "Update failed");
      return;
    }
    router.refresh();
  }

  const btn = "rounded-lg border px-4 py-2 text-sm font-medium disabled:opacity-50";

  return (
    <div className="space-y-1">
      <div className="flex flex-wrap gap-2">
        {status === "PENDING" && (
          <>
            <button disabled={loading} onClick={() => act("approve")} className={`${btn} border-green-600 bg-green-600 text-white`}>
              Approve
            </button>
            <button
              disabled={loading}
              onClick={() => act("reject", "Are you sure you want to reject this restaurant? The owner will see 'Blocked'.")}
              className={`${btn} border-red-500 text-red-600`}
            >
              Reject
            </button>
          </>
        )}
        {status === "APPROVED" && (
          <button
            disabled={loading}
            onClick={() => act("block", "Are you sure you want to block this restaurant? It will immediately disappear from customers' view.")}
            className={`${btn} border-red-500 text-red-600`}
          >
            Block
          </button>
        )}
        {status === "BLOCKED" && (
          <button disabled={loading} onClick={() => act("unblock")} className={`${btn} border-green-600 text-green-700`}>
            Unblock / Approve
          </button>
        )}
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}