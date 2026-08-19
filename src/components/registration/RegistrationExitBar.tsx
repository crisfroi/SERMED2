import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Home, Repeat } from "lucide-react";
import {
  clearProgress,
  releaseActiveType,
  saveProgress,
  type DraftScope,
} from "@/utils/registrationDrafts";
import { useToast } from "@/hooks/use-toast";

interface Props {
  scope: DraftScope;
  tipo: string;
  tipoLabel?: string;
  /** Se llama tras salir para que la página vuelva al selector de tipo. */
  onExit: () => void;
}

const RegistrationExitBar = ({ scope, tipo, tipoLabel, onExit }: Props) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [open, setOpen] = React.useState(false);
  const [target, setTarget] = React.useState<"home" | "tipo">("home");

  const finish = (guardar: boolean) => {
    if (guardar) {
      saveProgress(scope, tipo);
      releaseActiveType(scope);
      toast({
        title: "Progreso guardado",
        description: `Podrá retomar el trámite «${tipoLabel || tipo}» exactamente donde lo dejó.`,
      });
    } else {
      clearProgress(scope, tipo);
      toast({ title: "Progreso descartado", description: "Se ha limpiado el formulario." });
    }
    setOpen(false);
    onExit();
    if (target === "home") navigate("/");
  };

  const ask = (to: "home" | "tipo") => {
    setTarget(to);
    setOpen(true);
  };

  return (
    <>
      <div className="sticky top-0 z-30 border-b bg-white/95 backdrop-blur">
        <div className="container mx-auto flex flex-wrap items-center justify-between gap-2 px-4 py-3">
          <div className="flex items-center gap-2">
            <Badge variant="outline">Trámite: {tipoLabel || tipo}</Badge>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => ask("tipo")}>
              <Repeat className="mr-2 h-4 w-4" />
              Cambiar tipo de trámite
            </Button>
            <Button variant="outline" size="sm" onClick={() => ask("home")}>
              <Home className="mr-2 h-4 w-4" />
              Volver al inicio
            </Button>
          </div>
        </div>
      </div>

      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Desea guardar el progreso?</AlertDialogTitle>
            <AlertDialogDescription>
              Si guarda, el progreso quedará asociado al trámite «{tipoLabel || tipo}» y se
              restaurará cuando vuelva a seleccionar ese mismo tipo. Si no guarda, se limpiará
              todo el formulario.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Seguir editando</AlertDialogCancel>
            <Button variant="destructive" onClick={() => finish(false)}>
              No guardar y limpiar
            </Button>
            <AlertDialogAction onClick={() => finish(true)}>Guardar progreso</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default RegistrationExitBar;
