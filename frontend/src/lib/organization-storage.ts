/**
 * Client-side utilities for managing last selected organization in localStorage
 */

const LAST_ORGANIZATION_KEY = "pixcell_last_organization_id";

export function getLastSelectedOrganizationId(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(LAST_ORGANIZATION_KEY);
  } catch {
    return null;
  }
}

export function setLastSelectedOrganizationId(organizationId: string): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(LAST_ORGANIZATION_KEY, organizationId);
  } catch {
    // Ignore errors
  }
}

export function clearLastSelectedOrganizationId(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(LAST_ORGANIZATION_KEY);
  } catch {
    // Ignore errors
  }
}

