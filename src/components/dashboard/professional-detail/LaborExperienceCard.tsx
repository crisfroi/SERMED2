import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Briefcase } from "lucide-react";
import type { Profesional } from "@/hooks/useProfesionales";

interface LaborExperienceCardProps {
  professional: Profesional;
}

export const LaborExperienceCard = ({ professional }: LaborExperienceCardProps) => {
  const experiencias = (professional.experiencia_laboral as any[]) || [];

  if (experiencias.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-sm">
            <Briefcase className="w-4 h-4" />
            <span>Experiencia Laboral</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-gray-500">Sin experiencia laboral registrada</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2 text-sm">
          <Briefcase className="w-4 h-4" />
          <span>Experiencia Laboral</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {experiencias.map((exp: any, idx: number) => (
          <div key={idx} className="border-l-2 border-blue-400 pl-3 py-2">
            <div className="text-xs space-y-1">
              {exp.funcion && (
                <p>
                  <span className="font-semibold">Función:</span> {exp.funcion}
                </p>
              )}
              {exp.institucion && (
                <p>
                  <span className="font-semibold">Institución:</span> {exp.institucion}
                </p>
              )}
              {exp.periodo && (
                <p>
                  <span className="font-semibold">Período:</span> {exp.periodo}
                </p>
              )}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};
