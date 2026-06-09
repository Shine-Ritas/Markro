import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "../../lib/prisma";

/** Catalog of ticket card themes — add new entries here; run seed to upsert. */
export const TICKET_DESIGN_PRESETS: {
  slug: string;
  name: string;
  description: string;
  sortOrder: number;
  theme: Prisma.InputJsonValue;
}[] = [
  {
    slug: "classic",
    name: "Classic",
    description: "Purple border, clean dark card",
    sortOrder: 0,
    theme: {
      borderStyle: "solid",
      borderWidth: "2px",
      borderColor: "oklch(0.58 0.24 285)",
      background: "oklch(0.19 0.02 285)",
      accentColor: "oklch(0.58 0.24 285)",
      textColor: "oklch(0.97 0 0)",
      mutedColor: "oklch(0.65 0.02 285)",
      boxShadow: "0 0 24px oklch(0.58 0.24 285 / 22%)",
      numberSize: "2rem",
    },
  },
  {
    slug: "minimal",
    name: "Minimal",
    description: "Thin border, flat surface",
    sortOrder: 1,
    theme: {
      borderStyle: "solid",
      borderWidth: "1px",
      borderColor: "oklch(1 0 0 / 18%)",
      background: "oklch(0.17 0.015 285)",
      accentColor: "oklch(0.75 0.05 285)",
      textColor: "oklch(0.95 0 0)",
      mutedColor: "oklch(0.55 0.02 285)",
      boxShadow: "none",
      numberSize: "1.75rem",
    },
  },
  {
    slug: "glow",
    name: "Glow",
    description: "Soft luminous border for social posts",
    sortOrder: 2,
    theme: {
      borderStyle: "solid",
      borderWidth: "2px",
      borderColor: "oklch(0.65 0.28 285 / 60%)",
      background: "oklch(0.22 0.05 285)",
      accentColor: "oklch(0.72 0.26 285)",
      textColor: "oklch(1 0 0)",
      mutedColor: "oklch(0.7 0.08 285)",
      boxShadow:
        "0 0 0 1px oklch(1 0 0 / 8%), 0 0 28px oklch(0.58 0.24 285 / 35%), 0 0 56px oklch(0.58 0.24 285 / 12%)",
      numberSize: "2.25rem",
    },
  },
  {
    slug: "festive",
    name: "Festive",
    description: "Warm gold accent for celebrations",
    sortOrder: 3,
    theme: {
      borderStyle: "solid",
      borderWidth: "3px",
      borderColor: "oklch(0.78 0.16 85)",
      background: "oklch(0.18 0.03 85)",
      accentColor: "oklch(0.78 0.16 85)",
      textColor: "oklch(0.98 0.02 90)",
      mutedColor: "oklch(0.72 0.08 85)",
      boxShadow: "0 0 20px oklch(0.78 0.16 85 / 30%)",
      numberSize: "2rem",
    },
  },
  {
    slug: "corporate",
    name: "Corporate",
    description: "Blue accent, professional look",
    sortOrder: 4,
    theme: {
      borderStyle: "solid",
      borderWidth: "2px",
      borderColor: "oklch(0.55 0.14 250)",
      background: "oklch(0.16 0.02 250)",
      accentColor: "oklch(0.6 0.16 250)",
      textColor: "oklch(0.96 0 0)",
      mutedColor: "oklch(0.6 0.04 250)",
      boxShadow: "0 4px 24px oklch(0 0 0 / 35%)",
      numberSize: "1.875rem",
    },
  },
];

export async function seedTicketDesignPresets() {
  for (const preset of TICKET_DESIGN_PRESETS) {
    await prisma.ticketDesignPreset.upsert({
      where: { slug: preset.slug },
      create: {
        slug: preset.slug,
        name: preset.name,
        description: preset.description,
        theme: preset.theme,
        sortOrder: preset.sortOrder,
        isActive: true,
      },
      update: {
        name: preset.name,
        description: preset.description,
        theme: preset.theme,
        sortOrder: preset.sortOrder,
        isActive: true,
      },
    });
  }
}

export async function getDefaultTicketDesignId(): Promise<string> {
  const preset = await prisma.ticketDesignPreset.findUniqueOrThrow({
    where: { slug: "classic" },
    select: { id: true },
  });
  return preset.id;
}
