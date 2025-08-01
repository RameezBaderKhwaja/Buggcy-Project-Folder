import { z } from "zod"
import { PasswordSecurity, validateEmail } from "./security"

export const loginSchema = z.object({
  email: z
    .string()
    .email("Invalid email address")
    .refine(
      (email) => validateEmail(email).isValid,
      { message: "Invalid email" },
    ),
  password: z.string().min(1, "Password is required"),
})

export const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(50, "Name too long"),
  email: z
    .string()
    .email("Invalid email address")
    .refine(
      (email) => validateEmail(email).isValid,
      { message: "Invalid email" },
    ),
  password: z.string().refine(
    (password) => PasswordSecurity.validatePasswordStrength(password).isValid,
    { message: "Password does not meet security requirements" },
  ),
  age: z.number().min(18, "Must be at least 18 years old").max(120, "Invalid age"),
  gender: z.enum(["male", "female", "other", "prefer-not-to-say"]),
})

export const profileUpdateSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(50, "Name too long").optional(),
  age: z.number().min(18, "Must be at least 18 years old").max(120, "Invalid age").optional(),
  gender: z.enum(["male", "female", "other", "prefer-not-to-say"]).optional(),
  image: z.string().url().optional(),
})

export const passwordResetSchema = z.object({
  email: z
    .string()
    .email("Invalid email address")
    .refine(
      (email) => validateEmail(email).isValid,
      { message: "Invalid email" },
    ),
})

export const passwordChangeSchema = z.object({
  token: z.string().min(1, "Reset token is required"),
  password: z.string().refine(
    (password) => PasswordSecurity.validatePasswordStrength(password).isValid,
    { message: "Password does not meet security requirements" },
  ),
})

export type LoginInput = z.infer<typeof loginSchema>
export type RegisterInput = z.infer<typeof registerSchema>
export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>
export type PasswordResetInput = z.infer<typeof passwordResetSchema>
export type PasswordChangeInput = z.infer<typeof passwordChangeSchema>
