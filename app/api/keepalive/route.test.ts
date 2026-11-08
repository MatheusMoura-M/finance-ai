import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ upsert: vi.fn() }));

vi.mock("@/app/_lib/prisma", () => ({
  db: { keepAlive: { upsert: mocks.upsert } },
}));

import { GET } from "./route";

const request = (headers: Record<string, string> = {}) =>
  new NextRequest("http://localhost/api/keepalive", { headers });

describe("GET /api/keepalive", () => {
  beforeEach(() => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    mocks.upsert.mockResolvedValue({
      pingedAt: new Date("2026-11-07T06:00:00Z"),
      pingCount: 3,
      source: "vercel-cron",
    });
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("bloqueia (503) quando CRON_SECRET não está configurado", async () => {
    vi.stubEnv("CRON_SECRET", "");

    const response = await GET(request({ authorization: "Bearer qualquer" }));

    expect(response.status).toBe(503);
    expect(mocks.upsert).not.toHaveBeenCalled();
    expect(console.error).toHaveBeenCalled();
  });

  it("recusa (401) sem o token certo", async () => {
    vi.stubEnv("CRON_SECRET", "segredo");

    const semToken = await GET(request());
    const tokenErrado = await GET(request({ authorization: "Bearer outro" }));

    expect(semToken.status).toBe(401);
    expect(tokenErrado.status).toBe(401);
    expect(mocks.upsert).not.toHaveBeenCalled();
  });

  it("registra o ping com o token certo", async () => {
    vi.stubEnv("CRON_SECRET", "segredo");

    const response = await GET(
      request({
        authorization: "Bearer segredo",
        "user-agent": "vercel-cron/1.0",
      }),
    );

    expect(response.status).toBe(200);
    expect(mocks.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        update: expect.objectContaining({ source: "vercel-cron" }),
      }),
    );
    await expect(response.json()).resolves.toMatchObject({
      ok: true,
      pingCount: 3,
    });
  });
});
