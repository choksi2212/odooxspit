import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { ChevronRight, Plus, Trash2, Check, X } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface ProductLine {
  id: string;
  productId: string;
  productName: string;
  countedQuantity: number;
}

export default function AdjustmentDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const isNew = id === 'new';

  const [formData, setFormData] = useState({
    responsible: user?.name || '',
    warehouseId: '',
    locationId: '',
    notes: '',
  });

  const [productLines, setProductLines] = useState<ProductLine[]>([]);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [countedQuantity, setCountedQuantity] = useState('');

  const { data: products } = useQuery({
    queryKey: ['products'],
    queryFn: () => apiClient.getProducts(),
  });

  const { data: warehouses } = useQuery({
    queryKey: ['warehouses'],
    queryFn: () => apiClient.getWarehouses(),
  });

  const { data: locations } = useQuery({
    queryKey: ['locations', formData.warehouseId],
    queryFn: () => apiClient.getLocations(formData.warehouseId),
    enabled: !!formData.warehouseId,
  });

  const { data: operation, isLoading } = useQuery({
    queryKey: ['operation', id],
    queryFn: () => apiClient.getOperation(id!),
    enabled: !isNew,
  });

  useEffect(() => {
    if (operation && !isNew) {
      setFormData({
        responsible: operation.responsibleUser?.name || '',
        warehouseId: operation.location?.warehouseId || '',
        locationId: operation.locationId || '',
        notes: operation.notes || '',
      });
      if (operation.items) {
        setProductLines(
          operation.items.map((item: any) => ({
            id: item.id,
            productId: item.productId,
            productName: item.product.name,
            countedQuantity: item.countedQuantity,
          }))
        );
      }
    }
  }, [operation, isNew]);

  const createMutation = useMutation({
    mutationFn: (data: any) => apiClient.createAdjustment(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['operations'] });
      toast.success('Adjustment created successfully');
      navigate('/operations/adjustments');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to create adjustment');
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) => apiClient.updateOperation(id!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['operation', id] });
      toast.success('Adjustment updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update adjustment');
    },
  });

  const transitionMutation = useMutation({
    mutationFn: (action: string) => apiClient.transitionOperation(id!, action),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['operation', id] });
      toast.success('Adjustment status updated');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update status');
    },
  });

  const handleAddProduct = () => {
    if (!selectedProductId || !countedQuantity || parseFloat(countedQuantity) < 0) {
      toast.error('Please select a product and enter a valid counted quantity');
      return;
    }

    const product = products?.find((p: any) => p.id === selectedProductId);
    if (!product) return;

    const existingIndex = productLines.findIndex((line) => line.productId === selectedProductId);
    if (existingIndex >= 0) {
      const updated = [...productLines];
      updated[existingIndex].countedQuantity = parseFloat(countedQuantity);
      setProductLines(updated);
    } else {
      setProductLines([
        ...productLines,
        {
          id: `temp-${Date.now()}`,
          productId: selectedProductId,
          productName: product.name,
          countedQuantity: parseFloat(countedQuantity),
        },
      ]);
    }

    setSelectedProductId('');
    setCountedQuantity('');
  };

  const handleRemoveProduct = (lineId: string) => {
    setProductLines(productLines.filter((line) => line.id !== lineId));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.locationId) {
      toast.error('Please select a location');
      return;
    }

    if (productLines.length === 0) {
      toast.error('Please add at least one product');
      return;
    }

    const payload = {
      warehouseId: formData.warehouseId || undefined,
      locationId: formData.locationId,
      notes: formData.notes || undefined,
      items: productLines.map((line) => ({
        productId: line.productId,
        countedQuantity: line.countedQuantity,
      })),
      responsibleUserId: user?.id,
    };

    if (isNew) {
      createMutation.mutate(payload);
    } else {
      updateMutation.mutate({
        notes: formData.notes || undefined,
      });
    }
  };

  const handleMarkReady = () => {
    transitionMutation.mutate('mark_ready');
  };

  const handleMarkDone = () => {
    transitionMutation.mutate('mark_done');
  };

  const handleCancel = () => {
    transitionMutation.mutate('cancel');
  };

  if (isLoading && !isNew) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-8 text-muted-foreground">Loading adjustment...</div>
      </div>
    );
  }

  const canEdit = isNew || operation?.status === 'DRAFT';
  const canTransition = !isNew && ['DRAFT', 'WAITING', 'READY'].includes(operation?.status);

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link to="/operations/adjustments" className="hover:text-foreground">
          Adjustments
        </Link>
        <ChevronRight className="h-4 w-4" />
        <span className="text-foreground">
          {isNew ? 'New Adjustment' : operation?.reference}
        </span>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {isNew ? 'New Stock Adjustment' : `Adjustment ${operation?.reference}`}
          </h1>
          <p className="text-muted-foreground">
            {isNew
              ? 'Create a new inventory adjustment after physical count'
              : 'View and manage adjustment details'}
          </p>
        </div>
        {!isNew && operation && (
          <div className="flex items-center gap-2">
            <StatusBadge status={operation.status} />
            {canTransition && operation.status === 'DRAFT' && (
              <Button onClick={handleMarkReady} size="sm">
                <Check className="mr-2 h-4 w-4" />
                Mark Ready
              </Button>
            )}
            {canTransition && operation.status === 'READY' && (
              <Button onClick={handleMarkDone} size="sm">
                <Check className="mr-2 h-4 w-4" />
                Mark Done
              </Button>
            )}
            {canTransition && (
              <Button onClick={handleCancel} variant="destructive" size="sm">
                <X className="mr-2 h-4 w-4" />
                Cancel
              </Button>
            )}
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Adjustment Details */}
        <Card>
          <CardHeader>
            <CardTitle>Adjustment Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="warehouseId">Warehouse</Label>
                <Select
                  value={formData.warehouseId}
                  onValueChange={(value) =>
                    setFormData({ ...formData, warehouseId: value, locationId: '' })
                  }
                  disabled={!canEdit}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select warehouse" />
                  </SelectTrigger>
                  <SelectContent>
                    {warehouses?.map((warehouse: any) => (
                      <SelectItem key={warehouse.id} value={warehouse.id}>
                        {warehouse.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="locationId">Location</Label>
                <Select
                  value={formData.locationId}
                  onValueChange={(value) => setFormData({ ...formData, locationId: value })}
                  disabled={!canEdit || !formData.warehouseId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select location" />
                  </SelectTrigger>
                  <SelectContent>
                    {locations?.map((location: any) => (
                      <SelectItem key={location.id} value={location.id}>
                        {location.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="responsible">Responsible</Label>
                <Input
                  id="responsible"
                  value={formData.responsible}
                  disabled
                  placeholder="Current user"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Input
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Optional notes about this adjustment"
              />
            </div>
          </CardContent>
        </Card>

        {/* Product Lines */}
        <Card>
          <CardHeader>
            <CardTitle>Products</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {canEdit && (
              <div className="flex gap-4">
                <div className="flex-1">
                  <Select value={selectedProductId} onValueChange={setSelectedProductId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select product" />
                    </SelectTrigger>
                    <SelectContent>
                      {products?.map((product: any) => (
                        <SelectItem key={product.id} value={product.id}>
                          {product.name} ({product.sku})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="w-32">
                  <Input
                    type="number"
                    min="0"
                    step="any"
                    placeholder="Counted"
                    value={countedQuantity}
                    onChange={(e) => setCountedQuantity(e.target.value)}
                  />
                </div>
                <Button type="button" onClick={handleAddProduct}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add
                </Button>
              </div>
            )}

            {productLines.length > 0 ? (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead className="text-right">Counted Quantity</TableHead>
                      {canEdit && <TableHead className="w-[100px]"></TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {productLines.map((line) => (
                      <TableRow key={line.id}>
                        <TableCell>{line.productName}</TableCell>
                        <TableCell className="text-right font-mono">{line.countedQuantity}</TableCell>
                        {canEdit && (
                          <TableCell>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveProduct(line.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No products added yet. Add products with counted quantities.
              </div>
            )}
          </CardContent>
        </Card>

        {/* Actions */}
        {canEdit && (
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => navigate('/operations/adjustments')}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {isNew ? 'Create Adjustment' : 'Save Changes'}
            </Button>
          </div>
        )}
      </form>
    </div>
  );
}

