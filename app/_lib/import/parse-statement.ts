/**
 * Leitura de extratos bancários: OFX (padrão da maioria dos bancos) e os
 * CSVs do Nubank (conta e fatura do cartão). Tudo vira uma lista única de
 * lançamentos, sem depender de IA.
 */

export type StatementFormat = "ofx" | "nubank-account" | "nubank-card";

export interface StatementEntry {
  /** Dia do lançamento (meio-dia, para não "voltar" um dia em outro fuso). */
  date: Date;
  description: string;
  /** Sempre positivo; o sentido está em `direction`. */
  amount: number;
  /** "out" = saiu dinheiro (despesa), "in" = entrou. */
  direction: "in" | "out";
  /** Identificador do banco (FITID / Identificador), quando houver. */
  externalId?: string;
}

export interface ParsedStatement {
  format: StatementFormat;
  /** Fatura de cartão: créditos são pagamentos/estornos, não receitas. */
  isCardStatement: boolean;
  entries: StatementEntry[];
}

/** Erro com mensagem para mostrar ao usuário. */
export class StatementParseError extends Error {}

const dayAtNoon = (year: number, month: number, day: number) => {
  const date = new Date(year, month - 1, day, 12, 0, 0, 0);

  if (
    Number.isNaN(date.getTime()) ||
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }

  return date;
};

/** "1.234,56" / "1234.56" / "-23,90" → número. */
const parseAmount = (raw: string) => {
  let value = raw.trim().replace(/\s/g, "").replace(/^R\$/i, "");

  if (value.includes(",") && value.includes(".")) {
    // O separador decimal é o que aparece por último.
    value =
      value.lastIndexOf(",") > value.lastIndexOf(".")
        ? value.replace(/\./g, "").replace(",", ".")
        : value.replace(/,/g, "");
  } else if (value.includes(",")) {
    value = value.replace(",", ".");
  }

  const amount = Number(value);

  return Number.isFinite(amount) ? amount : null;
};

const decodeEntities = (text: string) =>
  text
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'");

const cleanDescription = (text: string) =>
  decodeEntities(text).replace(/\s+/g, " ").trim();

// ---------------------------------------------------------------- OFX

const ofxField = (block: string, tag: string) =>
  block.match(new RegExp(`<${tag}>([^<\\r\\n]*)`, "i"))?.[1]?.trim();

const parseOfx = (content: string): ParsedStatement => {
  const isCardStatement = /<CCSTMTRS>/i.test(content);
  const blocks = content.match(/<STMTTRN>[\s\S]*?<\/STMTTRN>/gi) ?? [];

  const entries = blocks.flatMap((block): StatementEntry[] => {
    const posted = ofxField(block, "DTPOSTED")?.match(/^(\d{4})(\d{2})(\d{2})/);
    const amount = parseAmount(ofxField(block, "TRNAMT") ?? "");
    const date = posted
      ? dayAtNoon(Number(posted[1]), Number(posted[2]), Number(posted[3]))
      : null;

    if (!date || amount === null || amount === 0) return [];

    const description = cleanDescription(
      ofxField(block, "MEMO") || ofxField(block, "NAME") || "Sem descrição",
    );

    return [
      {
        date,
        description,
        amount: Math.abs(amount),
        direction: amount < 0 ? "out" : "in",
        externalId: ofxField(block, "FITID") || undefined,
      },
    ];
  });

  return { format: "ofx", isCardStatement, entries };
};

// ---------------------------------------------------------------- CSV

/** Separa uma linha de CSV respeitando campos entre aspas. */
export const splitCsvLine = (line: string, separator = ",") => {
  const fields: string[] = [];
  let current = "";
  let quoted = false;

  for (let index = 0; index < line.length; index++) {
    const char = line[index];

    if (quoted) {
      if (char === '"' && line[index + 1] === '"') {
        current += '"';
        index++;
      } else if (char === '"') {
        quoted = false;
      } else {
        current += char;
      }
    } else if (char === '"') {
      quoted = true;
    } else if (char === separator) {
      fields.push(current);
      current = "";
    } else {
      current += char;
    }
  }

  fields.push(current);

  return fields.map((field) => field.trim());
};

