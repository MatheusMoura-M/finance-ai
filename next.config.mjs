/** @type {import('next').NextConfig} */
const nextConfig = {
  // Geram PDF e Excel no servidor; carregados do node_modules, sem bundle.
  // (instrumentation.ts já é padrão desde o Next 15, sem flag.)
  serverExternalPackages: ["@react-pdf/renderer", "exceljs"],
};

export default nextConfig;
