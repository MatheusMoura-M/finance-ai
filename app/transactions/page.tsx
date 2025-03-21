import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import AddTransactionButton from "../_components/add-transaction-button";
import Navbar from "../_components/navbar";
import { DataTable } from "../_components/ui/data-table";
import { ScrollArea } from "../_components/ui/scroll-area";
import { db } from "../_lib/prisma";
import { transactionsColumns } from "./_columns";
import { canUserAddTransaction } from "../_data/can-user-add-transaction";

export const metadata = {
  title: "Transações",
};

const TransactionsPage = async () => {
  const { userId } = auth();

  if (!userId) {
    redirect("/login");
  }

  const transaction = await db.transaction.findMany({
    where: {
      userId,
    },
    orderBy: {
      date: "desc",
    },
  });

  const userCanAddTransaction = await canUserAddTransaction();

  return (
    <>
      <Navbar />

      <div className="flex flex-col space-y-6 overflow-hidden p-6">
        <div className="flex w-full items-center justify-between">
          <h1 className="text-2xl font-bold">Transações</h1>

          <AddTransactionButton userCanAddTransaction={userCanAddTransaction} />
        </div>

        <ScrollArea className="h-full" id="scroll-transactions">
          <DataTable
            columns={transactionsColumns}
            data={JSON.parse(JSON.stringify(transaction))}
          />
        </ScrollArea>
      </div>
    </>
  );
};

export default TransactionsPage;