const normalizeHeader = (header: string) =>
  header.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();

const csvRows = (content: string) =>
  content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => splitCsvLine(line));

/** Nubank conta: Data,Valor,Identificador,Descrição (data dd/MM/yyyy). */
const parseNubankAccount = (rows: string[][]): ParsedStatement => {
  const entries = rows.slice(1).flatMap((row): StatementEntry[] => {
    const [rawDate, rawAmount, externalId, ...rest] = row;
    const dateMatch = rawDate?.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    const amount = parseAmount(rawAmount ?? "");
    const date = dateMatch
      ? dayAtNoon(
          Number(dateMatch[3]),
          Number(dateMatch[2]),
          Number(dateMatch[1]),
        )
      : null;

    if (!date || amount === null || amount === 0) return [];

    return [
      {
        date,
        description: cleanDescription(rest.join(", ")) || "Sem descrição",
        amount: Math.abs(amount),
        direction: amount < 0 ? "out" : "in",
        externalId: externalId || undefined,
      },
    ];
  });

  return { format: "nubank-account", isCardStatement: false, entries };
};

/**
 * Nubank cartão (fatura): date,title,amount (data yyyy-MM-dd). Compras vêm
 * positivas; pagamentos e estornos, negativos.
 */
const parseNubankCard = (rows: string[][]): ParsedStatement => {
  const entries = rows.slice(1).flatMap((row): StatementEntry[] => {
    const [rawDate, title, rawAmount] = row;
    const dateMatch = rawDate?.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    const amount = parseAmount(rawAmount ?? "");
    const date = dateMatch
      ? dayAtNoon(
          Number(dateMatch[1]),
          Number(dateMatch[2]),
          Number(dateMatch[3]),
        )
      : null;

    if (!date || amount === null || amount === 0) return [];

    return [
      {
        date,
        description: cleanDescription(title ?? "") || "Sem descrição",
        amount: Math.abs(amount),
        direction: amount > 0 ? "out" : "in",
      },
    ];
  });

  return { format: "nubank-card", isCardStatement: true, entries };
};

/** Lê o conteúdo de um extrato e devolve os lançamentos. */
export const parseStatement = (content: string): ParsedStatement => {
  const text = content.replace(/^\uFEFF/, "");

  if (/<OFX>|OFXHEADER/i.test(text)) {
    const parsed = parseOfx(text);

    if (!parsed.entries.length) {
      throw new StatementParseError(
        "Não encontramos transações nesse arquivo OFX.",
      );
    }

    return parsed;
  }

  const rows = csvRows(text);
  const header = (rows[0] ?? []).map(normalizeHeader).join(",");

  let parsed: ParsedStatement | null = null;

  if (header.startsWith("data,valor,identificador,descricao")) {
    parsed = parseNubankAccount(rows);
  } else if (header.startsWith("date,title,amount")) {
    parsed = parseNubankCard(rows);
  }

  if (!parsed) {
    throw new StatementParseError(
      "Formato não reconhecido. Envie um arquivo OFX do seu banco ou o CSV do Nubank (conta ou fatura do cartão).",
    );
  }

  if (!parsed.entries.length) {
    throw new StatementParseError("Não encontramos transações nesse arquivo.");
  }

  return parsed;
};

/**
 * Decodifica os bytes do arquivo. OFX antigo costuma vir em Windows-1252
 * (acentos); o resto, em UTF-8.
 */
export const decodeStatementFile = (bytes: ArrayBuffer) => {
  const head = new TextDecoder("ascii").decode(bytes.slice(0, 512));
  const isWindows1252 = /CHARSET:\s*1252|ENCODING:\s*(USASCII|1252)/i.test(
    head,
  );

  return new TextDecoder(isWindows1252 ? "windows-1252" : "utf-8").decode(
    bytes,
  );
};
