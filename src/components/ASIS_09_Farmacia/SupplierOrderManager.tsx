// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  AlertCircle,
  Plus,
  Edit2,
  Loader,
  Trash2,
  CheckCircle2,
  Clock,
  Truck,
  AlertTriangle,
  FileText,
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useProcurementWorkflow } from '@/hooks/useProcurementWorkflow';

// ============================================================================
// VALIDATION SCHEMA
// ============================================================================
const PurchaseOrderSchema = z.object({
  supplier_id: z.string().min(1, 'Proveedor requerido'),
  items: z.array(
    z.object({
      medicine_id: z.string().min(1),
      quantity: z.number().min(1, 'Cantidad debe ser > 0'),
      unit_price: z.number().min(0),
    })
  ).min(1, 'Agregar al menos un medicamento'),
  expected_delivery_date: z.string().min(1),
  notes: z.string().optional(),
});

type PurchaseOrderFormData = z.infer<typeof PurchaseOrderSchema>;

// ============================================================================
// TYPES
// ============================================================================
interface PurchaseOrder {
  id: string;
  po_number: string;
  supplier_id: string;
  supplier_name: string;
  items: OrderItem[];
  total_amount: number;
  status: 'draft' | 'submitted' | 'approved' | 'delivered' | 'cancelled';
  expected_delivery_date: string;
  actual_delivery_date: string | null;
  created_at: string;
  created_by: string;
}

interface OrderItem {
  medicine_id: string;
  medicine_name: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
}

interface Supplier {
  id: string;
  company_name: string;
  contact_name: string;
  phone: string;
  email: string;
}

