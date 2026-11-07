"use client";

import { getSuggestionHistory } from "@/app/_actions/get-suggestion-history";
import { decideAutoFill } from "@/app/_lib/categorize/auto-fill";
import {
  HistoryIndex,
  SuggestionSource,
  suggestForName,
} from "@/app/_lib/categorize/suggest";
import type { tFormSchema } from "@/app/(pages)/transactions/_schema";
import { TransactionCategory, TransactionPaymentMethod } from "@prisma/client";
import { useCallback, useEffect, useRef, useState } from "react";
import { UseFormReturn } from "react-hook-form";

type SuggestedField = "category" | "paymentMethod";

const FALLBACK = {
  category: TransactionCategory.OTHER,
  paymentMethod: TransactionPaymentMethod.OTHER,
} as const;

const NAME_DEBOUNCE_MS = 250;

/**
 * Sugere categoria e forma de pagamento a partir do nome digitado (histórico
 * do usuário + palavras-chave, sem IA). Só preenche os campos que o usuário
 * ainda não escolheu na mão.
 */
export const useTransactionSuggestions = ({
  form,
  enabled,
  isOpen,
}: {
  form: UseFormReturn<tFormSchema>;
  enabled: boolean;
  isOpen: boolean;
}) => {
  const [history, setHistory] = useState<HistoryIndex>(new Map());
  const [sources, setSources] = useState<
    Record<SuggestedField, SuggestionSource | null>
  >({ category: null, paymentMethod: null });

  const touched = useRef<Record<SuggestedField, boolean>>({
    category: false,
    paymentMethod: false,
  });
  const lastAutoFilled = useRef<Record<SuggestedField, string | null>>({
    category: null,
    paymentMethod: null,
  });

  // Ao abrir o formulário, as dicas da vez anterior somem (ajuste durante a
  // renderização, padrão recomendado pelo React em vez de setState no efeito).
  const isActive = isOpen && enabled;
  const [wasActive, setWasActive] = useState(isActive);

  if (wasActive !== isActive) {
    setWasActive(isActive);
    if (isActive) setSources({ category: null, paymentMethod: null });
  }

  // Ao abrir: zera o controle interno e carrega o histórico uma vez.
  useEffect(() => {
    if (!isActive) return;

    touched.current = { category: false, paymentMethod: false };
    lastAutoFilled.current = { category: null, paymentMethod: null };

    let cancelled = false;

    getSuggestionHistory()
      .then((result) => {
        if (!cancelled && result.success) setHistory(new Map(result.data));
      })
      .catch((error) => console.error(error));

    return () => {
      cancelled = true;
    };
  }, [isActive]);

  const name = form.watch("name");

  useEffect(() => {
    if (!isOpen || !enabled) return;

    const timeout = setTimeout(() => {
      const suggestion = suggestForName(name ?? "", history);

      const apply = (
        field: SuggestedField,
        suggested: string | null,
        source: SuggestionSource | null,
      ) => {
        const decision = decideAutoFill<string>({
          touched: touched.current[field],
          suggested,
          current: form.getValues(field),
          lastAutoFilled: lastAutoFilled.current[field],
          fallback: FALLBACK[field],
        });

        lastAutoFilled.current[field] = decision.lastAutoFilled;

        if (decision.value !== form.getValues(field)) {
          form.setValue(field, decision.value as never, { shouldDirty: true });
        }

        if (!touched.current[field]) {
          setSources((current) => ({
            ...current,
            [field]: decision.lastAutoFilled ? source : null,
          }));
        }
      };

      apply("category", suggestion.category, suggestion.categorySource);
      apply(
        "paymentMethod",
        suggestion.paymentMethod,
        suggestion.paymentMethodSource,
      );
    }, NAME_DEBOUNCE_MS);

    return () => clearTimeout(timeout);
  }, [name, history, isOpen, enabled, form]);

  /** Chamar quando o usuário escolhe o campo na mão: a partir daí não mexemos. */
  const markTouched = useCallback((field: SuggestedField) => {
    touched.current[field] = true;
    lastAutoFilled.current[field] = null;
    setSources((current) => ({ ...current, [field]: null }));
  }, []);

  return { sources, markTouched };
};
