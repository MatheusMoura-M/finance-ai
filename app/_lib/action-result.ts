import { ZodError } from "zod";

/**
 * Resposta padrão das server actions. Em produção o Next esconde a mensagem
 * de erros lançados, então as actions retornam o erro em vez de lançar.
 */
export type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string };

/** Erro com mensagem que pode ser mostrada ao usuário. */
export class ActionError extends Error {}

export const UNEXPECTED_ERROR_MESSAGE =
  "Ocorreu um erro inesperado. Tente novamente.";

export const runAction = async <T>(
  action: () => Promise<T>,
): Promise<ActionResult<T>> => {
  try {
    return { success: true, data: await action() };
  } catch (error) {
    if (error instanceof ActionError) {
      return { success: false, error: error.message };
    }

    if (error instanceof ZodError) {
      return { success: false, error: "Dados inválidos." };
    }

    console.error("[action]", error);

    return { success: false, error: UNEXPECTED_ERROR_MESSAGE };
  }
};
