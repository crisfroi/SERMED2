import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  AlertCircle,
  TrendingDown,
  TrendingUp,
  Package,
  Bell,
  Loader,
  Download,
  Plus,
  Search,
  Filter,
} from 'lucide-react';
import { useInventoryManagement } from '@/hooks/useInventoryManagement';

// ============================================================================
// TYPES
// ============================================================================
interface InventoryItem {
  id: string;
  medicine_name: string;
  category: string;
  quantity_on_hand: number;
  reorder_level: number;
  unit_cost: number;
  expiration_date: string;
  status: 'in_stock' | 'low_stock' | 'out_of_stock' | 'near_expiration';
  supplier_id: string;
  last_reorder_date: string;
  days_until_expiration: number;
}

// ============================================================================
// COMPONENT
// ============================================================================
export const InventoryDashboard: React.FC = () => {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<InventoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [summaryStats, setSummaryStats] = useState({
    totalItems: 0,
    lowStockCount: 0,
    outOfStockCount: 0,
    nearExpirationCount: 0,
    estimatedValue: 0,
  });

  const { fetchInventory, autoReorder } = useInventoryManagement();

  useEffect(() => {
    const loadInventory = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const result = await fetchInventory();
        if (result.success) {
          setItems(result.data);
          calculateStats(result.data);
        } else {
          setError(result.error);
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadInventory();
  }, [fetchInventory]);

  useEffect(() => {
    let filtered = items;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(item =>
        item.medicine_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.category.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply status filter
    if (filterStatus !== 'all') {
      filtered = filtered.filter(item => item.status === filterStatus);
    }

    setFilteredItems(filtered);
  }, [items, searchTerm, filterStatus]);

  const calculateStats = (data: InventoryItem[]) => {
    const lowStock = data.filter(item => item.status === 'low_stock').length;
    const outOfStock = data.filter(item => item.status === 'out_of_stock').length;
    const nearExpiration = data.filter(item => item.status === 'near_expiration').length;
    const totalValue = data.reduce((sum, item) => sum + (item.quantity_on_hand * item.unit_cost), 0);

    setSummaryStats({
      totalItems: data.length,
      lowStockCount: lowStock,
      outOfStockCount: outOfStock,
      nearExpirationCount: nearExpiration,
      estimatedValue: totalValue,
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'in_stock': return 'bg-green-100 text-green-800 border-green-300';
      case 'low_stock': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'out_of_stock': return 'bg-red-100 text-red-800 border-red-300';
      case 'near_expiration': return 'bg-orange-100 text-orange-800 border-orange-300';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'in_stock': return '✓ En Stock';
      case 'low_stock': return '⚠️ Stock Bajo';
      case 'out_of_stock': return '❌ Agotado';
      case 'near_expiration': return '⏰ Próx. Vencer';
      default: return status;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'low_stock': return <TrendingDown className="h-4 w-4" />;
      case 'out_of_stock': return <AlertCircle className="h-4 w-4" />;
      case 'near_expiration': return <Bell className="h-4 w-4" />;
      default: return <Package className="h-4 w-4" />;
    }
  };

  const handleAutoReorder = async (itemId: string) => {
    try {
      const result = await autoReorder(itemId);
      if (result.success) {
        // Refresh inventory
        setItems(items.map(item =>
          item.id === itemId
            ? { ...item, status: 'in_stock', quantity_on_hand: item.reorder_level * 2 }
            : item
        ));
      }
    } catch (err) {
      console.error('Error creating reorder:', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Panel de Inventario</h2>
          <p className="text-gray-600 mt-1">Gestión de medicinas y suministros</p>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Nuevo Medicamento
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="p-4">
          <p className="text-sm text-gray-600">Total de Artículos</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{summaryStats.totalItems}</p>
        </Card>

        <Card className="p-4 bg-yellow-50 border-yellow-200">
          <div className="flex items-center gap-2">
            <TrendingDown className="h-5 w-5 text-yellow-600" />
            <div>
              <p className="text-sm text-gray-600">Stock Bajo</p>
              <p className="text-3xl font-bold text-yellow-600">{summaryStats.lowStockCount}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-red-50 border-red-200">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <div>
              <p className="text-sm text-gray-600">Agotados</p>
              <p className="text-3xl font-bold text-red-600">{summaryStats.outOfStockCount}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-orange-50 border-orange-200">
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-orange-600" />
            <div>
              <p className="text-sm text-gray-600">Por Vencer</p>
              <p className="text-3xl font-bold text-orange-600">{summaryStats.nearExpirationCount}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <p className="text-sm text-gray-600">Valor Estimado</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">
            ${summaryStats.estimatedValue.toFixed(2)}
          </p>
        </Card>
      </div>

      {/* Error State */}
      {error && (
        <Alert className="bg-red-50 border-red-200">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-900">{error}</AlertDescription>
        </Alert>
      )}

      {/* Search and Filters */}
      <Card className="p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar medicamento..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-600" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Todos</option>
              <option value="in_stock">En Stock</option>
              <option value="low_stock">Stock Bajo</option>
              <option value="out_of_stock">Agotado</option>
              <option value="near_expiration">Por Vencer</option>
            </select>
          </div>

          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Exportar
          </Button>
        </div>
      </Card>

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader className="h-5 w-5 animate-spin text-blue-600 mr-2" />
          <span className="text-gray-600">Cargando inventario...</span>
        </div>
      )}

      {/* Inventory Table */}
      {!isLoading && (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Medicamento</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Categoría</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Cantidad</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Costo Unit.</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Vencimiento</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Estado</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredItems.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{item.medicine_name}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{item.category}</td>
                    <td className="px-6 py-4 text-sm">
                      <div>
                        <p className="font-medium text-gray-900">{item.quantity_on_hand}</p>
                        <p className="text-xs text-gray-500">Min: {item.reorder_level}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">${item.unit_cost.toFixed(2)}</td>
                    <td className="px-6 py-4 text-sm">
                      <div>
                        <p className="text-gray-900">{new Date(item.expiration_date).toLocaleDateString()}</p>
                        <p className="text-xs text-gray-500">{item.days_until_expiration} días</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(item.status)}`}>
                        {getStatusIcon(item.status)}
                        {getStatusLabel(item.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {item.status !== 'in_stock' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleAutoReorder(item.id)}
                          className="text-xs"
                        >
                          Reabastecer
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* No Results */}
      {!isLoading && filteredItems.length === 0 && (
        <Card className="p-12 text-center">
          <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No hay medicamentos que coincidan con tu búsqueda</p>
        </Card>
      )}
    </div>
  );
};

export default InventoryDashboard;
