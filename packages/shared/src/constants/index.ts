export const TASK_STATUS = {
  PENDING: "PENDING",
  IN_PROGRESS: "IN_PROGRESS",
  DONE: "DONE",
  NOT_APPLICABLE: "NOT_APPLICABLE",
} as const;

export const TASK_STATUS_LABELS: Record<string, string> = {
  PENDING: "Pending",
  IN_PROGRESS: "In Progress",
  DONE: "Completed",
  NOT_APPLICABLE: "N/A",
};

export const TASK_STATUS_COLORS: Record<string, string> = {
  PENDING: "red",
  IN_PROGRESS: "yellow",
  DONE: "green",
  NOT_APPLICABLE: "gray",
};

export const STATUS_ORDER = ["PENDING", "IN_PROGRESS", "DONE"] as const;

export const IMPORTANCE_LEVELS = ["Low", "Med", "High", "Very High"] as const;

export const IMPORTANCE_COLORS: Record<string, string> = {
  Low: "gray",
  Med: "blue",
  High: "orange",
  "Very High": "red",
  "Very High ": "red", // Handle trailing space in data
};

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

  // Users can mark any task as N/A
  if (newStatus === "NOT_APPLICABLE") return true;

  // If current status is N/A, users can move to any forward status
  if (currentStatus === "NOT_APPLICABLE") {
    return STATUS_ORDER.includes(newStatus as (typeof STATUS_ORDER)[number]);
  }

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
    return [...STATUS_ORDER, "NOT_APPLICABLE"];
  }

  // If current is N/A, user can move back to regular workflow
  if (currentStatus === "NOT_APPLICABLE") {
    return [...STATUS_ORDER];
  }

  const currentIndex = STATUS_ORDER.indexOf(
    currentStatus as (typeof STATUS_ORDER)[number]
  );
  // Include N/A as an option for users
  return [...STATUS_ORDER.slice(currentIndex + 1), "NOT_APPLICABLE"];
}

