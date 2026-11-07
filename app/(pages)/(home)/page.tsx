import Navbar from "@/app/_components/navbar";
import { ScrollArea } from "@/app/_components/ui/scroll-area";
import { canUserAddTransaction } from "@/app/_data/can-user-add-transaction";
import { getDashboard } from "@/app/_data/get-dashboard";
import { getUserSubscription } from "@/app/_data/get-user-subscription";
import { auth } from "@clerk/nextjs/server";
import { isMatch } from "date-fns";
import { redirect } from "next/navigation";
import AiReportButton from "./_components/ai-report-button";
import ExpensesPerCategory from "./_components/expenses-per-category";
import LastTransactions from "./_components/last-transactions";
import SummaryCards from "./_components/summary-cards";
import TimeSelect from "./_components/time-select";
import TransactionsPieChart from "./_components/transactions-pie-chart";
import { getAvailableYears } from "@/app/_data/get-available-years";
import { getYearlyEvolution } from "@/app/_data/get-yearly-evolution";
import { getMonthBudgets } from "@/app/_data/get-month-budgets";
import { ensureRecurringTransactions } from "@/app/_data/ensure-recurring-transactions";
import MonthlyEvolutionChart from "./_components/monthly-evolution-chart";
import PremiumDownloadButton from "@/app/_components/premium-download-button";
import { FileDownIcon } from "lucide-react";

export const metadata = {
  title: "Painel",
};

interface HomeProps {
  searchParams: {
    month: string;
    year: string;
  };
}

const Home = async ({ searchParams: { month, year } }: HomeProps) => {
  const { userId } = await auth();

  if (!userId) {
    redirect("/login");
  }

  const monthIsInvalid = !month || !isMatch(month, "MM");
  const currentYear = new Date().getFullYear();
  const parsedYear = Number(year);
  const selectedYear =
    Number.isInteger(parsedYear) && parsedYear >= 1900 && parsedYear <= 2100
      ? parsedYear
      : currentYear;

  if (monthIsInvalid) {
    const dateFormatted = String(new Date().getMonth() + 1).padStart(2, "0");

    redirect(`?month=${dateFormatted}&year=${selectedYear}`);
  }

  // Cria antes as transações recorrentes que faltam, para já aparecerem nos números.
  await ensureRecurringTransactions();

  const [
    dashboard,
    userCanAddTransaction,
    { hasPremiumPlan },
    availableYears,
    yearlyEvolution,
    monthBudgets,
  ] = await Promise.all([
    getDashboard(month, selectedYear),
    canUserAddTransaction(),
    getUserSubscription(),
    getAvailableYears(),
    getYearlyEvolution(selectedYear),
    getMonthBudgets(Number(month), selectedYear),
  ]);

  return (
    <>
      <Navbar />

      <ScrollArea>
        <div className="flex h-full flex-col space-y-5 p-4 pb-4 pt-3 sm:p-6 sm:py-4">
          {/* Mobile: título, depois Relatório IA + PDF, depois o calendário. A partir do md, tudo numa linha. */}
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <h1 className="text-2xl font-bold lg:text-3xl">Dashboard</h1>

            <div className="flex flex-col gap-2 md:flex-row md:items-center md:gap-3">
              <div className="flex gap-2 md:gap-3">
                <AiReportButton
                  month={month}
                  year={selectedYear}
                  hasPremiumPlan={hasPremiumPlan}
                />

                <PremiumDownloadButton
                  href={`/api/reports/month?month=${month}&year=${selectedYear}`}
                  fallbackFileName={`relatorio-${month}-${selectedYear}.pdf`}
                  variant="outline"
                  className="h-9 flex-1 px-3 md:h-10 md:flex-none md:border-transparent md:px-4"
                  premiumMessage="O relatório em PDF é um recurso do Plano Premium."
                >
                  PDF do mês <FileDownIcon aria-hidden />
                </PremiumDownloadButton>
              </div>

              <TimeSelect availableYears={availableYears} />
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
                  budgets={monthBudgets.effective}
                  month={Number(month)}
                  year={selectedYear}
                />
              </div>
            </div>

            <LastTransactions lastTransactions={dashboard.lastTransactions} />
          </div>

          <MonthlyEvolutionChart
            data={yearlyEvolution}
            year={selectedYear}
            selectedMonth={Number(month)}
          />
        </div>
      </ScrollArea>
    </>
  );
};

export default Home;
