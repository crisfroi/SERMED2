/**
 * @file PatientSearch.tsx
 * @module 00-core/patients
 * @description HOSIX - Componente de Búsqueda de Pacientes
 * Busca pacientes por ID de identificación con privacidad garantizada
 */

import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { AlertCircle, Search, Loader2, User, Phone, Mail } from 'lucide-react';
import { supabaseClientEnhanced } from '@/services/supabaseClientEnhanced';
import { useAuth } from '@/hooks/useAuth';

export interface PatientSearchResult {
  id: string;
  first_name: string;
  last_name: string;
  identification_number: string;
  phone?: string;
  email?: string;
  date_of_birth?: string;
}

export interface PatientSearchProps {
  onPatientSelected?: (patientId: string) => void;
}

export const PatientSearch: React.FC<PatientSearchProps> = ({ onPatientSelected }) => {
  const navigate = useNavigate();
  const { auth } = useAuth();

  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<PatientSearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);

  const handleSearch = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setResults([]);
    setHasSearched(true);

    try {
      // Validación
      if (!searchQuery.trim()) {
        setError('Por favor ingresa un ID de paciente');
        setIsLoading(false);
        return;
      }

      if (!auth?.hospital) {
        setError('Error: no hay hospital asociado a tu cuenta');
        setIsLoading(false);
        return;
      }

      // Buscar pacientes (privacy-preserving: usa identification_hash)
      const patients = await supabaseClientEnhanced.searchPatientByIdentification(
        searchQuery.trim(),
        auth.hospital
      );

      if (patients.length === 0) {
        setError('No se encontraron pacientes con ese ID');
      } else {
        setResults(patients);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setError(`Error en la búsqueda: ${errorMessage}`);
      console.error('Patient search error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, auth?.hospital]);

  const handleSelectPatient = (patientId: string) => {
    setSelectedPatientId(patientId);
    onPatientSelected?.(patientId);
    // Redirigir a perfil del paciente después de 300ms
    setTimeout(() => {
      navigate(`/hosix/patients/${patientId}`);
    }, 300);
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setResults([]);
    setError(null);
    setHasSearched(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Búsqueda de Pacientes</h1>
            <p className="text-gray-600 mt-1">Encuentra y accede al perfil de tus pacientes</p>
          </div>
          <div className="text-sm text-gray-500 bg-white rounded-lg p-3 border">
            <p>Hospital: <span className="font-semibold">{auth?.hospital || 'No asignado'}</span></p>
          </div>
        </div>

        {/* Search Card */}
        <Card>
          <CardHeader>
            <CardTitle>Buscar Paciente</CardTitle>
            <CardDescription>
              Ingresa el número de identificación del paciente (cédula, pasaporte, etc)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSearch} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="search" className="text-sm font-medium">
                  ID de Identificación
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="search"
                    type="text"
                    placeholder="Ej: 1234567890"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    disabled={isLoading}
                    className="flex-1"
                    aria-label="Search patient by identification"
                  />
                  <Button
                    type="submit"
                    disabled={isLoading || !searchQuery.trim()}
                    className="bg-blue-600 hover:bg-blue-700 min-w-fit"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Buscando...
                      </>
                    ) : (
                      <>
                        <Search className="w-4 h-4 mr-2" />
                        Buscar
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {/* Error Alert */}
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
            </form>
          </CardContent>
        </Card>

        {/* Results Section */}
        {hasSearched && (
          <>
            {results.length > 0 ? (
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle>Resultados ({results.length})</CardTitle>
                      <CardDescription>
                        Haz clic en un paciente para ver su perfil completo
                      </CardDescription>
                    </div>
                    <Button
                      variant="outline"
                      onClick={handleClearSearch}
                      disabled={isLoading}
                    >
                      Nueva Búsqueda
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-gray-100">
                          <TableHead className="font-semibold">Nombre</TableHead>
                          <TableHead className="font-semibold">ID Identificación</TableHead>
                          <TableHead className="font-semibold">Teléfono</TableHead>
                          <TableHead className="font-semibold">Email</TableHead>
                          <TableHead className="font-semibold text-right">Acción</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {results.map((patient) => (
                          <TableRow
                            key={patient.id}
                            className="hover:bg-blue-50 cursor-pointer transition-colors"
                            onClick={() => handleSelectPatient(patient.id)}
                          >
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <div className="bg-blue-100 rounded-full p-2">
                                  <User className="w-4 h-4 text-blue-600" />
                                </div>
                                <div>
                                  <p className="font-semibold">{patient.first_name} {patient.last_name}</p>
                                  {patient.date_of_birth && (
                                    <p className="text-xs text-gray-500">
                                      Nac: {new Date(patient.date_of_birth).toLocaleDateString()}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <code className="bg-gray-100 px-2 py-1 rounded text-sm">
                                {patient.identification_number}
                              </code>
                            </TableCell>
                            <TableCell>
                              {patient.phone ? (
                                <div className="flex items-center gap-1">
                                  <Phone className="w-4 h-4 text-gray-500" />
                                  {patient.phone}
                                </div>
                              ) : (
                                <span className="text-gray-400">-</span>
                              )}
                            </TableCell>
                            <TableCell>
                              {patient.email ? (
                                <div className="flex items-center gap-1">
                                  <Mail className="w-4 h-4 text-gray-500" />
                                  <span className="truncate">{patient.email}</span>
                                </div>
                              ) : (
                                <span className="text-gray-400">-</span>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                size="sm"
                                variant={selectedPatientId === patient.id ? 'default' : 'outline'}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleSelectPatient(patient.id);
                                }}
                                className="bg-blue-600 hover:bg-blue-700"
                              >
                                Ver Perfil →
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="bg-yellow-50 border-yellow-200">
                <CardContent className="pt-6">
                  <div className="text-center space-y-3">
                    <AlertCircle className="w-12 h-12 text-yellow-600 mx-auto" />
                    <p className="text-lg font-semibold text-yellow-900">
                      No se encontraron pacientes
                    </p>
                    <p className="text-yellow-700">
                      Verifica el ID de identificación e intenta de nuevo
                    </p>
                    <Button
                      onClick={handleClearSearch}
                      variant="outline"
                      className="mt-4"
                    >
                      Hacer otra búsqueda
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}

        {/* Empty State */}
        {!hasSearched && (
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="pt-6">
              <div className="text-center space-y-3">
                <Search className="w-12 h-12 text-blue-600 mx-auto opacity-50" />
                <p className="text-lg font-semibold text-blue-900">
                  Comienza tu búsqueda
                </p>
                <p className="text-blue-700">
                  Ingresa el número de identificación para buscar pacientes
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Footer Info */}
        <Card className="bg-gray-50 border-gray-200">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-sm">
                <p className="font-semibold text-gray-900">🔒 Privacidad Garantizada</p>
                <p className="text-gray-600">Los datos se buscan por hash, no por texto plano</p>
              </div>
              <div className="text-sm">
                <p className="font-semibold text-gray-900">🔐 Encriptación End-to-End</p>
                <p className="text-gray-600">Todos los datos se desencriptan localmente</p>
              </div>
              <div className="text-sm">
                <p className="font-semibold text-gray-900">📋 Auditoría Completa</p>
                <p className="text-gray-600">Cada acceso se registra en la auditoría</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PatientSearch;
