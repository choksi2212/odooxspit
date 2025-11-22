import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface StatusBadgeProps {
  status: 'DRAFT' | 'WAITING' | 'READY' | 'DONE' | 'CANCELED';
  className?: string;
}

const statusConfig = {
  DRAFT: {
    label: 'Draft',
    className: 'bg-status-draft text-status-draft-foreground',
  },
  WAITING: {
    label: 'Waiting',
    className: 'bg-status-waiting text-status-waiting-foreground',
  },
  READY: {
    label: 'Ready',
    className: 'bg-status-ready text-status-ready-foreground',
  },
  DONE: {
    label: 'Done',
    className: 'bg-status-done text-status-done-foreground',
  },
  CANCELED: {
    label: 'Canceled',
    className: 'bg-status-canceled text-status-canceled-foreground',
  },
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status];
  
  return (
    <Badge className={cn(config.className, className)}>
      {config.label}
    </Badge>
  );
}
