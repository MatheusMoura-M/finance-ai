import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import AddTransactionButton from "@/app/_components/add-transaction-button";
import Navbar from "@/app/_components/navbar";
import { DataTable } from "@/app/_components/ui/data-table";
import { canUserAddTransaction } from "@/app/_data/can-user-add-transaction";
import { getTransactions } from "@/app/_data/get-transactions";
import { parseTransactionsSearchParams } from "@/app/_data/get-transactions/search-params";
import { transactionsColumns } from "./_columns";

export const metadata = {
  title: "Transações",
};

interface TransactionsPageProps {
  searchParams: Record<string, string | string[] | undefined>;
}

const TransactionsPage = async ({ searchParams }: TransactionsPageProps) => {
  const { userId } = await auth();

  if (!userId) {
    redirect("/login");
  }

  const query = parseTransactionsSearchParams(searchParams);

  const [result, userCanAddTransaction] = await Promise.all([
    getTransactions(query),
    canUserAddTransaction(),
  ]);

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
          data={result.transactions}
          total={result.total}
          pageCount={result.pageCount}
          query={{ ...query, page: result.page }}
          facets={result.facets}
          firstAndLastTransactionDate={{
            oldestTransaction: result.oldestTransactionDate,
            newestTransaction: result.newestTransactionDate,
          }}
        />
      </div>
    </>
  );
};

export default TransactionsPage;
