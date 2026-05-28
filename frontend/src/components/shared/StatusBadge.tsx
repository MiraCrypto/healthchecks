import { Badge } from '@radix-ui/themes'
import type { CheckStatus } from '@healthchecks/shared'

interface StatusBadgeProps {
  status: CheckStatus
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const getStatusColor = (s: CheckStatus) => {
    switch (s) {
      case 'UP': return 'green'
      case 'DOWN': return 'ruby'
      case 'PAUSED': return 'amber'
      case 'NEW': return 'gray'
      default: return 'gray'
    }
  }

  return (
    <Badge 
      color={getStatusColor(status)} 
      radius="full"
      size="2"
      style={{ padding: '0.25em 0.75em', borderRadius: '9999px', fontWeight: 500 }}
    >
      {status}
    </Badge>
  )
}
