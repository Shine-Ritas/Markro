import type { Session } from "next-auth";

export function hasPermission(session: Session | null, permission: string): boolean {
  if (!session?.user) return false;
  const { isSuperAdmin, permissions = [] } = session.user;
  if (isSuperAdmin || permissions.includes("*")) return true;
  if (permissions.includes(permission)) return true;
  const [resource] = permission.split(".");
  return permissions.includes(`${resource}.*`);
}

export function requirePermission(session: Session | null, permission: string): void {
  if (!hasPermission(session, permission)) {
    throw new Error("Forbidden");
  }
}

export const PERMISSIONS = {
  TENANT_MANAGE: "tenant.manage",
  EVENTS_READ: "events.read",
  EVENTS_WRITE: "events.write",
  TICKETS_READ: "tickets.read",
  TICKETS_WRITE: "tickets.write",
  DRAWS_RUN: "draws.run",
  CUSTOMERS_READ: "customers.read",
  ANALYTICS_VIEW: "analytics.view",
  STAFF_MANAGE: "staff.manage",
  SETTINGS_MANAGE: "settings.manage",
} as const;
