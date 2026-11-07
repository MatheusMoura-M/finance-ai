import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

// O pooler de sessão do Supabase (porta 5432) aceita no máximo 15 conexões no
// total. O pg abre até 10 por pool por padrão, e o dashboard faz várias
// consultas em paralelo: com mais de uma instância (dev recarregando, várias
// funções na Vercel) o limite estourava ("max clients reached"). Com 5 por
// instância, as consultas excedentes só esperam na fila.
const MAX_CONNECTIONS = 5;

const createPrismaClient = () =>
  new PrismaClient({
    adapter: new PrismaPg({
      connectionString: process.env.DATABASE_URL!,
      max: MAX_CONNECTIONS,
      // Devolve conexões ociosas ao pooler em vez de segurá-las.
      idleTimeoutMillis: 10_000,
    }),
  });

declare global {
  var cachedPrisma: PrismaClient | undefined;
}

// Em dev o módulo é recarregado a cada edição; reaproveitar o cliente global
// evita abrir um pool novo (e mais conexões) toda vez.
export const db =
  process.env.NODE_ENV === "production"
    ? createPrismaClient()
    : (globalThis.cachedPrisma ??= createPrismaClient());
