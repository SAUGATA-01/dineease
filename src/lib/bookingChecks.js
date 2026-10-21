import { prisma } from "./prisma";
import { todayIST, toDbDate } from "./datetime";

// Aaj ya aage ki confirmed bookings ginta hai (extra filter jaise { tableId } ke saath)
export function countUpcoming(where) {
  return prisma.booking.count({
    where: {
      ...where,
      status: "CONFIRMED",
      isActive: true,
      date: { gte: toDbDate(todayIST()) },
    },
  });
}