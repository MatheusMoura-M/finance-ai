/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // Habilita instrumentation.ts (validação das variáveis de ambiente no boot).
    instrumentationHook: true,
  },
};

export default nextConfig;
