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
import { DatePicker } from '@/components/ui/date-picker';
import { ChevronRight, Plus, Trash2, Check, X } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface ProductLine {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
}

export default function TransferDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const isNew = id === 'new';

  const [formData, setFormData] = useState({
    contact: '',
    responsible: user?.name || '',
    scheduleDate: format(new Date(), 'yyyy-MM-dd'),
    warehouseFromId: '',
    locationFromId: '',
    warehouseToId: '',
    locationToId: '',
    notes: '',
  });

  const [productLines, setProductLines] = useState<ProductLine[]>([]);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [quantity, setQuantity] = useState('');

  const { data: products } = useQuery({
    queryKey: ['products'],
    queryFn: () => apiClient.getProducts(),
  });

  const { data: warehouses } = useQuery({
    queryKey: ['warehouses'],
    queryFn: () => apiClient.getWarehouses(),
  });

  const { data: locationsFrom } = useQuery({
    queryKey: ['locations', formData.warehouseFromId],
    queryFn: () => apiClient.getLocations(formData.warehouseFromId),
    enabled: !!formData.warehouseFromId,
  });

  const { data: locationsTo } = useQuery({
    queryKey: ['locations', formData.warehouseToId],
    queryFn: () => apiClient.getLocations(formData.warehouseToId),
    enabled: !!formData.warehouseToId,
  });

  const { data: operation, isLoading } = useQuery({
    queryKey: ['operation', id],
    queryFn: () => apiClient.getOperation(id!),
    enabled: !isNew,
  });

  useEffect(() => {
    if (operation && !isNew) {
      setFormData({
        contact: operation.contactName || '',
        responsible: operation.responsibleUser?.name || '',
        scheduleDate: operation.scheduleDate
          ? format(new Date(operation.scheduleDate), 'yyyy-MM-dd')
          : format(new Date(), 'yyyy-MM-dd'),
        warehouseFromId: operation.locationFrom?.warehouseId || '',
        locationFromId: operation.locationFromId || '',
        warehouseToId: operation.locationTo?.warehouseId || '',
        locationToId: operation.locationToId || '',
        notes: operation.notes || '',
      });
      if (operation.items) {
        setProductLines(
          operation.items.map((item: any) => ({
            id: item.id,
            productId: item.productId,
            productName: item.product.name,
            quantity: item.quantity,
          }))
        );
      }
    }
  }, [operation, isNew]);

  const createMutation = useMutation({
    mutationFn: (data: any) => apiClient.createTransfer(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['operations'] });
      toast.success('Transfer created successfully');
      navigate('/operations/transfers');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to create transfer');
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) => apiClient.updateOperation(id!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['operation', id] });
      toast.success('Transfer updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update transfer');
    },
  });

  const transitionMutation = useMutation({
    mutationFn: (action: string) => apiClient.transitionOperation(id!, action),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['operation', id] });
      toast.success('Transfer status updated');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update status');
    },
  });

  const handleAddProduct = () => {
    if (!selectedProductId || !quantity || parseFloat(quantity) <= 0) {
      toast.error('Please select a product and enter a valid quantity');
      return;
    }

    const product = products?.find((p: any) => p.id === selectedProductId);
    if (!product) return;

    const existingIndex = productLines.findIndex((line) => line.productId === selectedProductId);
    if (existingIndex >= 0) {
      const updated = [...productLines];
      updated[existingIndex].quantity += parseFloat(quantity);
      setProductLines(updated);
    } else {
      setProductLines([
        ...productLines,
        {
          id: `temp-${Date.now()}`,
          productId: selectedProductId,
          productName: product.name,
          quantity: parseFloat(quantity),
        },
      ]);
    }

    setSelectedProductId('');
    setQuantity('');
  };

  const handleRemoveProduct = (lineId: string) => {
    setProductLines(productLines.filter((line) => line.id !== lineId));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.locationFromId || !formData.locationToId) {
      toast.error('Please select both source and destination locations');
      return;
    }

    if (productLines.length === 0) {
      toast.error('Please add at least one product');
      return;
    }

    const payload = {
      warehouseFromId: formData.warehouseFromId || undefined,
      locationFromId: formData.locationFromId,
      warehouseToId: formData.warehouseToId || undefined,
      locationToId: formData.locationToId,
      scheduleDate: formData.scheduleDate,
      notes: formData.notes || undefined,
      items: productLines.map((line) => ({
        productId: line.productId,
        quantity: line.quantity,
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
        <div className="text-center py-8 text-muted-foreground">Loading transfer...</div>
      </div>
    );
  }

  const canEdit = isNew || operation?.status === 'DRAFT';
  const canTransition = !isNew && ['DRAFT', 'WAITING', 'READY'].includes(operation?.status);

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link to="/operations/transfers" className="hover:text-foreground">
          Transfers
        </Link>
        <ChevronRight className="h-4 w-4" />
        <span className="text-foreground">
          {isNew ? 'New Transfer' : operation?.reference}
        </span>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {isNew ? 'New Internal Transfer' : `Transfer ${operation?.reference}`}
          </h1>
          <p className="text-muted-foreground">
            {isNew
              ? 'Create a new inventory transfer between locations'
              : 'View and manage transfer details'}
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
        {/* Transfer Details */}
        <Card>
          <CardHeader>
            <CardTitle>Transfer Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="warehouseFromId">Source Warehouse</Label>
                <Select
                  value={formData.warehouseFromId}
                  onValueChange={(value) =>
                    setFormData({ ...formData, warehouseFromId: value, locationFromId: '' })
                  }
                  disabled={!canEdit}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select source warehouse" />
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
                <Label htmlFor="locationFromId">Source Location</Label>
                <Select
                  value={formData.locationFromId}
                  onValueChange={(value) => setFormData({ ...formData, locationFromId: value })}
                  disabled={!canEdit || !formData.warehouseFromId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select source location" />
                  </SelectTrigger>
                  <SelectContent>
                    {locationsFrom?.map((location: any) => (
                      <SelectItem key={location.id} value={location.id}>
                        {location.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="warehouseToId">Destination Warehouse</Label>
                <Select
                  value={formData.warehouseToId}
                  onValueChange={(value) =>
                    setFormData({ ...formData, warehouseToId: value, locationToId: '' })
                  }
                  disabled={!canEdit}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select destination warehouse" />
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
                <Label htmlFor="locationToId">Destination Location</Label>
                <Select
                  value={formData.locationToId}
                  onValueChange={(value) => setFormData({ ...formData, locationToId: value })}
                  disabled={!canEdit || !formData.warehouseToId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select destination location" />
                  </SelectTrigger>
                  <SelectContent>
                    {locationsTo?.map((location: any) => (
                      <SelectItem key={location.id} value={location.id}>
                        {location.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="scheduleDate">Schedule Date</Label>
                <DatePicker
                  date={formData.scheduleDate ? new Date(formData.scheduleDate) : undefined}
                  onDateChange={(date) => 
                    setFormData({ ...formData, scheduleDate: date ? format(date, 'yyyy-MM-dd') : '' })
                  }
                  disabled={!canEdit}
                  placeholder="Select schedule date"
                />
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
                placeholder="Optional notes about this transfer"
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
                    placeholder="Quantity"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
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
                      <TableHead className="text-right">Quantity</TableHead>
                      {canEdit && <TableHead className="w-[100px]"></TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {productLines.map((line) => (
                      <TableRow key={line.id}>
                        <TableCell>{line.productName}</TableCell>
                        <TableCell className="text-right font-mono">{line.quantity}</TableCell>
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
                No products added yet. Add products to create the transfer.
              </div>
            )}
          </CardContent>
        </Card>

        {/* Actions */}
        {canEdit && (
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => navigate('/operations/transfers')}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {isNew ? 'Create Transfer' : 'Save Changes'}
            </Button>
          </div>
        )}
      </form>
    </div>
  );
}

