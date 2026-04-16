import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Calendar, CheckCircle, AlertCircle, Clock } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface VaccinationScheduleProps {
  childId: string;
  ageMonths: number;
}

interface VaccineScheduleItem {
  id: string;
  vaccine_name: string;
  scheduled_age_months: number;
  scheduled_date: string;
  administered_date?: string;
  status: 'pending' | 'administered' | 'delayed' | 'not_needed';
  batch_number?: string;
  adverse_effects?: string[];
  administered_by?: string;
}

// Ecuador's National Vaccination Schema (Esquema Nacional de Vacunación)
const ECUADOR_VACCINATION_SCHEMA = [
  { age: 0, vaccines: ['BCG', 'HepB-0'] },
  { age: 2, vaccines: ['DPT-1', 'OPV-1', 'HepB-1'] },
  { age: 4, vaccines: ['DPT-2', 'OPV-2', 'HepB-2'] },
  { age: 6, vaccines: ['DPT-3', 'OPV-3'] },
  { age: 12, vaccines: ['MMR', 'Varicela'] },
  { age: 15, vaccines: ['DPT-R'] },
  { age: 18, vaccines: ['OPV-R'] },
];

const VACCINE_COLORS: { [key: string]: string } = {
  BCG: 'bg-blue-100 text-blue-800',
  'HepB-0': 'bg-green-100 text-green-800',
  'HepB-1': 'bg-green-100 text-green-800',
  'HepB-2': 'bg-green-100 text-green-800',
  'DPT-1': 'bg-purple-100 text-purple-800',
  'DPT-2': 'bg-purple-100 text-purple-800',
  'DPT-3': 'bg-purple-100 text-purple-800',
  'DPT-R': 'bg-purple-100 text-purple-800',
  'OPV-1': 'bg-yellow-100 text-yellow-800',
  'OPV-2': 'bg-yellow-100 text-yellow-800',
  'OPV-3': 'bg-yellow-100 text-yellow-800',
  'OPV-R': 'bg-yellow-100 text-yellow-800',
  'MMR': 'bg-red-100 text-red-800',
  'Varicela': 'bg-orange-100 text-orange-800',
};

const VACCINE_DESCRIPTIONS: { [key: string]: string } = {
  BCG: 'Bacilo Calmette-Guérin (tuberculosis)',
  'HepB-0': 'Hepatitis B - Recién nacido',
  'HepB-1': 'Hepatitis B - 2 meses',
  'HepB-2': 'Hepatitis B - 4 meses',
  'DPT-1': 'Difteria, Pertusis, Tétanos - 1ª dosis',
  'DPT-2': 'Difteria, Pertusis, Tétanos - 2ª dosis',
  'DPT-3': 'Difteria, Pertusis, Tétanos - 3ª dosis',
  'DPT-R': 'Difteria, Pertusis, Tétanos - Refuerzo',
  'OPV-1': 'Poliomielitis - 1ª dosis',
  'OPV-2': 'Poliomielitis - 2ª dosis',
  'OPV-3': 'Poliomielitis - 3ª dosis',
  'OPV-R': 'Poliomielitis - Refuerzo',
  'MMR': 'Sarampión, Paperas, Rubéola',
  'Varicela': 'Varicela (Chickenpox)',
};

