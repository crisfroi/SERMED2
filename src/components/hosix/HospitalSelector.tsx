// @ts-nocheck
/**
 * HospitalSelector - FASE A1 MULTICENTRO
 * Dropdown to select active hospital, integrated into header
 * Changes context and refetches all queries
 */

import React from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useHospital } from "@/hooks/useHospital";
import { Hospital } from "@/types/hospital";

export const HospitalSelector: React.FC = () => {
  const { activeHospital, hospitals, setActiveHospital, isLoading } = useHospital();

  const handleHospitalChange = (hospitalId: string) => {
    const hospital = hospitals.find(h => h.id === hospitalId);
    if (hospital) {
      setActiveHospital(hospital);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">Cargando...</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm font-medium text-muted-foreground">Hospital:</span>
      <Select
        value={activeHospital?.id || ''}
        onValueChange={handleHospitalChange}
        disabled={isLoading}
      >
        <SelectTrigger className="w-80 bg-white dark:bg-slate-900">
          <SelectValue placeholder="Seleccionar hospital..." />
        </SelectTrigger>
        <SelectContent>
          {hospitals.map((hospital: Hospital) => (
            <SelectItem
              key={hospital.id}
              value={hospital.id}
              className="cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <span className="font-semibold">{hospital.nombre}</span>
                <span className="text-xs text-muted-foreground">
                  ({hospital.region})
                </span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

/**
 * Compact version for small spaces (mobile, sidebar)
 */
export const HospitalSelectorCompact: React.FC = () => {
  const { activeHospital, hospitals, setActiveHospital, isLoading } = useHospital();

  const handleHospitalChange = (hospitalId: string) => {
    const hospital = hospitals.find(h => h.id === hospitalId);
    if (hospital) {
      setActiveHospital(hospital);
    }
  };

  if (isLoading) {
    return (
      <div className="text-xs text-muted-foreground">
        Cargando...
      </div>
    );
  }

  return (
    <Select
      value={activeHospital?.id || ''}
      onValueChange={handleHospitalChange}
      disabled={isLoading}
    >
      <SelectTrigger className="w-full text-xs h-8">
        <SelectValue placeholder="Hospital..." />
      </SelectTrigger>
      <SelectContent>
        {hospitals.map((hospital: Hospital) => (
          <SelectItem
            key={hospital.id}
            value={hospital.id}
            className="text-xs cursor-pointer"
          >
            {hospital.nombre.substring(0, 30)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export default HospitalSelector;
