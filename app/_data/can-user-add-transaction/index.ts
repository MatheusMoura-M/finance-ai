import { getCurrentMonthTransactions } from "../get-month-transactions";
import { getUserSubscription } from "../get-user-subscription";

export const FREE_PLAN_MONTHLY_TRANSACTIONS_LIMIT = 10;

export const canUserAddTransaction = async () => {
  const { hasPremiumPlan } = await getUserSubscription();

  if (hasPremiumPlan) {
    return true;
  }

  const currentMonthTransactions = await getCurrentMonthTransactions();

  return currentMonthTransactions < FREE_PLAN_MONTHLY_TRANSACTIONS_LIMIT;
};
