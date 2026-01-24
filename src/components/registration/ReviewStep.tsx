import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Edit2, Check, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface ReviewStepProps {
  formData: any;
  onEdit: (step: number) => void;
  onSubmit: () => void;
  isSubmitting: boolean;
  errorMessage?: string;
}

export const ReviewStep: React.FC<ReviewStepProps> = ({
  formData,
  onEdit,
  onSubmit,
  isSubmitting,
  errorMessage,
}) => {
  const [expandedSections, setExpandedSections] = useState<{ [key: string]: boolean }>({
    personal: true,
    domicilio: true,
    formacion: true,
    laboral: true,
    experiencia: true,
  });

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const SectionHeader = ({ title, section }: { title: string; section: string }) => (
    <button
      onClick={() => toggleSection(section)}
      className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 mb-3 transition-colors"
    >
      <h3 className="font-semibold text-gray-900">{title}</h3>
      <div className="flex items-center gap-2">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onEdit(section === 'personal' ? 1 : section === 'domicilio' ? 2 : section === 'formacion' ? 3 : section === 'laboral' ? 4 : 5);
          }}
          className="p-1.5 hover:bg-blue-100 rounded text-blue-600 transition-colors"
          title="Editar"
        >
          <Edit2 className="w-4 h-4" />
        </button>
        <span className="text-gray-500">
          {expandedSections[section] ? '▼' : '▶'}
        </span>
      </div>
    </button>
  );

  const DataRow = ({ label, value, colspan = 1 }: any) => (
    <div className="grid grid-cols-2 gap-4 py-2 border-b border-gray-100 last:border-b-0">
      <span className="text-sm font-medium text-gray-600">{label}:</span>
      <span className="text-sm text-gray-900">{value || '—'}</span>
    </div>
  );

  return (
    <div className="space-y-6">
      {errorMessage && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      )}

      {/* Datos Personales */}
      <div>
        <SectionHeader title="Datos Personales" section="personal" />
        {expandedSections.personal && (
          <Card className="border-gray-200">
            <CardContent className="pt-6">
              <div className="space-y-2">
                <DataRow label="Nombre Completo" value={`${formData.nombre} ${formData.apellidos}`} />
                <DataRow label="Género" value={formData.genero} />
                <DataRow label="Fecha de Nacimiento" value={formData.fecha_nacimiento} />
                <DataRow label="Nacionalidad" value={formData.nacionalidad} />
                <DataRow label="Número DIP" value={formData.numero_dip} />
                <DataRow label="Número Pasaporte" value={formData.numero_pasaporte} />
                <DataRow label="Teléfono" value={formData.telefono} />
                <DataRow label="Email" value={formData.email} />
                <DataRow label="Número Tarjeta RFID" value={formData.numero_tarjeta_rfid} />
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Domicilio */}
      <div>
        <SectionHeader title="Domicilio" section="domicilio" />
        {expandedSections.domicilio && (
          <Card className="border-gray-200">
            <CardContent className="pt-6">
              <div className="space-y-2">
                <DataRow label="Domicilio" value={formData.domicilio} />
                <DataRow label="Provincia" value={formData.provincia} />
                <DataRow label="Distrito" value={formData.distrito} />
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Formación */}
      <div>
        <SectionHeader title="Formación Académica" section="formacion" />
        {expandedSections.formacion && (
          <Card className="border-gray-200">
            <CardContent className="pt-6">
              <div className="space-y-2">
                <DataRow label="Área Profesional" value={formData.area_profesional} />
                <DataRow label="Especialidad" value={formData.especialidad} />
                <DataRow label="Categoría de Titulación" value={formData.categoria_titulacion} />
                <DataRow label="Titulación Específica" value={formData.titulacion_especifica_1} />
                <DataRow label="Institución" value={formData.institucion_1} />
                <DataRow label="País de Formación" value={formData.pais_formacion_1} />
                <DataRow label="Período de Formación" value={formData.periodo_formacion} />
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Situación Laboral */}
      <div>
        <SectionHeader title="Situación Laboral" section="laboral" />
        {expandedSections.laboral && (
          <Card className="border-gray-200">
            <CardContent className="pt-6">
              <div className="space-y-2">
                <DataRow label="Situación Laboral" value={formData.situacion_laboral} />
                <DataRow label="Centro de Trabajo" value={formData.nombre_centro} />
                <DataRow label="Categoría del Centro" value={formData.categoria_centro} />
                <DataRow label="Tipo de Sector" value={formData.tipo_sector} />
                <DataRow label="Distrito Sanitario" value={formData.distrito_sanitario} />
                <DataRow label="Tipo de Profesional" value={formData.tipo_profesional} />
                <DataRow label="Función Pública" value={formData.funcion_publica ? 'Sí' : 'No'} />
                {formData.funcion_publica && (
                  <>
                    <DataRow label="Estatus de Funcionario" value={formData.funcionario_estatus} />
                    <DataRow label="Número de Funcionario" value={formData.numero_funcionario} />
                    <DataRow label="Fecha de Nombramiento" value={formData.fecha_nombramiento} />
                    <DataRow label="Fecha de Inicio de Trabajo" value={formData.fecha_inicio_trabajo} />
                  </>
                )}
                <DataRow label="Brigada Médica" value={formData.pertenece_brigada_medica ? 'Sí' : 'No'} />
                {formData.pertenece_brigada_medica && (
                  <DataRow label="Tipo de Cooperación" value={formData.tipo_cooperacion} />
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Experiencia Laboral */}
      {formData.experiencia_laboral && formData.experiencia_laboral.length > 0 && (
        <div>
          <SectionHeader title="Experiencia Laboral" section="experiencia" />
          {expandedSections.experiencia && (
            <Card className="border-gray-200">
              <CardContent className="pt-6">
                <div className="space-y-4">
                  {formData.experiencia_laboral.map((exp: any, idx: number) => (
                    <div key={idx} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <h4 className="font-semibold text-gray-900 mb-2">Experiencia #{idx + 1}</h4>
                      <div className="space-y-2">
                        <DataRow label="Función/Puesto" value={exp.funcion} />
                        <DataRow label="Institución" value={exp.institucion} />
                        <DataRow label="Período" value={exp.periodo} />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Código de Expediente y Código de Barras */}
      {formData.codigo_expediente && (
        <Card className="border-guinea-teal bg-guinea-teal/5">
          <CardHeader>
            <CardTitle className="text-guinea-teal flex items-center gap-2">
              <Check className="w-5 h-5" />
              Información del Expediente
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-2">Código de Expediente</p>
                <p className="text-2xl font-mono font-bold text-guinea-teal">{formData.codigo_expediente}</p>
              </div>
              {formData.codigo_barras_base64 && (
                <div className="text-center">
                  <p className="text-sm text-gray-600 mb-2">Código de Barras</p>
                  <img 
                    src={formData.codigo_barras_base64} 
                    alt="Código de barras"
                    className="mx-auto h-12 object-contain"
                  />
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Botones de acción */}
      <Card className="border-gray-200 bg-gray-50">
        <CardContent className="pt-6">
          <div className="flex gap-3 justify-center">
            <Button
              type="button"
              variant="outline"
              onClick={() => onEdit(1)}
              disabled={isSubmitting}
            >
              Volver a Editar
            </Button>
            <Button
              type="button"
              onClick={onSubmit}
              disabled={isSubmitting}
              className="bg-guinea-teal hover:bg-guinea-teal/90"
            >
              {isSubmitting ? 'Enviando...' : '✓ Confirmar y Enviar Solicitud'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
