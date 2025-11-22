import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { StatusBadge } from '@/components/Operations/StatusBadge';
import { Search, ArrowUpCircle, ArrowDownCircle } from 'lucide-react';
import { format } from 'date-fns';

export default function MoveHistoryPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const { data: moveHistory, isLoading } = useQuery({
    queryKey: ['move-history'],
    queryFn: () => apiClient.getMoveHistory(),
  });

  const filteredHistory = moveHistory?.data?.filter((move: any) => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch =
      move.reference?.toLowerCase().includes(searchLower) ||
      move.contact?.toLowerCase().includes(searchLower);

    const matchesType = filterType === 'all' || move.type === filterType;
    const matchesStatus = filterStatus === 'all' || move.status === filterStatus;

    return matchesSearch && matchesType && matchesStatus;
  });

  const getMovementType = (type: string) => {
    if (type === 'RECEIPT' || type === 'ADJUSTMENT_IN') {
      return { label: 'In', icon: ArrowUpCircle, color: 'text-movement-in' };
    }
    return { label: 'Out', icon: ArrowDownCircle, color: 'text-movement-out' };
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Move History</h1>
        <p className="text-muted-foreground">Track all inventory movements</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by reference or contact..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>

            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="RECEIPT">Receipt</SelectItem>
                <SelectItem value="DELIVERY">Delivery</SelectItem>
                <SelectItem value="TRANSFER">Transfer</SelectItem>
                <SelectItem value="ADJUSTMENT">Adjustment</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="DRAFT">Draft</SelectItem>
                <SelectItem value="WAITING">Waiting</SelectItem>
                <SelectItem value="READY">Ready</SelectItem>
                <SelectItem value="DONE">Done</SelectItem>
                <SelectItem value="CANCELED">Canceled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading history...</div>
          ) : filteredHistory?.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No move history found matching your filters.
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Reference</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>From</TableHead>
                    <TableHead>To</TableHead>
                    <TableHead className="text-right">Quantity</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredHistory?.map((move: any) => {
                    const movementType = getMovementType(move.type);
                    const MovementIcon = movementType.icon;

                    return (
                      <TableRow key={move.id}>
                        <TableCell className="font-medium font-mono text-sm">
                          {move.reference}
                        </TableCell>
                        <TableCell>
                          {move.date ? format(new Date(move.date), 'MMM dd, yyyy HH:mm') : '-'}
                        </TableCell>
                        <TableCell>{move.contact || '-'}</TableCell>
                        <TableCell>{move.from || '-'}</TableCell>
                        <TableCell>{move.to || '-'}</TableCell>
                        <TableCell className="text-right font-mono">
                          <div className="flex items-center justify-end gap-1">
                            <MovementIcon className={`h-4 w-4 ${movementType.color}`} />
                            <span>{move.quantity || 0}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={
                              movementType.label === 'In'
                                ? 'border-movement-in text-movement-in'
                                : 'border-movement-out text-movement-out'
                            }
                          >
                            {movementType.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={move.status} />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
