import {
  Document,
  Page,
  StyleSheet,
  Text,
  View,
  renderToBuffer,
} from "@react-pdf/renderer";
import { MonthReportModel, ReportTone } from "./month-report-model";

// Tema claro (para imprimir) com as cores do app.
const COLORS = {
  text: "#1f2937",
  muted: "#6b7280",
  border: "#e5e7eb",
  headerBg: "#f3f4f6",
  brand: "#1f8f47",
  positive: "#1f8f47",
  negative: "#dc2626",
};

const toneColor = (tone: ReportTone) =>
  tone === "positive"
    ? COLORS.positive
    : tone === "negative"
      ? COLORS.negative
      : COLORS.text;

const styles = StyleSheet.create({
  page: {
    paddingTop: 36,
    paddingBottom: 48,
    paddingHorizontal: 36,
    fontFamily: "Helvetica",
    fontSize: 10,
    color: COLORS.text,
  },
  brand: { fontFamily: "Helvetica-Bold", color: COLORS.brand, fontSize: 11 },
  title: { fontFamily: "Helvetica-Bold", fontSize: 18, marginTop: 4 },
  muted: { color: COLORS.muted, fontSize: 9 },
  summary: { flexDirection: "row", gap: 8, marginTop: 18 },
  card: {
    flex: 1,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 4,
    padding: 8,
  },
  cardValue: { fontFamily: "Helvetica-Bold", fontSize: 13, marginVertical: 3 },
  sectionTitle: {
    fontFamily: "Helvetica-Bold",
    fontSize: 12,
    marginTop: 22,
    marginBottom: 6,
  },
  row: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingVertical: 4,
  },
  headerRow: {
    flexDirection: "row",
    backgroundColor: COLORS.headerBg,
    paddingVertical: 4,
    fontFamily: "Helvetica-Bold",
  },
  cell: { paddingHorizontal: 4 },
  right: { textAlign: "right" },
  empty: { color: COLORS.muted, paddingVertical: 6 },
  footer: {
    position: "absolute",
    bottom: 20,
    left: 36,
    right: 36,
    flexDirection: "row",
    justifyContent: "space-between",
    color: COLORS.muted,
    fontSize: 8,
  },
});

const describeVariation = (variation: string, previousLabel: string) =>
  variation.startsWith("sem base")
    ? variation
    : `${variation} em relação a ${previousLabel}`;

const MonthReportDocument = ({ model }: { model: MonthReportModel }) => (
  <Document title={model.title} author="Finance AI" language="pt-BR">
    <Page size="A4" style={styles.page}>
      <View>
        <Text style={styles.brand}>Finance AI</Text>
        <Text style={styles.title}>{model.title}</Text>
        <Text style={styles.muted}>Gerado em {model.generatedAt}</Text>
      </View>

      <View style={styles.summary}>
        {model.summary.map((item) => (
          <View key={item.label} style={styles.card}>
            <Text style={styles.muted}>{item.label}</Text>
            <Text style={styles.cardValue}>{item.value}</Text>
            <Text style={styles.muted}>
              {describeVariation(item.variation, model.previousLabel)}
            </Text>
          </View>
        ))}
      </View>

      <Text style={styles.sectionTitle}>Gastos por categoria</Text>
      {model.categories.length ? (
        <View>
          <View style={styles.headerRow}>
            <Text style={[styles.cell, { flex: 2 }]}>Categoria</Text>
            <Text style={[styles.cell, styles.right, { flex: 1.3 }]}>
              Gasto
            </Text>
            <Text style={[styles.cell, styles.right, { flex: 0.8 }]}>
              % do total
            </Text>
            <Text style={[styles.cell, styles.right, { flex: 1.3 }]}>
              Orçamento
            </Text>
            <Text style={[styles.cell, styles.right, { flex: 2.2 }]}>
              Situação
            </Text>
          </View>
          {model.categories.map((category) => (
            <View key={category.label} style={styles.row} wrap={false}>
              <Text style={[styles.cell, { flex: 2 }]}>{category.label}</Text>
              <Text style={[styles.cell, styles.right, { flex: 1.3 }]}>
                {category.spent}
              </Text>
              <Text style={[styles.cell, styles.right, { flex: 0.8 }]}>
                {category.share}
              </Text>
              <Text style={[styles.cell, styles.right, { flex: 1.3 }]}>
                {category.budget}
              </Text>
              <Text
                style={[
                  styles.cell,
                  styles.right,
                  { flex: 2.2, color: toneColor(category.tone) },
                ]}
              >
                {category.status}
              </Text>
            </View>
          ))}
        </View>
      ) : (
        <Text style={styles.empty}>Nenhuma despesa neste mês.</Text>
      )}

      <Text style={styles.sectionTitle}>Transações do mês</Text>
      {model.transactions.length ? (
        <View>
          <View style={styles.headerRow} fixed>
            <Text style={[styles.cell, { flex: 0.7 }]}>Data</Text>
            <Text style={[styles.cell, { flex: 3 }]}>Nome</Text>
            <Text style={[styles.cell, { flex: 1.6 }]}>Categoria</Text>
            <Text style={[styles.cell, { flex: 1.8 }]}>Pagamento</Text>
            <Text style={[styles.cell, styles.right, { flex: 1.4 }]}>
              Valor
            </Text>
          </View>
          {model.transactions.map((transaction, index) => (
            <View key={index} style={styles.row} wrap={false}>
              <Text style={[styles.cell, { flex: 0.7 }]}>
                {transaction.date}
              </Text>
              <Text style={[styles.cell, { flex: 3 }]}>{transaction.name}</Text>
              <Text style={[styles.cell, { flex: 1.6 }]}>
                {transaction.category}
              </Text>
              <Text style={[styles.cell, { flex: 1.8 }]}>
                {transaction.paymentMethod}
              </Text>
              <Text
                style={[
                  styles.cell,
                  styles.right,
                  { flex: 1.4, color: toneColor(transaction.tone) },
                ]}
              >
                {transaction.amount}
              </Text>
            </View>
          ))}
        </View>
      ) : (
        <Text style={styles.empty}>Nenhuma transação neste mês.</Text>
      )}

      <View style={styles.footer} fixed>
        <Text>Finance AI · {model.title}</Text>
        <Text
          render={({ pageNumber, totalPages }) =>
            `Página ${pageNumber} de ${totalPages}`
          }
        />
      </View>
    </Page>
  </Document>
);

/** Gera o PDF do relatório mensal em memória. */
export const renderMonthReportPdf = (model: MonthReportModel) =>
  renderToBuffer(<MonthReportDocument model={model} />);
