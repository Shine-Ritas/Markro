import { toTicketDesignPresetDto } from "@/lib/ticket-designs";
import { prisma } from "@/lib/prisma";

export async function listTicketDesignPresets() {
  const presets = await prisma.ticketDesignPreset.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
  });
  return presets.map(toTicketDesignPresetDto);
}

export async function getTicketDesignPresetById(id: string) {
  const preset = await prisma.ticketDesignPreset.findFirst({
    where: { id, isActive: true },
  });
  return preset ? toTicketDesignPresetDto(preset) : null;
}

export async function getTicketDesignPresetBySlug(slug: string) {
  const preset = await prisma.ticketDesignPreset.findFirst({
    where: { slug, isActive: true },
  });
  return preset ? toTicketDesignPresetDto(preset) : null;
}

export async function getDefaultTicketDesignId(): Promise<string> {
  const preset = await prisma.ticketDesignPreset.findUniqueOrThrow({
    where: { slug: "classic" },
    select: { id: true },
  });
  return preset.id;
}
