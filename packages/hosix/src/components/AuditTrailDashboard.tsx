'use client';

import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAuditIntegration, type AuditTrailEntry, type AccessLog } from '@/hooks/useAuditIntegration';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { Activity, Download, AlertCircle, CheckCircle, Eye, Lock } from 'lucide-react';

interface AuditTrailDashboardProps {
  entityId?: string;
  entityType?: 'document' | 'patient' | 'user';
}

export const AuditTrailDashboard: React.FC<AuditTrailDashboardProps> = ({
  entityId,
  entityType = 'document',
}) => {
  const {
    loading,
    error,
    getDocumentAccessHistory,
    getUserActivityLog,
    getCriticalEvents,
    generateComplianceReport,
    exportAuditLogs,
    logAuditTrail,
  } = useAuditIntegration();

  const [accessLogs, setAccessLogs] = useState<AccessLog[]>([]);
  const [auditTrail, setAuditTrail] = useState<AuditTrailEntry[]>([]);
  const [criticalEvents, setCriticalEvents] = useState<AuditTrailEntry[]>([]);
  const [startDate, setStartDate] = useState<string>(
    new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [endDate, setEndDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [filterAction, setFilterAction] = useState<string>('all');
  const [filterSeverity, setFilterSeverity] = useState<string>('all');

  // Load data on mount and when dates change
  useEffect(() => {
    const loadData = async () => {
      if (entityType === 'document' && entityId) {
        const logs = await getDocumentAccessHistory(entityId, startDate, endDate);
        setAccessLogs(logs);
      } else if (entityType === 'user' && entityId) {
        const logs = await getUserActivityLog(entityId, startDate, endDate);
        setAuditTrail(logs);
      }

      const critical = await getCriticalEvents(startDate, endDate);
      setCriticalEvents(critical);
    };

    loadData();
  }, [entityId, entityType, startDate, endDate, getDocumentAccessHistory, getUserActivityLog, getCriticalEvents]);

  const handleExportLogs = async () => {
    const csv = await exportAuditLogs(startDate, endDate);
    if (csv) {
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `audit-logs-${startDate}-${endDate}.csv`;
      a.click();
    }
  };

  // Filter audit trail
  const filteredAuditTrail = auditTrail.filter((entry) => {
    if (filterAction !== 'all' && entry.action !== filterAction) return false;
    if (filterSeverity !== 'all' && entry.severity !== filterSeverity) return false;
    return true;
  });

  // Calculate statistics for charts
  const actionStats = auditTrail.reduce(
    (acc, entry) => {
      const existing = acc.find((a) => a.action === entry.action);
      if (existing) {
        existing.count++;
      } else {
        acc.push({ action: entry.action, count: 1 });
      }
      return acc;
    },
    [] as Array<{ action: string; count: number }>
  );

  const severityStats = auditTrail.reduce(
    (acc, entry) => {
      const existing = acc.find((a) => a.name === entry.severity);
      if (existing) {
        existing.value++;
      } else {
        acc.push({ name: entry.severity, value: 1 });
      }
      return acc;
    },
    [] as Array<{ name: string; value: number }>
  );

  const COLORS = {
    low: '#10b981',
    medium: '#f59e0b',
    high: '#ef4444',
    critical: '#7c3aed',
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
      case 'high':
        return <AlertCircle className="w-4 h-4" />;
      default:
        return <CheckCircle className="w-4 h-4" />;
    }
  };

  return (
    <div className="w-full space-y-4">
      {/* Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Filtros de Auditoría
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Date range */}
            <div>
              <Label className="text-xs">Desde</Label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs">Hasta</Label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="mt-1"
              />
            </div>

            {/* Action filter */}
            <div>
              <Label className="text-xs">Acción</Label>
              <Select value={filterAction} onValueChange={setFilterAction}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="create">Crear</SelectItem>
                  <SelectItem value="read">Leer</SelectItem>
                  <SelectItem value="update">Actualizar</SelectItem>
                  <SelectItem value="delete">Eliminar</SelectItem>
                  <SelectItem value="decrypt">Desencriptar</SelectItem>
                  <SelectItem value="export">Exportar</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Severity filter */}
            <div>
              <Label className="text-xs">Severidad</Label>
              <Select value={filterSeverity} onValueChange={setFilterSeverity}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="low">Baja</SelectItem>
                  <SelectItem value="medium">Media</SelectItem>
                  <SelectItem value="high">Alta</SelectItem>
                  <SelectItem value="critical">Crítica</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Export button */}
          <div className="flex gap-2 pt-2">
            <Button onClick={handleExportLogs} disabled={loading} variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Exportar CSV
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">{auditTrail.length}</p>
              <p className="text-xs text-gray-600 mt-1">Total Eventos</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-yellow-600">{accessLogs.length}</p>
              <p className="text-xs text-gray-600 mt-1">Accesos</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-red-600">{criticalEvents.length}</p>
              <p className="text-xs text-gray-600 mt-1">Eventos Críticos</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">
                {new Set(auditTrail.map((a) => a.changed_by)).size}
              </p>
              <p className="text-xs text-gray-600 mt-1">Usuarios</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      {auditTrail.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Actions chart */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Por Acción</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={actionStats}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="action" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Severity chart */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Por Severidad</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={severityStats}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {severityStats.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[entry.name as keyof typeof COLORS]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Audit Trail Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Historial de Auditoría</CardTitle>
          <CardDescription>
            {filteredAuditTrail.length} eventos encontrados
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Hora</TableHead>
                  <TableHead>Acción</TableHead>
                  <TableHead>Usuario</TableHead>
                  <TableHead>Severidad</TableHead>
                  <TableHead>Descripción</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAuditTrail.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-gray-500">
                      Sin eventos registrados
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredAuditTrail.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell className="text-xs">
                        {format(new Date(entry.changed_at), 'PPp', { locale: es })}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {entry.action}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">{entry.changed_by}</TableCell>
                      <TableCell>
                        <Badge
                          className={`text-xs flex items-center gap-1 w-fit ${
                            entry.severity === 'critical'
                              ? 'bg-red-100 text-red-800'
                              : entry.severity === 'high'
                                ? 'bg-orange-100 text-orange-800'
                                : entry.severity === 'medium'
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : 'bg-green-100 text-green-800'
                          }`}
                        >
                          {getSeverityIcon(entry.severity)}
                          {entry.severity}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-gray-700">{entry.description}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <p className="text-sm text-red-800">Error: {error}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
