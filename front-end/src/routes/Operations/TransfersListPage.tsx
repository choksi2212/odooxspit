import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { wsClient } from '@/lib/ws-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { StatusBadge } from '@/components/Operations/StatusBadge';
import { KanbanView } from '@/components/Operations/KanbanView';
import { Plus, Search, List, LayoutGrid } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

type ViewMode = 'list' | 'kanban';

export default function TransfersListPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('list');

  const { data: operations, isLoading, refetch } = useQuery({
    queryKey: ['operations', 'TRANSFER'],
    queryFn: () => apiClient.getOperations({ type: 'TRANSFER' }),
  });

  useEffect(() => {
    const unsubscribeCreated = wsClient.on('operation.created', (data) => {
      if (data.type === 'TRANSFER') {
        refetch();
      }
    });

    const unsubscribeUpdated = wsClient.on('operation.updated', () => {
      refetch();
    });

    const unsubscribeStatus = wsClient.on('operation.statusChanged', () => {
      refetch();
    });

    return () => {
      unsubscribeCreated();
      unsubscribeUpdated();
      unsubscribeStatus();
    };
  }, [refetch]);

  const filteredOperations = operations?.data?.filter((op: any) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      op.reference?.toLowerCase().includes(searchLower) ||
      op.locationFrom?.name?.toLowerCase().includes(searchLower) ||
      op.locationTo?.name?.toLowerCase().includes(searchLower)
    );
  });

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Internal Transfers</h1>
          <p className="text-muted-foreground">Manage inventory transfers between locations</p>
        </div>
        <Button asChild>
          <Link to="/operations/transfers/new">
            <Plus className="mr-2 h-4 w-4" />
            New Transfer
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by reference or location..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex rounded-md border">
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  'rounded-r-none',
                  viewMode === 'list' && 'bg-accent'
                )}
                onClick={() => setViewMode('list')}
              >
                <List className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  'rounded-l-none border-l',
                  viewMode === 'kanban' && 'bg-accent'
                )}
                onClick={() => setViewMode('kanban')}
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading transfers...</div>
          ) : filteredOperations?.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No transfers found. Create your first transfer to get started.
            </div>
          ) : viewMode === 'kanban' ? (
            <KanbanView operations={filteredOperations} basePath="/operations/transfers" />
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Reference</TableHead>
                    <TableHead>From Location</TableHead>
                    <TableHead>To Location</TableHead>
                    <TableHead>Responsible</TableHead>
                    <TableHead>Schedule Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOperations?.map((operation: any) => (
                    <TableRow key={operation.id}>
                      <TableCell className="font-medium">{operation.reference}</TableCell>
                      <TableCell>{operation.locationFrom?.name || '-'}</TableCell>
                      <TableCell>{operation.locationTo?.name || '-'}</TableCell>
                      <TableCell>{operation.responsible?.name || '-'}</TableCell>
                      <TableCell>
                        {operation.scheduleDate
                          ? format(new Date(operation.scheduleDate), 'MMM dd, yyyy')
                          : '-'}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={operation.status} />
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" asChild>
                          <Link to={`/operations/transfers/${operation.id}`}>View</Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
