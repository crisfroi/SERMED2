// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { Eye, AlertCircle, Download, Filter, User, Clock, Shield, FileText } from 'lucide-react';

// ============================================================================
// ASIS 13: AuditLog Component
// Propósito: Mostrar log de acceso completo a la HCE (HIPAA-required)
// Estado: Read-only, con filtros y exportación
// Líneas: ~500
// ============================================================================

interface AccessLog {
  id: string;
  accessed_by: string;
  access_type: string;
  reason: string;
  accessed_at: string;
  ip_address: string;
  duration_seconds: number;
  status: string;
  data_accessed?: Record<string, boolean>;
}

interface AuditLogProps {
  erhId: string;
}

export const AuditLog: React.FC<AuditLogProps> = ({ erhId }) => {
  const [logs, setLogs] = useState<AccessLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterType, setFilterType] = useState<string | 'all'>('all');
  const [filterReason, setFilterReason] = useState<string | 'all'>('all');
  const [dateRangeStart, setDateRangeStart] = useState('');
  const [dateRangeEnd, setDateRangeEnd] = useState('');
  const [selectedLog, setSelectedLog] = useState<AccessLog | null>(null);

  // Fetch audit logs
  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const response = await fetch(`/api/ehr/${erhId}/access-logs`, {
          method: 'GET',
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        
        if (response.ok) {
          const data = await response.json();
          setLogs(data);
        }
      } catch (error) {
        console.error('Failed to fetch audit logs:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLogs();
  }, [erhId]);

  // Filter logs
  const filteredLogs = logs.filter(log => {
    const typeMatch = filterType === 'all' || log.access_type === filterType;
    const reasonMatch = filterReason === 'all' || log.reason === filterReason;
    const dateStart = dateRangeStart
      ? new Date(log.accessed_at) >= new Date(dateRangeStart)
      : true;
    const dateEnd = dateRangeEnd
      ? new Date(log.accessed_at) <= new Date(dateRangeEnd + 'T23:59:59')
      : true;
    
    return typeMatch && reasonMatch && dateStart && dateEnd;
  });

  // Get unique values for filters
  const accessTypes = Array.from(new Set(logs.map(l => l.access_type)));
  const reasons = Array.from(new Set(logs.map(l => l.reason)));

  const getAccessTypeIcon = (type: string) => {
    const iconMap: Record<string, React.ReactNode> = {
      'view': <Eye className="w-4 h-4 text-blue-600" />,
      'edit': <FileText className="w-4 h-4 text-yellow-600" />,
      'export': <Download className="w-4 h-4 text-green-600" />,
      'share': <Shield className="w-4 h-4 text-purple-600" />,
      'approve': <Shield className="w-4 h-4 text-green-600" />,
      'delete': <AlertCircle className="w-4 h-4 text-red-600" />
    };
    return iconMap[type] || <FileText className="w-4 h-4" />;
  };

  const getAccessTypeLabel = (type: string) => {
    const labelMap: Record<string, string> = {
      'view': 'Visualización',
      'edit': 'Edición',
      'export': 'Exportación',
      'share': 'Compartir',
      'approve': 'Aprobación',
      'delete': 'Eliminación',
      'anonymize': 'Anonimización'
    };
    return labelMap[type] || type;
  };

  const getReasonLabel = (reason: string) => {
    const labelMap: Record<string, string> = {
      'clinical_care': 'Cuidado Clínico',
      'patient_request': 'Solicitud del Paciente',
      'audit': 'Auditoría',
      'emergency': 'Emergencia',
      'training': 'Capacitación',
      'research_approved': 'Investigación Aprobada',
      'legal_discovery': 'Descubrimiento Legal'
    };
    return labelMap[reason] || reason;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    const colorMap: Record<string, string> = {
      'completed': 'bg-green-100 text-green-800',
      'denied': 'bg-red-100 text-red-800',
      'pending': 'bg-yellow-100 text-yellow-800'
    };
    return colorMap[status] || 'bg-gray-100 text-gray-800';
  };

  const handleExportLogs = async () => {
    try {
      const response = await fetch(`/api/ehr/${erhId}/access-logs/export`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          format: 'csv',
          filters: {
            access_type: filterType === 'all' ? null : filterType,
            reason: filterReason === 'all' ? null : filterReason,
            date_start: dateRangeStart || null,
            date_end: dateRangeEnd || null
          }
        })
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `audit-log-${erhId}-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <Clock className="w-8 h-8 text-gray-400 animate-spin mx-auto mb-3" />
        <p className="text-gray-600">Cargando log de acceso...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* HIPAA STATUS SECTION */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <Shield className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="font-semibold text-blue-900">Auditoría HIPAA Completa</h3>
            <p className="text-blue-800 text-sm mt-1">
              Todos los accesos a esta Historia Médica Electrónica están siendo registrados y auditados en tiempo real.
              Se ha registrado un total de <span className="font-bold">{logs.length}</span> accesos.
            </p>
          </div>
        </div>
      </div>

      {/* FILTERS SECTION */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-4">
        <div className="flex items-center space-x-2 mb-4">
          <Filter className="w-4 h-4 text-gray-600" />
          <h3 className="font-semibold text-gray-900">Filtros</h3>
        </div>

        <div className="grid grid-cols-4 gap-4">
          {/* Access Type Filter */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-2">Tipo de Acceso</label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              <option value="all">Todos</option>
              {accessTypes.map(type => (
                <option key={type} value={type}>{getAccessTypeLabel(type)}</option>
              ))}
            </select>
          </div>

          {/* Reason Filter */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-2">Razón</label>
            <select
              value={filterReason}
              onChange={(e) => setFilterReason(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              <option value="all">Todas</option>
              {reasons.map(reason => (
                <option key={reason} value={reason}>{getReasonLabel(reason)}</option>
              ))}
            </select>
          </div>

          {/* Date Start */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-2">Desde</label>
            <input
              type="date"
              value={dateRangeStart}
              onChange={(e) => setDateRangeStart(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
          </div>

          {/* Date End */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-2">Hasta</label>
            <input
              type="date"
              value={dateRangeEnd}
              onChange={(e) => setDateRangeEnd(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
          </div>
        </div>

        {/* Export Button */}
        <button
          onClick={handleExportLogs}
          className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700"
        >
          <Download className="w-4 h-4" />
          <span>Exportar como CSV</span>
        </button>
      </div>

      {/* AUDIT LOG ENTRIES */}
      {filteredLogs.length > 0 ? (
        <div className="space-y-3">
          {filteredLogs.map(log => (
            <div
              key={log.id}
              onClick={() => setSelectedLog(log)}
              className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3 flex-1">
                  {/* Icon */}
                  <div className="mt-1">
                    {getAccessTypeIcon(log.access_type)}
                  </div>

                  {/* Info */}
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-semibold text-gray-900">
                        {getAccessTypeLabel(log.access_type)}
                      </span>
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${getStatusColor(log.status)}`}>
                        {log.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      <span className="font-medium">{log.accessed_by}</span> • {getReasonLabel(log.reason)}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {formatDate(log.accessed_at)} • {log.ip_address}
                    </p>
                  </div>
                </div>

                {/* Duration */}
                <div className="text-right">
                  <p className="text-xs font-medium text-gray-700">
                    {log.duration_seconds ? `${log.duration_seconds}s` : '—'}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <AlertCircle className="w-8 h-8 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">No hay registros de acceso</p>
          <p className="text-gray-400 text-sm mt-1">Intenta ajustar los filtros</p>
        </div>
      )}

      {/* DETAIL MODAL */}
      {selectedLog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-md w-full mx-4 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900">Detalles del Acceso</h2>
              <button
                onClick={() => setSelectedLog(null)}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <p className="text-xs font-medium text-gray-600">TIPO DE ACCESO</p>
                <p className="font-semibold text-gray-900">{getAccessTypeLabel(selectedLog.access_type)}</p>
              </div>

              <div>
                <p className="text-xs font-medium text-gray-600">USUARIO</p>
                <p className="font-semibold text-gray-900">{selectedLog.accessed_by}</p>
              </div>

              <div>
                <p className="text-xs font-medium text-gray-600">RAZÓN</p>
                <p className="font-semibold text-gray-900">{getReasonLabel(selectedLog.reason)}</p>
              </div>

              <div>
                <p className="text-xs font-medium text-gray-600">FECHA Y HORA</p>
                <p className="font-semibold text-gray-900">{formatDate(selectedLog.accessed_at)}</p>
              </div>

              <div>
                <p className="text-xs font-medium text-gray-600">DIRECCIÓN IP</p>
                <p className="font-mono text-gray-900 text-sm">{selectedLog.ip_address}</p>
              </div>

              {selectedLog.duration_seconds && (
                <div>
                  <p className="text-xs font-medium text-gray-600">DURACIÓN</p>
                  <p className="font-semibold text-gray-900">{selectedLog.duration_seconds} segundos</p>
                </div>
              )}

              {selectedLog.data_accessed && (
                <div>
                  <p className="text-xs font-medium text-gray-600 mb-2">DATOS ACCEDIDOS</p>
                  <div className="space-y-1">
                    {Object.entries(selectedLog.data_accessed).map(([key, value]) => (
                      <div key={key} className="flex items-center space-x-2 text-sm">
                        <span className={`w-2 h-2 rounded-full ${value ? 'bg-green-600' : 'bg-gray-300'}`} />
                        <span className="text-gray-700 capitalize">{key.replace(/_/g, ' ')}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={() => setSelectedLog(null)}
              className="mt-6 w-full px-4 py-2 bg-gray-200 text-gray-900 rounded-lg font-medium hover:bg-gray-300"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AuditLog;
