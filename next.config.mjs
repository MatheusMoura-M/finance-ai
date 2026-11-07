/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // Habilita instrumentation.ts (validação das variáveis de ambiente no boot).
    instrumentationHook: true,
    // Gera os PDFs no servidor; precisa ser carregado do node_modules, sem bundle.
    serverComponentsExternalPackages: ["@react-pdf/renderer"],
  },
};

export default nextConfig;
