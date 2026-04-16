'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import { useSpecialistLookup, useSpecialistResponses } from '@/hooks/useSpecialistLookup';
import { Star, MapPin, Clock, Phone, Mail } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface SpecialistFinderProps {
  specialty: string;
  onSelectSpecialist?: (specialistId: string) => void;
}

export const SpecialistFinder: React.FC<SpecialistFinderProps> = ({
  specialty,
  onSelectSpecialist,
}) => {
  const {
    loading,
    error,
    findSpecialistsBySpecialty,
    getAvailableSlots,
    getSpecialistProfile,
  } = useSpecialistLookup();

  const [specialists, setSpecialists] = useState<any[]>([]);
  const [selectedSpecialist, setSelectedSpecialist] = useState<any>(null);
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  // Load specialists
  React.useEffect(() => {
    const loadSpecialists = async () => {
      const found = await findSpecialistsBySpecialty(specialty);
      setSpecialists(found);
    };

    loadSpecialists();
  }, [specialty, findSpecialistsBySpecialty]);

  const handleSelectSpecialist = async (specialist: any) => {
    setSelectedSpecialist(specialist);
    const slots = await getAvailableSlots(specialist.id);
    setAvailableSlots(slots);
    onSelectSpecialist?.(specialist.id);
  };

  // Filter specialists
  const filteredSpecialists = specialists.filter((s) =>
    s.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="w-full space-y-4">
      {/* Search */}
      <Card>
        <CardHeader>
          <CardTitle>Buscar Especialista</CardTitle>
          <CardDescription>En especialidad: {specialty}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label>Nombre del especialista</Label>
            <Input
              placeholder="Buscar por nombre..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Specialists Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredSpecialists.length === 0 ? (
          <Card className="md:col-span-2">
            <CardContent className="pt-6 text-center text-gray-500">
              No se encontraron especialistas para: {specialty}
            </CardContent>
          </Card>
        ) : (
          filteredSpecialists.map((specialist) => (
            <Card
              key={specialist.id}
              className={`cursor-pointer transition-colors ${
                selectedSpecialist?.id === specialist.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'hover:bg-gray-50'
              }`}
              onClick={() => handleSelectSpecialist(specialist)}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-base">{specialist.name}</CardTitle>
                    <CardDescription className="mt-1">
                      {specialist.specialty}
                    </CardDescription>
                  </div>
                  <div className="flex gap-0.5">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-4 h-4 ${
                          i < Math.round(specialist.success_rate / 20)
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'text-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-3">
                {/* Stats */}
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-gray-600" />
                    <span>{specialist.average_response_time_days} días respuesta</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-gray-600" />
                    <span>{specialist.available_slots} cupos</span>
                  </div>
                </div>

                {/* Availability badge */}
                <div>
                  {specialist.is_available ? (
                    <Badge className="bg-green-100 text-green-800">✓ Disponible</Badge>
                  ) : (
                    <Badge className="bg-red-100 text-red-800">✗ No disponible</Badge>
                  )}
                </div>

                
                {selectedSpecialist?.id === specialist.id && availableSlots.length > 0 && (
                  <div className="pt-3 border-t space-y-2">
                    <p className="text-sm font-medium">Citas disponibles:</p>
                    <div className="grid grid-cols-2 gap-2">
                      {availableSlots.slice(0, 4).map((slot) => (
                        <Button key={slot} size="sm" variant="outline" className="text-xs">
                          {format(new Date(slot), 'dd MMM', { locale: es })}
                        </Button>
                      ))}
                      {availableSlots.length > 4 && (
                        <span className="text-xs text-gray-600 col-span-2">
                          +{availableSlots.length - 4} más
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>

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
