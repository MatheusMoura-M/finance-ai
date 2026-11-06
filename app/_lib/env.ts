import { z } from "zod";

// Variáveis vazias ("") contam como não definidas.
const required = z.preprocess(
  (value) => (value === "" ? undefined : value),
  z.string({ required_error: "não definida" }),
);

const optional = z.preprocess(
  (value) => (value === "" ? undefined : value),
  z.string().optional(),
);

const serverEnvSchema = z.object({
  DATABASE_URL: required,
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: required,
  CLERK_SECRET_KEY: required,
  STRIPE_SECRET_KEY: required,
  STRIPE_WEBHOOK_SECRET: required,
  STRIPE_PREMIUM_PLAN_PRICE_ID: required,
  APP_URL: required.pipe(z.string().url("precisa ser uma URL válida")),
  // Sem OPENAI_API_KEY o relatório de IA usa um relatório de exemplo.
  OPENAI_API_KEY: optional,
  // Modelo do relatório de IA (padrão: gpt-4o-mini).
  OPENAI_MODEL: optional,
  // Sem CRON_SECRET a rota /api/keepalive fica aberta.
  CRON_SECRET: optional,
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;

const formatIssues = (error: z.ZodError) =>
  error.issues
    .map((issue) => `  - ${issue.path.join(".")}: ${issue.message}`)
    .join("\n");

let cachedEnv: ServerEnv | undefined;

/**
 * Variáveis de ambiente do servidor, validadas.
 * Lança um erro listando todas as variáveis faltando/inválidas.
 */
export const getServerEnv = (): ServerEnv => {
  if (cachedEnv) return cachedEnv;

  const parsed = serverEnvSchema.safeParse(process.env);

  if (!parsed.success) {
    throw new Error(
      `Variáveis de ambiente inválidas:\n${formatIssues(parsed.error)}`,
    );
  }

  cachedEnv = parsed.data;

  return cachedEnv;
};

/** Usado no boot do servidor (instrumentation.ts): só registra no log. */
export const reportServerEnvProblems = () => {
  const parsed = serverEnvSchema.safeParse(process.env);

  if (!parsed.success) {
    console.error(
      `[env] Variáveis de ambiente inválidas:\n${formatIssues(parsed.error)}`,
    );
  }
};
