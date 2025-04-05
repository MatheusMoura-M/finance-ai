import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import AddTransactionButton from "../_components/add-transaction-button";
import Navbar from "../_components/navbar";
import { DataTable } from "../_components/ui/data-table";
import { canUserAddTransaction } from "../_data/can-user-add-transaction";
import { db } from "../_lib/prisma";
import { transactionsColumns } from "./_columns";

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

  const oldestTransaction = await db.transaction.findFirst({
    orderBy: { date: "asc" },
    select: { date: true },
  });

  const newestTransaction = await db.transaction.findFirst({
    orderBy: { date: "desc" },
    select: { date: true },
  });

  const firstAndLastTransactionDate = {
    oldestTransaction:
      oldestTransaction?.date ?? new Date(new Date().getFullYear(), 0, 1),
    newestTransaction: newestTransaction?.date ?? new Date(),
  };

  const userCanAddTransaction = await canUserAddTransaction();

  return (
    <>
      <Navbar />

      <div className="flex flex-col space-y-4 overflow-hidden p-4 pt-3 sm:space-y-6 sm:px-6 sm:py-4">
        <div className="flex w-full items-center justify-between">
          <h1 className="text-2xl font-bold">Transações</h1>

          <AddTransactionButton userCanAddTransaction={userCanAddTransaction} />
        </div>

        <DataTable
          columns={transactionsColumns}
          data={JSON.parse(JSON.stringify(transaction))}
          firstAndLastTransactionDate={firstAndLastTransactionDate}
        />
      </div>
    </>
  );
};

export default TransactionsPage;
