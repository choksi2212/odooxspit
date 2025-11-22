import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/Operations/StatusBadge';
import { format } from 'date-fns';
import { Eye } from 'lucide-react';

interface Operation {
  id: string;
  reference: string;
  contact?: string;
  contactName?: string;
  from?: string;
  to?: string;
  locationFrom?: { name: string };
  locationTo?: { name: string };
  scheduleDate?: string;
  status: string;
}

interface KanbanViewProps {
  operations: Operation[];
  basePath: string; // e.g., "/operations/receipts"
}

const STATUS_COLUMNS = [
  { key: 'DRAFT', label: 'Draft', color: 'bg-muted' },
  { key: 'WAITING', label: 'Waiting', color: 'bg-warning/10' },
  { key: 'READY', label: 'Ready', color: 'bg-primary/10' },
  { key: 'DONE', label: 'Done', color: 'bg-success/10' },
  { key: 'CANCELED', label: 'Canceled', color: 'bg-destructive/10' },
];

export function KanbanView({ operations, basePath }: KanbanViewProps) {
  const groupByStatus = () => {
    const groups: Record<string, Operation[]> = {
      DRAFT: [],
      WAITING: [],
      READY: [],
      DONE: [],
      CANCELED: [],
    };

    operations.forEach((op) => {
      if (groups[op.status]) {
        groups[op.status].push(op);
      }
    });

    return groups;
  };

  const grouped = groupByStatus();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
      {STATUS_COLUMNS.map((column) => (
        <div key={column.key} className="flex flex-col gap-3">
          <div className={`rounded-lg p-3 ${column.color}`}>
            <h3 className="font-semibold text-sm flex items-center justify-between">
              {column.label}
              <span className="text-xs font-normal text-muted-foreground">
                {grouped[column.key].length}
              </span>
            </h3>
          </div>

          <div className="space-y-3">
            {grouped[column.key].length === 0 ? (
              <div className="text-center text-xs text-muted-foreground py-4">
                No operations
              </div>
            ) : (
              grouped[column.key].map((operation) => (
                <Card key={operation.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1 flex-1 min-w-0">
                        <div className="font-mono text-sm font-semibold truncate">
                          {operation.reference}
                        </div>
                        {(operation.contact || operation.contactName) && (
                          <div className="text-xs text-muted-foreground truncate">
                            {operation.contactName || operation.contact}
                          </div>
                        )}
                        {operation.scheduleDate && (
                          <div className="text-xs text-muted-foreground">
                            {format(new Date(operation.scheduleDate), 'MMM dd')}
                          </div>
                        )}
                      </div>
                      <StatusBadge status={operation.status} size="sm" />
                    </div>

                    {(operation.from || operation.locationFrom || operation.to || operation.locationTo) && (
                      <div className="text-xs space-y-1 pt-2 border-t">
                        {(operation.from || operation.locationFrom) && (
                          <div className="text-muted-foreground">
                            From: <span className="text-foreground">{operation.locationFrom?.name || operation.from || 'External'}</span>
                          </div>
                        )}
                        {(operation.to || operation.locationTo) && (
                          <div className="text-muted-foreground">
                            To: <span className="text-foreground">{operation.locationTo?.name || operation.to}</span>
                          </div>
                        )}
                      </div>
                    )}

                    <Button 
                      asChild 
                      variant="outline" 
                      size="sm" 
                      className="w-full mt-2"
                    >
                      <Link to={`${basePath}/${operation.id}`}>
                        <Eye className="mr-2 h-3 w-3" />
                        View
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

