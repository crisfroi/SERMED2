// @ts-nocheck
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Baby, FlaskConical, Pill, Stethoscope, Syringe,
  Apple, Scissors, FileText, Users, Clock, Activity
} from 'lucide-react';
import { Link } from 'react-router-dom';

const modules = [
  { label: 'Obstetricia', icon: Baby, path: '/hosix/obstetricia', color: 'text-pink-600', desc: 'Gestación, parto, postparto' },
  { label: 'CRED', icon: Activity, path: '/hosix/cred', color: 'text-blue-600', desc: 'Control desarrollo infantil' },
  { label: 'Cirugía', icon: Scissors, path: '/hosix/cirugia', color: 'text-red-600', desc: 'Quirófanos y procedimientos' },
  { label: 'Laboratorio', icon: FlaskConical, path: '/hosix/laboratorio', color: 'text-emerald-600', desc: 'Órdenes y resultados' },
  { label: 'Farmacia', icon: Pill, path: '/hosix/farmacia', color: 'text-orange-600', desc: 'Inventario y dispensación' },
  { label: 'Diagnóstico', icon: Stethoscope, path: '/hosix/diagnostico', color: 'text-purple-600', desc: 'ICD-10, comorbilidad' },
  { label: 'Inmunización', icon: Syringe, path: '/hosix/inmunizacion', color: 'text-teal-600', desc: 'Vacunas y calendarios' },
  { label: 'Dietética', icon: Apple, path: '/hosix/dietetica', color: 'text-green-600', desc: 'Nutrición y planes' },
  { label: 'Historia Clínica', icon: FileText, path: '/hosix/ehr', color: 'text-indigo-600', desc: 'HME electrónica' },
  { label: 'Recursos Humanos', icon: Users, path: '/hosix/rrhh', color: 'text-amber-600', desc: 'Personal y turnos' },
  { label: 'Salas de Espera', icon: Clock, path: '/hosix/salas-espera', color: 'text-cyan-600', desc: 'Colas y gestión' },
];

const HospitalDashboard: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard — Sistema Hospitalario</h1>
        <p className="text-muted-foreground">
          Sistema integrado de gestión clínica basado en GNU Health / Thalamus
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {modules.map((mod) => (
          <Link key={mod.path} to={mod.path}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-3">
                  <mod.icon className={`h-8 w-8 ${mod.color}`} />
                  <CardTitle className="text-base">{mod.label}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{mod.desc}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default HospitalDashboard;
