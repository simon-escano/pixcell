import { getStatusConfig, ReportStatus } from '@/lib/status-config'
import React from 'react'
import { Badge } from '../ui/badge'
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card"

interface StatusBadgeProps {
  status: ReportStatus
}

const StatusBadge = ({status}: StatusBadgeProps) => {
  const config = getStatusConfig(status)

  return (
    <HoverCard>
      <HoverCardTrigger>
        <Badge variant="outline" className={`${config.color} border flex items-center pl-1.5 pr-2 gap-1.5`}>
          <config.icon className={`${config.color} size-3.5`} />
          {config.label}
        </Badge>
      </HoverCardTrigger>
      <HoverCardContent className='text-xs px-3 py-2 w-auto max-w-40'>{config.description}</HoverCardContent>
    </HoverCard>
  )
}

export default StatusBadge