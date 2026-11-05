// Executado uma vez quando o servidor Next.js inicia.
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { reportServerEnvProblems } = await import("./app/_lib/env");

    reportServerEnvProblems();
  }
}
