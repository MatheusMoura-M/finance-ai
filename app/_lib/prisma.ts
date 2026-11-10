import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { attachDatabasePool } from "@vercel/functions";
import { Pool } from "pg";

// DATABASE_URL deve apontar para o pooler do Supabase em modo TRANSAÇÃO
// (porta 6543). No modo sessão (porta 5432) cada conexão aberta ocupa uma das
// 15 vagas do pooler enquanto existir; com várias instâncias da Vercel
// segurando conexões o limite estourava ("EMAXCONNSESSION max clients
// reached") e as páginas caíam. No modo transação a vaga só fica ocupada
// durante a consulta. Migrations usam DIRECT_URL (ver prisma.config.ts).
const MAX_CONNECTIONS = 5;

const createPrismaClient = () => {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL!,
    max: MAX_CONNECTIONS,
    // Devolve conexões ociosas ao pooler em vez de segurá-las.
    idleTimeoutMillis: 5_000,
  });

  // Na Vercel (Fluid compute) mantém a instância viva só o suficiente para
  // fechar as conexões ociosas antes de ela ser suspensa, em vez de deixá-las
  // presas no pooler. Fora da Vercel não faz nada.
  attachDatabasePool(pool);

  return new PrismaClient({ adapter: new PrismaPg(pool) });
};

declare global {
  var cachedPrisma: PrismaClient | undefined;
}

// Em dev o módulo é recarregado a cada edição; reaproveitar o cliente global
// evita abrir um pool novo (e mais conexões) toda vez.
export const db =
  process.env.NODE_ENV === "production"
    ? createPrismaClient()
    : (globalThis.cachedPrisma ??= createPrismaClient());
