import { clerkMiddleware } from "@clerk/nextjs/server";

// No Next 16 o antigo middleware.ts se chama proxy.ts. O Clerk só disponibiliza
// a sessão (auth()) para as páginas; a proteção é feita em cada página/rota.
export default clerkMiddleware();

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
