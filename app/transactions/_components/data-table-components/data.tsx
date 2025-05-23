import { ArrowDownIcon, ArrowUpIcon } from "@radix-ui/react-icons";

export const categories = [
  {
    value: "food",
    label: "Alimentação",
  },
  {
    value: "utilities",
    label: "Utilidades",
  },
  {
    value: "housing",
    label: "Moradia",
  },
  {
    value: "health",
    label: "Saúde",
  },
  {
    value: "transportation",
    label: "Transporte",
  },
  {
    value: "salary",
    label: "Salário",
  },
  {
    value: "entertainment",
    label: "Entretenimento",
  },
  {
    value: "education",
    label: "Educação",
  },
  {
    value: "other",
    label: "Outros",
  },
];

export const incomeType = [
  {
    label: "Depósito",
    value: "deposit",
    icon: ArrowUpIcon,
  },
  {
    label: "Despesa",
    value: "expense",
    icon: ArrowDownIcon,
  },
  {
    label: "Investimento",
    value: "investment",
    icon: ArrowDownIcon,
  },
];
