// @ts-nocheck
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, CheckCircle2, FileSearch, Landmark, Send, Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useSpServicios, useSpDirecciones, crearSpSolicitud, verificarSpSolicitud } from "@/hooks/useServiciosPublicos";
import { useFileUpload } from "@/hooks/useFileUpload";

const ServiciosPublicos = () => {
  const { toast } = useToast();
  const { data: servicios = [], isLoading } = useSpServicios(true);
  const { data: direcciones = [] } = useSpDirecciones();
  const { uploadFile, isUploading } = useFileUpload();

  const [servicioId, setServicioId] = useState("");
  const [solicitante, setSolicitante] = useState({ nombre: "", documento: "", email: "", telefono: "" });
  const [datos, setDatos] = useState<Record<string, any>>({});
  const [documentos, setDocumentos] = useState<{ nombre: string; url: string }[]>([]);
  const [enviada, setEnviada] = useState<any>(null);
  const [token, setToken] = useState("");
  const [verificacion, setVerificacion] = useState<any>(null);
  const [buscando, setBuscando] = useState(false);

  const servicio = useMemo(() => servicios.find((s) => s.id === servicioId), [servicios, servicioId]);
  const dirName = (id?: string | null) => direcciones.find((d) => d.id === id)?.nombre || "Ministerio de Sanidad y Bienestar Social";

  const subir = async (file?: File) => {
    if (!file) return;
    const url = await uploadFile(file, "documentos-profesionales", `servicios-publicos/${Date.now()}-${file.name}`);
    if (url) setDocumentos((d) => [...d, { nombre: file.name, url }]);
  };

  const enviar = async () => {
    if (!servicio) return;
    if (!solicitante.nombre.trim()) {
      toast({ title: "Datos incompletos", description: "Indique el nombre del solicitante.", variant: "destructive" });
      return;
    }
    const faltan = (servicio.formulario_schema || []).filter((c) => c.required && !String(datos[c.name] ?? "").trim());
    if (faltan.length) {
      toast({ title: "Campos obligatorios", description: faltan.map((c) => c.label).join(", "), variant: "destructive" });
      return;
    }
    try {
      const row = await crearSpSolicitud({
        servicio_id: servicio.id,
        direccion_id: servicio.direccion_id,
        solicitante_nombre: solicitante.nombre,
        solicitante_documento: solicitante.documento || null,
        solicitante_email: solicitante.email || null,
        solicitante_telefono: solicitante.telefono || null,
        datos,
        documentos,
        monto: servicio.requiere_pago ? servicio.monto : 0,
        moneda: servicio.moneda,
        cuenta_bancaria_id: servicio.cuenta_bancaria_id,
      });
      setEnviada(row);
      setDatos({});
      setDocumentos([]);
    } catch (e: any) {
      toast({ title: "No se pudo enviar la solicitud", description: e?.message, variant: "destructive" });
    }
  };

  const verificar = async () => {
    setBuscando(true);
    try {
      const res = await verificarSpSolicitud(token);
      setVerificacion(res || { vacio: true });
    } catch (e: any) {
      toast({ title: "Error de verificación", description: e?.message, variant: "destructive" });
    } finally {
      setBuscando(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b bg-white">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <div>
            <h1 className="text-xl font-semibold">Servicios Públicos del Ministerio de Sanidad</h1>
            <p className="text-sm text-muted-foreground">Solicite trámites oficiales y verifique su expediente.</p>
          </div>
          <Link to="/"><Button variant="outline" size="sm"><ArrowLeft className="mr-2 h-4 w-4" />Inicio</Button></Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        <Tabs defaultValue="solicitar" className="space-y-5">
          <TabsList>
            <TabsTrigger value="solicitar"><Send className="mr-2 h-4 w-4" />Solicitar servicio</TabsTrigger>
            <TabsTrigger value="verificar"><FileSearch className="mr-2 h-4 w-4" />Verificar expediente</TabsTrigger>
          </TabsList>

          <TabsContent value="solicitar" className="space-y-5">
            {enviada ? (
              <Card>
                <CardHeader><CardTitle className="flex items-center gap-2 text-green-700"><CheckCircle2 className="h-5 w-5" />Solicitud registrada</CardTitle></CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div><b>Nº de expediente:</b> <span className="font-mono">{enviada.numero_solicitud}</span></div>
                  <div><b>Token de verificación pública:</b> <span className="font-mono">{enviada.token_verificacion}</span></div>
                  <div><b>Importe a abonar:</b> {Number(enviada.monto).toLocaleString("es-ES")} {enviada.moneda}</div>
                  <p className="text-muted-foreground">Conserve el token: le permitirá comprobar el estado y la resolución de su trámite.</p>
                  <Button className="mt-2" onClick={() => setEnviada(null)}>Realizar otra solicitud</Button>
                </CardContent>
              </Card>
            ) : (
              <>
                <Card>
                  <CardHeader><CardTitle>1. Seleccione el servicio</CardTitle></CardHeader>
                  <CardContent>
                    {isLoading ? <p className="text-muted-foreground">Cargando catálogo...</p> : (
                      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {servicios.map((s) => (
                          <button key={s.id} type="button" onClick={() => setServicioId(s.id)}
                            className={`rounded-xl border p-4 text-left transition-all hover:shadow-md ${servicioId === s.id ? "border-blue-500 bg-blue-50" : "bg-white"}`}>
                            <div className="font-semibold">{s.nombre}</div>
                            <p className="mt-1 text-sm text-muted-foreground">{s.descripcion}</p>
                            <div className="mt-3 flex flex-wrap gap-2 text-xs">
                              <Badge variant="outline">{dirName(s.direccion_id)}</Badge>
                              <Badge variant="secondary">{s.requiere_pago ? `${Number(s.monto).toLocaleString("es-ES")} ${s.moneda}` : "Gratuito"}</Badge>
                              <Badge variant="outline">{s.plazo_dias} días</Badge>
                            </div>
                          </button>
                        ))}
                        {servicios.length === 0 && <p className="text-muted-foreground">No hay servicios publicados todavía.</p>}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {servicio && (
                  <Card>
                    <CardHeader>
                      <CardTitle>2. Datos de la solicitud — {servicio.nombre}</CardTitle>
                      <p className="text-sm text-muted-foreground flex items-center gap-2"><Landmark className="h-4 w-4" />Dirección responsable: {dirName(servicio.direccion_id)}</p>
                    </CardHeader>
                    <CardContent className="space-y-5">
                      <div className="grid gap-4 md:grid-cols-2">
                        <div><Label>Nombre y apellidos / Razón social *</Label><Input value={solicitante.nombre} onChange={(e) => setSolicitante({ ...solicitante, nombre: e.target.value })} /></div>
                        <div><Label>Documento / NIF</Label><Input value={solicitante.documento} onChange={(e) => setSolicitante({ ...solicitante, documento: e.target.value })} /></div>
                        <div><Label>Correo electrónico</Label><Input type="email" value={solicitante.email} onChange={(e) => setSolicitante({ ...solicitante, email: e.target.value })} /></div>
                        <div><Label>Teléfono</Label><Input value={solicitante.telefono} onChange={(e) => setSolicitante({ ...solicitante, telefono: e.target.value })} /></div>
                      </div>

                      {(servicio.formulario_schema || []).length > 0 && (
                        <div className="grid gap-4 md:grid-cols-2">
                          {servicio.formulario_schema.map((campo) => (
                            <div key={campo.name} className={campo.type === "textarea" ? "md:col-span-2" : ""}>
                              <Label>{campo.label}{campo.required ? " *" : ""}</Label>
                              {campo.type === "textarea" ? (
                                <Textarea value={datos[campo.name] || ""} onChange={(e) => setDatos({ ...datos, [campo.name]: e.target.value })} />
                              ) : campo.type === "select" ? (
                                <Select value={datos[campo.name] || ""} onValueChange={(v) => setDatos({ ...datos, [campo.name]: v })}>
                                  <SelectTrigger><SelectValue placeholder="Seleccione" /></SelectTrigger>
                                  <SelectContent>{(campo.options || []).map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
                                </Select>
                              ) : (
                                <Input type={campo.type === "number" ? "number" : campo.type === "date" ? "date" : "text"}
                                  value={datos[campo.name] || ""} onChange={(e) => setDatos({ ...datos, [campo.name]: e.target.value })} />
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      <div>
                        <Label>Documentación requerida</Label>
                        <ul className="mb-2 list-disc pl-5 text-sm text-muted-foreground">
                          {(servicio.documentos_requeridos || []).map((d) => <li key={d}>{d}</li>)}
                        </ul>
                        <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm hover:bg-muted">
                          <Upload className="h-4 w-4" />{isUploading ? "Subiendo..." : "Adjuntar documento"}
                          <input type="file" className="hidden" onChange={(e) => subir(e.target.files?.[0])} />
                        </label>
                        {documentos.length > 0 && (
                          <ul className="mt-2 space-y-1 text-sm">
                            {documentos.map((d) => <li key={d.url}><a className="text-blue-700 hover:underline" href={d.url} target="_blank" rel="noreferrer">{d.nombre}</a></li>)}
                          </ul>
                        )}
                      </div>

                      <div className="flex justify-end">
                        <Button onClick={enviar}><Send className="mr-2 h-4 w-4" />Enviar solicitud</Button>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </TabsContent>

          <TabsContent value="verificar">
            <Card>
              <CardHeader><CardTitle>Verificación pública de expedientes</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col gap-3 sm:flex-row">
                  <Input placeholder="XXXXXX-XXXXXX-XXXXXX" value={token} onChange={(e) => setToken(e.target.value)} className="font-mono" />
                  <Button onClick={verificar} disabled={buscando || !token.trim()}>{buscando ? "Consultando..." : "Verificar"}</Button>
                </div>
                {verificacion && (verificacion.vacio ? (
                  <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-900">No existe ningún expediente con ese token.</div>
                ) : (
                  <div className="space-y-1 rounded-md border border-green-200 bg-green-50 p-4 text-sm text-green-900">
                    <div><b>Expediente:</b> {verificacion.numero_solicitud}</div>
                    <div><b>Servicio:</b> {verificacion.servicio}</div>
                    <div><b>Dirección:</b> {verificacion.direccion}</div>
                    <div><b>Estado:</b> {verificacion.estado}</div>
                    <div><b>Fecha:</b> {verificacion.fecha ? new Date(verificacion.fecha).toLocaleString("es-ES") : "—"}</div>
                    {verificacion.hash_auditoria && <div className="font-mono text-xs"><b>Hash:</b> {verificacion.hash_auditoria}</div>}
                    {verificacion.resolucion_url && <a className="text-blue-700 hover:underline" href={verificacion.resolucion_url} target="_blank" rel="noreferrer">Descargar resolución</a>}
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default ServiciosPublicos;
