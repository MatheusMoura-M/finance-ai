import { NextRequest, NextResponse } from "next/server";
import { db } from "@/app/_lib/prisma";

/**
 * Mantém o projeto Supabase (plano free) fora do estado "paused".
 *
 * O free tier pausa o projeto após 7 dias sem atividade. Um SELECT nem sempre
 * é contabilizado, então aqui é feito um WRITE real (upsert) — atividade que o
 * Supabase sempre registra.
 *
 * Disparado diariamente pelo Vercel Cron (ver vercel.json). O parâmetro
 * ?source= permite plugar um segundo agendador externo na mesma rota.
 */

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 30;

const SINGLETON_ID = "supabase-keepalive";

const isAuthorized = (request: NextRequest) => {
  const secret = process.env.CRON_SECRET;

  // Sem segredo configurado a rota fica aberta — melhor isso do que o
  // keepalive silenciosamente parar de funcionar por falta de env var.
  if (!secret) return true;

  return request.headers.get("authorization") === `Bearer ${secret}`;
};

export const GET = async (request: NextRequest) => {
  if (!isAuthorized(request)) {
    return NextResponse.json(
      { ok: false, error: "unauthorized" },
      { status: 401 },
    );
  }

  // O Vercel Cron não aceita query string de forma confiável no path, então a
  // origem também é detectada pelo user-agent que ele envia.
  const userAgent = request.headers.get("user-agent") ?? "";
  const source =
    request.nextUrl.searchParams.get("source") ??
    (userAgent.startsWith("vercel-cron") ? "vercel-cron" : "unknown");

  try {
    const now = new Date();

    const row = await db.keepAlive.upsert({
      where: { id: SINGLETON_ID },
      create: { id: SINGLETON_ID, pingCount: 1, pingedAt: now, source },
      update: { pingCount: { increment: 1 }, pingedAt: now, source },
    });

    return NextResponse.json(
      {
        ok: true,
        pingedAt: row.pingedAt.toISOString(),
        pingCount: row.pingCount,
        source: row.source,
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown error";

    console.error("[keepalive] falhou:", message);

    // 500 explícito para que o agendador (GitHub Actions) marque a execução
    // como falha e envie notificação em vez de falhar em silêncio.
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
};
