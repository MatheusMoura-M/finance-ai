import { describe, expect, it } from "vitest";
import {
  StatementParseError,
  decodeStatementFile,
  parseStatement,
  splitCsvLine,
} from "./parse-statement";

const noon = (year: number, month: number, day: number) =>
  new Date(year, month - 1, day, 12, 0, 0, 0);

const OFX_ACCOUNT = `OFXHEADER:100
DATA:OFXSGML
CHARSET:1252

<OFX>
<BANKMSGSRSV1><STMTTRNRS><STMTRS>
<BANKTRANLIST>
<STMTTRN>
<TRNTYPE>DEBIT
<DTPOSTED>20261028120000[-3:BRT]
<TRNAMT>-23.90
<FITID>abc-1
<MEMO>UBER *TRIP
</STMTTRN>
<STMTTRN>
<TRNTYPE>CREDIT
<DTPOSTED>20261005
<TRNAMT>5000,00
<FITID>abc-2
<NAME>SALARIO EMPRESA X &amp; CIA
</STMTTRN>
<STMTTRN>
<TRNTYPE>OTHER
<DTPOSTED>20261006
<TRNAMT>0.00
<FITID>abc-3
<MEMO>Ajuste zerado
</STMTTRN>
</BANKTRANLIST>
</STMTRS></STMTTRNRS></BANKMSGSRSV1>
</OFX>`;

describe("parseStatement: OFX", () => {
  it("lê os lançamentos com data, valor, sentido e identificador", () => {
    const parsed = parseStatement(OFX_ACCOUNT);

    expect(parsed.format).toBe("ofx");
    expect(parsed.isCardStatement).toBe(false);
    expect(parsed.entries).toEqual([
      {
        date: noon(2026, 10, 28),
        description: "UBER *TRIP",
        amount: 23.9,
        direction: "out",
        externalId: "abc-1",
      },
      {
        date: noon(2026, 10, 5),
        description: "SALARIO EMPRESA X & CIA",
        amount: 5000,
        direction: "in",
        externalId: "abc-2",
      },
    ]);
  });

  it("identifica fatura de cartão de crédito", () => {
    const card = OFX_ACCOUNT.replace(
      "<BANKMSGSRSV1><STMTTRNRS><STMTRS>",
      "<CREDITCARDMSGSRSV1><CCSTMTTRNRS><CCSTMTRS>",
    );

    expect(parseStatement(card).isCardStatement).toBe(true);
  });

  it("avisa quando o OFX não tem transações", () => {
    expect(() => parseStatement("<OFX></OFX>")).toThrow(StatementParseError);
  });
});

describe("parseStatement: CSV do Nubank", () => {
  it("lê o extrato da conta (dd/MM/yyyy, valor com ponto)", () => {
    const parsed = parseStatement(
      [
        "Data,Valor,Identificador,Descrição",
        "28/10/2026,-23.90,id-1,Compra no débito - Padaria, Pão e Cia",
        '25/10/2026,150.00,id-2,"Transferência recebida pelo Pix - JOÃO"',
      ].join("\n"),
    );

    expect(parsed.format).toBe("nubank-account");
    expect(parsed.entries).toEqual([
      {
        date: noon(2026, 10, 28),
        description: "Compra no débito - Padaria, Pão e Cia",
        amount: 23.9,
        direction: "out",
        externalId: "id-1",
      },
      {
        date: noon(2026, 10, 25),
        description: "Transferência recebida pelo Pix - JOÃO",
        amount: 150,
        direction: "in",
        externalId: "id-2",
      },
    ]);
  });

  it("lê a fatura do cartão (compras positivas, pagamentos negativos)", () => {
    const parsed = parseStatement(
      [
        "date,title,amount",
        "2026-10-27,iFood,58.40",
        "2026-10-15,Loja X - Parcela 3/10,120.00",
        "2026-10-10,Pagamento recebido,-1500.00",
      ].join("\r\n"),
    );

    expect(parsed.format).toBe("nubank-card");
    expect(parsed.isCardStatement).toBe(true);
    expect(
      parsed.entries.map((entry) => [
        entry.description,
        entry.amount,
        entry.direction,
      ]),
    ).toEqual([
      ["iFood", 58.4, "out"],
      ["Loja X - Parcela 3/10", 120, "out"],
      ["Pagamento recebido", 1500, "in"],
    ]);
  });

  it("ignora linhas inválidas", () => {
    const parsed = parseStatement(
      [
        "date,title,amount",
        "data-errada,X,10",
        "2026-02-30,Y,10",
        "2026-10-01,Ok,10",
      ].join("\n"),
    );

    expect(parsed.entries.map((entry) => entry.description)).toEqual(["Ok"]);
  });

  it("recusa formatos desconhecidos com uma mensagem clara", () => {
    expect(() => parseStatement("nome;valor\nx;1")).toThrow(
      /Formato não reconhecido/,
    );
  });
});

describe("splitCsvLine", () => {
  it("respeita vírgulas e aspas dentro de campos entre aspas", () => {
    expect(splitCsvLine('a,"b, c","d ""e"""')).toEqual(["a", "b, c", 'd "e"']);
  });
});

describe("decodeStatementFile", () => {
  it("usa Windows-1252 quando o OFX declara CHARSET:1252", () => {
    // "Pão" em Windows-1252: 0xE3 = "ã".
    const bytes = new Uint8Array([
      ...Array.from(new TextEncoder().encode("CHARSET:1252\n<MEMO>P")),
      0xe3,
      ...Array.from(new TextEncoder().encode("o")),
    ]);

    expect(decodeStatementFile(bytes.buffer)).toContain("<MEMO>Pão");
  });

  it("usa UTF-8 por padrão", () => {
    const bytes = new TextEncoder().encode(
      "date,title,amount\n2026-10-01,Pão,1",
    );

    expect(decodeStatementFile(bytes.buffer as ArrayBuffer)).toContain("Pão");
  });
});
