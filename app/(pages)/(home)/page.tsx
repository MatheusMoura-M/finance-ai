import Navbar from "@/app/_components/navbar";
import { ScrollArea } from "@/app/_components/ui/scroll-area";
import { canUserAddTransaction } from "@/app/_data/can-user-add-transaction";
import { getDashboard } from "@/app/_data/get-dashboard";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { isMatch } from "date-fns";
import { redirect } from "next/navigation";
import AiReportButton from "./_components/ai-report-button";
import ExpensesPerCategory from "./_components/expenses-per-category";
import LastTransactions from "./_components/last-transactions";
import SummaryCards from "./_components/summary-cards";
import TimeSelect from "./_components/time-select";
import TransactionsPieChart from "./_components/transactions-pie-chart";

export const metadata = {
  title: "Painel",
};

interface HomeProps {
  searchParams: {
    month: string;
  };
}

const Home = async ({ searchParams: { month } }: HomeProps) => {
  const { userId } = auth();

  if (!userId) {
    redirect("/login");
  }

  const monthIsInvalid = !month || !isMatch(month, "MM");

  if (monthIsInvalid) {
    const dateFormatted = String(new Date().getMonth() + 1).padStart(2, "0");

    redirect(`?month=${dateFormatted}`);
  }

  const dashboard = await getDashboard(month);

  const userCanAddTransaction = await canUserAddTransaction();
  const user = await clerkClient().users.getUser(userId);

  return (
    <>
      <Navbar />

      <ScrollArea>
        <div className="flex h-full flex-col space-y-5 p-4 pb-4 pt-3 sm:p-6">
          <div className="flex justify-between">
            <h1 className="text-2xl font-bold">Dashboard</h1>

            <div className="flex items-center gap-3">
              <AiReportButton
                month={month}
                hasPremiumPlan={
                  user.publicMetadata.subscriptionPlan === "premium"
                }
              />

              <TimeSelect />
            </div>
          </div>

          <div className="grid h-full grid-cols-1 gap-3 sm:gap-5 lg:gap-6 sm2:grid-cols-[2fr,1fr]">
            <div className="flex flex-col gap-5 overflow-hidden">
              <SummaryCards
                month={month}
                {...dashboard}
                userCanAddTransaction={userCanAddTransaction}
              />

              <div className="grid grid-cols-1 gap-5 sm:h-full sm:overflow-hidden lg:max-h-[325px] lg:grid-cols-3 xl:grid-rows-1">
                <TransactionsPieChart {...dashboard} />

                <ExpensesPerCategory
                  expensesPerCategory={dashboard.totalExpensePerCategory}
                />
              </div>
            </div>

            <LastTransactions lastTransactions={dashboard.lastTransactions} />
          </div>
        </div>
      </ScrollArea>
    </>
  );
};

export default Home;
