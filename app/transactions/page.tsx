import { DataTable } from "../_components/ui/data-table";
import { db } from "../_lib/prisma";
import { transactionsColumns } from "./_columns";
import AddTransactionButton from "../_components/add-transaction-button";
import Navbar from "../_components/navbar";
import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";

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

      <div className="flex flex-col space-y-6 overflow-hidden p-6">
        <div className="flex w-full items-center justify-between">
          <h1 className="text-2xl font-bold">Transações</h1>

          <AddTransactionButton />
        </div>

        <DataTable
          columns={transactionsColumns}
          data={JSON.parse(JSON.stringify(transaction))}
        />
      </div>
    </>
  );
};

export default TransactionsPage;
