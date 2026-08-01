import { auth } from "@/auth";
import { hasPermission, PERMISSIONS } from "@/lib/rbac";
import type { Session } from "next-auth";

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
