"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import { ReactNode } from "react";

/**
 * Tema claro/escuro. Padrão: escuro. A escolha (Claro, Escuro ou
 * Automático, que segue o sistema) fica salva no próprio aparelho.
 */
export const ThemeProvider = ({ children }: { children: ReactNode }) => (
  <NextThemesProvider
    attribute="class"
    defaultTheme="dark"
    enableSystem
    disableTransitionOnChange
    storageKey="finance-ai-theme"
  >
    {children}
  </NextThemesProvider>
);
