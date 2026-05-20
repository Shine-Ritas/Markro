import type { CSSProperties } from "react";
import type { TicketDesignPreset, TicketListView } from "@prisma/client";
import type { TicketDesignPresetDto, TicketDesignTheme } from "@/types/ticket-designs";

export function parseTicketDesignTheme(theme: unknown): TicketDesignTheme {
  if (theme && typeof theme === "object" && !Array.isArray(theme)) {
    return theme as TicketDesignTheme;
  }
  return {};
}

export function toTicketDesignPresetDto(
  preset: TicketDesignPreset
): TicketDesignPresetDto {
  return {
    id: preset.id,
    slug: preset.slug,
    name: preset.name,
    description: preset.description,
    previewUrl: preset.previewUrl,
    theme: parseTicketDesignTheme(preset.theme),
    sortOrder: preset.sortOrder,
  };
}

export function ticketDesignCardStyle(theme: TicketDesignTheme): CSSProperties {
  return {
    borderStyle: (theme.borderStyle as CSSProperties["borderStyle"]) ?? "solid",
    borderWidth: theme.borderWidth ?? "2px",
    borderColor: theme.borderColor ?? "oklch(0.58 0.24 285)",
    background: theme.background ?? "oklch(0.19 0.02 285)",
    color: theme.textColor ?? "oklch(0.97 0 0)",
    boxShadow: theme.boxShadow ?? undefined,
  };
}

export function ticketListViewToParam(view: TicketListView): string {
  return view.toLowerCase();
}

export function paramToTicketListView(
  param: string | null | undefined
): TicketListView | null {
  const upper = param?.toUpperCase();
  if (
    upper === "GRID" ||
    upper === "COMPACT" ||
    upper === "SHOWCASE" ||
    upper === "TABLE"
  ) {
    return upper;
  }
  return null;
}
