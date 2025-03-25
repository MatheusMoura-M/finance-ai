"use client";

import { ArrowDownUpIcon, PlusIcon } from "lucide-react";
import { useState } from "react";
import { Button } from "./ui/button";
import UpsertTransactionDialog from "./upsert-transaction-dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip";

interface AddTransactionButtonProps {
  userCanAddTransaction?: boolean;
  isHomePage?: boolean;
}

const AddTransactionButton = ({
  userCanAddTransaction,
  isHomePage,
}: AddTransactionButtonProps) => {
  const [dialogIsOpen, setDialogIsOpen] = useState(false);

  return (
    <>
      <TooltipProvider>
        <Tooltip>
          {isHomePage ? (
            <TooltipTrigger asChild>
              <div>
                <Button
                  className="hidden rounded-full md2:inline-flex"
                  onClick={() => setDialogIsOpen(true)}
                  disabled={!userCanAddTransaction}
                >
                  Adicionar Transação <ArrowDownUpIcon />
                </Button>

                {/* BTN MOBILE */}
                <Button
                  className="inline-flex h-10 w-10 rounded-full p-0 md2:hidden [&>svg]:!h-5 [&>svg]:!w-5"
                  onClick={() => setDialogIsOpen(true)}
                  disabled={!userCanAddTransaction}
                >
                  <PlusIcon />
                </Button>
              </div>
            </TooltipTrigger>
          ) : (
            <TooltipTrigger asChild>
              <Button
                className="rounded-full"
                onClick={() => setDialogIsOpen(true)}
                disabled={!userCanAddTransaction}
              >
                Adicionar Transação <ArrowDownUpIcon />
              </Button>
            </TooltipTrigger>
          )}
          <TooltipContent>
            {!userCanAddTransaction &&
              "Você atingiu seu limite de transações, Atualize seu plano para criar transacções ilimitadas"}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <UpsertTransactionDialog
        isOpen={dialogIsOpen}
        setIsOpen={setDialogIsOpen}
      />
    </>
  );
};

export default AddTransactionButton;
