import { cn } from "@/app/_lib/utils";
import Image from "next/image";

/**
 * Logo do Finance AI na versão certa para o tema: o texto "finance.ai" é
 * branco no tema escuro e escuro no claro. A troca é só com CSS, então não
 * "pisca" enquanto o tema carrega.
 */
const Logo = ({ className }: { className?: string }) => (
  <>
    <Image
      src="/logo-light.svg"
      width={173}
      height={39}
      alt="Finance AI"
      className={cn("dark:hidden", className)}
      priority
    />
    <Image
      src="/logo.svg"
      width={173}
      height={39}
      alt="Finance AI"
      className={cn("hidden dark:block", className)}
      priority
    />
  </>
);

export default Logo;
