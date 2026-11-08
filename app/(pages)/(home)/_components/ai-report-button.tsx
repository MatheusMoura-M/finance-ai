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
import { ScrollArea } from "@/app/_components/ui/scroll-area";
import { UNEXPECTED_ERROR_MESSAGE } from "@/app/_lib/action-result";
import type { AiReportUsage } from "@/app/_lib/ai-report/usage";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { BotIcon, Loader2Icon, RefreshCwIcon } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import Markdown from "react-markdown";
import { toast } from "sonner";
import { getSavedAiReport } from "../_actions/get-saved-ai-report";

interface AiReportButtonProps {
  month: string;
  year: number;
  hasPremiumPlan: boolean;
}

type Status = "idle" | "loading" | "streaming";

const AiReportButton = ({
  month,
  year,
  hasPremiumPlan,
}: AiReportButtonProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [status, setStatus] = useState<Status>("idle");
  const [report, setReport] = useState<string | null>(null);
  const [generatedAt, setGeneratedAt] = useState<Date | null>(null);
  const [usage, setUsage] = useState<AiReportUsage | null>(null);

  // Ignora respostas que chegam depois de trocar de mês/ano.
  const requestId = useRef(0);
  const abortController = useRef<AbortController | null>(null);

  const periodLabel = format(
    new Date(year, Number(month) - 1, 1),
    "MMMM 'de' yyyy",
    { locale: ptBR },
  );

  const loadSavedReport = useCallback(async () => {
    const id = ++requestId.current;
    setStatus("loading");

    try {
      const result = await getSavedAiReport({ month, year });

      if (id !== requestId.current) return;

      if (!result.success) {
        toast.error(result.error);
        return;
      }

      setReport(result.data.report?.content ?? null);
      setGeneratedAt(
        result.data.report ? new Date(result.data.report.createdAt) : null,
      );
      setUsage(result.data.usage);
    } catch (error) {
      console.error(error);

      if (id === requestId.current) toast.error(UNEXPECTED_ERROR_MESSAGE);
    } finally {
      if (id === requestId.current) setStatus("idle");
    }
  }, [month, year]);

  // Trocar de mês/ano limpa o relatório anterior (ajuste durante a renderização,
  // padrão recomendado pelo React em vez de setState dentro de um efeito).
  const period = `${month}-${year}`;
  const [shownPeriod, setShownPeriod] = useState(period);

  if (shownPeriod !== period) {
    setShownPeriod(period);
    setReport(null);
    setGeneratedAt(null);
    setStatus("idle");
  }

  // ...e interrompe uma geração em andamento (efeito sem setState).
  useEffect(() => {
    requestId.current++;
    abortController.current?.abort();
  }, [period]);

  // Ao abrir a janela, carrega o relatório salvo do mês.
  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);

    if (open && hasPremiumPlan) {
      loadSavedReport();
    }
  };

  const handleGenerateReportClick = async () => {
    const id = ++requestId.current;
    const controller = new AbortController();
    abortController.current = controller;

    setStatus("streaming");
    setReport("");
    setGeneratedAt(null);

    try {
      const response = await fetch("/api/ai-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ month, year }),
        signal: controller.signal,
      });

      if (!response.ok || !response.body) {
        const body = await response.json().catch(() => null);

        toast.error(body?.error ?? UNEXPECTED_ERROR_MESSAGE);
        await loadSavedReport();
        return;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let text = "";

      for (;;) {
        const { done, value } = await reader.read();

        if (done) break;
        if (id !== requestId.current) return;

        text += decoder.decode(value, { stream: true });
        setReport(text);
      }

      text += decoder.decode();
      setReport(text);
      setGeneratedAt(new Date());
      setUsage((current) =>
        current
          ? {
              ...current,
              used: current.used + 1,
              remaining: Math.max(0, current.remaining - 1),
            }
          : current,
      );
    } catch (error) {
      if (controller.signal.aborted) return;

      console.error(error);
      toast.error("A geração foi interrompida. Tente novamente.");
      await loadSavedReport();
    } finally {
      if (id === requestId.current) setStatus("idle");
    }
  };

  const isStreaming = status === "streaming";
  const isLoading = status === "loading";
  const limitReached = usage?.remaining === 0;

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="h-9 flex-1 px-3 md:h-10 md:flex-none md:border-transparent md:px-4"
        >
          Relatório IA <BotIcon />
        </Button>
      </DialogTrigger>

      {hasPremiumPlan ? (
        <DialogContent className="max-w-160">
          <DialogHeader>
            <DialogTitle>Relatório IA de {periodLabel}</DialogTitle>

            <DialogDescription>
              {generatedAt
                ? `Gerado em ${format(generatedAt, "dd/MM/yyyy 'às' HH:mm")}.`
                : "Use inteligência artificial para gerar um relatório com insights sobre suas finanças deste mês."}
            </DialogDescription>
          </DialogHeader>

          {isLoading ? (
            <div className="flex h-32 items-center justify-center text-muted-foreground">
              <Loader2Icon className="animate-spin" aria-hidden />
              <span className="sr-only">Carregando relatório</span>
            </div>
          ) : report ? (
            <ScrollArea
              className="prose max-h-112.5 text-foreground dark:prose-invert"
              aria-live="polite"
              aria-busy={isStreaming}
            >
              <Markdown>{report}</Markdown>
            </ScrollArea>
          ) : (
            <p className="py-6 text-center text-sm text-muted-foreground">
              {isStreaming
                ? "Analisando suas transações…"
                : "Nenhum relatório gerado para este mês ainda."}
            </p>
          )}

          <DialogFooter className="items-center gap-2 sm:justify-between sm:space-x-0">
            <p className="text-xs text-muted-foreground">
              {usage &&
                (limitReached
                  ? `Você usou os ${usage.limit} relatórios das últimas 24 horas.`
                  : `Restam ${usage.remaining} de ${usage.limit} relatórios nas próximas 24 horas.`)}
            </p>

            <div className="flex gap-2">
              <DialogClose asChild>
                <Button variant="ghost">Fechar</Button>
              </DialogClose>

              <Button
                onClick={handleGenerateReportClick}
                disabled={isStreaming || isLoading || limitReached}
              >
                {isStreaming ? (
                  <Loader2Icon className="animate-spin" aria-hidden />
                ) : (
                  generatedAt && <RefreshCwIcon aria-hidden />
                )}
                {isStreaming
                  ? "Gerando…"
                  : generatedAt
                    ? "Gerar novamente"
                    : "Gerar relatório"}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      ) : (
        <DialogContent className="max-w-150">
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
