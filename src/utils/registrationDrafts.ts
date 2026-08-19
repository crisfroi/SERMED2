// Persistencia de borradores por tipo de trámite.
// Cada tipo de solicitud conserva su propio progreso; al salir se puede guardar o limpiar.

export type DraftScope = "professional" | "establishment";

const CONFIG: Record<DraftScope, { typeKey: string; dataKeys: string[] }> = {
  professional: {
    typeKey: "professional_request_type",
    dataKeys: ["professional_registration_form_data"],
  },
  establishment: {
    typeKey: "establishment_request_type",
    dataKeys: ["establishment_registration_form_data"],
  },
};

const nsKey = (key: string, tipo: string) => `${key}__${tipo}`;

export const getRequestType = (scope: DraftScope) =>
  localStorage.getItem(CONFIG[scope].typeKey);

/** Activa un tipo de trámite y restaura su borrador (si existe) al espacio de trabajo activo. */
export const activateRequestType = (scope: DraftScope, tipo: string) => {
  const { typeKey, dataKeys } = CONFIG[scope];
  localStorage.setItem(typeKey, tipo);
  dataKeys.forEach((key) => {
    const saved = localStorage.getItem(nsKey(key, tipo));
    if (saved) localStorage.setItem(key, saved);
    else localStorage.removeItem(key);
  });
};

/** Guarda el progreso actual en el espacio del tipo de trámite indicado. */
export const saveProgress = (scope: DraftScope, tipo?: string | null) => {
  const { dataKeys } = CONFIG[scope];
  const target = tipo || getRequestType(scope);
  if (!target) return;
  dataKeys.forEach((key) => {
    const current = localStorage.getItem(key);
    if (current) localStorage.setItem(nsKey(key, target), current);
  });
};

/** Elimina el progreso del tipo indicado (o de todos los tipos) y el espacio activo. */
export const clearProgress = (scope: DraftScope, tipo?: string | null) => {
  const { typeKey, dataKeys } = CONFIG[scope];
  const target = tipo || getRequestType(scope);
  dataKeys.forEach((key) => {
    localStorage.removeItem(key);
    if (target) localStorage.removeItem(nsKey(key, target));
  });
  localStorage.removeItem(typeKey);
};

/** Sale del trámite activo sin borrar nada guardado por tipo. */
export const releaseActiveType = (scope: DraftScope) => {
  const { typeKey, dataKeys } = CONFIG[scope];
  localStorage.removeItem(typeKey);
  dataKeys.forEach((key) => localStorage.removeItem(key));
};

export const hasProgress = (scope: DraftScope, tipo: string) =>
  CONFIG[scope].dataKeys.some((key) => !!localStorage.getItem(nsKey(key, tipo)));
