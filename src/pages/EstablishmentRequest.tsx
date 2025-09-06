import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useFileUpload } from '@/hooks/useFileUpload';
import { useCreateSolicitudEstablecimiento } from '@/hooks/useEstablecimientosSolicitudes';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useNacionalidades } from '@/hooks/useNacionalidades';
import { useDistritosSanitarios } from '@/hooks/useDistritosSanitarios';

const TIPO_ESTABLECIMIENTO_OPCIONES = [
  'HOSPITAL',
  'CLINICA',
  'CENTRO DE SALUD',
  'CONSULTORIO',
  'FARMACIA',
  'LABORATORIO',
];

const CATEGORIA_HOSPITAL = ['Regional', 'Provincial', 'Distrital'];

const SECTOR_OPCIONES = ['Público', 'Privado', 'Mixto'];

const SERVICIOS_LISTA = [
  'Consulta General', 'Urgencias', 'Hospitalización', 'Cirugía General', 'Pediatría', 'Ginecología y Obstetricia', 'Traumatología', 'Medicina Interna', 'Dermatología', 'Oftalmología', 'Odontología', 'Psicología', 'Laboratorio Clínico', 'Radiología', 'Farmacia', 'Vacunación', 'Fisioterapia', 'Rehabilitación', 'Diálisis', 'Cardiología', 'Neurología', 'Oncología', 'UCI', 'Anestesiología'
];

const ESPECIALIDADES_LISTA = [
  'Medicina General', 'Pediatría', 'Ginecología', 'Traumatología', 'Cardiología', 'Dermatología', 'Oftalmología', 'Otorrinolaringología', 'Neurología', 'Psiquiatría', 'Endocrinología', 'Gastroenterología', 'Nefrología', 'Neumología', 'Oncología', 'Anestesiología', 'Hematología', 'Reumatología', 'Infectología', 'Urología'
];

const EQUIPAMIENTO_LISTA = [
  'Microscopio', 'Rayos X', 'Agitadora', 'Centrífuga', 'Autoclave', 'Electrocardiógrafo', 'Ecógrafo', 'Respirador', 'Desfibrilador', 'Monitor Multiparámetro', 'Incubadora', 'Bomba de Infusión', 'Analizador Hematológico', 'Analizador Bioquímico', 'Lámpara Quirúrgica'
];

