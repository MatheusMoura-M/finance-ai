/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // Habilita instrumentation.ts (validação das variáveis de ambiente no boot).
    instrumentationHook: true,
    // Geram PDF e Excel no servidor; carregados do node_modules, sem bundle.
    serverComponentsExternalPackages: ["@react-pdf/renderer", "exceljs"],
  },
};

export default nextConfig;
