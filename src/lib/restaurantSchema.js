import { z } from "zod";

const time = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Time must be in HH:MM format (e.g., 11:00)");

export const restaurantSchema = z
  .object({
    name: z.string().trim().min(2, "Please enter the restaurant name").max(80),
    cityId: z.string().min(1, "Please choose a city"),
    address: z.string().trim().min(5, "Please enter the full address").max(200),
    cuisine: z.string().trim().min(2, "Please specify the cuisine").max(60),
    description: z.string().trim().max(1000).optional().default(""),
    openingTime: time,
    closingTime: time,
    costForTwo: z.number().int().min(0).max(100000).nullable(),
    // https:// isliye zaroori hai ki koi "javascript:" jaisa khatarnak link na daal sake
    mapLink: z.union([
      z.literal(""),
      z.string().trim().url("Invalid map link configuration").startsWith("https://", "Map link must start with https://"),
    ]),
  })
  .refine((d) => d.openingTime < d.closingTime, {
    message: "Closing time must be after the opening time",
    path: ["closingTime"],
  });
