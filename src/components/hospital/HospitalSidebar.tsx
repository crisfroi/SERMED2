import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, Baby, HeartPulse, FlaskConical, Pill,
  Stethoscope, Syringe, Apple, Scissors, Brain,
  FileText, ClipboardList, Users, Clock, Activity,
  Image, BookOpen
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface HospitalSidebarProps {
  isOpen: boolean;
}

const menuSections = [
  {
    title: 'General',
    items: [
      { path: '/hosix', label: 'Dashboard', icon: LayoutDashboard, end: true },
      { path: '/hosix/ehr', label: 'Historia Clínica (HME)', icon: FileText },
    ],
  },
  {
    title: 'Módulos Clínicos',
    items: [
      { path: '/hosix/obstetricia', label: 'Obstetricia (ASIS 4)', icon: Baby },
      { path: '/hosix/cred', label: 'CRED (ASIS 5)', icon: HeartPulse },
      { path: '/hosix/cirugia', label: 'Cirugía (ASIS 7)', icon: Scissors },
      { path: '/hosix/dietetica', label: 'Dietética (ASIS 8)', icon: Apple },
      { path: '/hosix/inmunizacion', label: 'Inmunización (ASIS 8)', icon: Syringe },
      { path: '/hosix/laboratorio', label: 'Laboratorio (ASIS 8/10)', icon: FlaskConical },
      { path: '/hosix/farmacia', label: 'Farmacia (ASIS 9)', icon: Pill },
      { path: '/hosix/medicamentos', label: 'Medicamentos (ASIS 10)', icon: Pill },
      { path: '/hosix/referencia', label: 'Referencia (ASIS 11)', icon: ClipboardList },
      { path: '/hosix/farmacoterapia', label: 'Farmacoterapia (ASIS 12)', icon: Activity },
      { path: '/hosix/diagnostico', label: 'Diagnóstico (ASIS 14)', icon: Stethoscope },
      { path: '/hosix/imagenes', label: 'Imágenes (ASIS 15)', icon: Image },
    ],
  },
  {
    title: 'Administración',
    items: [
      { path: '/hosix/rrhh', label: 'Recursos Humanos', icon: Users },
      { path: '/hosix/salas-espera', label: 'Salas de Espera', icon: Clock },
    ],
  },
];

const HospitalSidebar: React.FC<HospitalSidebarProps> = ({ isOpen }) => {
  if (!isOpen) return null;

  return (
    <aside className="w-64 bg-card border-r border-border overflow-y-auto">
      <div className="p-4">
        <div className="flex items-center gap-2 mb-6">
          <img
            src="https://cdn.builder.io/api/v1/image/assets%2F696aeb7245c24fa8957a85fb78836206%2F9f0f84e2fe5c4ac7bf20d675db3ea3cc?format=webp&width=200"
            alt="Logo"
            className="h-8 w-auto"
          />
          <span className="font-bold text-foreground text-sm">HOSIX</span>
        </div>

        {menuSections.map((section) => (
          <div key={section.title} className="mb-4">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-2">
              {section.title}
            </h3>
            <nav className="space-y-1">
              {section.items.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.end}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-2 px-2 py-1.5 rounded-md text-sm transition-colors',
                      isActive
                        ? 'bg-primary/10 text-primary font-medium'
                        : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                    )
                  }
                >
                  <item.icon className="h-4 w-4 shrink-0" />
                  <span className="truncate">{item.label}</span>
                </NavLink>
              ))}
            </nav>
          </div>
        ))}
      </div>
    </aside>
  );
};

export default HospitalSidebar;
