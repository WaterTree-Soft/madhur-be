import { z } from "zod";

export const registerSchema = z.object({
  firstName: z.string().min(2, "First name must be at least 2 characters").max(50),
  lastName: z.string().min(1, "Last name is required").max(50),
  email: z.string().email(),
  password: z.string().min(8).regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
    "Password must contain uppercase, lowercase, and a number"
  ),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});
