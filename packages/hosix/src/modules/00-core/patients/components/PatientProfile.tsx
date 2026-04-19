/**
 * @file PatientProfile.tsx
 * @module 00-core/patients
 * @description HOSIX - Componente de Perfil del Paciente
 * Visualiza y edita datos del paciente con encriptación automática
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { AlertCircle, Loader2, Edit2, Save, X, ArrowLeft, User, Shield, FileText } from 'lucide-react';
import { supabaseClientEnhanced } from '@/services/supabaseClientEnhanced';
import { useAuth } from '@/hooks/useAuth';

export interface PatientData {
  id: string;
  first_name: string;
  last_name: string;
  identification_number: string;
  date_of_birth?: string;
  gender?: string;
  email?: string;
  phone?: string;
  address?: string;
  hospital_id: string;
  created_at: string;
  updated_at: string;
}

export interface PatientProfileProps {
  patientId?: string;
}

export const PatientProfile: React.FC<PatientProfileProps> = ({ patientId: propPatientId }) => {
  const { patientId: paramPatientId } = useParams<{ patientId: string }>();
  const navigate = useNavigate();
  const { auth } = useAuth();

  const patientId = propPatientId || paramPatientId;

  const [patient, setPatient] = useState<PatientData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<Partial<PatientData>>({});
  const [auditLogs, setAuditLogs] = useState<any[]>([]);

  // Cargar datos del paciente
  useEffect(() => {
    const loadPatient = async () => {
      if (!patientId) {
        setError('ID de paciente no válido');
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const data = await supabaseClientEnhanced.getPatientById(patientId);

        if (!data) {
          setError('Paciente no encontrado');
        } else {
          setPatient(data);
          setEditData(data);
          // Aquí se cargarían los logs de auditoría
          // const logs = await supabaseClientEnhanced.getAuditLogs('patients', patientId);
          // setAuditLogs(logs);
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
        setError(`Error cargando paciente: ${errorMessage}`);
        console.error('Patient load error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadPatient();
  }, [patientId]);

  const handleEditChange = (field: keyof PatientData, value: any) => {
    setEditData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);
    setSuccess(null);

    try {
      if (!patient?.id) {
        setError('Error: paciente no válido');
        setIsSaving(false);
        return;
      }

      // Actualizar paciente (se encripta automáticamente)
      const updated = await supabaseClientEnhanced.updatePatient(
        patient.id,
        editData,
        auth?.id || 'unknown'
      );

      if (updated) {
        setPatient(updated);
        setIsEditing(false);
        setSuccess('Paciente actualizado correctamente');
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError('Error al actualizar el paciente');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setError(`Error guardando cambios: ${errorMessage}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setEditData(patient || {});
    setIsEditing(false);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto" />
          <p className="text-lg font-semibold">Cargando perfil del paciente...</p>
        </div>
      </div>
    );
  }

  if (error && !patient) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-4xl mx-auto">
          <Button
            variant="outline"
            onClick={() => navigate(-1)}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver
          </Button>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-4xl mx-auto">
          <Button
            variant="outline"
            onClick={() => navigate(-1)}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver
          </Button>
          <Card className="bg-yellow-50 border-yellow-200">
            <CardContent className="pt-6">
              <p className="text-center text-yellow-900">
                No hay datos para mostrar
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              onClick={() => navigate(-1)}
              size="sm"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {patient.first_name} {patient.last_name}
              </h1>
              <p className="text-gray-600">ID: {patient.identification_number}</p>
            </div>
          </div>
          <div className="flex gap-2">
            {!isEditing ? (
              <Button
                onClick={() => setIsEditing(true)}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Edit2 className="w-4 h-4 mr-2" />
                Editar
              </Button>
            ) : (
              <>
                <Button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Guardando...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Guardar
                    </>
                  )}
                </Button>
                <Button
                  onClick={handleCancel}
                  variant="outline"
                  disabled={isSaving}
                >
                  <X className="w-4 h-4 mr-2" />
                  Cancelar
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Alerts */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        {success && (
          <Alert className="bg-green-50 border-green-200">
            <AlertDescription className="text-green-800">{success}</AlertDescription>
          </Alert>
        )}

        {/* Tabs */}
        <Tabs defaultValue="personal" className="space-y-4">
          <TabsList>
            <TabsTrigger value="personal" className="flex items-center gap-2">
              <User className="w-4 h-4" />
              Información Personal
            </TabsTrigger>
            <TabsTrigger value="contacts" className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Contactos de Emergencia
            </TabsTrigger>
            <TabsTrigger value="audit" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Auditoría
            </TabsTrigger>
          </TabsList>

          {/* Personal Information Tab */}
          <TabsContent value="personal">
            <Card>
              <CardHeader>
                <CardTitle>Información Personal</CardTitle>
                <CardDescription>
                  {isEditing
                    ? 'Modifica los datos del paciente'
                    : 'Datos personales del paciente'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* First Name */}
                  <div className="space-y-2">
                    <Label>Nombre</Label>
                    {isEditing ? (
                      <Input
                        value={editData.first_name || ''}
                        onChange={(e) => handleEditChange('first_name', e.target.value)}
                        placeholder="Nombre"
                      />
                    ) : (
                      <p className="text-gray-900 font-medium">{patient.first_name}</p>
                    )}
                  </div>

                  {/* Last Name */}
                  <div className="space-y-2">
                    <Label>Apellido</Label>
                    {isEditing ? (
                      <Input
                        value={editData.last_name || ''}
                        onChange={(e) => handleEditChange('last_name', e.target.value)}
                        placeholder="Apellido"
                      />
                    ) : (
                      <p className="text-gray-900 font-medium">{patient.last_name}</p>
                    )}
                  </div>

                  {/* Identification */}
                  <div className="space-y-2">
                    <Label>Número de Identificación</Label>
                    <p className="text-gray-900 font-medium">
                      {patient.identification_number}
                    </p>
                    <p className="text-xs text-gray-500">(No se puede editar)</p>
                  </div>

                  {/* Date of Birth */}
                  <div className="space-y-2">
                    <Label>Fecha de Nacimiento</Label>
                    {isEditing ? (
                      <Input
                        type="date"
                        value={editData.date_of_birth || ''}
                        onChange={(e) => handleEditChange('date_of_birth', e.target.value)}
                      />
                    ) : (
                      <p className="text-gray-900 font-medium">
                        {patient.date_of_birth
                          ? new Date(patient.date_of_birth).toLocaleDateString()
                          : '-'}
                      </p>
                    )}
                  </div>

                  {/* Gender */}
                  <div className="space-y-2">
                    <Label>Género</Label>
                    {isEditing ? (
                      <select
                        value={editData.gender || ''}
                        onChange={(e) => handleEditChange('gender', e.target.value)}
                        className="w-full px-3 py-2 border rounded-md"
                      >
                        <option value="">Seleccionar</option>
                        <option value="M">Masculino</option>
                        <option value="F">Femenino</option>
                        <option value="O">Otro</option>
                      </select>
                    ) : (
                      <p className="text-gray-900 font-medium">
                        {patient.gender === 'M'
                          ? 'Masculino'
                          : patient.gender === 'F'
                          ? 'Femenino'
                          : patient.gender || '-'}
                      </p>
                    )}
                  </div>

                  {/* Email */}
                  <div className="space-y-2">
                    <Label>Email</Label>
                    {isEditing ? (
                      <Input
                        type="email"
                        value={editData.email || ''}
                        onChange={(e) => handleEditChange('email', e.target.value)}
                        placeholder="email@example.com"
                      />
                    ) : (
                      <p className="text-gray-900 font-medium">{patient.email || '-'}</p>
                    )}
                  </div>

                  {/* Phone */}
                  <div className="space-y-2">
                    <Label>Teléfono</Label>
                    {isEditing ? (
                      <Input
                        value={editData.phone || ''}
                        onChange={(e) => handleEditChange('phone', e.target.value)}
                        placeholder="+1 (555) 000-0000"
                      />
                    ) : (
                      <p className="text-gray-900 font-medium">{patient.phone || '-'}</p>
                    )}
                  </div>

                  {/* Address */}
                  <div className="space-y-2 md:col-span-2">
                    <Label>Dirección</Label>
                    {isEditing ? (
                      <Input
                        value={editData.address || ''}
                        onChange={(e) => handleEditChange('address', e.target.value)}
                        placeholder="Dirección completa"
                      />
                    ) : (
                      <p className="text-gray-900 font-medium">{patient.address || '-'}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Contacts Tab */}
          <TabsContent value="contacts">
            <Card>
              <CardHeader>
                <CardTitle>Contactos de Emergencia</CardTitle>
                <CardDescription>
                  Personas a contactar en caso de emergencia
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 text-center py-8">
                  Funcionalidad de contactos de emergencia próximamente
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Audit Tab */}
          <TabsContent value="audit">
            <Card>
              <CardHeader>
                <CardTitle>Registro de Auditoría</CardTitle>
                <CardDescription>
                  Historial de cambios y accesos
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-sm text-blue-900">
                      <strong>Creado:</strong> {new Date(patient.created_at).toLocaleString()}
                    </p>
                    <p className="text-sm text-blue-900">
                      <strong>Última actualización:</strong> {new Date(patient.updated_at).toLocaleString()}
                    </p>
                  </div>

                  {auditLogs.length > 0 ? (
                    <div className="space-y-2">
                      {auditLogs.map((log, idx) => (
                        <div key={idx} className="border rounded p-3 text-sm">
                          <p className="font-semibold">{log.action}</p>
                          <p className="text-gray-600">{log.timestamp}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-600 text-center py-4">
                      No hay cambios registrados
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Security Info */}
        <Card className="bg-green-50 border-green-200">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-sm">
                <p className="font-semibold text-green-900">🔒 Datos Encriptados</p>
                <p className="text-green-700">Todos los datos personales están encriptados</p>
              </div>
              <div className="text-sm">
                <p className="font-semibold text-green-900">📋 Auditoría Completa</p>
                <p className="text-green-700">Todos los accesos se registran automáticamente</p>
              </div>
              <div className="text-sm">
                <p className="font-semibold text-green-900">🏥 Aislamiento por Hospital</p>
                <p className="text-green-700">Solo usuarios del mismo hospital pueden ver estos datos</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PatientProfile;
