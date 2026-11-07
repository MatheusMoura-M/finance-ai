import { describe, expect, it } from "vitest";
import { decideAutoFill } from "./auto-fill";

describe("decideAutoFill", () => {
  it("preenche com a sugestão quando o usuário não escolheu", () => {
    expect(
      decideAutoFill({
        touched: false,
        suggested: "TRANSPORTATION",
        current: "OTHER",
        lastAutoFilled: null,
        fallback: "OTHER",
      }),
    ).toEqual({ value: "TRANSPORTATION", lastAutoFilled: "TRANSPORTATION" });
  });

  it("nunca mexe depois que o usuário escolheu na mão", () => {
    expect(
      decideAutoFill({
        touched: true,
        suggested: "TRANSPORTATION",
        current: "HEALTH",
        lastAutoFilled: "FOOD",
        fallback: "OTHER",
      }),
    ).toEqual({ value: "HEALTH", lastAutoFilled: null });
  });

  it("troca a sugestão anterior por uma nova enquanto o usuário digita", () => {
    expect(
      decideAutoFill({
        touched: false,
        suggested: "FOOD",
        current: "TRANSPORTATION",
        lastAutoFilled: "TRANSPORTATION",
        fallback: "OTHER",
      }),
    ).toEqual({ value: "FOOD", lastAutoFilled: "FOOD" });
  });

  it("volta ao padrão quando a sugestão some (ex.: apagou o nome)", () => {
    expect(
      decideAutoFill({
        touched: false,
        suggested: null,
        current: "TRANSPORTATION",
        lastAutoFilled: "TRANSPORTATION",
        fallback: "OTHER",
      }),
    ).toEqual({ value: "OTHER", lastAutoFilled: null });
  });

  it("sem sugestão e sem preenchimento anterior, deixa como está", () => {
    expect(
      decideAutoFill({
        touched: false,
        suggested: null,
        current: "OTHER",
        lastAutoFilled: null,
        fallback: "OTHER",
      }),
    ).toEqual({ value: "OTHER", lastAutoFilled: null });
  });
});
