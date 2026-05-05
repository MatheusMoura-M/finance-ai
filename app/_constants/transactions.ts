import {
  TransactionCategory,
  TransactionPaymentMethod,
  TransactionType,
} from "@prisma/client";

export const TRANSACTION_PAYMENT_METHOD_ICONS = {
  [TransactionPaymentMethod.BANK_TRANSFER]: "bank-transfer.svg",
  [TransactionPaymentMethod.DEBIT_CARD]: "debit-card.svg",
  [TransactionPaymentMethod.CREDIT_CARD]: "credit-card.svg",
  [TransactionPaymentMethod.CASH]: "money.svg",
  [TransactionPaymentMethod.PIX]: "pix.svg",
  [TransactionPaymentMethod.BANK_SLIP]: "bank-slip.svg",
  [TransactionPaymentMethod.OTHER]: "other.svg",
};

export const TRANSACTION_PAYMENT_METHOD_LABELS = {
  BANK_SLIP: "Boleto Bancário",
  DEBIT_CARD: "Cartão de Débito",
  CREDIT_CARD: "Cartão de Crédito",
  CASH: "Dinheiro",
  PIX: "Pix",
  BANK_TRANSFER: "Transferência Bancária",
  OTHER: "Outros",
};

export const TRANSACTION_PAYMENT_METHOD_OPTIONS = [
  {
    value: TransactionPaymentMethod.BANK_SLIP,
    label:
      TRANSACTION_PAYMENT_METHOD_LABELS[TransactionPaymentMethod.BANK_SLIP],
  },
  {
    value: TransactionPaymentMethod.DEBIT_CARD,
    label:
      TRANSACTION_PAYMENT_METHOD_LABELS[TransactionPaymentMethod.DEBIT_CARD],
  },
  {
    value: TransactionPaymentMethod.CREDIT_CARD,
    label:
      TRANSACTION_PAYMENT_METHOD_LABELS[TransactionPaymentMethod.CREDIT_CARD],
  },
  {
    value: TransactionPaymentMethod.CASH,
    label: TRANSACTION_PAYMENT_METHOD_LABELS[TransactionPaymentMethod.CASH],
  },
  {
    value: TransactionPaymentMethod.PIX,
    label: TRANSACTION_PAYMENT_METHOD_LABELS[TransactionPaymentMethod.PIX],
  },
  {
    value: TransactionPaymentMethod.BANK_TRANSFER,
    label:
      TRANSACTION_PAYMENT_METHOD_LABELS[TransactionPaymentMethod.BANK_TRANSFER],
  },
  {
    value: TransactionPaymentMethod.OTHER,
    label: TRANSACTION_PAYMENT_METHOD_LABELS[TransactionPaymentMethod.OTHER],
  },
];

export const TRANSACTION_TYPE_OPTIONS = [
  {
    value: TransactionType.DEPOSIT,
    label: "Depósito",
  },
  {
    value: TransactionType.EXPENSE,
    label: "Despesa",
  },
  {
    value: TransactionType.INVESTMENT,
    label: "Investimento",
  },
];

export const TRANSACTION_CATEGORY_LABELS = {
  FOOD: "Alimentação",
  SUBSCRIPTIONS: "Assinaturas",
  EDUCATION: "Educação",
  EMERGENCY: "Emergência",
  ENTERTAINMENT: "Entretenimento",
  LOAN: "Empréstimo",
  INVOICE: "Fatura",
  INVESTMENTS: "Investimentos",
  HOUSING: "Moradia",
  SALARY: "Salário",
  HEALTH: "Saúde",
  TRANSPORTATION: "Transporte",
  UTILITY: "Utilidades",
  CLOTHING: "Vestuário",
  TRAVEL: "Viagem",
  OTHER: "Outros",
};

export const TRANSACTION_CATEGORY_OPTIONS = [
  {
    value: TransactionCategory.FOOD,
    label: TRANSACTION_CATEGORY_LABELS[TransactionCategory.FOOD],
  },
  {
    value: TransactionCategory.SUBSCRIPTIONS,
    label: TRANSACTION_CATEGORY_LABELS[TransactionCategory.SUBSCRIPTIONS],
  },
  {
    value: TransactionCategory.EDUCATION,
    label: TRANSACTION_CATEGORY_LABELS[TransactionCategory.EDUCATION],
  },
  {
    value: TransactionCategory.EMERGENCY,
    label: TRANSACTION_CATEGORY_LABELS[TransactionCategory.EMERGENCY],
  },
  {
    value: TransactionCategory.ENTERTAINMENT,
    label: TRANSACTION_CATEGORY_LABELS[TransactionCategory.ENTERTAINMENT],
  },
  {
    value: TransactionCategory.LOAN,
    label: TRANSACTION_CATEGORY_LABELS[TransactionCategory.LOAN],
  },
  {
    value: TransactionCategory.INVOICE,
    label: TRANSACTION_CATEGORY_LABELS[TransactionCategory.INVOICE],
  },
  {
    value: TransactionCategory.INVESTMENTS,
    label: TRANSACTION_CATEGORY_LABELS[TransactionCategory.INVESTMENTS],
  },
  {
    value: TransactionCategory.HOUSING,
    label: TRANSACTION_CATEGORY_LABELS[TransactionCategory.HOUSING],
  },
  {
    value: TransactionCategory.SALARY,
    label: TRANSACTION_CATEGORY_LABELS[TransactionCategory.SALARY],
  },
  {
    value: TransactionCategory.HEALTH,
    label: TRANSACTION_CATEGORY_LABELS[TransactionCategory.HEALTH],
  },
  {
    value: TransactionCategory.TRANSPORTATION,
    label: TRANSACTION_CATEGORY_LABELS[TransactionCategory.TRANSPORTATION],
  },
  {
    value: TransactionCategory.UTILITY,
    label: TRANSACTION_CATEGORY_LABELS[TransactionCategory.UTILITY],
  },
  {
    value: TransactionCategory.CLOTHING,
    label: TRANSACTION_CATEGORY_LABELS[TransactionCategory.CLOTHING],
  },
  {
    value: TransactionCategory.TRAVEL,
    label: TRANSACTION_CATEGORY_LABELS[TransactionCategory.TRAVEL],
  },
  {
    value: TransactionCategory.OTHER,
    label: TRANSACTION_CATEGORY_LABELS[TransactionCategory.OTHER],
  },
];
