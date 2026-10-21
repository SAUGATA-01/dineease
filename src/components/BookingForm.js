"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

function formatTime(t) {
  const [h, m] = t.split(":").map(Number);
  return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${h >= 12 ? "PM" : "AM"}`;
}

export default function BookingForm({ restaurantId, minDate, maxDate, maxGuests }) {
  const [date, setDate] = useState(minDate);
  const [guests, setGuests] = useState(Math.min(2, maxGuests));
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [slotId, setSlotId] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(null);

  // Date ya guests badlte hi availability dobara laao
  useEffect(() => {
    if (!date) return;
    let cancelled = false;
    setLoading(true);
    setSlotId("");
    setError("");

    fetch(`/api/restaurants/${restaurantId}/availability?date=${date}&guests=${guests}`)
      .then(async (res) => ({ ok: res.ok, json: await res.json() }))
      .then(({ ok, json }) => {
        if (cancelled) return;
        if (!ok) {
          setData(null);
          setError(json.error || "Something went wrong");
        } else {
          setData(json);
        }
      })
      .catch(() => !cancelled && setError("Network problem, please try again"))
      .finally(() => !cancelled && setLoading(false));

    return () => {
      cancelled = true;
    };
  }, [date, guests, restaurantId]);

  async function book() {
    setError("");
    setSubmitting(true);
    const res = await fetch("/api/bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ restaurantId, slotId, date, guests, specialRequest: note }),
    });
    const json = await res.json();
    setSubmitting(false);

    if (!res.ok) {
      setError(json.error || "Booking failed");
      // Availability refresh karo (shayad kisi ne table le liya ho)
      const d = date;
      setDate("");
      setTimeout(() => setDate(d), 0);
      return;
    }
    setDone(json.booking);
  }

  if (done) {
    return (
      <div className="rounded-xl border border-green-300 bg-green-50 p-6 text-center">
        <div className="text-5xl">✅</div>
        <h2 className="mt-2 text-2xl font-bold text-green-800">Booking Confirmed!</h2>
        <p className="mt-2 text-gray-700">
          On {done.date} at {formatTime(done.time)} for {done.guests} {done.guests === 1 ? "guest" : "guests"}, Table #{done.tableNumber}
        </p>
        <Link
          href="/my-bookings"
          className="mt-4 inline-block rounded-lg bg-orange-600 px-6 py-3 font-semibold text-white"
        >
          View My Bookings
        </Link>
      </div>
    );
  }

  const input = "w-full rounded-lg border p-3";

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1 block text-sm font-medium">Date</span>
          <input
            type="date"
            value={date}
            min={minDate}
            max={maxDate}
            onChange={(e) => setDate(e.target.value)}
            className={input}
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium">Number of Guests</span>
          <select
            value={guests}
            onChange={(e) => setGuests(Number(e.target.value))}
            className={input}
          >
            {Array.from({ length: maxGuests }, (_, i) => i + 1).map((n) => (
              <option key={n} value={n}>
                {n} {n === 1 ? "person" : "people"}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div>
        <h3 className="mb-2 font-semibold">Choose Time Slot</h3>

        {loading && <p className="text-gray-500">Checking available slots...</p>}

        {!loading && data?.closed && (
          <p className="rounded-lg bg-red-50 p-3 text-red-700">
            The restaurant is closed on this date{data.reason ? ` (${data.reason})` : ""}. Please select another date.
          </p>
        )}

        {!loading && data && !data.closed && data.slots.length === 0 && (
          <p className="text-gray-500">This restaurant has not added any slots yet.</p>
        )}

        {!loading && data && !data.closed && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {data.slots.map((s) => {
              const selected = slotId === s.id;
              return (
                <button
                  key={s.id}
                  type="button"
                  disabled={!s.available}
                  onClick={() => setSlotId(s.id)}
                  className={`rounded-lg border p-3 text-left transition ${
                    selected
                      ? "border-orange-600 bg-orange-50 ring-2 ring-orange-600"
                      : "hover:border-orange-400"
                  } disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-400`}
                >
                  <div className="font-semibold">{formatTime(s.time)}</div>
                  <div className="text-xs">
                    {s.past
                      ? "Time passed"
                      : s.fittingTables === 0
                      ? "Full"
                      : `${s.freeTables} / ${s.totalTables} tables free`}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {slotId && (
        <label className="block">
          <span className="mb-1 block text-sm font-medium">Special Request (optional)</span>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            maxLength={200}
            rows={2}
            placeholder="E.g., celebrating a birthday, window seat preferred"
            className={input}
          />
        </label>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        onClick={book}
        disabled={!slotId || submitting}
        className="w-full rounded-lg bg-orange-600 p-3 text-lg font-semibold text-white disabled:opacity-50"
      >
        {submitting ? "Booking in progress..." : "Confirm Booking"}
      </button>
    </div>
  );
}
