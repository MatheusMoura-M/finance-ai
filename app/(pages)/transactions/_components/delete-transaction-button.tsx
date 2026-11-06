import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/app/_components/ui/alert-dialog";
import { Button, buttonVariants } from "@/app/_components/ui/button";
import { cn } from "@/app/_lib/utils";
import { TrashIcon } from "lucide-react";
import { deleteTransaction } from "../_actions/delete-transactions";
import { toast } from "sonner";

interface DeleteTransactionButtonProps {
  transactionId: string;
  transactionName: string;
  /** Total de parcelas, quando a transação é parte de uma compra parcelada. */
  installmentTotal?: number | null;
}

type Scope = "single" | "allInstallments";

const DeleteTransactionButton = ({
  transactionId,
  transactionName,
  installmentTotal,
}: DeleteTransactionButtonProps) => {
  const isInstallment = Boolean(installmentTotal);

  const handleConfirmDeleteClick = async (scope: Scope) => {
    try {
      const result = await deleteTransaction({ transactionId, scope });

      if (!result.success) {
        toast.error(result.error);
        return;
      }

      toast.success(
        scope === "allInstallments"
          ? `${result.data.deleted} parcelas deletadas com sucesso!`
          : "Transação deletada com sucesso!",
      );
    } catch (error) {
      toast.error("Ocorreu um erro ao deletar transação.");
      console.error(error);
    }
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="text-muted-foreground"
          aria-label={`Deletar ${transactionName}`}
        >
          <TrashIcon />
        </Button>
      </AlertDialogTrigger>

      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {isInstallment
              ? `Excluir "${transactionName}"?`
              : "Você realmente deseja deletar essa transação?"}
          </AlertDialogTitle>

          <AlertDialogDescription>
            {isInstallment
              ? "Essa transação faz parte de uma compra parcelada. Essa ação não pode ser desfeita."
              : "Essa ação não pode ser desfeita."}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>

          {isInstallment ? (
            <>
              <AlertDialogAction
                // O AlertDialogAction já vem com o estilo padrão (texto escuro);
                // aqui o fundo é escuro, então o texto volta para a cor normal.
                className={cn(
                  buttonVariants({ variant: "outline" }),
                  "text-foreground",
                )}
                onClick={() => handleConfirmDeleteClick("single")}
              >
                Só esta parcela
              </AlertDialogAction>
              <AlertDialogAction
                className={buttonVariants({ variant: "destructive" })}
                onClick={() => handleConfirmDeleteClick("allInstallments")}
              >
                Todas as {installmentTotal} parcelas
              </AlertDialogAction>
            </>
          ) : (
            <AlertDialogAction
              onClick={() => handleConfirmDeleteClick("single")}
            >
              Continuar
            </AlertDialogAction>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default DeleteTransactionButton;
