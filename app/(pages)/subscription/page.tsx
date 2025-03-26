import { Badge } from "@/app/_components/ui/badge";
import { ScrollArea } from "@/app/_components/ui/scroll-area";
import { getCurrentMonthTransactions } from "@/app/_data/get-month-transactions";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { CheckIcon, XIcon } from "lucide-react";
import { redirect } from "next/navigation";
import Navbar from "../../_components/navbar";
import { Card, CardContent, CardHeader } from "../../_components/ui/card";
import AquirePlanButton from "./_components/aquire-plan-button";

export const metadata = {
  title: "Assinatura",
};

const SubscriptionPage = async () => {
  const { userId } = auth();

  if (!userId) {
    redirect("/login");
  }

  const user = await clerkClient().users.getUser(userId);
  const currentMonthTransaction = await getCurrentMonthTransactions();
  const hasPremiumPlan = user?.publicMetadata.subscriptionPlan === "premium";

  return (
    <>
      <Navbar />

      <ScrollArea>
        <div className="space-y-4 p-4 sm:space-y-6 sm:p-6 sm:py-4">
          <h1 className="text-2xl font-bold">Assinatura</h1>

          <div className="flex flex-wrap justify-center gap-6 md:justify-start">
            <Card className="w-[36.53%] min-w-[345px] max-w-[450px]">
              <CardHeader className="border-b border-solid px-4 py-5 md:px-6 md:py-8">
                <h2 className="text-center text-2xl font-semibold">
                  Plano Básico
                </h2>

                <div className="flex items-center justify-center">
                  <span className="text-4xl">R$</span>
                  <span className="text-6xl font-semibold">0</span>
                  <span className="text-2xl text-muted-foreground">/mês</span>
                </div>
              </CardHeader>

              <CardContent className="space-y-5 px-4 py-5 md:space-y-6 md:px-6 md:py-8">
                <div className="flex items-center gap-2">
                  <CheckIcon className="text-primary" />

                  <p>
                    Apenas 10 transações por mês ({currentMonthTransaction}/10)
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <XIcon />
                  <p>Relatórios de IA</p>
                </div>
              </CardContent>
            </Card>

            <Card className="w-[36.53%] min-w-[345px] max-w-[450px]">
              <CardHeader className="relative border-b border-solid px-4 py-5 md:px-6 md:py-8">
                {hasPremiumPlan && (
                  <Badge className="absolute left-4 top-12 bg-primary/10 text-primary">
                    Ativo
                  </Badge>
                )}

                <h2 className="text-center text-2xl font-semibold">
                  Plano Premium
                </h2>

                <div className="flex items-center justify-center">
                  <span className="text-4xl">R$</span>
                  <span className="text-6xl font-semibold">19</span>
                  <span className="text-2xl text-muted-foreground">/mês</span>
                </div>
              </CardHeader>

              <CardContent className="space-y-5 px-4 py-5 md:space-y-6 md:px-6 md:py-8">
                <div className="flex items-center gap-2">
                  <CheckIcon className="text-primary" />
                  <p>Transações ilimitadas</p>
                </div>

                <div className="flex items-center gap-2">
                  <CheckIcon className="text-primary" />
                  <p>Relatórios de IA</p>
                </div>

                <AquirePlanButton />
              </CardContent>
            </Card>
          </div>
        </div>
      </ScrollArea>
    </>
  );
};

export default SubscriptionPage;
