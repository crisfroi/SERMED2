import { NavLink, Outlet } from 'react-router-dom';

const links: { to: string; label: string; end?: boolean }[] = [
  { to: '/hosix/clinical', label: 'Resumen', end: true },
  { to: '/hosix/clinical/obstetricia', label: 'Obstetricia' },
  { to: '/hosix/clinical/pediatria', label: 'Pediatría / CRED' },
  { to: '/hosix/clinical/laboratorio', label: 'Laboratorio' },
  { to: '/hosix/clinical/farmacia', label: 'Farmacia' },
];

/**
 * Shell del área clínica: subnavegación + outlet para módulos ASIS (por fases).
 */
export const ClinicalLayout = () => {
  return (
    <div className="space-y-6 text-gray-800">
      <nav className="flex flex-wrap gap-2 border-b border-gray-200 pb-3">
        {links.map((l) => (
          <NavLink
            key={l.to}
            to={l.to}
            end={l.end}
            className={({ isActive }) =>
              `px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-gray-100'
              }`
            }
          >
            {l.label}
          </NavLink>
        ))}
      </nav>
      <Outlet />
    </div>
  );
};

export default ClinicalLayout;