export const VaccinationSchedule: React.FC<VaccinationScheduleProps> = ({
  childId,
  ageMonths,
}) => {
  const [vaccinations, setVaccinations] = useState<VaccineScheduleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchVaccinations();
  }, [childId]);

  const fetchVaccinations = async () => {
    try {
      const { data, error: fetchError } = await supabase
        .from('vaccination_administration')
        .select('*')
        .eq('child_id', childId)
        .order('scheduled_date', { ascending: true });

      if (fetchError) throw fetchError;

      // Generar calendario completo basado en esquema nacional
      const schedule = generateVaccinationSchedule(data || []);
      setVaccinations(schedule);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  const generateVaccinationSchedule = (administered: any[]) => {
    const schedule: VaccineScheduleItem[] = [];

    ECUADOR_VACCINATION_SCHEMA.forEach((schemaItem) => {
      const scheduledDate = new Date();
      scheduledDate.setMonth(scheduledDate.getMonth() + schemaItem.age);

      schemaItem.vaccines.forEach((vaccineName) => {
        const administered_record = administered.find((a) => a.vaccine_name === vaccineName);

        schedule.push({
          id: `${vaccineName}-${schemaItem.age}`,
          vaccine_name: vaccineName,
          scheduled_age_months: schemaItem.age,
          scheduled_date: scheduledDate.toISOString().split('T')[0],
          administered_date: administered_record?.administered_date,
          status: determineStatus(
            schemaItem.age,
            ageMonths,
            administered_record?.administered_date
          ),
          batch_number: administered_record?.batch_number,
          adverse_effects: administered_record?.adverse_effects,
          administered_by: administered_record?.administered_by,
        });
      });
    });

    return schedule;
  };

  const determineStatus = (
    scheduledAge: number,
    currentAge: number,
    administeredDate?: string
  ): 'pending' | 'administered' | 'delayed' | 'not_needed' => {
    if (administeredDate) return 'administered';
    if (currentAge < scheduledAge - 1) return 'pending'; // No ha llegado la edad
    if (currentAge >= scheduledAge + 3) return 'delayed'; // Pasado + 3 meses
    return 'pending';
  };

  if (loading) return <div>Cargando calendario de vacunas...</div>;
  if (error) return <div className="text-red-500">Error: {error}</div>;

  // Agrupar por edad
  const groupedByAge = ECUADOR_VACCINATION_SCHEMA.reduce((acc, schema) => {
    acc[schema.age] = vaccinations.filter((v) => v.scheduled_age_months === schema.age);
    return acc;
  }, {} as { [key: number]: VaccineScheduleItem[] });

  const vaccinationStats = {
    total: vaccinations.length,
    administered: vaccinations.filter((v) => v.status === 'administered').length,
    pending: vaccinations.filter((v) => v.status === 'pending').length,
    delayed: vaccinations.filter((v) => v.status === 'delayed').length,
  };

  const completionPercentage = Math.round((vaccinationStats.administered / vaccinationStats.total) * 100);

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-4 gap-3">
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-gray-600">Total Vacunas</p>
            <p className="text-2xl font-bold">{vaccinationStats.total}</p>
          </CardContent>
        </Card>

        <Card className="bg-green-50 border-green-200">
          <CardContent className="pt-4">
            <p className="text-sm text-green-700">Administradas</p>
            <p className="text-2xl font-bold text-green-800">{vaccinationStats.administered}</p>
          </CardContent>
        </Card>

        <Card className="bg-yellow-50 border-yellow-200">
          <CardContent className="pt-4">
            <p className="text-sm text-yellow-700">Pendientes</p>
            <p className="text-2xl font-bold text-yellow-800">{vaccinationStats.pending}</p>
          </CardContent>
        </Card>

        <Card className="bg-red-50 border-red-200">
          <CardContent className="pt-4">
            <p className="text-sm text-red-700">Retrasadas</p>
            <p className="text-2xl font-bold text-red-800">{vaccinationStats.delayed}</p>
          </CardContent>
        </Card>
      </div>

      {/* Completion Progress */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <p className="font-medium">Esquema de Vacunación Completado</p>
              <p className="text-lg font-bold text-blue-600">{completionPercentage}%</p>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="h-3 rounded-full bg-blue-600 transition-all"
                style={{ width: `${completionPercentage}%` }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Alerts */}
      {vaccinationStats.delayed > 0 && (
        <Alert className="border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            ⚠️ {vaccinationStats.delayed} vacuna(s) retrasada(s). Por favor, agendar citas para completar el esquema.
          </AlertDescription>
        </Alert>
      )}

      {/* Vaccination Schedule by Age */}
      {Object.entries(groupedByAge).map(([ageStr, vaccines]) => {
        const age = parseInt(ageStr);
        const isUpcoming = ageMonths < age - 1;
        const isCurrent = ageMonths >= age - 1 && ageMonths < age + 2;
        const isPast = ageMonths >= age + 2;

        return (
          <Card
            key={age}
            className={`${
              isCurrent
                ? 'border-blue-300 bg-blue-50'
                : isUpcoming
                  ? 'border-gray-200'
                  : 'border-gray-200 opacity-75'
            }`}
          >
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5" />
                  <CardTitle className="text-base">
                    {age} meses de vida
                    {isCurrent && <Badge className="ml-2">Próxima</Badge>}
                    {isPast && <Badge variant="outline">Completada</Badge>}
                  </CardTitle>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {vaccines.map((vaccine) => (
                <div
                  key={vaccine.id}
                  className="flex items-center justify-between p-3 bg-white rounded-lg border hover:shadow-sm transition-shadow"
                >
                  <div className="flex items-center gap-3 flex-1">
                    {vaccine.status === 'administered' ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : vaccine.status === 'delayed' ? (
                      <AlertCircle className="h-5 w-5 text-red-600" />
                    ) : (
                      <Clock className="h-5 w-5 text-gray-400" />
                    )}

                    <div className="flex-1">
                      <p className="font-medium">{vaccine.vaccine_name}</p>
                      <p className="text-sm text-gray-600">
                        {VACCINE_DESCRIPTIONS[vaccine.vaccine_name]}
                      </p>

                      {vaccine.administrative_date && (
                        <p className="text-xs text-green-700 mt-1">
                          ✓ Administrada: {vaccine.administered_date}
                        </p>
                      )}

                      {vaccine.adverse_effects && vaccine.adverse_effects.length > 0 && (
                        <div className="text-xs text-yellow-700 mt-1">
                          ⚠️ Efectos: {vaccine.adverse_effects.join(', ')}
                        </div>
                      )}
                    </div>
                  </div>

                  <Badge className={VACCINE_COLORS[vaccine.vaccine_name]}>
                    {vaccine.status === 'administered'
                      ? 'Administrada'
                      : vaccine.status === 'delayed'
                        ? 'Retrasada'
                        : 'Pendiente'}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        );
      })}

      {/* Vaccination Record Card */}
      <Card className="bg-blue-50">
        <CardHeader>
          <CardTitle>Carné de Vacunación Digital</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-gray-700">
            Según el esquema nacional de vacunación de Ecuador. Las vacunas ayudan a proteger a tu hijo de enfermedades prevenibles.
          </p>

          <div className="grid grid-cols-2 gap-3">
            <Button variant="outline" className="w-full">
              📥 Descargar Carné
            </Button>
            <Button variant="outline" className="w-full">
              🖨️ Imprimir Carné
            </Button>
          </div>

          <div className="p-3 bg-white rounded-lg border border-blue-200">
            <p className="font-medium text-sm">Próxima cita recomendada:</p>
            {vaccinations.find((v) => v.status === 'pending') ? (
              <p className="text-sm mt-1">
                {vaccinations.find((v) => v.status === 'pending')?.vaccine_name} a los{' '}
                {vaccinations.find((v) => v.status === 'pending')?.scheduled_age_months} meses
              </p>
            ) : (
              <p className="text-sm mt-1 text-green-700">✓ Esquema completado</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default VaccinationSchedule;
