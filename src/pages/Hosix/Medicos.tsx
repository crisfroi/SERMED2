import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Stethoscope, ClipboardList, FileText, Pill, MessageSquare } from 'lucide-react';
import WorklistMedico from '@/components/hosix/medicos/WorklistMedico';
import ConsultaMedica from '@/components/hosix/medicos/ConsultaMedica';
import Prescripcion from '@/components/hosix/medicos/Prescripcion';
import Interconsultas from '@/components/hosix/medicos/Interconsultas';

export default function Medicos() {
  const [selectedPaciente, setSelectedPaciente] = useState<{
    pacienteId: string;
    episodioId?: string;
    tipoEpisodio?: string;
    worklistId?: string;
  } | null>(null);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Stethoscope className="h-8 w-8 text-blue-600" />
        <div>
          <h1 className="text-3xl font-bold">Módulo de Médicos</h1>
          <p className="text-gray-600">Gestión de consultas, prescripciones e interconsultas médicas</p>
        </div>
      </div>

      <Tabs defaultValue="worklist" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="worklist" className="flex items-center gap-2">
            <ClipboardList className="h-4 w-4" />
            Worklist
          </TabsTrigger>
          <TabsTrigger value="consulta" className="flex items-center gap-2">
            <Stethoscope className="h-4 w-4" />
            Consulta
          </TabsTrigger>
          <TabsTrigger value="prescripcion" className="flex items-center gap-2">
            <Pill className="h-4 w-4" />
            Prescripción
          </TabsTrigger>
          <TabsTrigger value="interconsultas" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Interconsultas
          </TabsTrigger>
        </TabsList>

        <TabsContent value="worklist" className="space-y-4">
          <WorklistMedico />
        </TabsContent>

        <TabsContent value="consulta" className="space-y-4">
          {selectedPaciente ? (
            <ConsultaMedica
              pacienteId={selectedPaciente.pacienteId}
              episodioId={selectedPaciente.episodioId}
              tipoEpisodio={selectedPaciente.tipoEpisodio}
              worklistId={selectedPaciente.worklistId}
            />
          ) : (
            <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed rounded-lg">
              <Stethoscope className="h-12 w-12 text-gray-400 mb-4" />
              <p className="text-gray-500 text-lg mb-2">Seleccione un paciente</p>
              <p className="text-gray-400 text-sm">
                Para realizar una consulta, seleccione un paciente desde el Worklist
              </p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="prescripcion" className="space-y-4">
          {selectedPaciente ? (
            <Prescripcion
              pacienteId={selectedPaciente.pacienteId}
              episodioId={selectedPaciente.episodioId}
              tipoEpisodio={selectedPaciente.tipoEpisodio}
              worklistId={selectedPaciente.worklistId}
            />
          ) : (
            <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed rounded-lg">
              <Pill className="h-12 w-12 text-gray-400 mb-4" />
              <p className="text-gray-500 text-lg mb-2">Seleccione un paciente</p>
              <p className="text-gray-400 text-sm">
                Para prescribir medicamentos, seleccione un paciente desde el Worklist
              </p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="interconsultas" className="space-y-4">
          {selectedPaciente ? (
            <Interconsultas
              pacienteId={selectedPaciente.pacienteId}
              episodioId={selectedPaciente.episodioId}
              tipoEpisodio={selectedPaciente.tipoEpisodio}
              worklistId={selectedPaciente.worklistId}
            />
          ) : (
            <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed rounded-lg">
              <MessageSquare className="h-12 w-12 text-gray-400 mb-4" />
              <p className="text-gray-500 text-lg mb-2">Seleccione un paciente</p>
              <p className="text-gray-400 text-sm">
                Para gestionar interconsultas, seleccione un paciente desde el Worklist
              </p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

