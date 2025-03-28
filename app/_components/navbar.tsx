"use client";
import { UserButton } from "@clerk/nextjs";
import { MenuIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "./ui/button";
import { Sheet, SheetContent, SheetTrigger } from "./ui/sheet";

const Navbar = () => {
  const pathname = usePathname();
  return (
    <nav className="flex justify-between border-b border-solid px-4 py-8 sm:px-6">
      {/* ESQUERDA */}
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="outline" size="icon" className="md:hidden">
            <MenuIcon className="h-6 w-6" />
          </Button>
        </SheetTrigger>

        <SheetContent side="left">
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
              Assinaturas
            </Link>
          </div>
        </SheetContent>
      </Sheet>

      <div className="hidden items-center md:flex md:gap-10">
        <div className="flex items-center sm:gap-2">
          <Image
            src="/logo.svg"
            width={173}
            height={39}
            alt="Finance AI"
            priority
          />
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
      <UserButton showName />
    </nav>
  );
};

export default Navbar;
