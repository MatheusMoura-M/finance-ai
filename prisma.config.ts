import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  // O CLI (migrate, studio) precisa de uma conexão de sessão: DIRECT_URL
  // (pooler em modo sessão, porta 5432, ou conexão direta). O app usa
  // DATABASE_URL em modo transação (porta 6543), que não serve para migrations.
  datasource: {
    url: process.env.DIRECT_URL || env("DATABASE_URL"),
  },
});
