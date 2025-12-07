export type TaskStatus = "PENDING" | "IN_PROGRESS" | "DONE";

export interface TaskProgress {
  id: string;
  hotelId: string;
  questionId: string;
  status: TaskStatus;
  estimatedDate: Date | null;
  updatedAt: Date;
  updatedById: string;
}

export interface UpdateTaskInput {
  status: TaskStatus;
  estimatedDate?: Date | null;
}

export interface TaskWithDetails {
  id: string;
  status: TaskStatus;
  estimatedDate: Date | null;
  updatedAt: Date;
  question: {
    id: string;
    serialNo: number;
    checklistItem: string;
    category: {
      id: string;
      name: string;
    };
    department: {
      id: string;
      name: string;
    };
  };
}

export interface TaskFilters {
  departmentId?: string;
  categoryId?: string;
  status?: TaskStatus;
}

export interface DashboardStats {
  totalTasks: number;
  pendingTasks: number;
  inProgressTasks: number;
  completedTasks: number;
  progressPercentage: number;
  departmentProgress: DepartmentProgress[];
}

export interface DepartmentProgress {
  departmentId: string;
  departmentName: string;
  total: number;
  pending: number;
  inProgress: number;
  completed: number;
  percentage: number;
}

