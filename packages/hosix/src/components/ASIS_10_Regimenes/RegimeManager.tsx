// ============================================================================
// RegimeManager.tsx - Medication Regimen Management Component
// ASIS 10.0 - Regímenes de Medicación
// ============================================================================

'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useRegimeManager } from '@/hooks/useRegimeManager';
import {
  Calendar,
  Pill,
  Clock,
  AlertCircle,
  Trash2,
  Edit2,
  CheckCircle,
  XCircle,
} from 'lucide-react';

interface RegimeManagerProps {
  patientId: string;
  onEdit?: (regime: any) => void;
}

export const RegimeManager: React.FC<RegimeManagerProps> = ({ patientId, onEdit }) => {
  const { regimes, loading, error, updateRegime, deleteRegime, refetchRegimes } = useRegimeManager(
    patientId
  );

  const [activeTab, setActiveTab] = useState('active');
  const [selectedRegime, setSelectedRegime] = useState<any>(null);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  const activeRegimes = regimes?.filter((r: any) => r.status === 'active') || [];
  const inactiveRegimes = regimes?.filter((r: any) => r.status === 'inactive') || [];
  const pausedRegimes = regimes?.filter((r: any) => r.status === 'paused') || [];

  const handleStatusChange = async (regime: any, newStatus: 'active' | 'inactive' | 'paused') => {
    await updateRegime(regime.id, { status: newStatus });
    await refetchRegimes();
  };

  const handleDelete = async () => {
    if (selectedRegime) {
      await deleteRegime(selectedRegime.id);
      setSelectedRegime(null);
      setShowConfirmDelete(false);
      await refetchRegimes();
    }
  };

  const RegimeCard = ({ regime }: { regime: any }) => (
    <div
      className="p-4 border rounded-lg hover:shadow-md transition-shadow cursor-pointer"
      onClick={() => setSelectedRegime(regime)}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h3 className="font-semibold text-lg">{regime.medication_name}</h3>
          <p className="text-sm text-gray-600">
            {regime.dose} {regime.unit}
          </p>
        </div>
        <Badge
          variant={
            regime.status === 'active'
              ? 'default'
              : regime.status === 'paused'
                ? 'secondary'
                : 'outline'
          }
        >
          {regime.status === 'active'
            ? 'Activo'
            : regime.status === 'paused'
              ? 'En Pausa'
              : 'Inactivo'}
        </Badge>
      </div>

      <div className="grid grid-cols-2 gap-2 text-sm mb-3">
        <div className="flex items-center text-gray-600">
          <Clock className="mr-2 h-4 w-4" />
          <span>{regime.frequency}</span>
        </div>
        <div className="flex items-center text-gray-600">
          <Calendar className="mr-2 h-4 w-4" />
          <span>{regime.duration} días</span>
        </div>
      </div>

      <p className="text-xs text-gray-500 line-clamp-2 mb-3">{regime.indication}</p>

      <div className="flex gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={(e) => {
            e.stopPropagation();
            onEdit?.(regime);
          }}
        >
          <Edit2 className="h-3 w-3" />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={(e) => {
            e.stopPropagation();
            setSelectedRegime(regime);
            setShowConfirmDelete(true);
          }}
        >
          <Trash2 className="h-3 w-3 text-red-500" />
        </Button>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Gestor de Regímenes</CardTitle>
          <CardDescription>Visualizar y administrar medicamentos activos</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} defaultValue="active">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="active" className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                Activos ({activeRegimes.length})
              </TabsTrigger>
              <TabsTrigger value="paused" className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                En Pausa ({pausedRegimes.length})
              </TabsTrigger>
              <TabsTrigger value="inactive" className="flex items-center gap-2">
                <XCircle className="h-4 w-4" />
                Inactivos ({inactiveRegimes.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="active" className="space-y-4 mt-6">
              {loading ? (
                <div className="text-center py-8 text-gray-500">Cargando regímenes...</div>
              ) : activeRegimes.length > 0 ? (
                <div className="grid gap-4">
                  {activeRegimes.map((regime: any) => (
                    <RegimeCard key={regime.id} regime={regime} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  Sin regímenes activos
                </div>
              )}
            </TabsContent>

            <TabsContent value="paused" className="space-y-4 mt-6">
              {pausedRegimes.length > 0 ? (
                <div className="grid gap-4">
                  {pausedRegimes.map((regime: any) => (
                    <RegimeCard key={regime.id} regime={regime} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  Sin regímenes en pausa
                </div>
              )}
            </TabsContent>

            <TabsContent value="inactive" className="space-y-4 mt-6">
              {inactiveRegimes.length > 0 ? (
                <div className="grid gap-4">
                  {inactiveRegimes.map((regime: any) => (
                    <RegimeCard key={regime.id} regime={regime} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  Sin regímenes inactivos
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Status Change Dialog */}
      {selectedRegime && !showConfirmDelete && (
        <Card>
          <CardHeader>
            <CardTitle>Cambiar Estado</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p>{selectedRegime.medication_name}</p>
            <div className="grid grid-cols-3 gap-2">
              <Button
                variant={selectedRegime.status === 'active' ? 'default' : 'outline'}
                onClick={() => {
                  handleStatusChange(selectedRegime, 'active');
                  setSelectedRegime(null);
                }}
              >
                Activar
              </Button>
              <Button
                variant={selectedRegime.status === 'paused' ? 'default' : 'outline'}
                onClick={() => {
                  handleStatusChange(selectedRegime, 'paused');
                  setSelectedRegime(null);
                }}
              >
                Pausar
              </Button>
              <Button
                variant={selectedRegime.status === 'inactive' ? 'default' : 'outline'}
                onClick={() => {
                  handleStatusChange(selectedRegime, 'inactive');
                  setSelectedRegime(null);
                }}
              >
                Desactivar
              </Button>
            </div>
            <Button variant="ghost" onClick={() => setSelectedRegime(null)} className="w-full">
              Cerrar
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Delete Confirmation */}
      {showConfirmDelete && selectedRegime && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <p className="mb-3">
              ¿Está seguro de que desea eliminar {selectedRegime.medication_name}?
            </p>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="destructive"
                onClick={handleDelete}
              >
                Confirmar
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setShowConfirmDelete(false);
                  setSelectedRegime(null);
                }}
              >
                Cancelar
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default RegimeManager;
