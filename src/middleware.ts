import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// Routes that require an authenticated Clerk session
const isProtectedRoute = createRouteMatcher([
  "/dashboard(.*)",
  "/onboarding(.*)",
]);

// Routes that must NEVER be blocked — Clerk webhooks need raw access
const isPublicRoute = createRouteMatcher([
  "/",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/api/webhooks(.*)",   // ← webhook must be fully public
]);

export default clerkMiddleware(async (auth, req) => {
  // Allow all public routes through without auth check
  if (isPublicRoute(req)) return;

  // Protect all /dashboard/* routes — redirect to sign-in if unauthenticated
  if (isProtectedRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    // Run middleware on all routes except static files and Next internals
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
