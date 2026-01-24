import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, User } from 'lucide-react';

interface PDFSummaryProps {
  formData: any;
}

const PDFSummary = ({ formData }: PDFSummaryProps) => {
  const barcodeSrc =
    formData?.codigo_barras_base64 ||
    formData?.url_codigo_barras ||
    null;

  return (
    <div className="space-y-2">
      <div className="bg-white p-4 space-y-3" style={{ minHeight: '297mm' }}>
        {/* Encabezado oficial */}
        <div className="text-center border-b-2 border-gray-300 pb-3 mb-3">
          <h1 className="text-lg font-bold text-guinea-teal mb-0.5 uppercase">
            Ministerio de Sanidad y Bienestar Social
          </h1>
          <h2 className="text-sm font-semibold text-gray-700 mb-0.5">
            REPÚBLICA DE GUINEA ECUATORIAL
          </h2>
          <h3 className="text-xs font-medium text-gray-600 uppercase">
            Solicitud de Acreditación Profesional Sanitaria
          </h3>
          {formData.codigo_expediente && (
            <div className="mt-2">
              <p className="text-xs font-medium text-gray-600 mb-0.5">
                Código de Expediente: <span className="font-bold">{formData.codigo_expediente}</span>
              </p>
            </div>
          )}
        </div>

        {/* Layout: Foto + Datos personales + Código de barras */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
          {/* Columna Izquierda: Foto y Código de Barras */}
          <div className="flex flex-col items-center space-y-4">
            {formData.foto_carnet_base64 && (
              <div className="w-24 h-32 border-2 border-gray-300 rounded overflow-hidden shadow-sm">
                <img
                  src={formData.foto_carnet_base64}
                  alt="Foto carnet"
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            
            {/* CÓDIGO DE BARRAS DINÁMICO (316x69 Adaptable) */}
            {barcodeSrc && (
              <div className="flex flex-col items-center w-full px-2">
                <img
                  src={barcodeSrc}
                  alt={`Código de Barras: ${formData.codigo_expediente}`}
                  // Ajustado a 150px de ancho en el documento para que quepa bien, 
                  // la Edge Function se encarga de la nitidez
                  style={{ width: '150px', height: '33px' }}
                  className="mb-1 object-contain"
                  crossOrigin="anonymous" 
                />
                <p className="text-[9px] text-gray-500 font-mono tracking-widest text-center uppercase">
                  Verificación Oficial
                </p>
              </div>
            )}
          </div>

          {/* Datos personales básicos */}
          <div className="md:col-span-2 space-y-1.5 border-l border-gray-100 pl-4">
            <h4 className="font-semibold text-sm text-gray-800 border-b pb-1 mb-2">Datos Personales</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-1.5 text-[11px]">
              <div><span className="text-gray-500">Nombre completo:</span> <p className="font-medium">{formData.nombre} {formData.apellidos}</p></div>
              <div><span className="text-gray-500">Género:</span> <p className="font-medium">{formData.genero}</p></div>
              <div><span className="text-gray-500">Fecha de nacimiento:</span> <p className="font-medium">{formData.fecha_nacimiento}</p></div>
              <div><span className="text-gray-500">Edad:</span> <p className="font-medium">{formData.edad} años</p></div>
              <div><span className="text-gray-500">Nacionalidad:</span> <p className="font-medium">{formData.nacionalidad}</p></div>
              <div><span className="text-gray-500">Teléfono:</span> <p className="font-medium">{formData.telefono}</p></div>
              {formData.numero_dip && <div><span className="text-gray-500">Número DIP:</span> <p className="font-medium">{formData.numero_dip}</p></div>}
              {formData.numero_pasaporte && <div><span className="text-gray-500">Número Pasaporte:</span> <p className="font-medium">{formData.numero_pasaporte}</p></div>}
            </div>
          </div>
        </div>

        {/* Información de domicilio */}
        <Card className="mb-2 shadow-none border-gray-200">
          <CardHeader className="py-2 px-3 bg-gray-50/50">
            <CardTitle className="text-xs font-bold uppercase text-gray-700">Información de Domicilio</CardTitle>
          </CardHeader>
          <CardContent className="pt-2 px-3 pb-3">
            <div className="grid grid-cols-3 gap-2 text-[11px]">
              <div><span className="text-gray-500">Domicilio:</span> <p>{formData.domicilio}</p></div>
              <div><span className="text-gray-500">Provincia:</span> <p>{formData.provincia}</p></div>
              <div><span className="text-gray-500">Distrito:</span> <p>{formData.distrito}</p></div>
            </div>
          </CardContent>
        </Card>

        {/* Información profesional */}
        <Card className="mb-2 shadow-none border-gray-200">
          <CardHeader className="py-2 px-3 bg-gray-50/50">
            <CardTitle className="text-xs font-bold uppercase text-gray-700">Información Profesional</CardTitle>
          </CardHeader>
          <CardContent className="pt-2 px-3 pb-3">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-[11px]">
              <div><span className="text-gray-500">Área profesional:</span> <p className="font-medium">{formData.area_profesional}</p></div>
              {formData.especialidad && <div><span className="text-gray-500">Especialidad:</span> <p className="font-medium">{formData.especialidad}</p></div>}
              <div><span className="text-gray-500">Categoría titulación:</span> <p className="font-medium text-guinea-teal">{formData.categoria_titulacion}</p></div>
              <div><span className="text-gray-500">Titulación:</span> <p className="font-medium">{formData.titulacion_especifica_1}</p></div>
            </div>
          </CardContent>
        </Card>

        {/* Información laboral */}
        <Card className="mb-2 shadow-none border-gray-200">
          <CardHeader className="py-2 px-3 bg-gray-50/50">
            <CardTitle className="text-xs font-bold uppercase text-gray-700">Información Laboral</CardTitle>
          </CardHeader>
          <CardContent className="pt-2 px-3 pb-3">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-[11px]">
              <div><span className="text-gray-500">Situación laboral:</span> <p>{formData.situacion_laboral}</p></div>
              <div><span className="text-gray-500">Centro de trabajo:</span> <p>{formData.nombre_centro}</p></div>
              <div><span className="text-gray-500">Tipo sector:</span> <p>{formData.tipo_sector}</p></div>
              {formData.funcion_publica && (
                <div className="col-span-2 border-t pt-2 mt-1 grid grid-cols-3 gap-2">
                  <div><span className="text-gray-500">Función pública:</span> <p>Sí</p></div>
                  {formData.numero_funcionario && <div><span className="text-gray-500">Nº Funcionario:</span> <p>{formData.numero_funcionario}</p></div>}
                  {formData.estatus_funcionario && <div><span className="text-gray-500">Estatus:</span> <p className="capitalize">{formData.estatus_funcionario.replace('_', ' ')}</p></div>}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Experiencia Laboral */}
        {formData.experiencia_laboral && formData.experiencia_laboral.length > 0 && (
          <Card className="mb-2 shadow-none border-gray-200">
            <CardHeader className="py-2 px-3 bg-gray-50/50">
              <CardTitle className="text-xs font-bold uppercase text-gray-700">Experiencia Laboral</CardTitle>
            </CardHeader>
            <CardContent className="pt-2 px-3 pb-3">
              <div className="space-y-2">
                {formData.experiencia_laboral.map((exp: any, idx: number) => (
                  <div key={idx} className="border-b border-gray-100 pb-2 last:border-b-0">
                    <p className="text-[10px] font-semibold text-gray-700 mb-1">Experiencia #{idx + 1}</p>
                    <div className="grid grid-cols-3 gap-2 text-[10px]">
                      {exp.funcion && <div><span className="text-gray-500">Función:</span> <p>{exp.funcion}</p></div>}
                      {exp.institucion && <div><span className="text-gray-500">Institución:</span> <p>{exp.institucion}</p></div>}
                      {exp.periodo && <div><span className="text-gray-500">Período:</span> <p>{exp.periodo}</p></div>}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Fecha y firma */}
        <div className="mt-auto pt-8 border-t border-gray-200">
          <div className="flex justify-between items-end">
            <div className="space-y-1">
              <p className="text-[11px]"><strong>Fecha de solicitud:</strong> {new Date().toLocaleDateString('es-ES')}</p>
              <p className="text-[10px] text-gray-400 font-mono">ID VALIDACIÓN: {formData.codigo_expediente?.split('-')[0] || 'N/A'}</p>
            </div>
            <div className="text-center">
              <div className="border-t border-gray-400 w-48 mb-1"></div>
              <p className="text-[11px] font-medium text-gray-700">Firma del solicitante</p>
              <p className="text-[9px] text-gray-400">DNI / DIP: {formData.numero_dip || '__________'}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PDFSummary;
