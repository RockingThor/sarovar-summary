import type { TaskStatus } from "./task";

export interface Department {
  id: string;
  name: string;
}

export interface Category {
  id: string;
  name: string;
}

export interface Question {
  id: string;
  serialNo: number;
  checklistItem: string;
  categoryId: string;
  departmentId: string;
  category: Category;
  department: Department;
}

export interface QuestionWithProgress extends Question {
  taskProgress?: {
    id: string;
    status: TaskStatus;
    estimatedDate: Date | null;
  };
}


