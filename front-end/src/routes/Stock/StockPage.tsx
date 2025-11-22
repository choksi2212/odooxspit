import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Search, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

interface StockItem {
  id: string;
  name: string;
  sku: string;
  category: string;
  unitOfMeasure: string;
  perUnitCost: number;
  onHand: number;
  freeToUse: number;
  reorderLevel: number;
}

export default function StockPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedWarehouse, setSelectedWarehouse] = useState<string>('all');
  const [selectedLocation, setSelectedLocation] = useState<string>('all');

  const { data: products, isLoading, refetch } = useQuery({
    queryKey: ['products', searchTerm],
    queryFn: () => apiClient.getProducts({ search: searchTerm }),
  });

  const { data: warehouses } = useQuery({
    queryKey: ['warehouses'],
    queryFn: () => apiClient.getWarehouses(),
  });

  const { data: locations } = useQuery({
    queryKey: ['locations', selectedWarehouse],
    queryFn: () => apiClient.getLocations(selectedWarehouse !== 'all' ? selectedWarehouse : undefined),
    enabled: selectedWarehouse !== 'all',
  });

  const handleRefresh = () => {
    refetch();
    toast.success('Stock data refreshed');
  };

  // Calculate free to use (on hand - reserved)
  // For now, assuming all stock is free to use (no reservations)
  const getStockData = (product: any): StockItem => {
    const onHand = product.currentStock || 0;
    const reserved = 0; // TODO: Calculate from pending operations
    const freeToUse = onHand - reserved;

    return {
      id: product.id,
      name: product.name,
      sku: product.sku,
      category: product.category || 'N/A',
      unitOfMeasure: product.unitOfMeasure || 'Units',
      perUnitCost: product.cost || 0,
      onHand,
      freeToUse,
      reorderLevel: product.lowStockThreshold || 0,
    };
  };

  const filteredProducts = products?.map(getStockData) || [];

  const getStockStatus = (item: StockItem) => {
    if (item.onHand === 0) return { color: 'text-destructive', label: 'Out of Stock' };
    if (item.onHand <= item.reorderLevel) return { color: 'text-warning', label: 'Low Stock' };
    return { color: 'text-success', label: 'In Stock' };
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Stock</h1>
          <p className="text-muted-foreground">
            View current stock levels, per unit costs, and available inventory
          </p>
        </div>
        <Button onClick={handleRefresh} variant="outline">
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label>Search Products</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name or SKU..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Warehouse</Label>
              <Select value={selectedWarehouse} onValueChange={setSelectedWarehouse}>
                <SelectTrigger>
                  <SelectValue placeholder="All Warehouses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Warehouses</SelectItem>
                  {warehouses?.map((warehouse: any) => (
                    <SelectItem key={warehouse.id} value={warehouse.id}>
                      {warehouse.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Location</Label>
              <Select 
                value={selectedLocation} 
                onValueChange={setSelectedLocation}
                disabled={selectedWarehouse === 'all'}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Locations" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Locations</SelectItem>
                  {locations?.map((location: any) => (
                    <SelectItem key={location.id} value={location.id}>
                      {location.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stock Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="text-center py-12 text-muted-foreground">Loading stock data...</div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No products found. Add products to start tracking stock.
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead className="text-right">Per Unit Cost</TableHead>
                    <TableHead className="text-right">On Hand</TableHead>
                    <TableHead className="text-right">Free to Use</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProducts.map((item) => {
                    const status = getStockStatus(item);
                    return (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.name}</TableCell>
                        <TableCell className="font-mono text-sm">{item.sku}</TableCell>
                        <TableCell>{item.category}</TableCell>
                        <TableCell className="text-right font-mono">
                          ₹{item.perUnitCost.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right font-mono font-medium">
                          {item.onHand} {item.unitOfMeasure}
                        </TableCell>
                        <TableCell className="text-right font-mono font-bold text-primary">
                          {item.freeToUse} {item.unitOfMeasure}
                        </TableCell>
                        <TableCell>
                          <span className={`text-sm font-medium ${status.color}`}>
                            {status.label}
                          </span>
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

      {/* Info Section */}
      <Card className="border-muted bg-muted/50">
        <CardContent className="pt-6">
          <div className="text-sm text-muted-foreground space-y-2">
            <p><strong>On Hand:</strong> Total quantity available in the location</p>
            <p><strong>Free to Use:</strong> Available quantity not reserved for pending operations</p>
            <p className="text-xs">
              Note: Stock levels are updated automatically when operations are validated
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

