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
  Loader,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useSupabaseMigrations } from "@/hooks/useSupabaseMigrations";

const MigrationManager = () => {
  const { toast } = useToast();
  const {
    migrations,
    stats,
    loading,
    error,
    loadMigrations,
    applyMigrations,
  } = useSupabaseMigrations();

  const [applyingMigrations, setApplyingMigrations] = useState(false);
  const [selectedMigrations, setSelectedMigrations] = useState<Set<string>>(
    new Set()
  );
  const [expandedMigration, setExpandedMigration] = useState<string | null>(
    null
  );
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [migrationsToApply, setMigrationsToApply] = useState<string[]>([]);

  useEffect(() => {
    loadMigrations();
  }, [loadMigrations]);

  // Mostrar error si existe
  useEffect(() => {
    if (error) {
      toast({
        title: "Error al cargar migraciones",
        description: error,
        variant: "destructive",
      });
    }
  }, [error, toast]);

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

    setMigrationsToApply(pendingSelected.map((m) => m.name));
    setShowConfirmDialog(true);
  };

  const handleApplyMigrations = async () => {
    setShowConfirmDialog(false);
    setApplyingMigrations(true);

    try {
      const result = await applyMigrations(migrationsToApply);

      toast({
        title: "Aplicación de Migraciones Completada",
        description: `${result.success} aplicadas, ${result.failed} errores`,
        variant: result.success > 0 ? "default" : "destructive",
      });

      setSelectedMigrations(new Set());
      setMigrationsToApply([]);

      // Recargar migraciones para actualizar estado
      setTimeout(() => {
        loadMigrations();
      }, 1000);
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
              onClick={() => loadMigrations()}
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
                <p className="text-3xl font-bold text-green-600">{stats.applied}</p>
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
                <p className="text-3xl font-bold text-yellow-600">{stats.pending}</p>
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
                <p className="text-3xl font-bold text-red-600">{stats.errors}</p>
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
