// @ts-nocheck
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

interface ExitConfirmationDialogProps {
  isOpen: boolean;
  onCancel: () => void;
  onExit: () => void;
  onSave: () => void;
}

export const ExitConfirmationDialog = ({
  isOpen,
  onCancel,
  onExit,
  onSave,
}: ExitConfirmationDialogProps) => {
  return (
    <AlertDialog open={isOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            ¿Deseas salir del formulario?
          </AlertDialogTitle>
          <AlertDialogDescription>
            Si sales ahora sin guardar, perderás los cambios no guardados. Puedes guardar
            tu progreso en el almacenamiento local del navegador o salir sin guardar.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="flex flex-col gap-3 mt-4">
          <Button
            variant="outline"
            onClick={onCancel}
            className="w-full"
          >
            Continuar completando
          </Button>
          <Button
            variant="default"
            onClick={onSave}
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            Guardar progreso localmente
          </Button>
          <Button
            variant="destructive"
            onClick={onExit}
            className="w-full"
          >
            Salir sin guardar
          </Button>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
};
