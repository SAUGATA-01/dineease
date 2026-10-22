"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { callApi } from "@/lib/callApi";

export default function TicketActions({ ticketId, status, adminNote }) {
  const router = useRouter();
  const [note, setNote] = useState(adminNote || "");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function save(newStatus) {
    setLoading(true);
    setError("");
    const { ok, data } = await callApi(`/api/admin/tickets/${ticketId}`, "PATCH", {
      status: newStatus,
      adminNote: note,
    });
    setLoading(false);
    if (!ok) {
      setError(data.error || "Failed to save");
      return;
    }
    router.refresh();
  }

  const btn = "rounded-lg border px-4 py-2 text-sm font-medium disabled:opacity-50";

  return (
    <div className="mt-3 space-y-2">
      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        maxLength={500}
        rows={2}
        placeholder="Admin note (visible only to admins): action taken, who you spoke to..."
        className="w-full rounded-lg border p-2 text-sm"
      />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex flex-wrap gap-2">
        <button disabled={loading} onClick={() => save(status)} className={btn}>
          Save Note
        </button>
        {status === "OPEN" ? (
          <button disabled={loading} onClick={() => save("CLOSED")} className={`${btn} border-green-600 bg-green-600 text-white`}>
            Mark as Resolved & Close
          </button>
        ) : (
          <button disabled={loading} onClick={() => save("OPEN")} className={btn}>
            Reopen
          </button>
        )}
      </div>
    </div>
  );
}