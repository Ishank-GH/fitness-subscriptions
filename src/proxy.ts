import { clerkMiddleware } from "@clerk/nextjs/server";

/**
 * Clerk modern proxy handler.
 * Following Clerk Core 3 / v7 recommendations, authentication and role-based
 * access controls are enforced at the resource level in layouts and route handlers
 * (via @/lib/auth) rather than deprecated path-matching middleware.
 */
export default clerkMiddleware();

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
