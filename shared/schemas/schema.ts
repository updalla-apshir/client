import { z } from "zod";

export const userLoginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export type UserLoginFormData = z.infer<typeof userLoginSchema>;