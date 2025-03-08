import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import AddTransactionButton from "../_components/add-transaction-button";
import Navbar from "../_components/navbar";
import { DataTable } from "../_components/ui/data-table";
import { ScrollArea } from "../_components/ui/scroll-area";
import { db } from "../_lib/prisma";
import { transactionsColumns } from "./_columns";

const TransactionsPage = async () => {
  const { userId } = auth();

  if (!userId) {
    redirect("/login");
  }

  const transaction = await db.transaction.findMany({
    where: {
      userId,
    },
  });

  return (
    <>
      <Navbar />

      <div className="space-y-6 overflow-hidden p-6">
        <div className="flex w-full items-center justify-between">
          <h1 className="text-2xl font-bold">Transações</h1>

          <AddTransactionButton />
        </div>

        <ScrollArea>
          <DataTable columns={transactionsColumns} data={transaction} />
        </ScrollArea>
      </div>
    </>
  );
};

export default TransactionsPage;
