import type { Session } from "./session-types";

export function hasRole(session: Session | null, ...roles: Session["role"][]): boolean {
  if (!session) return false;
  return roles.includes(session.role);
}

export function isAdmin(session: Session | null): boolean {
  if (!session) return false;
  return session.role === "admin" || session.role === "superadmin";
}

export function isSuperadmin(session: Session | null): boolean {
  if (!session) return false;
  return session.role === "superadmin";
}

export function isCreator(session: Session | null): boolean {
  if (!session) return false;
  return session.role === "creator";
}
