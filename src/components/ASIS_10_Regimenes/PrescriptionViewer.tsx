// @ts-nocheck
// ============================================================================
// PrescriptionViewer.tsx - View and Manage Prescriptions
// ASIS 10.0 - Regímenes de Medicación - Visualización de Prescripciones
// ============================================================================

'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { usePrescriptionViewer } from '@/hooks/usePrescriptionViewer';
import {
  Calendar,
  Pill,
  Clock,
  AlertCircle,
  Download,
  Print,
  MessageSquare,
  CheckCircle,
  XCircle,
  RefreshCw,
  Eye,
  Loader2,
  Phone,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface Prescription {
  id: string;
  medicationId: string;
  medicationName: string;
  dose: string;
  unit: string;
  frequency: string;
  startDate: string;
  endDate?: string;
  status: 'active' | 'completed' | 'cancelled' | 'pending';
  prescriber: string;
  indication: string;
  refillsRemaining: number;
  refillRequests: boolean;
  notes?: string;
  lastRefillDate?: string;
  expanded?: boolean;
}

interface PrescriptionViewerProps {
  patientId: string;
  medicationId?: string;
  onRefillRequest?: (prescriptionId: string) => void;
  onViewDetails?: (prescription: Prescription) => void;
}

export const PrescriptionViewer: React.FC<PrescriptionViewerProps> = ({
  patientId,
  medicationId,
  onRefillRequest,
  onViewDetails,
}) => {
  const { prescriptions, loading, error, requestRefill, printPrescription, exportPrescription } =
    usePrescriptionViewer(patientId, medicationId);

  const [activeTab, setActiveTab] = useState('active');
  const [expandedIds, setExpandedIds] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<'date' | 'medication' | 'status'>('date');

  const activePrescriptions = prescriptions?.filter((p: Prescription) => p.status === 'active') || [];
  const completedPrescriptions = prescriptions?.filter(
    (p: Prescription) => p.status === 'completed'
  ) || [];
  const cancelledPrescriptions = prescriptions?.filter(
    (p: Prescription) => p.status === 'cancelled'
  ) || [];
  const pendingPrescriptions = prescriptions?.filter((p: Prescription) => p.status === 'pending') || [];

  const toggleExpanded = (id: string) => {
    setExpandedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-blue-50 border-blue-200 text-blue-700';
      case 'completed':
        return 'bg-green-50 border-green-200 text-green-700';
      case 'cancelled':
        return 'bg-red-50 border-red-200 text-red-700';
      case 'pending':
        return 'bg-yellow-50 border-yellow-200 text-yellow-700';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="h-5 w-5 text-blue-600" />;
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'cancelled':
        return <XCircle className="h-5 w-5 text-red-600" />;
      case 'pending':
        return <Clock className="h-5 w-5 text-yellow-600" />;
      default:
        return <Pill className="h-5 w-5" />;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active':
        return 'Activa';
      case 'completed':
        return 'Completada';
      case 'cancelled':
        return 'Cancelada';
      case 'pending':
        return 'Pendiente';
      default:
        return status;
    }
  };

  const sortPrescriptions = (items: Prescription[]) => {
    if (sortBy === 'date') {
      return [...items].sort(
        (a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
      );
    } else if (sortBy === 'medication') {
      return [...items].sort((a, b) => a.medicationName.localeCompare(b.medicationName));
    } else if (sortBy === 'status') {
      return [...items].sort((a, b) => a.status.localeCompare(b.status));
    }
    return items;
  };

  const handleRefillRequest = async (prescriptionId: string) => {
    await requestRefill(prescriptionId);
    onRefillRequest?.(prescriptionId);
  };

  const PrescriptionCard = ({ prescription }: { prescription: Prescription }) => {
    const isExpanded = expandedIds.includes(prescription.id);

    return (
      <div
        className={`border-2 rounded-lg overflow-hidden transition-all ${getStatusColor(
          prescription.status
        )}`}
      >
        {/* Header */}
        <button
          onClick={() => toggleExpanded(prescription.id)}
          className="w-full p-4 flex items-start justify-between hover:bg-black hover:bg-opacity-5 transition-colors"
        >
          <div className="flex items-start gap-3 flex-1">
            {getStatusIcon(prescription.status)}
            <div className="text-left">
              <h4 className="font-semibold text-lg">{prescription.medicationName}</h4>
              <p className="text-sm opacity-75">
                {prescription.dose} {prescription.unit} - {prescription.frequency}
              </p>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline" className="text-xs">
                  {getStatusLabel(prescription.status)}
                </Badge>
                <span className="text-xs text-gray-600">
                  Prescriptor: {prescription.prescriber}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {prescription.refillsRemaining > 0 && (
              <Badge className="bg-green-100 text-green-800">
                {prescription.refillsRemaining} recargas
              </Badge>
            )}
            {isExpanded ? (
              <ChevronUp className="h-5 w-5" />
            ) : (
              <ChevronDown className="h-5 w-5" />
            )}
          </div>
        </button>

        {/* Expanded Content */}
        {isExpanded && (
          <div className="border-t border-current opacity-50 p-4 space-y-4 bg-black bg-opacity-2">
            {/* Timeline */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-semibold mb-1">FECHA DE INICIO:</p>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <p className="text-sm">
                    {new Date(prescription.startDate).toLocaleDateString('es-ES')}
                  </p>
                </div>
              </div>
              {prescription.endDate && (
                <div>
                  <p className="text-xs font-semibold mb-1">FECHA DE FIN:</p>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <p className="text-sm">
                      {new Date(prescription.endDate).toLocaleDateString('es-ES')}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Indication */}
            <div>
              <p className="text-xs font-semibold mb-1">INDICACIÓN:</p>
              <p className="text-sm">{prescription.indication}</p>
            </div>

            {/* Refill Status */}
            <div className="bg-white bg-opacity-30 rounded p-3">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold">ESTADO DE RECARGA:</p>
                <div className="flex items-center gap-1">
                  <RefreshCw className="h-4 w-4" />
                  <span className="text-sm font-semibold">{prescription.refillsRemaining} disponibles</span>
                </div>
              </div>
              {prescription.lastRefillDate && (
                <p className="text-xs">
                  Última recarga:{' '}
                  {new Date(prescription.lastRefillDate).toLocaleDateString('es-ES')}
                </p>
              )}
              {prescription.status === 'active' && prescription.refillsRemaining > 0 && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleRefillRequest(prescription.id)}
                  className="w-full mt-2 text-xs"
                >
                  <RefreshCw className="h-3 w-3 mr-1" />
                  Solicitar Recarga
                </Button>
              )}
            </div>

            {/* Notes */}
            {prescription.notes && (
              <div>
                <p className="text-xs font-semibold mb-1">NOTAS:</p>
                <p className="text-sm">{prescription.notes}</p>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2 justify-end pt-3 border-t">
              <Button
                size="sm"
                variant="outline"
                onClick={() => onViewDetails?.(prescription)}
              >
                <Eye className="h-3 w-3 mr-1" />
                Detalles
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => printPrescription(prescription.id)}
              >
                <Print className="h-3 w-3 mr-1" />
                Imprimir
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => exportPrescription(prescription.id)}
              >
                <Download className="h-3 w-3 mr-1" />
                Descargar
              </Button>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total</p>
                <p className="text-3xl font-bold">{prescriptions?.length || 0}</p>
              </div>
              <Pill className="h-8 w-8 text-gray-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Activas</p>
                <p className="text-3xl font-bold text-blue-600">{activePrescriptions.length}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Completadas</p>
                <p className="text-3xl font-bold text-green-600">{completedPrescriptions.length}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Pendientes</p>
                <p className="text-3xl font-bold text-yellow-600">{pendingPrescriptions.length}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Pill className="h-5 w-5" />
                Gestor de Prescripciones
              </CardTitle>
              <CardDescription>Ver y administrar todas sus prescripciones</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} defaultValue="active">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="active" className="flex items-center gap-1">
                <CheckCircle className="h-4 w-4" />
                Activas ({activePrescriptions.length})
              </TabsTrigger>
              <TabsTrigger value="pending" className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                Pendientes ({pendingPrescriptions.length})
              </TabsTrigger>
              <TabsTrigger value="completed" className="flex items-center gap-1">
                <CheckCircle className="h-4 w-4" />
                Completadas ({completedPrescriptions.length})
              </TabsTrigger>
              <TabsTrigger value="cancelled" className="flex items-center gap-1">
                <XCircle className="h-4 w-4" />
                Canceladas ({cancelledPrescriptions.length})
              </TabsTrigger>
            </TabsList>

            {/* Sort Controls */}
            <div className="flex gap-2 mt-4 pb-4 border-b">
              <span className="text-sm text-gray-600 flex items-center">Ordenar por:</span>
              {['date', 'medication', 'status'].map((sort) => (
                <Button
                  key={sort}
                  size="sm"
                  variant={sortBy === sort ? 'default' : 'outline'}
                  onClick={() => setSortBy(sort as any)}
                >
                  {sort === 'date' && 'Fecha'}
                  {sort === 'medication' && 'Medicamento'}
                  {sort === 'status' && 'Estado'}
                </Button>
              ))}
            </div>

            {/* Tab Contents */}
            <TabsContent value="active" className="space-y-3 mt-4">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                </div>
              ) : activePrescriptions.length > 0 ? (
                sortPrescriptions(activePrescriptions).map((prescription) => (
                  <PrescriptionCard key={prescription.id} prescription={prescription} />
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Pill className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>Sin prescripciones activas</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="pending" className="space-y-3 mt-4">
              {pendingPrescriptions.length > 0 ? (
                sortPrescriptions(pendingPrescriptions).map((prescription) => (
                  <PrescriptionCard key={prescription.id} prescription={prescription} />
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>Sin prescripciones pendientes</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="completed" className="space-y-3 mt-4">
              {completedPrescriptions.length > 0 ? (
                sortPrescriptions(completedPrescriptions).map((prescription) => (
                  <PrescriptionCard key={prescription.id} prescription={prescription} />
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <CheckCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>Sin prescripciones completadas</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="cancelled" className="space-y-3 mt-4">
              {cancelledPrescriptions.length > 0 ? (
                sortPrescriptions(cancelledPrescriptions).map((prescription) => (
                  <PrescriptionCard key={prescription.id} prescription={prescription} />
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <XCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>Sin prescripciones canceladas</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default PrescriptionViewer;
