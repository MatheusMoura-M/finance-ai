import { TransactionCategory, TransactionPaymentMethod } from "@prisma/client";

/**
 * Sugestão de categoria e forma de pagamento a partir do nome da transação,
 * sem IA: primeiro o histórico do próprio usuário, depois palavras-chave.
 * Usada na importação de extratos e no formulário de transação.
 */

export type SuggestionSource = "history" | "keyword";

export interface HistoryEntry {
  name: string;
  category: TransactionCategory;
  paymentMethod: TransactionPaymentMethod;
}

export type HistoryIndex = Map<
  string,
  { category: TransactionCategory; paymentMethod: TransactionPaymentMethod }
>;

/** Minúsculas, sem acentos e só letras/números separados por espaço. */
export const normalizeName = (text: string) =>
  text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

/**
 * Chave para comparar nomes no histórico: ignora números, parcelas
 * ("(2/10)", "Parcela 3/10") e prefixos de banco ("Compra no débito - ").
 */
export const historyKey = (name: string) =>
  normalizeName(
    name
      .replace(/\(\s*\d+\s*\/\s*\d+\s*\)/g, " ")
      .replace(/parcela\s*\d+\s*(\/|de)\s*\d+/gi, " "),
  )
    .replace(
      /^(compra no (debito|credito)|transferencia (enviada|recebida)( pelo pix)?|pix (enviado|recebido)|pagamento de boleto)\s*/,
      "",
    )
    .replace(/\d+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const KEYWORDS: Record<TransactionCategory, string[]> = {
  FOOD: [
    "ifood",
    "ifd",
    "rappi",
    "ze delivery",
    "mercado",
    "supermercado",
    "mercadinho",
    "padaria",
    "panificadora",
    "restaurante",
    "lanchonete",
    "acougue",
    "hortifruti",
    "pizzaria",
    "pizza",
    "hamburgueria",
    "burger",
    "burger king",
    "mcdonalds",
    "mc donalds",
    "subway",
    "outback",
    "cafe",
    "cafeteria",
    "starbucks",
    "assai",
    "atacadao",
    "carrefour",
    "pao de acucar",
    "sams club",
    "zaffari",
    "angeloni",
    "savegnago",
    "doceria",
    "sorveteria",
    "acai",
    "churrascaria",
    "esfiharia",
    "habibs",
    "spoleto",
    "giraffas",
    "bobs",
    "kfc",
    "coco bambu",
    "lanches",
  ],
  TRANSPORTATION: [
    "uber",
    "99app",
    "99 pop",
    "99 taxi",
    "cabify",
    "taxi",
    "posto",
    "combustivel",
    "gasolina",
    "etanol",
    "shell",
    "ipiranga",
    "petrobras",
    "br mania",
    "estacionamento",
    "estapar",
    "sem parar",
    "conectcar",
    "veloe",
    "pedagio",
    "metro",
    "cptm",
    "onibus",
    "bilhete unico",
    "blablacar",
    "oficina",
    "mecanica",
    "autopecas",
    "auto pecas",
    "detran",
    "ipva",
    "lavagem",
    "lava jato",
  ],
  HEALTH: [
    "farmacia",
    "drogaria",
    "drogasil",
    "droga raia",
    "drogaraia",
    "pague menos",
    "panvel",
    "drogao",
    "nissei",
    "hospital",
    "clinica",
    "laboratorio",
    "consulta",
    "dentista",
    "odonto",
    "unimed",
    "amil",
    "hapvida",
    "sulamerica",
    "psicologo",
    "fisioterapia",
    "smart fit",
    "smartfit",
    "academia",
    "bluefit",
    "otica",
  ],
  SUBSCRIPTIONS: [
    "netflix",
    "spotify",
    "amazon prime",
    "prime video",
    "disney",
    "hbo",
    "globoplay",
    "youtube premium",
    "deezer",
    "apple com bill",
    "icloud",
    "google one",
    "google storage",
    "microsoft",
    "xbox",
    "chatgpt",
    "openai",
    "canva",
    "adobe",
    "paramount",
    "crunchyroll",
    "twitch",
    "patreon",
    "assinatura",
  ],
  HOUSING: [
    "aluguel",
    "condominio",
    "iptu",
    "imobiliaria",
    "quinto andar",
    "quintoandar",
    "moradia",
  ],
  UTILITY: [
    "energia",
    "conta de luz",
    "enel",
    "cemig",
    "copel",
    "cpfl",
    "celesc",
    "equatorial",
    "coelba",
    "neoenergia",
    "sabesp",
    "copasa",
    "sanepar",
    "embasa",
    "cedae",
    "comgas",
    "internet",
    "vivo",
    "claro",
    "tim",
    "telefone",
    "celular",
    "recarga",
  ],
  EDUCATION: [
    "escola",
    "colegio",
    "faculdade",
    "universidade",
    "curso",
    "udemy",
    "alura",
    "rocketseat",
    "coursera",
    "livraria",
    "livro",
    "mensalidade",
    "ingles",
    "wizard",
    "ccaa",
    "fisk",
  ],
  ENTERTAINMENT: [
    "cinema",
    "cinemark",
    "ingresso",
    "ingressos",
    "sympla",
    "eventim",
    "show",
    "teatro",
    "bar",
    "boteco",
    "balada",
    "steam",
    "playstation store",
    "nintendo",
    "parque",
    "boliche",
  ],
  CLOTHING: [
    "renner",
    "riachuelo",
    "zara",
    "hering",
    "shein",
    "centauro",
    "netshoes",
    "nike",
    "adidas",
    "roupas",
    "calcados",
    "sapataria",
    "marisa",
    "pernambucanas",
    "c a modas",
    "youcom",
  ],
  TRAVEL: [
    "hotel",
    "pousada",
    "airbnb",
    "booking",
    "decolar",
    "123milhas",
    "latam",
    "passagem",
    "passagens",
    "hurb",
    "cvc",
    "rodoviaria",
    "hostel",
    "maxmilhas",
  ],
  LOAN: ["emprestimo", "financiamento", "consignado"],
  INVOICE: ["fatura", "pagamento de fatura"],
  INVESTMENTS: [
    "aplicacao",
    "rdb",
    "cdb",
    "tesouro",
    "investimento",
    "corretora",
    "xp investimentos",
    "nuinvest",
    "btg",
    "poupanca",
  ],
  SALARY: ["salario", "folha de pagamento", "proventos", "holerite"],
  EMERGENCY: [],
  OTHER: [],
};

// Palavras mais longas primeiro: "pagamento de fatura" ganha de "fatura".
const KEYWORD_LIST = (
  Object.entries(KEYWORDS) as [TransactionCategory, string[]][]
)
  .flatMap(([category, words]) => words.map((word) => ({ word, category })))
  .sort((a, b) => b.word.length - a.word.length);

/** Categoria pela lista de palavras-chave (palavra inteira), ou null. */
export const suggestCategoryByKeyword = (
  name: string,
): TransactionCategory | null => {
  const text = ` ${normalizeName(name)} `;

  return (
    KEYWORD_LIST.find(({ word }) => text.includes(` ${word} `))?.category ??
    null
  );
};

/** Forma de pagamento pelo texto do banco (Pix, débito, boleto...), ou null. */
export const suggestPaymentMethodByText = (
  name: string,
): TransactionPaymentMethod | null => {
  const text = ` ${normalizeName(name)} `;

  if (text.includes(" pix ")) return TransactionPaymentMethod.PIX;
  if (text.includes(" debito ")) return TransactionPaymentMethod.DEBIT_CARD;
  if (text.includes(" boleto ")) return TransactionPaymentMethod.BANK_SLIP;
  if (/ (transferencia|ted|doc) /.test(text)) {
    return TransactionPaymentMethod.BANK_TRANSFER;
  }
  if (text.includes(" saque ")) return TransactionPaymentMethod.CASH;

  return null;
};

/**
 * Índice do histórico: para cada nome, a escolha mais recente do usuário.
 * `entries` deve vir do mais recente para o mais antigo.
 */
export const buildHistoryIndex = (entries: HistoryEntry[]): HistoryIndex => {
  const index: HistoryIndex = new Map();

  for (const entry of entries) {
    const key = historyKey(entry.name);

    if (key && !index.has(key)) {
      index.set(key, {
        category: entry.category,
        paymentMethod: entry.paymentMethod,
      });
    }
  }

  return index;
};

export interface Suggestion {
  category: TransactionCategory | null;
  categorySource: SuggestionSource | null;
  paymentMethod: TransactionPaymentMethod | null;
  paymentMethodSource: SuggestionSource | null;
}

/** Sugestão para um nome: histórico primeiro, depois palavras-chave. */
export const suggestForName = (
  name: string,
  history: HistoryIndex,
): Suggestion => {
  const fromHistory = history.get(historyKey(name));
  const keywordCategory = suggestCategoryByKeyword(name);
  const textPaymentMethod = suggestPaymentMethodByText(name);

  return {
    category: fromHistory?.category ?? keywordCategory,
    categorySource: fromHistory
      ? "history"
      : keywordCategory
        ? "keyword"
        : null,
    paymentMethod: fromHistory?.paymentMethod ?? textPaymentMethod,
    paymentMethodSource: fromHistory
      ? "history"
      : textPaymentMethod
        ? "keyword"
        : null,
  };
};
