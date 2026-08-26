// @ts-nocheck
import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Building2, FileText, GitBranch, ListChecks, Plus, RefreshCw, Save, Trash2, Workflow } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  useSpDirecciones, useSpServicios, useSpEstados, useSpTransiciones, useSpSolicitudes, useSpHistorial,
  useSpUpsert, useSpDelete, useSpCambiarEstado, renderPlantilla,
} from "@/hooks/useServiciosPublicos";
import { useCuentasBancarias } from "@/hooks/useTesoreriaCuentas";

const NONE = "__none__";

export default function ServiciosPublicosAdmin() {
  const { toast } = useToast();
  const direcciones = useSpDirecciones();
  const servicios = useSpServicios();
  const estados = useSpEstados();
  const transiciones = useSpTransiciones();
  const [estadoFiltro, setEstadoFiltro] = useState("todos");
  const solicitudes = useSpSolicitudes(estadoFiltro);
  const cuentas = useCuentasBancarias(true);

  const upDireccion = useSpUpsert("sp_direcciones", "sp_direcciones");
  const delDireccion = useSpDelete("sp_direcciones", "sp_direcciones");
  const upServicio = useSpUpsert("sp_servicios", "sp_servicios");
  const delServicio = useSpDelete("sp_servicios", "sp_servicios");
  const upEstado = useSpUpsert("sp_estados", "sp_estados");
  const delEstado = useSpDelete("sp_estados", "sp_estados");
  const upTransicion = useSpUpsert("sp_transiciones", "sp_transiciones");
  const delTransicion = useSpDelete("sp_transiciones", "sp_transiciones");
  const cambiarEstado = useSpCambiarEstado();

  const [servicioEdit, setServicioEdit] = useState<any>(null);
  const [detalle, setDetalle] = useState<any>(null);
  const [motivo, setMotivo] = useState("");
  const historial = useSpHistorial(detalle?.id);

  const dirName = (id?: string | null) => direcciones.data?.find((d) => d.id === id)?.nombre || "Sin asignar";
  const srvName = (id?: string | null) => servicios.data?.find((s) => s.id === id)?.nombre || "—";
  const estadoNombre = (codigo: string) => estados.data?.find((e) => e.codigo === codigo)?.nombre || codigo;

  const transicionesDisponibles = useMemo(() => {
    if (!detalle) return [];
    return (transiciones.data || []).filter(
      (t) => t.estado_origen === detalle.estado && (!t.servicio_id || t.servicio_id === detalle.servicio_id),
    );
  }, [transiciones.data, detalle]);

  const aplicarTransicion = async (t: any) => {
    if (t.requiere_motivo && !motivo.trim()) {
      toast({ title: "Motivo obligatorio", description: "Indique el motivo antes de continuar.", variant: "destructive" });
      return;
    }
    const servicio = servicios.data?.find((s) => s.id === detalle.servicio_id);
    const resolucion = t.genera_resolucion && servicio?.plantilla_resolucion
      ? renderPlantilla(servicio.plantilla_resolucion, {
          numero_solicitud: detalle.numero_solicitud,
          solicitante: detalle.solicitante_nombre,
          servicio: servicio.nombre,
          direccion: dirName(detalle.direccion_id),
          fecha: new Date().toLocaleDateString("es-ES"),
        })
      : undefined;
    try {
      const updated = await cambiarEstado.mutateAsync({ solicitud: detalle, transicion: t, motivo: motivo.trim() || undefined, resolucion });
      setDetalle(updated);
      setMotivo("");
      toast({ title: "Flujo actualizado", description: `La solicitud pasó a «${estadoNombre(t.estado_destino)}».` });
    } catch (e: any) {
      toast({ title: "No se pudo actualizar", description: e?.message, variant: "destructive" });
    }
  };

  const saveServicio = async () => {
    try {
      const payload = { ...servicioEdit };
      if (payload.direccion_id === NONE) payload.direccion_id = null;
      if (payload.cuenta_bancaria_id === NONE) payload.cuenta_bancaria_id = null;
      if (typeof payload.formulario_schema === "string") payload.formulario_schema = JSON.parse(payload.formulario_schema || "[]");
      if (typeof payload.documentos_requeridos === "string")
        payload.documentos_requeridos = payload.documentos_requeridos.split("\n").map((s: string) => s.trim()).filter(Boolean);
      await upServicio.mutateAsync(payload);
      setServicioEdit(null);
      toast({ title: "Servicio guardado" });
    } catch (e: any) {
      toast({ title: "No se pudo guardar", description: e?.message, variant: "destructive" });
    }
  };

  return (
    <Tabs defaultValue="solicitudes" className="space-y-5">
      <TabsList className="grid w-full grid-cols-2 lg:grid-cols-5">
        <TabsTrigger value="solicitudes"><FileText className="mr-2 h-4 w-4" />Solicitudes</TabsTrigger>
        <TabsTrigger value="servicios"><ListChecks className="mr-2 h-4 w-4" />Servicios y tarifas</TabsTrigger>
        <TabsTrigger value="direcciones"><Building2 className="mr-2 h-4 w-4" />Direcciones</TabsTrigger>
        <TabsTrigger value="estados"><Workflow className="mr-2 h-4 w-4" />Estados</TabsTrigger>
        <TabsTrigger value="flujos"><GitBranch className="mr-2 h-4 w-4" />Flujos</TabsTrigger>
      </TabsList>

      {/* ---------- SOLICITUDES ---------- */}
      <TabsContent value="solicitudes" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex flex-wrap items-center justify-between gap-2">
              <span>Registro de solicitudes de servicios públicos</span>
              <div className="flex gap-2">
                <Select value={estadoFiltro} onValueChange={setEstadoFiltro}>
                  <SelectTrigger className="w-56"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos los estados</SelectItem>
                    {(estados.data || []).map((e) => <SelectItem key={e.id} value={e.codigo}>{e.nombre}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Button variant="outline" size="sm" onClick={() => solicitudes.refetch()}><RefreshCw className="h-4 w-4" /></Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="p-3 text-left">Nº</th><th className="p-3 text-left">Servicio</th>
                    <th className="p-3 text-left">Solicitante</th><th className="p-3 text-left">Dirección</th>
                    <th className="p-3 text-left">Importe</th><th className="p-3 text-left">Estado</th><th className="p-3" />
                  </tr>
                </thead>
                <tbody>
                  {(solicitudes.data || []).length === 0 ? (
                    <tr><td colSpan={7} className="p-8 text-center text-muted-foreground">Sin solicitudes registradas.</td></tr>
                  ) : solicitudes.data.map((s) => (
                    <tr key={s.id} className="border-t">
                      <td className="p-3 font-mono">{s.numero_solicitud}</td>
                      <td className="p-3">{srvName(s.servicio_id)}</td>
                      <td className="p-3">{s.solicitante_nombre}</td>
                      <td className="p-3">{dirName(s.direccion_id)}</td>
                      <td className="p-3">{Number(s.monto).toLocaleString("es-ES")} {s.moneda}</td>
                      <td className="p-3"><Badge variant="outline">{estadoNombre(s.estado)}</Badge></td>
                      <td className="p-3"><Button size="sm" variant="outline" onClick={() => setDetalle(s)}>Tramitar</Button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      {/* ---------- SERVICIOS ---------- */}
      <TabsContent value="servicios" className="space-y-4">
        <div className="flex justify-end">
          <Button onClick={() => setServicioEdit({ codigo: "", nombre: "", descripcion: "", categoria: "GENERAL", requiere_pago: true, monto: 0, moneda: "XAF", plazo_dias: 15, activo: true, orden: 0, formulario_schema: "[]", documentos_requeridos: "" })}>
            <Plus className="mr-2 h-4 w-4" />Nuevo servicio
          </Button>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {(servicios.data || []).map((s) => (
            <Card key={s.id}>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-start justify-between gap-2 text-base">
                  <span>{s.nombre}</span>
                  <Badge variant={s.activo ? "default" : "secondary"}>{s.activo ? "Activo" : "Inactivo"}</Badge>
                </CardTitle>
                <p className="text-xs text-muted-foreground">{s.codigo} · {dirName(s.direccion_id)} · plazo {s.plazo_dias} días</p>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <p className="text-muted-foreground">{s.descripcion || "Sin descripción"}</p>
                <div className="font-medium">{s.requiere_pago ? `${Number(s.monto).toLocaleString("es-ES")} ${s.moneda}` : "Servicio gratuito"}</div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => setServicioEdit({ ...s, formulario_schema: JSON.stringify(s.formulario_schema ?? [], null, 2), documentos_requeridos: (s.documentos_requeridos || []).join("\n") })}>Editar</Button>
                  <Button size="sm" variant="ghost" onClick={() => delServicio.mutate(s.id)}><Trash2 className="h-4 w-4" /></Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </TabsContent>

      {/* ---------- DIRECCIONES ---------- */}
      <TabsContent value="direcciones">
        <CatalogoDirecciones data={direcciones.data || []} onSave={(row) => upDireccion.mutateAsync(row)} onDelete={(id) => delDireccion.mutate(id)} />
      </TabsContent>

      {/* ---------- ESTADOS ---------- */}
      <TabsContent value="estados">
        <CatalogoEstados data={estados.data || []} servicios={servicios.data || []} onSave={(row) => upEstado.mutateAsync(row)} onDelete={(id) => delEstado.mutate(id)} />
      </TabsContent>

      {/* ---------- FLUJOS ---------- */}
      <TabsContent value="flujos">
        <CatalogoTransiciones data={transiciones.data || []} estados={estados.data || []} servicios={servicios.data || []} onSave={(row) => upTransicion.mutateAsync(row)} onDelete={(id) => delTransicion.mutate(id)} />
      </TabsContent>

      {/* ---------- DIALOG SERVICIO ---------- */}
      <Dialog open={!!servicioEdit} onOpenChange={() => setServicioEdit(null)}>
        <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
          <DialogHeader><DialogTitle>{servicioEdit?.id ? "Editar servicio" : "Nuevo servicio"}</DialogTitle></DialogHeader>
          {servicioEdit && (
            <div className="grid gap-4 md:grid-cols-2">
              <div><Label>Código</Label><Input value={servicioEdit.codigo} onChange={(e) => setServicioEdit({ ...servicioEdit, codigo: e.target.value.toUpperCase() })} /></div>
              <div><Label>Nombre</Label><Input value={servicioEdit.nombre} onChange={(e) => setServicioEdit({ ...servicioEdit, nombre: e.target.value })} /></div>
              <div className="md:col-span-2"><Label>Descripción</Label><Textarea value={servicioEdit.descripcion || ""} onChange={(e) => setServicioEdit({ ...servicioEdit, descripcion: e.target.value })} /></div>
              <div>
                <Label>Dirección responsable</Label>
                <Select value={servicioEdit.direccion_id || NONE} onValueChange={(v) => setServicioEdit({ ...servicioEdit, direccion_id: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NONE}>Sin asignar</SelectItem>
                    {(direcciones.data || []).map((d) => <SelectItem key={d.id} value={d.id}>{d.nombre}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Categoría</Label><Input value={servicioEdit.categoria || ""} onChange={(e) => setServicioEdit({ ...servicioEdit, categoria: e.target.value })} /></div>
              <div className="flex items-center gap-3 pt-6">
                <Switch checked={!!servicioEdit.requiere_pago} onCheckedChange={(v) => setServicioEdit({ ...servicioEdit, requiere_pago: v })} />
                <span className="text-sm">Requiere pago (nota de ingreso)</span>
              </div>
              <div><Label>Tarifa</Label><Input type="number" value={servicioEdit.monto ?? 0} onChange={(e) => setServicioEdit({ ...servicioEdit, monto: Number(e.target.value) })} /></div>
              <div><Label>Moneda</Label><Input value={servicioEdit.moneda || "XAF"} onChange={(e) => setServicioEdit({ ...servicioEdit, moneda: e.target.value.toUpperCase() })} /></div>
              <div>
                <Label>Cuenta bancaria de Tesorería</Label>
                <Select value={servicioEdit.cuenta_bancaria_id || NONE} onValueChange={(v) => setServicioEdit({ ...servicioEdit, cuenta_bancaria_id: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NONE}>Cuenta predeterminada</SelectItem>
                    {(cuentas.data || []).map((c) => <SelectItem key={c.id} value={c.id}>{c.banco} · {c.numero_cuenta}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Plazo (días)</Label><Input type="number" value={servicioEdit.plazo_dias ?? 15} onChange={(e) => setServicioEdit({ ...servicioEdit, plazo_dias: Number(e.target.value) })} /></div>
              <div><Label>Vigencia (meses)</Label><Input type="number" value={servicioEdit.vigencia_meses ?? ""} onChange={(e) => setServicioEdit({ ...servicioEdit, vigencia_meses: e.target.value === "" ? null : Number(e.target.value) })} /></div>
              <div className="md:col-span-2">
                <Label>Campos del formulario (JSON)</Label>
                <Textarea rows={7} className="font-mono text-xs" value={servicioEdit.formulario_schema} onChange={(e) => setServicioEdit({ ...servicioEdit, formulario_schema: e.target.value })} />
                <p className="mt-1 text-xs text-muted-foreground">{`Ej: [{"name":"motivo","label":"Motivo","type":"textarea","required":true}]`}</p>
              </div>
              <div className="md:col-span-2"><Label>Documentos requeridos (uno por línea)</Label><Textarea rows={4} value={servicioEdit.documentos_requeridos} onChange={(e) => setServicioEdit({ ...servicioEdit, documentos_requeridos: e.target.value })} /></div>
              <div className="md:col-span-2">
                <Label>Plantilla de resolución / carta de aprobación</Label>
                <Textarea rows={4} value={servicioEdit.plantilla_resolucion || ""} onChange={(e) => setServicioEdit({ ...servicioEdit, plantilla_resolucion: e.target.value })} />
                <p className="mt-1 text-xs text-muted-foreground">Variables: {"{{numero_solicitud}} {{solicitante}} {{servicio}} {{direccion}} {{fecha}}"}</p>
              </div>
              <div className="flex items-center gap-3">
                <Switch checked={!!servicioEdit.activo} onCheckedChange={(v) => setServicioEdit({ ...servicioEdit, activo: v })} />
                <span className="text-sm">Publicado en el portal</span>
              </div>
              <div className="md:col-span-2 flex justify-end gap-2">
                <Button variant="outline" onClick={() => setServicioEdit(null)}>Cancelar</Button>
                <Button onClick={saveServicio} disabled={upServicio.isPending}><Save className="mr-2 h-4 w-4" />Guardar</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ---------- DIALOG TRAMITACIÓN ---------- */}
      <Dialog open={!!detalle} onOpenChange={() => { setDetalle(null); setMotivo(""); }}>
        <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
          <DialogHeader><DialogTitle>Expediente {detalle?.numero_solicitud}</DialogTitle></DialogHeader>
          {detalle && (
            <div className="space-y-4 text-sm">
              <div className="grid gap-2 md:grid-cols-2">
                <div><b>Servicio:</b> {srvName(detalle.servicio_id)}</div>
                <div><b>Dirección:</b> {dirName(detalle.direccion_id)}</div>
                <div><b>Solicitante:</b> {detalle.solicitante_nombre}</div>
                <div><b>Documento:</b> {detalle.solicitante_documento || "—"}</div>
                <div><b>Contacto:</b> {detalle.solicitante_email || "—"} {detalle.solicitante_telefono || ""}</div>
                <div><b>Importe:</b> {Number(detalle.monto).toLocaleString("es-ES")} {detalle.moneda}</div>
                <div><b>Estado:</b> <Badge variant="outline">{estadoNombre(detalle.estado)}</Badge></div>
                <div><b>Token público:</b> <span className="font-mono">{detalle.token_verificacion}</span></div>
              </div>
              {!!Object.keys(detalle.datos || {}).length && (
                <div className="rounded-lg border p-3">
                  <div className="mb-2 font-semibold">Datos del formulario</div>
                  {Object.entries(detalle.datos).map(([k, v]) => <div key={k}><b>{k}:</b> {String(v)}</div>)}
                </div>
              )}
              {detalle.resolucion_texto && (
                <div className="rounded-lg border bg-muted/30 p-3"><div className="mb-1 font-semibold">Resolución</div>{detalle.resolucion_texto}</div>
              )}
              <div className="rounded-lg border p-3">
                <div className="mb-2 font-semibold">Acciones del flujo</div>
                <Textarea className="mb-2" placeholder="Motivo / observaciones (obligatorio en rechazos)" value={motivo} onChange={(e) => setMotivo(e.target.value)} />
                <div className="flex flex-wrap gap-2">
                  {transicionesDisponibles.length === 0
                    ? <span className="text-muted-foreground">No hay transiciones configuradas desde este estado.</span>
                    : transicionesDisponibles.map((t) => (
                        <Button key={t.id} size="sm" variant="outline" disabled={cambiarEstado.isPending} onClick={() => aplicarTransicion(t)}>{t.accion_label}</Button>
                      ))}
                </div>
              </div>
              <div className="rounded-lg border p-3">
                <div className="mb-2 font-semibold">Historial auditable</div>
                {(historial.data || []).map((h: any) => (
                  <div key={h.id} className="border-b py-1 last:border-0">
                    {new Date(h.created_at).toLocaleString("es-ES")} · {h.estado_anterior || "—"} → <b>{h.estado_nuevo}</b> {h.motivo ? `· ${h.motivo}` : ""}
                  </div>
                ))}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Tabs>
  );
}

function CatalogoDirecciones({ data, onSave, onDelete }: any) {
  const [row, setRow] = useState<any>({ codigo: "", nombre: "", responsable: "", email: "", telefono: "", activo: true });
  return (
    <Card>
      <CardHeader><CardTitle>Direcciones del Ministerio</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 md:grid-cols-5">
          <Input placeholder="Código" value={row.codigo} onChange={(e) => setRow({ ...row, codigo: e.target.value.toUpperCase() })} />
          <Input placeholder="Nombre" className="md:col-span-2" value={row.nombre} onChange={(e) => setRow({ ...row, nombre: e.target.value })} />
          <Input placeholder="Responsable" value={row.responsable} onChange={(e) => setRow({ ...row, responsable: e.target.value })} />
          <Button onClick={async () => { await onSave(row); setRow({ codigo: "", nombre: "", responsable: "", email: "", telefono: "", activo: true }); }}>
            <Plus className="mr-2 h-4 w-4" />{row.id ? "Guardar" : "Añadir"}
          </Button>
        </div>
        <div className="divide-y rounded-lg border">
          {data.map((d: any) => (
            <div key={d.id} className="flex flex-wrap items-center justify-between gap-2 p-3 text-sm">
              <div><b>{d.codigo}</b> · {d.nombre} <span className="text-muted-foreground">{d.responsable || ""}</span></div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => setRow(d)}>Editar</Button>
                <Button size="sm" variant="ghost" onClick={() => onDelete(d.id)}><Trash2 className="h-4 w-4" /></Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function CatalogoEstados({ data, servicios, onSave, onDelete }: any) {
  const [row, setRow] = useState<any>({ codigo: "", nombre: "", color: "slate", orden: 0, es_inicial: false, es_final: false, es_aprobacion: false, servicio_id: null });
  return (
    <Card>
      <CardHeader><CardTitle>Estados de tramitación</CardTitle><p className="text-sm text-muted-foreground">Sin servicio asignado el estado es global para todos los trámites.</p></CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 md:grid-cols-6">
          <Input placeholder="Código" value={row.codigo} onChange={(e) => setRow({ ...row, codigo: e.target.value.toUpperCase().replace(/\s/g, "_") })} />
          <Input placeholder="Nombre" value={row.nombre} onChange={(e) => setRow({ ...row, nombre: e.target.value })} />
          <Input placeholder="Orden" type="number" value={row.orden} onChange={(e) => setRow({ ...row, orden: Number(e.target.value) })} />
          <Select value={row.servicio_id || NONE} onValueChange={(v) => setRow({ ...row, servicio_id: v === NONE ? null : v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value={NONE}>Global</SelectItem>
              {servicios.map((s: any) => <SelectItem key={s.id} value={s.id}>{s.nombre}</SelectItem>)}
            </SelectContent>
          </Select>
          <div className="flex items-center gap-2 text-xs">
            <Switch checked={row.es_aprobacion} onCheckedChange={(v) => setRow({ ...row, es_aprobacion: v, es_final: v || row.es_final })} />Aprobación
          </div>
          <Button onClick={async () => { await onSave(row); setRow({ codigo: "", nombre: "", color: "slate", orden: 0, es_inicial: false, es_final: false, es_aprobacion: false, servicio_id: null }); }}>
            <Plus className="mr-2 h-4 w-4" />{row.id ? "Guardar" : "Añadir"}
          </Button>
        </div>
        <div className="divide-y rounded-lg border">
          {data.map((e: any) => (
            <div key={e.id} className="flex items-center justify-between gap-2 p-3 text-sm">
              <div><Badge variant="outline" className="mr-2">{e.orden}</Badge><b>{e.codigo}</b> · {e.nombre} {e.es_aprobacion && <Badge className="ml-2">Aprobación</Badge>} {e.es_final && <Badge variant="secondary" className="ml-2">Final</Badge>}</div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => setRow(e)}>Editar</Button>
                <Button size="sm" variant="ghost" onClick={() => onDelete(e.id)}><Trash2 className="h-4 w-4" /></Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function CatalogoTransiciones({ data, estados, servicios, onSave, onDelete }: any) {
  const empty = { estado_origen: "", estado_destino: "", accion_label: "", requiere_motivo: false, genera_nota_ingreso: false, genera_resolucion: false, servicio_id: null, rol_requerido: "" };
  const [row, setRow] = useState<any>(empty);
  return (
    <Card>
      <CardHeader><CardTitle>Flujos de tramitación</CardTitle><p className="text-sm text-muted-foreground">Define qué acción lleva de un estado a otro y si genera nota de ingreso o resolución.</p></CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 md:grid-cols-4">
          <Select value={row.estado_origen} onValueChange={(v) => setRow({ ...row, estado_origen: v })}>
            <SelectTrigger><SelectValue placeholder="Estado origen" /></SelectTrigger>
            <SelectContent>{estados.map((e: any) => <SelectItem key={e.id} value={e.codigo}>{e.nombre}</SelectItem>)}</SelectContent>
          </Select>
          <Select value={row.estado_destino} onValueChange={(v) => setRow({ ...row, estado_destino: v })}>
            <SelectTrigger><SelectValue placeholder="Estado destino" /></SelectTrigger>
            <SelectContent>{estados.map((e: any) => <SelectItem key={e.id} value={e.codigo}>{e.nombre}</SelectItem>)}</SelectContent>
          </Select>
          <Input placeholder="Etiqueta de la acción" value={row.accion_label} onChange={(e) => setRow({ ...row, accion_label: e.target.value })} />
          <Select value={row.servicio_id || NONE} onValueChange={(v) => setRow({ ...row, servicio_id: v === NONE ? null : v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value={NONE}>Todos los servicios</SelectItem>
              {servicios.map((s: any) => <SelectItem key={s.id} value={s.id}>{s.nombre}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-wrap items-center gap-5 text-sm">
          <label className="flex items-center gap-2"><Switch checked={row.requiere_motivo} onCheckedChange={(v) => setRow({ ...row, requiere_motivo: v })} />Requiere motivo</label>
          <label className="flex items-center gap-2"><Switch checked={row.genera_nota_ingreso} onCheckedChange={(v) => setRow({ ...row, genera_nota_ingreso: v })} />Genera nota de ingreso</label>
          <label className="flex items-center gap-2"><Switch checked={row.genera_resolucion} onCheckedChange={(v) => setRow({ ...row, genera_resolucion: v })} />Genera resolución</label>
          <Button onClick={async () => { await onSave(row); setRow(empty); }}><Plus className="mr-2 h-4 w-4" />{row.id ? "Guardar" : "Añadir"}</Button>
        </div>
        <div className="divide-y rounded-lg border">
          {data.map((t: any) => (
            <div key={t.id} className="flex flex-wrap items-center justify-between gap-2 p-3 text-sm">
              <div>{t.estado_origen} → <b>{t.estado_destino}</b> · {t.accion_label} {t.genera_nota_ingreso && <Badge variant="outline" className="ml-2">Nota</Badge>} {t.genera_resolucion && <Badge variant="outline" className="ml-2">Resolución</Badge>}</div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => setRow(t)}>Editar</Button>
                <Button size="sm" variant="ghost" onClick={() => onDelete(t.id)}><Trash2 className="h-4 w-4" /></Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
