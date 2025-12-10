import type { TaskStatus } from "./task";
export interface Hotel {
  id: string;
  name: string;
  code: string;
  address: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateHotelInput {
  name: string;
  code: string;
  address: string;
  partnerEmail: string;
  partnerName: string;
}

export interface HotelWithProgress extends Hotel {
  totalTasks: number;
  pendingTasks: number;
  inProgressTasks: number;
  completedTasks: number;
  progressPercentage: number;
}

export interface HotelDetail extends Hotel {
  user: {
    id: string;
    email: string;
    name: string;
  } | null;
  taskProgress: TaskProgressWithQuestion[];
}

export interface TaskProgressWithQuestion {
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


