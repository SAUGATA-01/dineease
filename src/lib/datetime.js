export const MAX_ADVANCE_DAYS = 30;

const TZ = "Asia/Kolkata";

// "2026-10-21" format (IST)
export function todayIST() {
  return new Date().toLocaleDateString("en-CA", { timeZone: TZ });
}

// "19:30" format (IST)
export function nowTimeIST() {
  return new Date().toLocaleTimeString("en-GB", {
    timeZone: TZ,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  });
}

export function isValidDateStr(s) {
  if (typeof s !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const d = new Date(s + "T00:00:00Z");
  return !isNaN(d) && d.toISOString().slice(0, 10) === s;
}

export function addDays(dateStr, n) {
  const d = new Date(dateStr + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

// Database mein date save/read karne ke liye
export function toDbDate(dateStr) {
  return new Date(dateStr + "T00:00:00.000Z");
}
export function fromDbDate(date) {
  return date.toISOString().slice(0, 10);
}

// Kya yeh date + slot time nikal chuka hai?
export function isPastSlot(dateStr, time) {
  const today = todayIST();
  if (dateStr < today) return true;
  if (dateStr > today) return false;
  return time <= nowTimeIST();
}

// Date allowed window mein hai ya nahi (aaj se 30 din tak)
export function isWithinWindow(dateStr) {
  const today = todayIST();
  return dateStr >= today && dateStr <= addDays(today, MAX_ADVANCE_DAYS);
}

export function formatDate(dateStr) {
  return new Date(dateStr + "T00:00:00Z").toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

// "19:00" -> "7:00 PM"
export function formatTime(t) {
  const [h, m] = t.split(":").map(Number);
  const ap = h >= 12 ? "PM" : "AM";
  return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${ap}`;
}