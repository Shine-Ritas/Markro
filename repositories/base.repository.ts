import { prisma } from "@/lib/prisma";
import { tenantWhere } from "@/lib/tenant";

export function getTenantPrisma(tenantId: string) {
  return {
    tenantId,
    where: tenantWhere.bind(null, tenantId) as typeof tenantWhere,
    client: prisma,
  };
}
