import { z } from "zod";

export const buyerRegisterSchema = z.object({
  name: z.string().min(2).max(80),
  email: z.string().email(),
  password: z.string().min(8, "Password must be at least 8 characters").max(128),
});

export const linkPhoneRequestSchema = z.object({
  action: z.literal("request"),
  phone: z.string().min(5).max(30),
});

export const linkPhoneConfirmSchema = z.object({
  action: z.literal("confirm"),
  phone: z.string().min(5).max(30),
  code: z.string().length(6),
});

export const linkPhoneSchema = z.discriminatedUnion("action", [
  linkPhoneRequestSchema,
  linkPhoneConfirmSchema,
]);

export type BuyerRegisterInput = z.infer<typeof buyerRegisterSchema>;
export type LinkPhoneInput = z.infer<typeof linkPhoneSchema>;
