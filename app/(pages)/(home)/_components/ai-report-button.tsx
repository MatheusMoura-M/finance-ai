"use client";
import { Button } from "@/app/_components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/app/_components/ui/dialog";
import { BotIcon, Loader2Icon } from "lucide-react";
import { generateAiReport } from "../_actions/generate-ai-report";
import { useState } from "react";
import { ScrollArea } from "@/app/_components/ui/scroll-area";
import Markdown from "react-markdown";
import Link from "next/link";

interface AiReportButtonProps {
  month: string;
  hasPremiumPlan: boolean;
}

const AiReportButton = ({ month, hasPremiumPlan }: AiReportButtonProps) => {
  const [report, setReport] = useState<string | null>(null);
  const [reportIsLoading, setReportIsLoading] = useState(false);

  const handleGenerateReportClick = async () => {
    try {
      setReportIsLoading(true);

      const aiReport = await generateAiReport({ month });

      setReport(aiReport);
    } catch (error) {
      console.log(error);
    } finally {
      setReportIsLoading(false);
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant={"ghost"}
          className="h-7 px-2 py-0 xs:h-10 xs:px-4 xs:py-2"
        >
          Relatório IA <BotIcon />
        </Button>
      </DialogTrigger>

      {hasPremiumPlan ? (
        <DialogContent className="max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Relatório IA</DialogTitle>

            <DialogDescription>
              Use inteligência Artificial para gerar um relatório com insights
              sobre suas finanças.
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="prose max-h-[450px] text-white prose-h3:text-white prose-h4:text-white prose-strong:text-white">
            <Markdown>{report}</Markdown>
          </ScrollArea>

          <DialogFooter>
            <DialogClose asChild>
              <Button variant="ghost">Cancelar</Button>
            </DialogClose>

            <Button
              onClick={handleGenerateReportClick}
              disabled={reportIsLoading}
            >
              {reportIsLoading && <Loader2Icon className="animate-spin" />}
              Gerar relatório
            </Button>
          </DialogFooter>
        </DialogContent>
      ) : (
        <DialogContent className="max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Relatório IA</DialogTitle>

            <DialogDescription>
              Você precisa de um Plano Premium para gerar relatórios com IA.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <DialogClose asChild>
              <Button variant={"ghost"}>Cancelar</Button>
            </DialogClose>
            <Button asChild>
              <Link href="/subscription">Assinar Plano Premium</Link>
            </Button>
          </DialogFooter>
        </DialogContent>
      )}
    </Dialog>
  );
};

export default AiReportButton;
