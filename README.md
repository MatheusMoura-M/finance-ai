# Finance AI

**Finance AI** é uma plataforma inovadora de gestão financeira projetada para ajudar os usuários a rastrear e analisar suas transações financeiras de forma simples. Alimentada por inteligência artificial, esta plataforma SaaS oferece painéis de análise, rastreamento de transações e planos de assinatura para desbloquear recursos avançados, como transações ilimitadas e relatórios financeiros personalizados com IA.

---

## 🚀 Recursos

1. **Gerenciamento de Transações**

   - Adicione transações selecionando:
     - **Categoria** (ex.: Alimentação, Transporte, Serviços Públicos)
     - **Método de Pagamento** (ex.: Cartão de Crédito, Dinheiro)
     - **Tipo** (Depósito, Despesa ou Investimento)
   - Visualize uma lista de todas as transações na página dedicada a Transações.

2. **Painel de Controle**

   - Visualize seus dados financeiros com:
     - Agrupamento por categorias.
     - Resumo das finanças atuais.
     - Gráficos e insights para monitorar despesas.

3. **Planos de Assinatura**

   - **Plano Básico**: Gratuito, limitado a 10 transações por mês.
   - **Plano Premium**: Transações ilimitadas e relatórios financeiros com IA por R$19/mês.

4. **Relatórios Financeiros com IA**

   - Integrados ao ChatGPT para fornecer insights personalizados sobre suas finanças.
   - Disponível para assinantes Premium.

