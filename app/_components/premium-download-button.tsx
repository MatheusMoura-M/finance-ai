"use client";

import { Button, ButtonProps } from "@/app/_components/ui/button";
import { UNEXPECTED_ERROR_MESSAGE } from "@/app/_lib/action-result";
import { useUser } from "@clerk/nextjs";
import { Loader2Icon } from "lucide-react";
import { useRouter } from "next/navigation";
import { ReactNode, useState } from "react";
import { toast } from "sonner";

interface PremiumDownloadButtonProps {
  /** Rota que devolve o arquivo (CSV, PDF...). */
  href: string;
  /** Nome usado se a resposta não informar um. */
  fallbackFileName: string;
  children: ReactNode;
  className?: string;
  variant?: ButtonProps["variant"];
  size?: ButtonProps["size"];
  /** Texto do aviso para quem não é Premium. */
  premiumMessage: string;
}

const fileNameFrom = (response: Response, fallback: string) =>
  response.headers
    .get("Content-Disposition")
    ?.match(/filename="([^"]+)"/)?.[1] ?? fallback;

/**
 * Baixa um arquivo gerado pelo servidor. Para quem não é Premium, mostra um
 * aviso com o atalho para assinar em vez de baixar.
 */
const PremiumDownloadButton = ({
  href,
  fallbackFileName,
  children,
  className,
  variant = "outline",
  size,
  premiumMessage,
}: PremiumDownloadButtonProps) => {
  const { user } = useUser();
  const router = useRouter();
  const [isDownloading, setIsDownloading] = useState(false);
  const hasPremiumPlan = user?.publicMetadata.subscriptionPlan === "premium";

  const handleClick = async () => {
    if (!hasPremiumPlan) {
      toast(premiumMessage, {
        action: {
          label: "Assinar",
          onClick: () => router.push("/subscription"),
        },
      });
      return;
    }

    setIsDownloading(true);

    try {
      const response = await fetch(href);

      if (!response.ok) {
        const body = await response.json().catch(() => null);
        toast.error(body?.error ?? UNEXPECTED_ERROR_MESSAGE);
        return;
      }

      const url = URL.createObjectURL(await response.blob());
      const link = document.createElement("a");
      link.href = url;
      link.download = fileNameFrom(response, fallbackFileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error(error);
      toast.error(UNEXPECTED_ERROR_MESSAGE);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      className={className}
      onClick={handleClick}
      disabled={isDownloading}
    >
      {isDownloading && <Loader2Icon className="animate-spin" aria-hidden />}
      {children}
      {!hasPremiumPlan && (
        <span className="rounded bg-primary/15 px-1.5 py-0.5 text-[11px] font-semibold text-primary">
          Premium
        </span>
      )}
    </Button>
  );
};

export default PremiumDownloadButton;