// ============================================================================
// COMPONENT
// ============================================================================
export const SupplierOrderManager: React.FC = () => {
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingOrder, setEditingOrder] = useState<PurchaseOrder | null>(null);
  const [selectedFilter, setSelectedFilter] = useState<string>('all');

  const { fetchPurchaseOrders, fetchSuppliers, createPurchaseOrder, approvePurchaseOrder } =
    useProcurementWorkflow();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PurchaseOrderFormData>({
    resolver: zodResolver(PurchaseOrderSchema),
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const ordersResult = await fetchPurchaseOrders();
        const suppliersResult = await fetchSuppliers();

        if (ordersResult.success) {
          setOrders(ordersResult.data);
        } else {
          setError(ordersResult.error);
        }

        if (suppliersResult.success) {
          setSuppliers(suppliersResult.data);
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [fetchPurchaseOrders, fetchSuppliers]);

  const onSubmit = async (data: PurchaseOrderFormData) => {
    try {
      const result = await createPurchaseOrder(data);
      if (result.success) {
        setOrders([result.data, ...orders]);
        reset();
        setShowForm(false);
      } else {
        setError(result.error);
      }
    } catch (err) {
      console.error('Error creating order:', err);
    }
  };

  const handleApprove = async (orderId: string) => {
    try {
      const result = await approvePurchaseOrder(orderId);
      if (result.success) {
        setOrders(orders.map(o => o.id === orderId ? { ...o, status: 'approved' } : o));
      }
    } catch (err) {
      console.error('Error approving order:', err);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-800 border-gray-300';
      case 'submitted': return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'approved': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'delivered': return 'bg-green-100 text-green-800 border-green-300';
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-300';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'draft': return '✎ Borrador';
      case 'submitted': return '📝 Enviado';
      case 'approved': return '✓ Aprobado';
      case 'delivered': return '📦 Entregado';
      case 'cancelled': return '❌ Cancelado';
      default: return status;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'submitted': return <Clock className="h-4 w-4" />;
      case 'approved': return <AlertTriangle className="h-4 w-4" />;
      case 'delivered': return <Truck className="h-4 w-4" />;
      case 'cancelled': return <AlertCircle className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const filteredOrders = orders.filter(order =>
    selectedFilter === 'all' || order.status === selectedFilter
  );

  const calculateStats = () => {
    return {
      totalValue: orders.reduce((sum, o) => sum + o.total_amount, 0),
      pending: orders.filter(o => ['draft', 'submitted'].includes(o.status)).length,
      approved: orders.filter(o => o.status === 'approved').length,
      delivered: orders.filter(o => o.status === 'delivered').length,
    };
  };

  const stats = calculateStats();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Gestión de Órdenes de Compra</h2>
          <p className="text-gray-600 mt-1">Seguimiento de compras a proveedores</p>
        </div>
        <Button onClick={() => setShowForm(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Nueva Orden
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <p className="text-sm text-gray-600">Valor Total</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">${stats.totalValue.toFixed(2)}</p>
        </Card>

        <Card className="p-4 bg-yellow-50 border-yellow-200">
          <p className="text-sm text-gray-600">Pendientes</p>
          <p className="text-2xl font-bold text-yellow-600 mt-1">{stats.pending}</p>
        </Card>

        <Card className="p-4 bg-orange-50 border-orange-200">
          <p className="text-sm text-gray-600">Aprobadas</p>
          <p className="text-2xl font-bold text-orange-600 mt-1">{stats.approved}</p>
        </Card>

        <Card className="p-4 bg-green-50 border-green-200">
          <p className="text-sm text-gray-600">Entregadas</p>
          <p className="text-2xl font-bold text-green-600 mt-1">{stats.delivered}</p>
        </Card>
      </div>

      {/* Error State */}
      {error && (
        <Alert className="bg-red-50 border-red-200">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-900">{error}</AlertDescription>
        </Alert>
      )}

      {/* New Order Form */}
      {showForm && (
        <Card className="p-6 bg-blue-50 border-blue-200">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Nueva Orden de Compra</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowForm(false)}
            >
              Cerrar
            </Button>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Proveedor
                </label>
                <select
                  {...register('supplier_id')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Seleccionar proveedor...</option>
                  {suppliers.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.company_name}
                    </option>
                  ))}
                </select>
                {errors.supplier_id && (
                  <p className="text-sm text-red-600 mt-1">{errors.supplier_id.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fecha de Entrega Esperada
                </label>
                <input
                  type="date"
                  {...register('expected_delivery_date')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                {errors.expected_delivery_date && (
                  <p className="text-sm text-red-600 mt-1">
                    {errors.expected_delivery_date.message}
                  </p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Notas</label>
              <textarea
                {...register('notes')}
                placeholder="Instrucciones especiales..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                rows={3}
              />
            </div>

            <div className="flex gap-2">
              <Button type="submit" className="flex-1">
                Crear Orden
              </Button>
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => setShowForm(false)}
              >
                Cancelar
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Status Filters */}
      <Card className="p-4">
        <div className="flex flex-wrap gap-2">
          <Button
            variant={selectedFilter === 'all' ? 'default' : 'outline'}
            onClick={() => setSelectedFilter('all')}
            size="sm"
          >
            Todas
          </Button>
          <Button
            variant={selectedFilter === 'draft' ? 'default' : 'outline'}
            onClick={() => setSelectedFilter('draft')}
            size="sm"
          >
            Borradores
          </Button>
          <Button
            variant={selectedFilter === 'submitted' ? 'default' : 'outline'}
            onClick={() => setSelectedFilter('submitted')}
            size="sm"
          >
            Enviadas
          </Button>
          <Button
            variant={selectedFilter === 'approved' ? 'default' : 'outline'}
            onClick={() => setSelectedFilter('approved')}
            size="sm"
          >
            Aprobadas
          </Button>
          <Button
            variant={selectedFilter === 'delivered' ? 'default' : 'outline'}
            onClick={() => setSelectedFilter('delivered')}
            size="sm"
          >
            Entregadas
          </Button>
        </div>
      </Card>

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader className="h-5 w-5 animate-spin text-blue-600 mr-2" />
          <span className="text-gray-600">Cargando órdenes...</span>
        </div>
      )}

      {/* Orders List */}
      {!isLoading && (
        <div className="space-y-4">
          {filteredOrders.length > 0 ? (
            filteredOrders.map(order => (
              <Card key={order.id} className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="text-lg font-semibold text-gray-900">
                        Orden #{order.po_number}
                      </h4>
                      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(order.status)}`}>
                        {getStatusIcon(order.status)}
                        {getStatusLabel(order.status)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">{order.supplier_name}</p>
                  </div>

                  <div className="text-right">
                    <p className="text-2xl font-bold text-gray-900">
                      ${order.total_amount.toFixed(2)}
                    </p>
                    <p className="text-sm text-gray-600">
                      Entrega: {new Date(order.expected_delivery_date).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                {/* Items */}
                <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs font-semibold text-gray-600 mb-2">ARTÍCULOS</p>
                  <div className="space-y-2">
                    {order.items.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between text-sm">
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{item.medicine_name}</p>
                          <p className="text-xs text-gray-500">
                            {item.quantity} x ${item.unit_price.toFixed(2)}
                          </p>
                        </div>
                        <p className="font-medium text-gray-900">
                          ${item.subtotal.toFixed(2)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  {['draft', 'submitted'].includes(order.status) && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleApprove(order.id)}
                    >
                      <CheckCircle2 className="h-4 w-4 mr-1" />
                      Aprobar
                    </Button>
                  )}
                  <Button variant="outline" size="sm">
                    <Edit2 className="h-4 w-4 mr-1" />
                    Editar
                  </Button>
                  <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                    <Trash2 className="h-4 w-4 mr-1" />
                    Eliminar
                  </Button>
                </div>
              </Card>
            ))
          ) : (
            <Card className="p-12 text-center">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No hay órdenes de compra</p>
              <Button
                className="mt-4"
                onClick={() => setShowForm(true)}
              >
                Crear Primera Orden
              </Button>
            </Card>
          )}
        </div>
      )}
    </div>
  );
};

export default SupplierOrderManager;
