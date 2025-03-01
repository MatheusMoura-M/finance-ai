import { DataTable } from "../_components/ui/data-table";
import { db } from "../_lib/prisma";
import { transactionsColumns } from "./_columns";
import { Button } from "../_components/ui/button";
import { ArrowDownUp } from "lucide-react";

const TransactionsPage = async () => {
  const transaction = await db.transaction.findMany({});

  return (
    <div className="flex flex-col space-y-6 overflow-hidden p-6">
      <div className="flex w-full items-center justify-between">
        <h1 className="text-2xl font-bold">Transações</h1>

        <Button className="rounded-full font-bold">
          Adicionar transação
          <ArrowDownUp />
        </Button>
      </div>

      <DataTable
        columns={transactionsColumns}
        data={JSON.parse(JSON.stringify(transaction))}
      />
    </div>
  );
};

export default TransactionsPage;
