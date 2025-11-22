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
import { ChevronRight, Plus, Trash2, Printer, Check, X } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface ProductLine {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
}

export default function ReceiptDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const isNew = id === 'new';

  const [formData, setFormData] = useState({
    contact: '',
    responsible: user?.name || '',
    scheduleDate: format(new Date(), 'yyyy-MM-dd'),
    warehouseId: '',
    locationId: '',
  });

  const [productLines, setProductLines] = useState<ProductLine[]>([
    { id: crypto.randomUUID(), productId: '', productName: '', quantity: 1 },
  ]);

  const { data: operation, isLoading: loadingOperation } = useQuery({
    queryKey: ['operation', id],
    queryFn: () => apiClient.getOperation(id!),
    enabled: !isNew,
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

  const { data: products } = useQuery({
    queryKey: ['products'],
    queryFn: () => apiClient.getProducts(),
  });

  useEffect(() => {
    if (operation) {
      setFormData({
        contact: operation.contact || '',
        responsible: operation.responsible || '',
        scheduleDate: operation.scheduleDate ? format(new Date(operation.scheduleDate), 'yyyy-MM-dd') : '',
        warehouseId: operation.warehouseId || '',
        locationId: operation.locationId || '',
      });
      if (operation.items?.length > 0) {
        setProductLines(operation.items.map((item: any) => ({
          id: item.id || crypto.randomUUID(),
          productId: item.productId,
          productName: item.productName,
          quantity: item.quantity,
        })));
      }
    }
  }, [operation]);

  const createMutation = useMutation({
    mutationFn: (data: any) => apiClient.createReceipt(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['operations'] });
      toast.success('Receipt created successfully');
      navigate('/operations/receipts');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to create receipt');
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) => apiClient.updateOperation(id!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['operation', id] });
      queryClient.invalidateQueries({ queryKey: ['operations'] });
      toast.success('Receipt updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update receipt');
    },
  });

  const transitionMutation = useMutation({
    mutationFn: (action: string) => apiClient.transitionOperation(id!, action),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['operation', id] });
      queryClient.invalidateQueries({ queryKey: ['operations'] });
      toast.success('Status updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update status');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate
    if (!formData.warehouseId || !formData.locationId) {
      toast.error('Please select warehouse and location');
      return;
    }

    if (productLines.some(line => !line.productId || line.quantity <= 0)) {
      toast.error('Please fill all product lines');
      return;
    }

    const payload = {
      header: {
        contact: formData.contact,
        responsible: formData.responsible,
        scheduleDate: formData.scheduleDate,
        warehouseId: formData.warehouseId,
        locationId: formData.locationId,
      },
      items: productLines.map(line => ({
        productId: line.productId,
        quantity: line.quantity,
      })),
    };

    if (isNew) {
      createMutation.mutate(payload);
    } else {
      updateMutation.mutate(payload);
    }
  };

  const addProductLine = () => {
    setProductLines([...productLines, {
      id: crypto.randomUUID(),
      productId: '',
      productName: '',
      quantity: 1,
    }]);
  };

  const removeProductLine = (id: string) => {
    if (productLines.length === 1) {
      toast.error('At least one product line is required');
      return;
    }
    setProductLines(productLines.filter(line => line.id !== id));
  };

  const updateProductLine = (id: string, field: string, value: any) => {
    setProductLines(productLines.map(line => {
      if (line.id === id) {
        const updated = { ...line, [field]: value };
        if (field === 'productId') {
          const product = products?.find((p: any) => p.id === value);
          updated.productName = product?.name || '';
        }
        return updated;
      }
      return line;
    }));
  };

  const handleTransition = (action: string) => {
    transitionMutation.mutate(action);
  };

  const isDone = operation?.status === 'DONE';
  const isCanceled = operation?.status === 'CANCELED';
  const isReadOnly = isDone || isCanceled;

  if (loadingOperation) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-8 text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link to="/" className="hover:text-foreground">Dashboard</Link>
        <ChevronRight className="h-4 w-4" />
        <Link to="/operations/receipts" className="hover:text-foreground">Receipts</Link>
        <ChevronRight className="h-4 w-4" />
        <span className="text-foreground">{operation?.reference || 'New Receipt'}</span>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {operation?.reference || 'New Receipt'}
          </h1>
          {operation && (
            <div className="flex items-center gap-2 mt-2">
              <StatusBadge status={operation.status} />
            </div>
          )}
        </div>

        {!isNew && operation && (
          <div className="flex gap-2">
            {operation.status === 'DRAFT' && (
              <Button onClick={() => handleTransition('validate')} variant="default">
                <Check className="mr-2 h-4 w-4" />
                Validate
              </Button>
            )}
            {operation.status === 'READY' && (
              <Button onClick={() => handleTransition('done')} variant="default">
                <Check className="mr-2 h-4 w-4" />
                Mark as Done
              </Button>
            )}
            {!isDone && !isCanceled && (
              <Button onClick={() => handleTransition('cancel')} variant="destructive">
                <X className="mr-2 h-4 w-4" />
                Cancel
              </Button>
            )}
            <Button variant="outline">
              <Printer className="mr-2 h-4 w-4" />
              Print
            </Button>
          </div>
        )}
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Receipt Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="contact">Receive From (Contact/Vendor)</Label>
                <Input
                  id="contact"
                  value={formData.contact}
                  onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                  placeholder="Vendor name"
                  disabled={isReadOnly}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="responsible">Responsible</Label>
                <Input
                  id="responsible"
                  value={formData.responsible}
                  onChange={(e) => setFormData({ ...formData, responsible: e.target.value })}
                  placeholder="Responsible person"
                  disabled={isReadOnly}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="scheduleDate">Schedule Date</Label>
                <Input
                  id="scheduleDate"
                  type="date"
                  value={formData.scheduleDate}
                  onChange={(e) => setFormData({ ...formData, scheduleDate: e.target.value })}
                  disabled={isReadOnly}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="warehouse">Warehouse</Label>
                <Select
                  value={formData.warehouseId}
                  onValueChange={(value) => setFormData({ ...formData, warehouseId: value, locationId: '' })}
                  disabled={isReadOnly}
                  required
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
                <Label htmlFor="location">Location</Label>
                <Select
                  value={formData.locationId}
                  onValueChange={(value) => setFormData({ ...formData, locationId: value })}
                  disabled={isReadOnly || !formData.warehouseId}
                  required
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
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Products</CardTitle>
            {!isReadOnly && (
              <Button type="button" onClick={addProductLine} size="sm" variant="outline">
                <Plus className="mr-2 h-4 w-4" />
                Add Product
              </Button>
            )}
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead className="w-32">Quantity</TableHead>
                    {!isReadOnly && <TableHead className="w-16"></TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {productLines.map((line) => (
                    <TableRow key={line.id}>
                      <TableCell>
                        <Select
                          value={line.productId}
                          onValueChange={(value) => updateProductLine(line.id, 'productId', value)}
                          disabled={isReadOnly}
                          required
                        >
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
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min="1"
                          value={line.quantity}
                          onChange={(e) => updateProductLine(line.id, 'quantity', parseInt(e.target.value))}
                          disabled={isReadOnly}
                          required
                        />
                      </TableCell>
                      {!isReadOnly && (
                        <TableCell>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeProductLine(line.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {!isReadOnly && (
          <div className="flex gap-2">
            <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
              {isNew ? 'Create Receipt' : 'Save Changes'}
            </Button>
            <Button type="button" variant="outline" onClick={() => navigate('/operations/receipts')}>
              Cancel
            </Button>
          </div>
        )}
      </form>
    </div>
  );
}
