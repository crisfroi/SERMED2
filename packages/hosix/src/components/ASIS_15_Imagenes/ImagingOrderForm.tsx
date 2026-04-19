// ============================================================================
// Imaging Order Form Component - ASIS 15.0 - Radiology Orders
// Create imaging orders with modality selection and DICOM/Orthanc integration
// ============================================================================

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import {
  AlertCircle,
  Plus,
  Camera,
  Send,
  CheckCircle,
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useImagingOrder } from '@/hooks/useImagingOrder';

interface ImagingOrderFormProps {
  patientId: string;
  patientName: string;
  patientAge: number;
  onOrderCreated?: (orderId: string) => void;
}

export const ImagingOrderForm: React.FC<ImagingOrderFormProps> = ({
  patientId,
  patientName,
  patientAge,
  onOrderCreated,
}) => {
  const [selectedModality, setSelectedModality] = useState('');
  const [selectedStudyType, setSelectedStudyType] = useState('');
  const [clinicalIndication, setClinicalIndication] = useState('');
  const [priority, setPriority] = useState<'normal' | 'urgent' | 'stat'>('normal');
  const [contrastAllergy, setContrastAllergy] = useState<'unknown' | 'no_allergy' | 'allergy' | 'severe_allergy'>('unknown');
  const [contrastAllergyNotes, setContrastAllergyNotes] = useState('');
  const [needsContrast, setNeedsContrast] = useState(false);
  const [insuranceAuthNumber, setInsuranceAuthNumber] = useState('');
  const [requestedForDate, setRequestedForDate] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const {
    availableModalities,
    availableStudyTypes,
    createOrder,
    getStudyTypesForModality,
  } = useImagingOrder();

  const studyTypesForModality = selectedModality
    ? availableStudyTypes.filter((st) => st.modality_id === selectedModality)
    : [];

  const handleModalityChange = (modalityId: string) => {
    setSelectedModality(modalityId);
    setSelectedStudyType(''); // Reset study type
  };

  const handleSubmitOrder = async () => {
    setError(null);
    setSuccessMessage(null);

    // Validations
    if (!selectedModality) {
      setError('Debe seleccionar una modalidad de imagen');
      return;
    }

    if (!selectedStudyType) {
      setError('Debe seleccionar un tipo de estudio');
      return;
    }

    if (!clinicalIndication.trim()) {
      setError('La indicación clínica es requerida');
      return;
    }

    // Contrast validation
    if (contrastAllergy === 'allergy' || contrastAllergy === 'severe_allergy') {
      if (needsContrast) {
        setError(
          'Este paciente tiene alergia al contraste. El estudio solicitado requiere contraste.'
        );
        return;
      }
    }

    setIsLoading(true);

    try {
      const orderId = await createOrder(
        patientId,
        selectedStudyType,
        clinicalIndication,
        {
          priority,
          contrastAllergy,
          contrastAllergyNotes,
          needsContrast,
          insuranceAuthNumber,
          requestedForDate: requestedForDate ? new Date(requestedForDate) : undefined,
        }
      );

      setSuccessMessage(`Orden creada exitosamente: ${orderId.slice(0, 8)}`);
      setSelectedModality('');
      setSelectedStudyType('');
      setClinicalIndication('');
      setPriority('normal');
      setContrastAllergy('unknown');
      setContrastAllergyNotes('');
      setNeedsContrast(false);
      setInsuranceAuthNumber('');
      setRequestedForDate('');

      onOrderCreated?.(orderId);
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear la orden');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Camera className="h-5 w-5" />
          Nueva Orden de Imagenología
        </CardTitle>
        <CardDescription>
          Paciente: <strong>{patientName}</strong> | {patientAge} años | ID:{' '}
          {patientId.slice(0, 8)}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Error/Success Alerts */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        {successMessage && (
          <Alert className="border-green-500 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              {successMessage}
            </AlertDescription>
          </Alert>
        )}

        {/* Modality Selection */}
        <div className="space-y-2">
          <Label htmlFor="modality">Modalidad de Imagen</Label>
          <Select value={selectedModality} onValueChange={handleModalityChange}>
            <SelectTrigger id="modality">
              <SelectValue placeholder="Selecciona una modalidad..." />
            </SelectTrigger>
            <SelectContent>
              {availableModalities.map((mod) => (
                <SelectItem key={mod.id} value={mod.id}>
                  {mod.name} ({mod.code})
                  {mod.radiation_dose && mod.radiation_dose > 0
                    ? ` - ${mod.radiation_dose} mSv`
                    : ' - Sin radiación'}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Study Type Selection */}
        {selectedModality && (
          <div className="space-y-2">
            <Label htmlFor="study-type">Tipo de Estudio</Label>
            <Select value={selectedStudyType} onValueChange={setSelectedStudyType}>
              <SelectTrigger id="study-type">
                <SelectValue placeholder="Selecciona un tipo de estudio..." />
              </SelectTrigger>
              <SelectContent>
                {studyTypesForModality.map((st) => (
                  <SelectItem key={st.id} value={st.id}>
                    {st.name} ({st.body_part})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Clinical Indication */}
        <div className="space-y-2">
          <Label htmlFor="indication">Indicación Clínica</Label>
          <Textarea
            id="indication"
            placeholder="Ej: Sospecha de neumonía, trauma abdominal, etc..."
            value={clinicalIndication}
            onChange={(e) => setClinicalIndication(e.target.value)}
            className="h-20"
          />
        </div>

        {/* Priority and Dates */}
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="priority">Prioridad</Label>
            <Select value={priority} onValueChange={(v: any) => setPriority(v)}>
              <SelectTrigger id="priority">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="normal">Normal (24h)</SelectItem>
                <SelectItem value="urgent">Urgente (4h)</SelectItem>
                <SelectItem value="stat">STAT (1h)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="requested-date">Solicitar para (Fecha)</Label>
            <Input
              id="requested-date"
              type="date"
              value={requestedForDate}
              onChange={(e) => setRequestedForDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
            />
          </div>
        </div>

        {/* Contrast Allergy Assessment */}
        <div className="space-y-3 rounded-lg border border-orange-200 bg-orange-50 p-4">
          <div className="font-semibold text-orange-900">Historial de Alergia al Contraste</div>

          <div className="space-y-2">
            <Label htmlFor="contrast-allergy">Estado de Alergia</Label>
            <Select
              value={contrastAllergy}
              onValueChange={(v: any) => setContrastAllergy(v)}
            >
              <SelectTrigger id="contrast-allergy">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="unknown">Desconocido</SelectItem>
                <SelectItem value="no_allergy">Sin alergia conocida</SelectItem>
                <SelectItem value="allergy">Alergia leve/moderada</SelectItem>
                <SelectItem value="severe_allergy">Alergia severa</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {(contrastAllergy === 'allergy' || contrastAllergy === 'severe_allergy') && (
            <div className="space-y-2">
              <Label htmlFor="allergy-notes">Notas sobre la alergia</Label>
              <Textarea
                id="allergy-notes"
                placeholder="Describe los síntomas y reacciones previas..."
                value={contrastAllergyNotes}
                onChange={(e) => setContrastAllergyNotes(e.target.value)}
                className="h-16"
              />
            </div>
          )}

          <div className="flex items-center gap-2">
            <Checkbox
              id="needs-contrast"
              checked={needsContrast}
              onCheckedChange={(checked) => setNeedsContrast(checked as boolean)}
              disabled={
                contrastAllergy === 'allergy' || contrastAllergy === 'severe_allergy'
              }
            />
            <Label htmlFor="needs-contrast" className="font-normal">
              Este estudio requiere contraste endovenoso
            </Label>
          </div>
        </div>

        {/* Insurance Information */}
        <div className="space-y-2">
          <Label htmlFor="insurance-auth">Número de Autorización (Asegurador)</Label>
          <Input
            id="insurance-auth"
            placeholder="Ej: AUTH-2024-123456"
            value={insuranceAuthNumber}
            onChange={(e) => setInsuranceAuthNumber(e.target.value)}
          />
        </div>

        {/* Study Information Alert */}
        {selectedStudyType && studyTypesForModality.length > 0 && (
          <Alert className="bg-blue-50 border-blue-200">
            <AlertCircle className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800">
              <div className="font-semibold">Información del Estudio</div>
              <div className="mt-1 text-sm">
                {studyTypesForModality.find((st) => st.id === selectedStudyType)
                  ?.clinical_indication_examples || ''}
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Submit Button */}
        <Button
          onClick={handleSubmitOrder}
          disabled={isLoading || !selectedModality || !selectedStudyType}
          className="w-full gap-2 bg-blue-600 hover:bg-blue-700"
        >
          <Send className="h-4 w-4" />
          {isLoading ? 'Enviando orden...' : 'Crear Orden de Imagenología'}
        </Button>
      </CardContent>
    </Card>
  );
};

export default ImagingOrderForm;
