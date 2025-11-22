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
import { Plus, Search } from 'lucide-react';
import { format } from 'date-fns';

export default function DeliveriesListPage() {
  const [searchTerm, setSearchTerm] = useState('');

  const { data: operations, isLoading, refetch } = useQuery({
    queryKey: ['operations', 'DELIVERY'],
    queryFn: () => apiClient.getOperations({ type: 'DELIVERY' }),
  });

  useEffect(() => {
    const unsubscribeCreated = wsClient.on('operation.created', (data) => {
      if (data.type === 'DELIVERY') {
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
      op.contact?.toLowerCase().includes(searchLower) ||
      op.deliveryAddress?.toLowerCase().includes(searchLower)
    );
  });

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Deliveries</h1>
          <p className="text-muted-foreground">Manage outgoing inventory operations</p>
        </div>
        <Button asChild>
          <Link to="/operations/deliveries/new">
            <Plus className="mr-2 h-4 w-4" />
            New Delivery
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by reference, contact, or address..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading deliveries...</div>
          ) : filteredOperations?.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No deliveries found. Create your first delivery to get started.
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Reference</TableHead>
                    <TableHead>To</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Address</TableHead>
                    <TableHead>Schedule Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOperations?.map((operation: any) => (
                    <TableRow key={operation.id}>
                      <TableCell className="font-medium">{operation.reference}</TableCell>
                      <TableCell>{operation.to || '-'}</TableCell>
                      <TableCell>{operation.contact || '-'}</TableCell>
                      <TableCell className="max-w-xs truncate">{operation.deliveryAddress || '-'}</TableCell>
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
                          <Link to={`/operations/deliveries/${operation.id}`}>View</Link>
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
