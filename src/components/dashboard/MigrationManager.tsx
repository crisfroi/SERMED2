import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/components/ui/use-toast";
import {
  Database,
  AlertTriangle,
  CheckCircle,
  Clock,
  RefreshCw,
  Download,
  Loader,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface Migration {
  filename: string;
  name: string;
  status: "pending" | "applied" | "error";
  appliedAt?: string;
  errorMessage?: string;
  content?: string;
}

const MigrationManager = () => {
  const { toast } = useToast();
  const [migrations, setMigrations] = useState<Migration[]>([]);
  const [loading, setLoading] = useState(false);
  const [applyingMigrations, setApplyingMigrations] = useState(false);
  const [selectedMigrations, setSelectedMigrations] = useState<Set<string>>(
    new Set()
  );
  const [expandedMigration, setExpandedMigration] = useState<string | null>(
    null
  );
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [migrationsToApply, setMigrationsToApply] = useState<Migration[]>([]);

  useEffect(() => {
    loadMigrations();
  }, []);

  const loadMigrations = async () => {
    setLoading(true);
    try {
      // Obtener migraciones disponibles desde el servidor
      const response = await fetch("/api/migrations");
      let availableMigrations: Migration[] = [];

      if (response.ok) {
        const data = await response.json();
        availableMigrations = data.migrations || [];
      } else {
        // Fallback: usar lista conocida de migraciones
        availableMigrations = getDefaultMigrations();
      }

      // Verificar estado de cada migración en Supabase
      const migrationsWithStatus = await Promise.all(
        availableMigrations.map(async (migration) => {
          const status = await checkMigrationStatus(migration.name);
          return {
            ...migration,
            status: status.status,
            appliedAt: status.appliedAt,
            errorMessage: status.errorMessage,
          };
        })
      );

      setMigrations(migrationsWithStatus);

      // Contar migraciones pendientes
      const pendingCount = migrationsWithStatus.filter(
        (m) => m.status === "pending"
      ).length;

      if (pendingCount > 0) {
        toast({
          title: "Migraciones Pendientes",
          description: `Hay ${pendingCount} migraciones sin aplicar`,
          variant: "default",
        });
      }
    } catch (error) {
      console.error("Error loading migrations:", error);
      toast({
        title: "Error",
        description: "Error al cargar las migraciones",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const checkMigrationStatus = async (
    migrationName: string
  ): Promise<{
    status: "pending" | "applied" | "error";
    appliedAt?: string;
    errorMessage?: string;
  }> => {
    try {
      // Verificar si existe tabla de registro de migraciones
      const { data, error } = await supabase
        .from("schema_migrations")
        .select("*")
        .eq("name", migrationName)
        .single();

      if (error && error.code !== "PGRST116") {
        // Si el error no es "no rows found", es un error real
        return { status: "error", errorMessage: error.message };
      }

      if (data) {
        return {
          status: "applied",
          appliedAt: data.executed_at || data.created_at,
        };
      }

      return { status: "pending" };
    } catch (error) {
      // Tabla podría no existir, asumir pendiente
      return { status: "pending" };
    }
  };

  const getDefaultMigrations = (): Migration[] => {
    // Lista de migraciones conocidas en el proyecto
    return [
      {
        filename: "20240101000000_create_biometric_sync_logs.sql",
        name: "20240101000000_create_biometric_sync_logs",
        status: "pending",
      },
      {
        filename: "20241201_dynamic_forms.sql",
        name: "20241201_dynamic_forms",
        status: "pending",
      },
      {
        filename: "20250116_001_hosix_base_schema.sql",
        name: "20250116_001_hosix_base_schema",
        status: "pending",
      },
      {
        filename: "20250116_002_hosix_pacientes_historia_clinica.sql",
        name: "20250116_002_hosix_pacientes_historia_clinica",
        status: "pending",
      },
      {
        filename: "20250116_003_hosix_urgencias_citas_agendas.sql",
        name: "20250116_003_hosix_urgencias_citas_agendas",
        status: "pending",
      },
      {
        filename: "20250116_004_hosix_hospitalizacion_quirofanos_farmacia.sql",
        name: "20250116_004_hosix_hospitalizacion_quirofanos_farmacia",
        status: "pending",
      },
      {
        filename: "20250116_005_hosix_facturacion_reportes.sql",
        name: "20250116_005_hosix_facturacion_reportes",
        status: "pending",
      },
      {
        filename: "20250121_006_hosix_cajas_completo.sql",
        name: "20250121_006_hosix_cajas_completo",
        status: "pending",
      },
      {
        filename: "20250121_007_hosix_recobros.sql",
        name: "20250121_007_hosix_recobros",
        status: "pending",
      },
      {
        filename: "20250121_008_hosix_suministros.sql",
        name: "20250121_008_hosix_suministros",
        status: "pending",
      },
      {
        filename: "20250122_009_hosix_almacenes.sql",
        name: "20250122_009_hosix_almacenes",
        status: "pending",
      },
      {
        filename: "20250122_011_hosix_cpoe_prescripciones.sql",
        name: "20250122_011_hosix_cpoe_prescripciones",
        status: "pending",
      },
      {
        filename: "20250122_012_hosix_servicios_tipos_ingreso.sql",
        name: "20250122_012_hosix_servicios_tipos_ingreso",
        status: "pending",
      },
      {
        filename: "20250205_010_hosix_enfermeria.sql",
        name: "20250205_010_hosix_enfermeria",
        status: "pending",
      },
      {
        filename: "20250205_011_hosix_medicos.sql",
        name: "20250205_011_hosix_medicos",
        status: "pending",
      },
      {
        filename: "20250205_012_hosix_drug_interactions.sql",
        name: "20250205_012_hosix_drug_interactions",
        status: "pending",
      },
      {
        filename: "20250206_011_hosix_medicos_asis_1.sql",
        name: "20250206_011_hosix_medicos_asis_1",
        status: "pending",
      },
      {
        filename: "20250206_013_hosix_quirofanos_asis_3.sql",
        name: "20250206_013_hosix_quirofanos_asis_3",
        status: "pending",
      },
      {
        filename: "20250206_014_hosix_interconsultas_asis_11.sql",
        name: "20250206_014_hosix_interconsultas_asis_11",
        status: "pending",
      },
    ];
  };

  const handleSelectMigration = (filename: string) => {
    const newSelected = new Set(selectedMigrations);
    if (newSelected.has(filename)) {
      newSelected.delete(filename);
    } else {
      newSelected.add(filename);
    }
    setSelectedMigrations(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedMigrations.size === migrations.length) {
      setSelectedMigrations(new Set());
    } else {
      setSelectedMigrations(new Set(migrations.map((m) => m.filename)));
    }
  };

  const handleApplyClick = () => {
    const pendingSelected = migrations.filter(
      (m) => selectedMigrations.has(m.filename) && m.status === "pending"
    );

    if (pendingSelected.length === 0) {
      toast({
        title: "Sin cambios",
        description: "Selecciona migraciones pendientes para aplicar",
        variant: "default",
      });
      return;
    }

    setMigrationsToApply(pendingSelected);
    setShowConfirmDialog(true);
  };

  const applyMigrations = async () => {
    setShowConfirmDialog(false);
    setApplyingMigrations(true);

    try {
      let successCount = 0;
      let errorCount = 0;

      for (const migration of migrationsToApply) {
        try {
          const response = await fetch("/api/apply-migration", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ migrationName: migration.name }),
          });

          if (response.ok) {
            successCount++;
            // Actualizar estado en la lista
            setMigrations((prev) =>
              prev.map((m) =>
                m.filename === migration.filename
                  ? { ...m, status: "applied", appliedAt: new Date().toISOString() }
                  : m
              )
            );

            toast({
              title: "Migración Aplicada",
              description: `${migration.name} se aplicó correctamente`,
            });
          } else {
            errorCount++;
            const error = await response.json();
            setMigrations((prev) =>
              prev.map((m) =>
                m.filename === migration.filename
                  ? {
                      ...m,
                      status: "error",
                      errorMessage: error.message || "Error desconocido",
                    }
                  : m
              )
            );

            toast({
              title: "Error",
              description: `Fallo al aplicar ${migration.name}: ${error.message}`,
              variant: "destructive",
            });
          }
        } catch (error) {
          errorCount++;
          console.error(`Error applying migration ${migration.name}:`, error);
        }
      }

      toast({
        title: "Aplicación de Migraciones Completada",
        description: `${successCount} aplicadas, ${errorCount} errores`,
        variant: successCount > 0 ? "default" : "destructive",
      });

      setSelectedMigrations(new Set());
      setMigrationsToApply([]);
    } catch (error) {
      console.error("Error applying migrations:", error);
      toast({
        title: "Error Fatal",
        description: "Error crítico al aplicar migraciones",
        variant: "destructive",
      });
    } finally {
      setApplyingMigrations(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "applied":
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case "pending":
        return <Clock className="w-5 h-5 text-yellow-600" />;
      case "error":
        return <AlertTriangle className="w-5 h-5 text-red-600" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "applied":
        return (
          <Badge variant="default" className="bg-green-600">
            Aplicada
          </Badge>
        );
      case "pending":
        return (
          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
            Pendiente
          </Badge>
        );
      case "error":
        return (
          <Badge variant="destructive">
            Error
          </Badge>
        );
      default:
        return null;
    }
  };

  const pendingCount = migrations.filter((m) => m.status === "pending").length;
  const appliedCount = migrations.filter((m) => m.status === "applied").length;
  const errorCount = migrations.filter((m) => m.status === "error").length;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Database className="w-5 h-5 text-blue-600" />
              <div>
                <CardTitle>Gestor de Migraciones de Base de Datos</CardTitle>
                <CardDescription>
                  Gestiona y aplica migraciones SQL de Supabase
                </CardDescription>
              </div>
            </div>
            <Button
              onClick={loadMigrations}
              variant="outline"
              disabled={loading}
              className="flex items-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
              Recargar
            </Button>
          </div>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Aplicadas</p>
                <p className="text-3xl font-bold text-green-600">{appliedCount}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pendientes</p>
                <p className="text-3xl font-bold text-yellow-600">{pendingCount}</p>
              </div>
              <Clock className="w-8 h-8 text-yellow-600 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Errores</p>
                <p className="text-3xl font-bold text-red-600">{errorCount}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-600 opacity-50" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Migraciones ({migrations.length})</CardTitle>
            <div className="flex gap-2">
              <Button
                onClick={handleSelectAll}
                variant="outline"
                size="sm"
                disabled={migrations.length === 0 || applyingMigrations}
              >
                {selectedMigrations.size === migrations.length
                  ? "Deseleccionar todo"
                  : "Seleccionar todo"}
              </Button>
              <Button
                onClick={handleApplyClick}
                disabled={
                  selectedMigrations.size === 0 ||
                  applyingMigrations ||
                  loading
                }
                className="flex items-center gap-2"
              >
                {applyingMigrations && (
                  <Loader className="w-4 h-4 animate-spin" />
                )}
                Aplicar Seleccionadas ({selectedMigrations.size})
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {migrations.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-600">No se encontraron migraciones</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-8">
                      <Checkbox
                        checked={selectedMigrations.size === migrations.length}
                        onCheckedChange={() => handleSelectAll()}
                        disabled={applyingMigrations}
                      />
                    </TableHead>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Fecha Aplicación</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {migrations.map((migration) => (
                    <React.Fragment key={migration.filename}>
                      <TableRow
                        className={`${
                          migration.status === "error" ? "bg-red-50" : ""
                        }`}
                      >
                        <TableCell>
                          <Checkbox
                            checked={selectedMigrations.has(migration.filename)}
                            onCheckedChange={() =>
                              handleSelectMigration(migration.filename)
                            }
                            disabled={
                              migration.status !== "pending" ||
                              applyingMigrations
                            }
                          />
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          {migration.filename}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getStatusIcon(migration.status)}
                            {getStatusBadge(migration.status)}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-gray-600">
                          {migration.appliedAt
                            ? new Date(migration.appliedAt).toLocaleString()
                            : "-"}
                        </TableCell>
                        <TableCell>
                          {migration.status === "error" && (
                            <Collapsible
                              open={expandedMigration === migration.filename}
                              onOpenChange={(open) =>
                                setExpandedMigration(
                                  open ? migration.filename : null
                                )
                              }
                            >
                              <CollapsibleTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="w-8 h-8 p-0"
                                >
                                  {expandedMigration === migration.filename ? (
                                    <ChevronUp className="w-4 h-4" />
                                  ) : (
                                    <ChevronDown className="w-4 h-4" />
                                  )}
                                </Button>
                              </CollapsibleTrigger>
                              <CollapsibleContent>
                                <div className="text-xs text-red-600 mt-2">
                                  {migration.errorMessage}
                                </div>
                              </CollapsibleContent>
                            </Collapsible>
                          )}
                        </TableCell>
                      </TableRow>
                    </React.Fragment>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Aplicar Migraciones</AlertDialogTitle>
            <AlertDialogDescription>
              Estás a punto de aplicar {migrationsToApply.length} migración
              {migrationsToApply.length !== 1 ? "es" : ""}. Esta acción no se
              puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {migrationsToApply.map((migration) => (
              <div
                key={migration.filename}
                className="text-sm p-2 bg-gray-50 rounded"
              >
                {migration.filename}
              </div>
            ))}
          </div>
          <div className="flex gap-4 justify-end">
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={applyMigrations}
              disabled={applyingMigrations}
              className="bg-blue-600"
            >
              {applyingMigrations ? (
                <>
                  <Loader className="w-4 h-4 animate-spin mr-2" />
                  Aplicando...
                </>
              ) : (
                "Aplicar Migraciones"
              )}
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default MigrationManager;
