"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { callApi } from "@/lib/callApi";

export default function ReviewActions({ reviewId, isHidden }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function run(method, body, confirmMsg) {
    if (confirmMsg && !confirm(confirmMsg)) return;
    setLoading(true);
    const { ok, data } = await callApi(`/api/admin/reviews/${reviewId}`, method, body);
    setLoading(false);
    if (!ok) {
      alert(data.error || "Something went wrong");
      return;
    }
    router.refresh();
  }

  const btn = "rounded border px-3 py-1 text-xs disabled:opacity-50";

  return (
    <div className="flex gap-2">
      <button disabled={loading} onClick={() => run("PATCH", { isHidden: !isHidden })} className={btn}>
        {isHidden ? "Show Again" : "Hide"}
      </button>
      <button
        disabled={loading}
        onClick={() => run("DELETE", undefined, "Are you sure you want to permanently delete this review?")}
        className={`${btn} border-red-500 text-red-600`}
      >
        Delete
      </button>
    </div>
  );
}