export default function EstablishmentRequest() {
  const { uploadFile, isUploading } = useFileUpload();
  const createMutation = useCreateSolicitudEstablecimiento();
  const { data: nacionalidades = [] } = useNacionalidades();
  const { data: distritosRows = [] } = useDistritosSanitarios();

  const provincias = useMemo(() => {
    const set = new Set<string>();
    (distritosRows || []).forEach((r: any) => r.nombre_provincia && set.add(r.nombre_provincia));
    return Array.from(set).sort();
  }, [distritosRows]);

  const distritosPorProvincia = useMemo(() => {
    const map = new Map<string, string[]>();
    (distritosRows || []).forEach((r: any) => {
      if (!r.nombre_provincia || !r.nombre_distrito) return;
      const arr = map.get(r.nombre_provincia) || [];
      if (!arr.includes(r.nombre_distrito)) arr.push(r.nombre_distrito);
      map.set(r.nombre_provincia, arr.sort());
    });
    return map;
  }, [distritosRows]);

  type FormState = {
    nombre_establecimiento: string;
    tipo_establecimiento: string;
    categoria: string;
    sector: string;
    provincia: string;
    distrito: string;
    direccion_completa: string;
    telefono: string;
    email_contacto: string;
    nombre_responsable: string;
    cargo_responsable: string;
    tipo_documento_responsable: 'DIP' | 'Pasaporte';
    documento_responsable: string;
    nacionalidad_responsable: string;
    nif: string;
    servicios_ofrecidos: string[];
    especialidades: string[];
    numero_camas: number | null;
    numero_consultorios: number | null;
    equipamiento_basico: string[];
    poblacion_beneficiada: number | null;
    documentos_adjuntos?: string[];
    distrito_sanitario?: string;
  };

  const [form, setForm] = useState<FormState>({
    nombre_establecimiento: '',
    tipo_establecimiento: 'CENTRO DE SALUD',
    categoria: 'Regional',
    sector: 'Público',
    provincia: '',
    distrito: '',
    direccion_completa: '',
    telefono: '+240',
    email_contacto: '',
    nombre_responsable: '',
    cargo_responsable: '',
    tipo_documento_responsable: 'DIP',
    documento_responsable: '',
    nacionalidad_responsable: 'Ecuatoguineana',
    nif: '',
    servicios_ofrecidos: [],
    especialidades: [],
    numero_camas: null,
    numero_consultorios: null,
    equipamiento_basico: [],
    poblacion_beneficiada: null,
    distrito_sanitario: '',
  });
  const [photos, setPhotos] = useState<File[]>([]);

  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    setPhotos(Array.from(files));
  };

  const toggleArrayValue = (key: 'servicios_ofrecidos' | 'especialidades' | 'equipamiento_basico', value: string) => {
    setForm((prev) => {
      const curr = new Set(prev[key]);
      if (curr.has(value)) curr.delete(value); else curr.add(value);
      return { ...prev, [key]: Array.from(curr) };
    });
  };

  const handleSubmit = async () => {
    const urls: string[] = [];
    for (const f of photos) {
      const path = `establecimientos/${Date.now()}-${f.name}`;
      const url = await uploadFile(f, 'documentos-pdf', path);
      if (url) urls.push(url);
    }

    const payload = {
      ...form,
      documentos_adjuntos: urls,
      justificacion: '',
    } as any;

    // Limpiar dependencias: si no es HOSPITAL, ignorar categoria; si es LABORATORIO, sin camas
    if (form.tipo_establecimiento !== 'HOSPITAL') payload.categoria = '';
    if (form.tipo_establecimiento === 'LABORATORIO') payload.numero_camas = null;
    if (form.tipo_establecimiento !== 'CONSULTORIO' && form.tipo_establecimiento !== 'CENTRO DE SALUD') payload.numero_consultorios = null;

    await createMutation.mutateAsync(payload);
    setPhotos([]);
    setForm((s) => ({ ...s, servicios_ofrecidos: [], especialidades: [], equipamiento_basico: [] }));
  };

  return (
    <div className="container mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>Solicitud de Alta de Establecimiento Sanitario</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Nombre del Establecimiento</Label>
              <Input className="hover:border-primary focus:ring-primary" name="nombre_establecimiento" value={form.nombre_establecimiento} onChange={(e) => setForm({ ...form, nombre_establecimiento: e.target.value })} />
            </div>
            <div>
              <Label>Tipo de Establecimiento</Label>
              <Select value={form.tipo_establecimiento} onValueChange={(v) => setForm({ ...form, tipo_establecimiento: v })}>
                <SelectTrigger className="hover:border-primary focus:ring-primary">
                  <SelectValue placeholder="Selecciona el tipo" />
                </SelectTrigger>
                <SelectContent>
                  {TIPO_ESTABLECIMIENTO_OPCIONES.map((o) => (
                    <SelectItem key={o} value={o}>{o}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {form.tipo_establecimiento === 'HOSPITAL' && (
              <div>
                <Label>Categoría</Label>
                <Select value={form.categoria} onValueChange={(v) => setForm({ ...form, categoria: v })}>
                  <SelectTrigger className="hover:border-primary focus:ring-primary">
                    <SelectValue placeholder="Selecciona la categoría" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIA_HOSPITAL.map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div>
              <Label>Sector</Label>
              <Select value={form.sector} onValueChange={(v) => setForm({ ...form, sector: v })}>
                <SelectTrigger className="hover:border-primary focus:ring-primary">
                  <SelectValue placeholder="Selecciona el sector" />
                </SelectTrigger>
                <SelectContent>
                  {SECTOR_OPCIONES.map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Provincia</Label>
              <Select value={form.provincia} onValueChange={(v) => setForm({ ...form, provincia: v, distrito: '' })}>
                <SelectTrigger className="hover:border-primary focus:ring-primary">
                  <SelectValue placeholder="Selecciona la provincia" />
                </SelectTrigger>
                <SelectContent>
                  {provincias.map((p) => (
                    <SelectItem key={p} value={p}>{p}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Distrito</Label>
              <Select value={form.distrito} onValueChange={(v) => setForm({ ...form, distrito: v })}>
                <SelectTrigger className="hover:border-primary focus:ring-primary">
                  <SelectValue placeholder="Selecciona el distrito" />
                </SelectTrigger>
                <SelectContent>
                  {(distritosPorProvincia.get(form.provincia) || []).map((d) => (
                    <SelectItem key={d} value={d}>{d}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Distrito Sanitario</Label>
              <Input className="hover:border-primary focus:ring-primary" value={form.distrito_sanitario || ''} onChange={(e) => setForm({ ...form, distrito_sanitario: e.target.value })} />
            </div>

            <div className="md:col-span-2">
              <Label>Dirección completa</Label>
              <Input className="hover:border-primary focus:ring-primary" value={form.direccion_completa} onChange={(e) => setForm({ ...form, direccion_completa: e.target.value })} />
            </div>
            <div>
              <Label>Teléfono</Label>
              <Input className="hover:border-primary focus:ring-primary" value={form.telefono} onChange={(e) => setForm({ ...form, telefono: e.target.value })} />
            </div>
            <div>
              <Label>Email de contacto</Label>
              <Input className="hover:border-primary focus:ring-primary" value={form.email_contacto} onChange={(e) => setForm({ ...form, email_contacto: e.target.value })} />
            </div>
            <div>
              <Label>Nombre del responsable</Label>
              <Input className="hover:border-primary focus:ring-primary" value={form.nombre_responsable} onChange={(e) => setForm({ ...form, nombre_responsable: e.target.value })} />
            </div>
            <div>
              <Label>Cargo del responsable</Label>
              <Input className="hover:border-primary focus:ring-primary" value={form.cargo_responsable} onChange={(e) => setForm({ ...form, cargo_responsable: e.target.value })} />
            </div>

            <div>
              <Label>Tipo de Documento del responsable</Label>
              <Select value={form.tipo_documento_responsable} onValueChange={(v: 'DIP' | 'Pasaporte') => setForm({ ...form, tipo_documento_responsable: v })}>
                <SelectTrigger className="hover:border-primary focus:ring-primary">
                  <SelectValue placeholder="Selecciona el tipo de documento" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DIP">DIP</SelectItem>
                  <SelectItem value="Pasaporte">Pasaporte</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Número de Documento</Label>
              <Input className="hover:border-primary focus:ring-primary" value={form.documento_responsable} onChange={(e) => setForm({ ...form, documento_responsable: e.target.value })} />
            </div>

            <div>
              <Label>Nacionalidad del responsable</Label>
              <Select value={form.nacionalidad_responsable} onValueChange={(v) => setForm({ ...form, nacionalidad_responsable: v })}>
                <SelectTrigger className="hover:border-primary focus:ring-primary">
                  <SelectValue placeholder="Selecciona nacionalidad" />
                </SelectTrigger>
                <SelectContent>
                  {nacionalidades.map((n: any) => (
                    <SelectItem key={n.id || n.nacionalidad} value={n.nacionalidad}>{n.nacionalidad}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Número de Identificación Fiscal (NIF)</Label>
              <Input className="hover:border-primary focus:ring-primary" value={form.nif} onChange={(e) => setForm({ ...form, nif: e.target.value })} />
            </div>

            {(form.tipo_establecimiento === 'HOSPITAL' || form.tipo_establecimiento === 'CLINICA' || form.tipo_establecimiento === 'CENTRO DE SALUD' || form.tipo_establecimiento === 'CONSULTORIO') && (
              <div>
                <Label>Número de camas</Label>
                <Input className="hover:border-primary focus:ring-primary" type="number" value={form.numero_camas ?? ''} onChange={(e) => setForm({ ...form, numero_camas: e.target.value ? Number(e.target.value) : null })} />
              </div>
            )}

            {(form.tipo_establecimiento === 'CONSULTORIO' || form.tipo_establecimiento === 'CENTRO DE SALUD') && (
              <div>
                <Label>Número de consultorios</Label>
                <Input className="hover:border-primary focus:ring-primary" type="number" value={form.numero_consultorios ?? ''} onChange={(e) => setForm({ ...form, numero_consultorios: e.target.value ? Number(e.target.value) : null })} />
              </div>
            )}

            <div className="md:col-span-2">
              <Label>Servicios ofrecidos</Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 mt-2">
                {SERVICIOS_LISTA.map((s) => (
                  <label key={s} className="flex items-center space-x-2 rounded border p-2 hover:border-primary">
                    <Checkbox checked={form.servicios_ofrecidos.includes(s)} onCheckedChange={() => toggleArrayValue('servicios_ofrecidos', s)} />
                    <span className="text-sm">{s}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="md:col-span-2">
              <Label>Especialidades</Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 mt-2">
                {ESPECIALIDADES_LISTA.map((s) => (
                  <label key={s} className="flex items-center space-x-2 rounded border p-2 hover:border-primary">
                    <Checkbox checked={form.especialidades.includes(s)} onCheckedChange={() => toggleArrayValue('especialidades', s)} />
                    <span className="text-sm">{s}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="md:col-span-2">
              <Label>Equipamiento básico</Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 mt-2">
                {EQUIPAMIENTO_LISTA.map((s) => (
                  <label key={s} className="flex items-center space-x-2 rounded border p-2 hover:border-primary">
                    <Checkbox checked={form.equipamiento_basico.includes(s)} onCheckedChange={() => toggleArrayValue('equipamiento_basico', s)} />
                    <span className="text-sm">{s}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <Label>Población beneficiada</Label>
              <Input className="hover:border-primary focus:ring-primary" type="number" value={form.poblacion_beneficiada ?? ''} onChange={(e) => setForm({ ...form, poblacion_beneficiada: e.target.value ? Number(e.target.value) : null })} />
            </div>

            <div className="md:col-span-2">
              <Label>Fotos del establecimiento</Label>
              <Input className="hover:border-primary focus:ring-primary" type="file" multiple onChange={(e) => handleFiles(e.target.files)} />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() =>
                setForm({
                  nombre_establecimiento: '',
                  tipo_establecimiento: 'CENTRO DE SALUD',
                  categoria: 'Regional',
                  sector: 'Público',
                  provincia: '',
                  distrito: '',
                  direccion_completa: '',
                  telefono: '+240',
                  email_contacto: '',
                  nombre_responsable: '',
                  cargo_responsable: '',
                  tipo_documento_responsable: 'DIP',
                  documento_responsable: '',
                  nacionalidad_responsable: 'Ecuatoguineana',
                  nif: '',
                  servicios_ofrecidos: [],
                  especialidades: [],
                  numero_camas: null,
                  numero_consultorios: null,
                  equipamiento_basico: [],
                  poblacion_beneficiada: null,
                  distrito_sanitario: '',
                })
              }
            >
              Limpiar
            </Button>
            <Button onClick={handleSubmit} disabled={createMutation.isPending || isUploading}>Enviar Solicitud</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
