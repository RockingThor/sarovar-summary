import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: Date | string | null): string {
  if (!date) return "-"
  const d = typeof date === "string" ? new Date(date) : date
  return d.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })
}

export function formatDateTime(date: Date | string | null): string {
  if (!date) return "-"
  const d = typeof date === "string" ? new Date(date) : date
  return d.toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

export function getDaysRemaining(estimatedDate: Date | string | null): { days: number | null; label: string; status: 'overdue' | 'urgent' | 'normal' | 'none' } {
  if (!estimatedDate) {
    return { days: null, label: "-", status: 'none' }
  }
  
  const estimated = typeof estimatedDate === "string" ? new Date(estimatedDate) : estimatedDate
  const today = new Date()
  
  // Reset time parts to compare only dates
  today.setHours(0, 0, 0, 0)
  estimated.setHours(0, 0, 0, 0)
  
  const diffTime = estimated.getTime() - today.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  
  if (diffDays < 0) {
    return { days: diffDays, label: `${Math.abs(diffDays)}d overdue`, status: 'overdue' }
  } else if (diffDays === 0) {
    return { days: 0, label: "Due today", status: 'urgent' }
  } else if (diffDays <= 3) {
    return { days: diffDays, label: `${diffDays}d left`, status: 'urgent' }
  } else {
    return { days: diffDays, label: `${diffDays}d left`, status: 'normal' }
  }
}

