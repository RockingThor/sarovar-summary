import type { TaskStatus } from "./task";

export interface AuditLog {
  id: string;
  hotelId: string;
  questionId: string;
  previousStatus: TaskStatus | null;
  newStatus: TaskStatus;
  changedById: string;
  isAdminOverride: boolean;
  createdAt: Date;
}

export interface AuditLogWithDetails extends AuditLog {
  question: {
    id: string;
    serialNo: number;
    checklistItem: string;
  };
  changedBy: {
    id: string;
    name: string;
    email: string;
  };
}

