import { z } from "zod";

export const menuSchema = z.object({
  name: z.string().trim().min(2, "Please enter the dish name").max(80),
  description: z.string().trim().max(200).optional().default(""),
  category: z.string().trim().min(2, "Please specify a category (e.g., Starters)").max(40),
  price: z.number().int("Price must be a whole number").min(1, "Please enter a valid price").max(100000),
  isVeg: z.boolean(),
  isAvailable: z.boolean(),
});