5. **Autenticação e Pagamentos Seguros**
   - Autenticação de usuários via [Clerk](https://clerk.dev/).
   - Pagamentos gerenciados através do [Stripe](https://stripe.com/).

---

## 🛠️ Tecnologias Utilizadas

Este projeto utiliza um conjunto robusto de tecnologias modernas:

### **Frontend**

- **[Next.js](https://nextjs.org/)** (14.2.35): Framework baseado em React para aplicações web rápidas e escaláveis.
- **[Tailwind CSS](https://tailwindcss.com/)** (3.4.1): Framework CSS com foco em utilitários para estilização.
- **[ShadCN](https://ui.shadcn.com/)**: Componentes visualmente atraentes e reutilizáveis.
- **[React Hook Form](https://react-hook-form.com/)**: Manejo simplificado de formulários.
- **[Recharts](https://recharts.org/)**: Biblioteca para visualização de dados e gráficos.
- **[Lucide](https://lucide.dev/)**: Biblioteca de ícones modernos.

### **Backend**

- **[Prisma](https://www.prisma.io/)** (7.x): ORM para consultas e migrações de banco de dados (driver adapter `pg`).
- **[OpenAI API](https://openai.com/api/)**: Integração com ChatGPT para insights financeiros com IA.
- **[Supabase](https://supabase.com/)**: Postgres gerenciado (com cron de keepalive para o plano grátis não pausar).
- **[Stripe](https://stripe.com/)**: Gateway de pagamentos para gerenciar assinaturas.

### **Autenticação**

- **[Clerk](https://clerk.dev/)** (5.7.5): Autenticação segura e fluida para usuários.

### **Ferramentas de Desenvolvimento**

- **TypeScript** (5.x): Tipagem estática para código escalável.
- **Husky** (9.1.6): Hooks do Git para manter a qualidade do código.
- **Lint-Staged** (12.3.2): Verificações pré-commit para linting.
- **Prettier** (3.x): Formatação de código.
- **Vitest** (3.x): Testes unitários.
- **GitHub Actions**: CI com lint, typecheck e testes em cada PR.
- **ESLint** (8.x): Linter para JavaScript.
- **Tailwind Merge**: Utilitário para mesclar classes do Tailwind de forma eficiente.

---

## 📚 Visão Geral das Páginas

1. **Home/Painel de Controle**

   - Mostra insights financeiros agregados e gráficos.
   - Exibe o saldo atual, despesas agrupadas e mais.

2. **Transações**

   - Lista de todas as transações do usuário.
   - Filtros e ordenação por categorias, métodos de pagamento e tipos.

3. **Assinaturas**

   - Escolha entre os planos Gratuito e Premium.
   - Sistema de pagamento integrado com Stripe para upgrades.

4. **Login/Autenticação**
   - Alimentado pelo Clerk para login seguro e gerenciamento de usuários.

---

## 💳 Detalhes da Assinatura

- **Plano Básico**

  - Gratuito.
  - Limitado a **10 transações por mês**.

- **Plano Premium**
  - **R$19/mês**.
  - Transações ilimitadas.
  - Insights financeiros gerados por IA com ChatGPT.

---

## 📦 Instalação e Configuração

1. Clone o repositório:

   ```bash
   git clone https://github.com/MatheusMoura-M/finance-ai.git
   cd finance-ai
   ```

2. Instale as dependências (isso também gera o Prisma Client e configura os hooks do Husky):

   ```bash
   npm install
   ```

3. Configure as variáveis de ambiente copiando o exemplo e preenchendo os valores:

   ```bash
   cp .env.example .env
   ```

   | Variável | Obrigatória | Descrição |
   | --- | --- | --- |
   | `DATABASE_URL` | ✅ | Conexão Postgres (Supabase, via pooler) |
   | `DIRECT_URL` | — | Conexão direta ao Postgres |
   | `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | ✅ | Chave pública do Clerk |
   | `CLERK_SECRET_KEY` | ✅ | Chave secreta do Clerk |
   | `STRIPE_SECRET_KEY` | ✅ | Chave secreta do Stripe |
   | `STRIPE_PREMIUM_PLAN_PRICE_ID` | ✅ | ID do preço do Plano Premium |
   | `STRIPE_WEBHOOK_SECRET` | ✅ | Segredo do endpoint de webhook (`whsec_...`) |
   | `APP_URL` | ✅ | URL pública do app (ex.: `http://localhost:3000`) |
   | `OPENAI_API_KEY` | — | Sem ela, o relatório de IA retorna um exemplo |
   | `OPENAI_MODEL` | — | Modelo do relatório de IA (padrão: `gpt-4o-mini`) |
   | `CRON_SECRET` | — | Protege a rota `/api/keepalive` |

   As variáveis são validadas em `app/_lib/env.ts`; se faltar alguma, o servidor avisa no log ao iniciar.

4. Aplique as migrations no banco:

   ```bash
   npx prisma migrate deploy
   ```

5. Inicie o servidor de desenvolvimento:

   ```bash
   npm run dev
   ```

### Stripe (assinaturas)

- O webhook fica em `/api/webhooks/stripe` e usa os eventos `invoice.paid`, `invoice.payment_failed`, `customer.subscription.updated` e `customer.subscription.deleted`.
- Para testar localmente:

  ```bash
  stripe listen --forward-to localhost:3000/api/webhooks/stripe
  ```

- O botão "Gerenciar Plano" abre o portal do cliente do Stripe, que precisa ter uma configuração salva em *Settings → Billing → Customer portal*.

## 🧑‍💻 Scripts

- **`npm run dev`**: Inicia o servidor de desenvolvimento.
- **`npm run build`**: Gera a aplicação para produção.
- **`npm run start`**: Inicia o servidor em produção.
- **`npm run lint`**: Roda o ESLint.
- **`npm run typecheck`**: Verifica os tipos com o TypeScript.
- **`npm test`**: Roda os testes (Vitest). Use `npm run test:watch` durante o desenvolvimento.
- **`npm run prepare`**: Gera o cliente Prisma e configura os hooks do Husky (roda sozinho no `npm install`).

## 🌟 Melhorias Futuras

- Melhorar o design mobile-first para usabilidade aprimorada.
- Permitir o usuário que possui o plano premium de extrair um PDF do seu relatório mensal de transações.
