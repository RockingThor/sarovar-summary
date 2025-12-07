export const TASK_STATUS = {
  PENDING: "PENDING",
  IN_PROGRESS: "IN_PROGRESS",
  DONE: "DONE",
} as const;

export const TASK_STATUS_LABELS: Record<string, string> = {
  PENDING: "Pending",
  IN_PROGRESS: "In Progress",
  DONE: "Completed",
};

export const TASK_STATUS_COLORS: Record<string, string> = {
  PENDING: "red",
  IN_PROGRESS: "yellow",
  DONE: "green",
};

export const STATUS_ORDER = ["PENDING", "IN_PROGRESS", "DONE"] as const;

export const USER_ROLES = {
  ADMIN: "ADMIN",
  USER: "USER",
} as const;

export const DEPARTMENTS = [
  "Engineering",
  "HR",
  "Hotel Admin",
  "Security",
  "IT",
  "Housekeeping",
  "Front Office",
] as const;

export const CATEGORIES = [
  "Fire Life Safety",
  "Engineering",
  "Guest Rooms",
  "Public Areas",
  "Security",
  "F&B",
  "Back of House",
  "IT & Systems",
] as const;

// Validation helpers
export function canUserTransition(
  currentStatus: string,
  newStatus: string,
  isAdmin: boolean
): boolean {
  if (isAdmin) return true;

  const currentIndex = STATUS_ORDER.indexOf(
    currentStatus as (typeof STATUS_ORDER)[number]
  );
  const newIndex = STATUS_ORDER.indexOf(
    newStatus as (typeof STATUS_ORDER)[number]
  );

  // Users can only move forward
  return newIndex > currentIndex;
}

export function getNextAllowedStatuses(
  currentStatus: string,
  isAdmin: boolean
): string[] {
  if (isAdmin) {
    return [...STATUS_ORDER];
  }

  const currentIndex = STATUS_ORDER.indexOf(
    currentStatus as (typeof STATUS_ORDER)[number]
  );
  return STATUS_ORDER.slice(currentIndex + 1);
}

