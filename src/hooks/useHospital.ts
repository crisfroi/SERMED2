import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/services/supabaseClient';
import { Hospital } from '@/types/hospital';

export const useHospital = () => {
  const [activeHospital, setActiveHospitalState] = useState<Hospital | null>(null);
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch all hospitals on mount
  useEffect(() => {
    const loadHospitals = async () => {
      try {
        setIsLoading(true);
        const { data, error: fetchError } = await supabase
          .from('clinic')
          .select('id, name, address, phone, email')
          .limit(50);

        if (fetchError) throw fetchError;

        const hospitalList = (data || []) as Hospital[];
        setHospitals(hospitalList);

        // Set first hospital as active if none selected
        if (hospitalList.length > 0 && !activeHospital) {
          setActiveHospitalState(hospitalList[0]);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error loading hospitals');
        console.error('Error loading hospitals:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadHospitals();
  }, []);

  const setActiveHospital = useCallback((hospital: Hospital) => {
    setActiveHospitalState(hospital);
    // Store in localStorage for persistence
    localStorage.setItem('activeHospitalId', hospital.id);
  }, []);

  return {
    activeHospital,
    hospitals,
    setActiveHospital,
    isLoading,
    error,
  };
};

