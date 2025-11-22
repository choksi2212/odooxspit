import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { wsClient } from '@/lib/ws-client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Package, AlertTriangle, FileText, TruckIcon, ArrowLeftRight, Clock, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DashboardKpis {
  totalProducts: number;
  lowStock: number;
  outOfStock: number;
  pendingReceipts: number;
  pendingDeliveries: number;
  pendingTransfers: number;
}

interface StatusCardData {
  late: number;
  waiting: number;
  ready: number;
  toReceive?: number;
  toDeliver?: number;
}

export default function DashboardPage() {
  const [kpis, setKpis] = useState<DashboardKpis | null>(null);
  const [receiptsData, setReceiptsData] = useState<StatusCardData>({ late: 0, waiting: 0, ready: 0, toReceive: 0 });
  const [deliveriesData, setDeliveriesData] = useState<StatusCardData>({ late: 0, waiting: 0, ready: 0, toDeliver: 0 });

  const { data: kpisData, isLoading } = useQuery({
    queryKey: ['dashboard-kpis'],
    queryFn: () => apiClient.getDashboardKpis(),
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  useEffect(() => {
    if (kpisData) {
      setKpis(kpisData);
      // Parse receipts/deliveries data from backend
      // Mock data for now
      setReceiptsData({ late: 2, waiting: 5, ready: 8, toReceive: 15 });
      setDeliveriesData({ late: 1, waiting: 3, ready: 6, toDeliver: 10 });
    }
  }, [kpisData]);

  useEffect(() => {
    // Subscribe to real-time dashboard updates
    const unsubscribe = wsClient.on('dashboard.kpisUpdated', (data) => {
      setKpis(data.kpis);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-muted-foreground">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Overview of your inventory operations</p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Products</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpis?.totalProducts || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Stock</CardTitle>
            <AlertTriangle className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">{kpis?.lowStock || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Out of Stock</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{kpis?.outOfStock || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Receipts</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpis?.pendingReceipts || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Deliveries</CardTitle>
            <TruckIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpis?.pendingDeliveries || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Transfers</CardTitle>
            <ArrowLeftRight className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpis?.pendingTransfers || 0}</div>
          </CardContent>
        </Card>
      </div>

      {/* Receipts and Deliveries Status Cards */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Receipts Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Receipts
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold">{receiptsData.toReceive}</span>
              <span className="text-muted-foreground">to receive</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className={cn('rounded-lg p-3 text-center', 'bg-destructive/10')}>
                <div className="text-2xl font-bold text-destructive">{receiptsData.late}</div>
                <div className="text-xs text-muted-foreground mt-1">Late</div>
              </div>
              <div className={cn('rounded-lg p-3 text-center', 'bg-warning/10')}>
                <div className="text-2xl font-bold text-warning">{receiptsData.waiting}</div>
                <div className="text-xs text-muted-foreground mt-1">Waiting</div>
              </div>
              <div className={cn('rounded-lg p-3 text-center', 'bg-primary/10')}>
                <div className="text-2xl font-bold text-primary">{receiptsData.ready}</div>
                <div className="text-xs text-muted-foreground mt-1">Ready</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Deliveries Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TruckIcon className="h-5 w-5" />
              Deliveries
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold">{deliveriesData.toDeliver}</span>
              <span className="text-muted-foreground">to deliver</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className={cn('rounded-lg p-3 text-center', 'bg-destructive/10')}>
                <div className="text-2xl font-bold text-destructive">{deliveriesData.late}</div>
                <div className="text-xs text-muted-foreground mt-1">Late</div>
              </div>
              <div className={cn('rounded-lg p-3 text-center', 'bg-warning/10')}>
                <div className="text-2xl font-bold text-warning">{deliveriesData.waiting}</div>
                <div className="text-xs text-muted-foreground mt-1">Waiting</div>
              </div>
              <div className={cn('rounded-lg p-3 text-center', 'bg-primary/10')}>
                <div className="text-2xl font-bold text-primary">{deliveriesData.ready}</div>
                <div className="text-xs text-muted-foreground mt-1">Ready</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
