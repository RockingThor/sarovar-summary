import { Badge } from '@/components/ui/badge'
import { TASK_STATUS_LABELS } from '@sarovar/shared'

interface StatusBadgeProps {
  status: string
  className?: string
}

export default function StatusBadge({ status, className }: StatusBadgeProps) {
  const variant = 
    status === 'DONE' ? 'done' :
    status === 'IN_PROGRESS' ? 'inProgress' : 
    'pending'

  return (
    <Badge variant={variant} className={className}>
      {TASK_STATUS_LABELS[status] || status}
    </Badge>
  )
}

