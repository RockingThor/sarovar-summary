import { Badge } from "@/components/ui/badge";
import { TASK_STATUS_LABELS } from "@sarovar/shared";

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export default function StatusBadge({ status, className }: StatusBadgeProps) {
  const variant =
    status === "DONE"
      ? "done"
      : status === "IN_PROGRESS"
      ? "inProgress"
      : status === "NOT_APPLICABLE"
      ? "notApplicable"
      : "pending";

  return (
    <Badge variant={variant} className={className}>
      {TASK_STATUS_LABELS[status] || status}
    </Badge>
  );
}

interface ImportanceBadgeProps {
  importance: string;
  className?: string;
}

export function ImportanceBadge({
  importance,
  className,
}: ImportanceBadgeProps) {
  const normalizedImportance = importance.trim();
  const variant =
    normalizedImportance === "Very High"
      ? "importanceVeryHigh"
      : normalizedImportance === "High"
      ? "importanceHigh"
      : normalizedImportance === "Med"
      ? "importanceMed"
      : "importanceLow";

  return (
    <Badge variant={variant} className={className}>
      {normalizedImportance}
    </Badge>
  );
}
