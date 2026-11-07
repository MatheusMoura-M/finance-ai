"use client";
import { UserButton } from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import { useTheme } from "next-themes";
import ThemeToggle from "./theme-toggle";
import { MenuIcon } from "lucide-react";
import Logo from "./logo";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useIsClient } from "./use-is-client";
import { Button } from "./ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "./ui/sheet";

const Navbar = () => {
  const pathname = usePathname();

  // O UserButton renderiza `null` no servidor, mas no cliente pode renderizar
  // um <div> já na hidratação se o Clerk carregar antes do React — o que causa
  // "Hydration failed". Só exibimos o botão depois que o componente montou.
  const isMounted = useIsClient();

  // Menu e perfil do usuário (Clerk) acompanham o tema escolhido.
  const { resolvedTheme } = useTheme();
  const clerkAppearance = {
    baseTheme: resolvedTheme === "light" ? undefined : dark,
  };

  return (
    <nav className="flex justify-between border-b border-solid px-4 py-8 sm:px-6">
      {/* ESQUERDA */}
      <Sheet>
        <SheetTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            className="md:hidden"
            aria-label="Abrir menu"
          >
            <MenuIcon className="h-6 w-6" />
          </Button>
        </SheetTrigger>

        <SheetContent side="left">
          {/* Título e descrição exigidos pelo Radix para leitores de tela (invisíveis na tela). */}
          <SheetHeader className="sr-only">
            <SheetTitle>Menu</SheetTitle>
            <SheetDescription>
              Navegue entre as páginas do Finance AI.
            </SheetDescription>
          </SheetHeader>

          <div className="grid gap-2 py-6">
            <Link
              href="/"
              className={`${
                pathname === "/"
                  ? "font-bold text-primary"
                  : "text-muted-foreground"
              } flex w-full items-center py-2 text-lg font-semibold`}
            >
              Dashboard
            </Link>

            <Link
              href="/transactions"
              className={`${
                pathname === "/transactions"
                  ? "font-bold text-primary"
                  : "text-muted-foreground"
              } flex w-full items-center py-2 text-lg font-semibold`}
            >
              Transações
            </Link>

            <Link
              href="/subscription"
              className={`${
                pathname === "/subscription"
                  ? "font-bold text-primary"
                  : "text-muted-foreground"
              } flex w-full items-center py-2 text-lg font-semibold`}
            >
              Assinatura
            </Link>
          </div>
        </SheetContent>
      </Sheet>

      <div className="hidden items-center md:flex md:gap-10">
        <div className="flex items-center sm:gap-2">
          <Logo />
        </div>

        <Link
          href="/"
          className={
            pathname === "/"
              ? "font-bold text-primary"
              : "text-muted-foreground"
          }
        >
          Dashboard
        </Link>

        <Link
          href="/transactions"
          className={
            pathname === "/transactions"
              ? "font-bold text-primary"
              : "text-muted-foreground"
          }
        >
          Transações
        </Link>

        <Link
          href="/subscription"
          className={
            pathname === "/subscription"
              ? "font-bold text-primary"
              : "text-muted-foreground"
          }
        >
          Assinatura
        </Link>
      </div>

      {/* DIREITA */}
      <div className="flex items-center gap-2">
        <ThemeToggle />
        {isMounted && (
          <UserButton
            showName
            appearance={clerkAppearance}
            userProfileProps={{ appearance: clerkAppearance }}
          />
        )}
      </div>
    </nav>
  );
};

export default Navbar;
