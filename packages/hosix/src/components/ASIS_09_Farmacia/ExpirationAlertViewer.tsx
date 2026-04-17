import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  AlertCircle,
  Loader,
  Clock,
  Trash2,
  CheckCircle2,
  Download,
  Filter,
  AlertTriangle,
  TrendingUp,
} from 'lucide-react';
import { useExpirationTracking } from '@hosix/hooks/06-medications/useExpirationTracking';

// ============================================================================
// TYPES
// ============================================================================
interface ExpirationAlert {
  id: string;
  medicine_id: string;
  medicine_name: string;
  lot_number: string;
  quantity_affected: number;
  expiration_date: string;
  days_until_expiration: number;
  severity: 'critical' | 'warning' | 'info';
  alert_type: 'near_expiration' | 'expired' | 'disposal_required';
  created_at: string;
  resolved: boolean;
  resolved_at: string | null;
  resolution_action: 'used' | 'destroyed' | 'returned' | null;
  cost_impact: number;
}

// ============================================================================
// COMPONENT
// ============================================================================
export const ExpirationAlertViewer: React.FC = () => {
  const [alerts, setAlerts] = useState<ExpirationAlert[]>([]);
  const [filteredAlerts, setFilteredAlerts] = useState<ExpirationAlert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'active' | 'resolved'>('all');
  const [severityFilter, setSeverityFilter] = useState<string>('all');

  const { fetchExpirationAlerts, markAlertResolved, deleteAlert } =
    useExpirationTracking();

  useEffect(() => {
    const loadAlerts = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const result = await fetchExpirationAlerts();
        if (result.success) {
          setAlerts(result.data);
        } else {
          setError(result.error);
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadAlerts();
  }, [fetchExpirationAlerts]);

  useEffect(() => {
    let filtered = alerts;

    // Apply status filter
    if (selectedFilter === 'active') {
      filtered = filtered.filter(a => !a.resolved);
    } else if (selectedFilter === 'resolved') {
      filtered = filtered.filter(a => a.resolved);
    }

    // Apply severity filter
    if (severityFilter !== 'all') {
      filtered = filtered.filter(a => a.severity === severityFilter);
    }

    // Sort by urgency
    filtered.sort((a, b) => {
      const severityOrder = { critical: 0, warning: 1, info: 2 };
      return (
        (severityOrder[a.severity as keyof typeof severityOrder] || 3) -
        (severityOrder[b.severity as keyof typeof severityOrder] || 3)
      );
    });

    setFilteredAlerts(filtered);
  }, [alerts, selectedFilter, severityFilter]);

  const calculateStats = () => {
    const active = alerts.filter(a => !a.resolved);
    return {
      total: alerts.length,
      active: active.length,
      critical: active.filter(a => a.severity === 'critical').length,
      warning: active.filter(a => a.severity === 'warning').length,
      totalCostImpact: alerts.reduce((sum, a) => sum + a.cost_impact, 0),
    };
  };

  const handleMarkResolved = async (alertId: string, action: 'used' | 'destroyed' | 'returned') => {
    try {
      const result = await markAlertResolved(alertId, action);
      if (result.success) {
        setAlerts(alerts.map(a =>
          a.id === alertId
            ? { ...a, resolved: true, resolution_action: action, resolved_at: new Date().toISOString() }
            : a
        ));
      }
    } catch (err) {
      console.error('Error marking alert resolved:', err);
    }
  };

  const handleDeleteAlert = async (alertId: string) => {
    try {
      const result = await deleteAlert(alertId);
      if (result.success) {
        setAlerts(alerts.filter(a => a.id !== alertId));
      }
    } catch (err) {
      console.error('Error deleting alert:', err);
    }
  };

  const getSeverityColor = (severity: string, resolved: boolean) => {
    if (resolved) return 'bg-green-100 text-green-800 border-green-300';
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-300';
      case 'warning': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'info': return 'bg-blue-100 text-blue-800 border-blue-300';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getSeverityLabel = (severity: string) => {
    switch (severity) {
      case 'critical': return '🔴 Crítico';
      case 'warning': return '🟡 Advertencia';
      case 'info': return '🔵 Información';
      default: return severity;
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return <AlertTriangle className="h-5 w-5" />;
      case 'warning': return <Clock className="h-5 w-5" />;
      default: return <AlertCircle className="h-5 w-5" />;
    }
  };

  const getAlertTypeLabel = (type: string) => {
    switch (type) {
      case 'near_expiration': return 'Próximo a Vencer';
      case 'expired': return 'Vencido';
      case 'disposal_required': return 'Disposición Requerida';
      default: return type;
    }
  };

  const stats = calculateStats();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Alertas de Vencimiento</h2>
          <p className="text-gray-600 mt-1">Gestión de medicinas próximas a vencer</p>
        </div>
        <Button variant="outline" className="gap-2">
          <Download className="h-4 w-4" />
          Exportar Reporte
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card className="p-4">
          <p className="text-sm text-gray-600">Total Alertas</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{stats.total}</p>
        </Card>

        <Card className="p-4 bg-red-50 border-red-200">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            <div>
              <p className="text-sm text-gray-600">Críticas</p>
              <p className="text-2xl font-bold text-red-600">{stats.critical}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-yellow-50 border-yellow-200">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-yellow-600" />
            <div>
              <p className="text-sm text-gray-600">Advertencias</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.warning}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-orange-50 border-orange-200">
          <p className="text-sm text-gray-600">Activas</p>
          <p className="text-2xl font-bold text-orange-600 mt-1">{stats.active}</p>
        </Card>

        <Card className="p-4">
          <p className="text-sm text-gray-600">Impacto Financiero</p>
          <p className="text-2xl font-bold text-red-600 mt-1">
            ${stats.totalCostImpact.toFixed(2)}
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

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Estado
            </label>
            <div className="flex gap-2">
              <Button
                variant={selectedFilter === 'all' ? 'default' : 'outline'}
                onClick={() => setSelectedFilter('all')}
                size="sm"
              >
                Todas
              </Button>
              <Button
                variant={selectedFilter === 'active' ? 'default' : 'outline'}
                onClick={() => setSelectedFilter('active')}
                size="sm"
              >
                Activas
              </Button>
              <Button
                variant={selectedFilter === 'resolved' ? 'default' : 'outline'}
                onClick={() => setSelectedFilter('resolved')}
                size="sm"
              >
                Resueltas
              </Button>
            </div>
          </div>

          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Severidad
            </label>
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Todas</option>
              <option value="critical">Críticas</option>
              <option value="warning">Advertencias</option>
              <option value="info">Información</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader className="h-5 w-5 animate-spin text-blue-600 mr-2" />
          <span className="text-gray-600">Cargando alertas...</span>
        </div>
      )}

      {/* Alerts List */}
      {!isLoading && (
        <div className="space-y-4">
          {filteredAlerts.length > 0 ? (
            filteredAlerts.map((alert) => (
              <Card
                key={alert.id}
                className={`p-5 border-2 ${getSeverityColor(alert.severity, alert.resolved)}`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="mt-1">
                      {getSeverityIcon(alert.severity)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {alert.medicine_name}
                        </h3>
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium border ${getSeverityColor(alert.severity, alert.resolved)}`}>
                          {getSeverityLabel(alert.severity)}
                        </span>
                      </div>

                      <p className="text-sm text-gray-600 mb-3">
                        Lote: <span className="font-mono font-medium">{alert.lot_number}</span>
                      </p>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-gray-600 text-xs">Tipo de Alerta</p>
                          <p className="font-medium text-gray-900">
                            {getAlertTypeLabel(alert.alert_type)}
                          </p>
                        </div>

                        <div>
                          <p className="text-gray-600 text-xs">Cantidad Afectada</p>
                          <p className="font-medium text-gray-900">{alert.quantity_affected} unidades</p>
                        </div>

                        <div>
                          <p className="text-gray-600 text-xs">Vencimiento</p>
                          <p className="font-medium text-gray-900">
                            {new Date(alert.expiration_date).toLocaleDateString()}
                          </p>
                        </div>

                        <div>
                          <p className="text-gray-600 text-xs">Días Restantes</p>
                          <p className={`font-medium ${
                            alert.days_until_expiration < 0 ? 'text-red-600' : 'text-gray-900'
                          }`}>
                            {alert.days_until_expiration < 0 
                              ? `${Math.abs(alert.days_until_expiration)} días vencido`
                              : `${alert.days_until_expiration} días`
                            }
                          </p>
                        </div>
                      </div>

                      {alert.resolved && (
                        <div className="mt-3 p-2 bg-green-100 rounded border border-green-300">
                          <p className="text-xs text-green-700">
                            ✓ Resuelto - Acción: <span className="font-medium">
                              {alert.resolution_action === 'used' ? 'Utilizado' :
                               alert.resolution_action === 'destroyed' ? 'Destruido' :
                               alert.resolution_action === 'returned' ? 'Devuelto' : 'Desconocido'}
                            </span>
                            {alert.resolved_at && (
                              <> ({new Date(alert.resolved_at).toLocaleDateString()})</>
                            )}
                          </p>
                        </div>
                      )}

                      {alert.cost_impact > 0 && (
                        <div className="mt-2 flex items-center gap-1 text-sm text-red-600">
                          <TrendingUp className="h-4 w-4" />
                          <span className="font-medium">Impacto: ${alert.cost_impact.toFixed(2)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                {!alert.resolved && (
                  <div className="flex flex-wrap gap-2 pt-3 border-t">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleMarkResolved(alert.id, 'used')}
                      className="text-xs"
                    >
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Utilizado
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleMarkResolved(alert.id, 'destroyed')}
                      className="text-xs"
                    >
                      <Trash2 className="h-3 w-3 mr-1" />
                      Destruido
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleMarkResolved(alert.id, 'returned')}
                      className="text-xs"
                    >
                      Devuelto
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDeleteAlert(alert.id)}
                      className="text-xs text-red-600 hover:text-red-700 ml-auto"
                    >
                      <Trash2 className="h-3 w-3 mr-1" />
                      Eliminar
                    </Button>
                  </div>
                )}
              </Card>
            ))
          ) : (
            <Card className="p-12 text-center bg-green-50 border-green-200">
              <CheckCircle2 className="h-12 w-12 text-green-600 mx-auto mb-4" />
              <p className="text-gray-900 font-medium">¡Excelente!</p>
              <p className="text-gray-600 mt-1">No hay alertas de vencimiento activas</p>
            </Card>
          )}
        </div>
      )}

      {/* Legend */}
      <Card className="p-4 bg-gray-50">
        <p className="text-sm font-semibold text-gray-900 mb-3">Guía de Severidad</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-600 rounded-full"></div>
            <span className="text-gray-700"><strong>Crítico:</strong> Vencido o vence en &lt; 7 días</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
            <span className="text-gray-700"><strong>Advertencia:</strong> Vence en 7-30 días</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            <span className="text-gray-700"><strong>Información:</strong> Vence en &gt; 30 días</span>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default ExpirationAlertViewer;
