/**
 * Decide o que fazer com um campo (categoria ou forma de pagamento) quando a
 * sugestão muda enquanto o usuário digita o nome:
 * - se o usuário já escolheu o campo na mão, nunca mexe;
 * - se há sugestão, preenche;
 * - se não há mais sugestão e o valor atual foi preenchido pelo app,
 *   volta para o padrão (não deixa uma sugestão velha para trás).
 */
export const decideAutoFill = <T>({
  touched,
  suggested,
  current,
  lastAutoFilled,
  fallback,
}: {
  touched: boolean;
  suggested: T | null;
  current: T;
  lastAutoFilled: T | null;
  fallback: T;
}): { value: T; lastAutoFilled: T | null } => {
  if (touched) {
    return { value: current, lastAutoFilled: null };
  }

  if (suggested !== null) {
    return { value: suggested, lastAutoFilled: suggested };
  }

  if (lastAutoFilled !== null && current === lastAutoFilled) {
    return { value: fallback, lastAutoFilled: null };
  }

  return { value: current, lastAutoFilled };
};
