import { auth } from "@/auth";
import { ensurePermissions } from "@/lib/auth-provisioning";
import { hasPermission, PERMISSIONS } from "@/lib/rbac";
import { getPrimaryStaffMembership } from "@/lib/tenant";
import type { Session } from "next-auth";

let permissionsEnsured = false;

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number
  ) {
    super(message);
  }
}

export async function requireApiSession(): Promise<Session> {
  const session = await auth();
  if (!session?.user?.id) {
    throw new ApiError("Unauthorized", 401);
  }
  if (!session.user.tenantId) {
    throw new ApiError("No workspace selected", 403);
  }

  if (!permissionsEnsured) {
    await ensurePermissions();
    permissionsEnsured = true;
  }

  if (!session.user.isSuperAdmin) {
    const membership = await getPrimaryStaffMembership(session.user.id);
    if (membership && membership.tenantId === session.user.tenantId) {
      session.user.permissions = membership.permissions;
      session.user.roleSlug = membership.roleSlug;
    }
  }

  return session;
}

export function requireEventsRead(session: Session) {
  if (!hasPermission(session, PERMISSIONS.EVENTS_READ)) {
    throw new ApiError("Forbidden", 403);
  }
}

export function requireEventsWrite(session: Session) {
  if (!hasPermission(session, PERMISSIONS.EVENTS_WRITE)) {
    throw new ApiError("Forbidden", 403);
  }
}

export function requireTicketsRead(session: Session) {
  if (!hasPermission(session, PERMISSIONS.TICKETS_READ)) {
    throw new ApiError("Forbidden", 403);
  }
}

export function requireTicketsWrite(session: Session) {
  if (!hasPermission(session, PERMISSIONS.TICKETS_WRITE)) {
    throw new ApiError("Forbidden", 403);
  }
}

export function requireDrawsRun(session: Session) {
  if (!hasPermission(session, PERMISSIONS.DRAWS_RUN)) {
    throw new ApiError("Forbidden", 403);
  }
}

export function requireCustomersRead(session: Session) {
  if (!hasPermission(session, PERMISSIONS.CUSTOMERS_READ)) {
    throw new ApiError("Forbidden", 403);
  }
}

export function requireCustomersWrite(session: Session) {
  if (!hasPermission(session, PERMISSIONS.CUSTOMERS_WRITE)) {
    throw new ApiError("Forbidden", 403);
  }
}
