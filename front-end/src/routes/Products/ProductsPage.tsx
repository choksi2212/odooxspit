import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { wsClient } from '@/lib/ws-client';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Search, AlertCircle, PackageX } from 'lucide-react';

export default function ProductsPage() {
  const [searchTerm, setSearchTerm] = useState('');

  const { data: products, isLoading, refetch } = useQuery({
    queryKey: ['products'],
    queryFn: () => apiClient.getProducts(),
  });

  useEffect(() => {
    const unsubscribe = wsClient.on('stock.levelChanged', () => {
      refetch();
    });

    const unsubscribeLowStock = wsClient.on('lowStock.alertCreated', () => {
      refetch();
    });

    return () => {
      unsubscribe();
      unsubscribeLowStock();
    };
  }, [refetch]);

  const filteredProducts = products?.filter((product: any) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      product.name?.toLowerCase().includes(searchLower) ||
      product.sku?.toLowerCase().includes(searchLower) ||
      product.category?.toLowerCase().includes(searchLower)
    );
  });

  const getStockStatus = (product: any) => {
    if (!product.currentStock || product.currentStock === 0) {
      return { label: 'Out of Stock', variant: 'destructive', icon: PackageX };
    }
    if (product.currentStock <= product.lowStockThreshold) {
      return { label: 'Low Stock', variant: 'warning', icon: AlertCircle };
    }
    return { label: 'In Stock', variant: 'success', icon: null };
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Products</h1>
        <p className="text-muted-foreground">View and manage product inventory levels</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, SKU, or category..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading products...</div>
          ) : filteredProducts?.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No products found matching your search.
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>SKU</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead className="text-right">Current Stock</TableHead>
                    <TableHead className="text-right">Low Stock Threshold</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProducts?.map((product: any) => {
                    const status = getStockStatus(product);
                    const StatusIcon = status.icon;

                    return (
                      <TableRow key={product.id}>
                        <TableCell className="font-mono text-sm">{product.sku}</TableCell>
                        <TableCell className="font-medium">{product.name}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{product.category || 'Uncategorized'}</Badge>
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {product.currentStock || 0}
                        </TableCell>
                        <TableCell className="text-right font-mono text-muted-foreground">
                          {product.lowStockThreshold || 0}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {StatusIcon && <StatusIcon className="h-4 w-4" />}
                            <Badge
                              variant={status.variant === 'destructive' ? 'destructive' : 'outline'}
                              className={
                                status.variant === 'warning'
                                  ? 'bg-warning text-warning-foreground border-warning'
                                  : status.variant === 'success'
                                  ? 'bg-success text-success-foreground border-success'
                                  : ''
                              }
                            >
                              {status.label}
                            </Badge>
                          </div>
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
