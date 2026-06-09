import type { TicketListView } from "@prisma/client";

export type TicketDesignTheme = {
  borderStyle?: string;
  borderWidth?: string;
  borderColor?: string;
  background?: string;
  accentColor?: string;
  textColor?: string;
  mutedColor?: string;
  boxShadow?: string;
  numberSize?: string;
};

export type TicketDesignPresetDto = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  previewUrl: string | null;
  theme: TicketDesignTheme;
  sortOrder: number;
};

export type TicketListViewSlug = Lowercase<TicketListView>;

export const TICKET_LIST_VIEWS: TicketListView[] = [
  "GRID",
  "COMPACT",
  "SHOWCASE",
  "TABLE",
];

export const TICKET_LIST_VIEW_LABELS: Record<TicketListView, string> = {
  GRID: "Grid cards",
  COMPACT: "Compact list",
  SHOWCASE: "Showcase strip",
  TABLE: "Table",
};

export type ShareAspectRatio = "1:1" | "4:5" | "16:9";

/** Max ticket cards shown on social share exports */
export const MAX_SHARE_TICKET_COUNT = 12;

export const SHARE_ASPECT_RATIOS: {
  id: ShareAspectRatio;
  label: string;
  width: number;
  height: number;
}[] = [
  { id: "1:1", label: "Square (1:1)", width: 1080, height: 1080 },
  { id: "4:5", label: "Portrait (4:5)", width: 1080, height: 1350 },
  { id: "16:9", label: "Wide (16:9)", width: 1920, height: 1080 },
];
