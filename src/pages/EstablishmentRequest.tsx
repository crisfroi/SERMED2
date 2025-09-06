import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useFileUpload } from '@/hooks/useFileUpload';
import { useCreateSolicitudEstablecimiento } from '@/hooks/useEstablecimientosSolicitudes';
import { useAuth } from '@/contexts/AuthContext';

export default function EstablishmentRequest() {
  const { uploadFile, isUploading } = useFileUpload();
  const createMutation = useCreateSolicitudEstablecimiento();
  const { user } = useAuth();

  const [form, setForm] = useState({
    nombre_establecimiento: '',
    tipo_establecimiento: 'Centro de Salud',
    categoria: 'Regional',
    sector: 'Público',
    provincia: '',
    distrito: '',
    distrito_sanitario: '',
    direccion_completa: '',
    telefono: '',
    email_contacto: '',
    nombre_responsable: '',
    cargo_responsable: '',
    documento_responsable: '',
    servicios_ofrecidos: '' as any,
    especialidades: '' as any,
    numero_camas: 0,
    numero_consultorios: 0,
    equipamiento_basico: '' as any,
    justificacion: '',
    poblacion_beneficiada: 0,
  });
  const [photos, setPhotos] = useState<File[]>([]);

  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    setPhotos(Array.from(files));
  };

  const handleSubmit = async () => {
    const urls: string[] = [];
    for (const f of photos) {
      const path = `establecimientos/${Date.now()}-${f.name}`;
      const url = await uploadFile(f, 'documentos-pdf', path);
      if (url) urls.push(url);
    }
    await createMutation.mutateAsync({
      ...form,
      servicios_ofrecidos: (form.servicios_ofrecidos || '').split(',').map((s: string) => s.trim()).filter(Boolean),
      especialidades: (form.especialidades || '').split(',').map((s: string) => s.trim()).filter(Boolean),
      equipamiento_basico: (form.equipamiento_basico || '').split(',').map((s: string) => s.trim()).filter(Boolean),
      documentos_adjuntos: urls,
    } as any);
    setPhotos([]);
  };

  const onChange = (e: any) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
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
              <Input name="nombre_establecimiento" value={form.nombre_establecimiento} onChange={onChange} />
            </div>
            <div>
              <Label>Tipo de Establecimiento</Label>
              <Input name="tipo_establecimiento" value={form.tipo_establecimiento} onChange={onChange} />
            </div>
            <div>
              <Label>Categoría</Label>
              <Input name="categoria" value={form.categoria} onChange={onChange} />
            </div>
            <div>
              <Label>Sector</Label>
              <Input name="sector" value={form.sector} onChange={onChange} />
            </div>
            <div>
              <Label>Provincia</Label>
              <Input name="provincia" value={form.provincia} onChange={onChange} />
            </div>
            <div>
              <Label>Distrito</Label>
              <Input name="distrito" value={form.distrito} onChange={onChange} />
            </div>
            <div>
              <Label>Distrito Sanitario</Label>
              <Input name="distrito_sanitario" value={form.distrito_sanitario} onChange={onChange} />
            </div>
            <div className="md:col-span-2">
              <Label>Dirección completa</Label>
              <Input name="direccion_completa" value={form.direccion_completa} onChange={onChange} />
            </div>
            <div>
              <Label>Teléfono</Label>
              <Input name="telefono" value={form.telefono} onChange={onChange} />
            </div>
            <div>
              <Label>Email de contacto</Label>
              <Input name="email_contacto" value={form.email_contacto} onChange={onChange} />
            </div>
            <div>
              <Label>Nombre del responsable</Label>
              <Input name="nombre_responsable" value={form.nombre_responsable} onChange={onChange} />
            </div>
            <div>
              <Label>Cargo del responsable</Label>
              <Input name="cargo_responsable" value={form.cargo_responsable} onChange={onChange} />
            </div>
            <div>
              <Label>Documento del responsable</Label>
              <Input name="documento_responsable" value={form.documento_responsable} onChange={onChange} />
            </div>
            <div className="md:col-span-2">
              <Label>Servicios ofrecidos (separados por coma)</Label>
              <Input name="servicios_ofrecidos" value={form.servicios_ofrecidos} onChange={onChange} />
            </div>
            <div className="md:col-span-2">
              <Label>Especialidades (separadas por coma)</Label>
              <Input name="especialidades" value={form.especialidades} onChange={onChange} />
            </div>
            <div>
              <Label>Número de camas</Label>
              <Input type="number" name="numero_camas" value={form.numero_camas} onChange={onChange} />
            </div>
            <div>
              <Label>Número de consultorios</Label>
              <Input type="number" name="numero_consultorios" value={form.numero_consultorios} onChange={onChange} />
            </div>
            <div className="md:col-span-2">
              <Label>Equipamiento básico (coma)</Label>
              <Input name="equipamiento_basico" value={form.equipamiento_basico} onChange={onChange} />
            </div>
            <div className="md:col-span-2">
              <Label>Justificación</Label>
              <Textarea name="justificacion" value={form.justificacion} onChange={onChange} />
            </div>
            <div>
              <Label>Población beneficiada</Label>
              <Input type="number" name="poblacion_beneficiada" value={form.poblacion_beneficiada} onChange={onChange} />
            </div>
            <div className="md:col-span-2">
              <Label>Fotos del establecimiento</Label>
              <Input type="file" multiple onChange={(e) => handleFiles(e.target.files)} />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setForm({
              nombre_establecimiento: '', tipo_establecimiento: 'Centro de Salud', categoria: 'Regional', sector: 'Público', provincia: '', distrito: '', distrito_sanitario: '', direccion_completa: '', telefono: '', email_contacto: '', nombre_responsable: '', cargo_responsable: '', documento_responsable: '', servicios_ofrecidos: '', especialidades: '', numero_camas: 0, numero_consultorios: 0, equipamiento_basico: '', justificacion: '', poblacion_beneficiada: 0,
            } as any)}>Limpiar</Button>
            <Button onClick={handleSubmit} disabled={createMutation.isPending || isUploading}>Enviar Solicitud</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
