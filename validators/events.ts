import { z } from "zod";
import { CURRENCY_CODES } from "@/lib/currencies";

export const eventStatusSchema = z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]);

export const currencyCodeSchema = z
  .string()
  .length(3)
  .regex(/^[A-Z]{3}$/, "Invalid currency code")
  .refine((code) => CURRENCY_CODES.includes(code), "Unsupported currency code");

export const ticketListViewSchema = z.enum(["GRID", "COMPACT", "SHOWCASE", "TABLE"]);

export const eventFormSchema = z
  .object({
    name: z.string().min(2, "Name is required").max(120),
    description: z.string().max(5000).optional().nullable(),
    bannerUrl: z
      .string()
      .optional()
      .nullable()
      .refine(
        (v) => !v || v.trim() === "" || /^https?:\/\/.+/i.test(v.trim()),
        "Invalid URL"
      ),
    rules: z.string().max(10000).optional().nullable(),
    venue: z.string().max(200).optional().nullable(),
    startDate: z.string().min(1, "Start date is required"),
    startTime: z.string().optional().nullable(),
    endDate: z.string().optional().nullable(),
    endTime: z.string().optional().nullable(),
    drawScheduledAt: z.string().optional().nullable(),
    drawScheduledTime: z.string().optional().nullable(),
    ticketQuantity: z.number().int().min(0).max(1_000_000),
    winnerCount: z.number().int().min(1).max(10_000),
    ticketDesignId: z.string().uuid().optional().nullable(),
    ticketListViewDefault: ticketListViewSchema.optional(),
    currencyCode: currencyCodeSchema,
    status: eventStatusSchema.optional(),
  })
  .refine(
    (data) => {
      if (!data.endDate) return true;
      return new Date(data.endDate) >= new Date(data.startDate);
    },
    { message: "End date must be after start date", path: ["endDate"] }
  );

export type EventFormValues = z.infer<typeof eventFormSchema>;
