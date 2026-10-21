"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ReviewForm({ restaurantId, initialRating = 0, initialComment = "" }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(initialRating);
  const [comment, setComment] = useState(initialComment);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const res = await fetch("/api/reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ restaurantId, rating, comment }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error || "Failed to save review");
      return;
    }
    setOpen(false);
    router.refresh();
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="rounded-lg border border-orange-600 px-4 py-2 text-sm text-orange-700 hover:bg-orange-50"
      >
        {initialRating ? "Edit Review" : "Write a Review"}
      </button>
    );
  }

  return (
    <form onSubmit={submit} className="mt-2 space-y-3 rounded-lg border bg-gray-50 p-4">
      <div className="flex gap-1 text-3xl">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            type="button"
            key={n}
            onClick={() => setRating(n)}
            className={n <= rating ? "text-yellow-500" : "text-gray-300"}
            aria-label={`${n} star`}
          >
            ★
          </button>
        ))}
      </div>
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        maxLength={500}
        rows={3}
        placeholder="Write about your experience (optional)"
        className="w-full rounded-lg border p-3"
      />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex gap-2">
        <button
          disabled={loading || rating === 0}
          className="rounded-lg bg-orange-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
        >
          {loading ? "Saving..." : "Submit Review"}
        </button>
        <button type="button" onClick={() => setOpen(false)} className="px-4 py-2 text-sm text-gray-600">
          Cancel
        </button>
      </div>
    </form>
  );
}
