import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// Public routes that don't require authentication
const isPublicRoute = createRouteMatcher([
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/", // Allow access to limited features on home page
  "/pricing(.*)",
  "/api/public(.*)", // Public API routes if any
]);

// Routes that require authentication
const isProtectedRoute = createRouteMatcher([
  "/(authenticated)(.*)", // All routes in the authenticated group
  "/api/protected(.*)", // Protected API routes
  "/api/conversations(.*)",
  "/chat(.*)", // Protect chat routes
]);

export default clerkMiddleware(async (auth, req) => {
  const pathname = req.nextUrl.pathname;
  console.log("Middleware - Path:", pathname);

  // Allow public routes
  if (isPublicRoute(req)) {
    console.log("Middleware - Public route, allowing access");
    return;
  }

  // Check if it's a protected route
  if (isProtectedRoute(req)) {
    console.log("Middleware - Protected route detected");
    const { userId } = await auth();

    console.log("Middleware - userId:", userId);

    if (!userId) {
      console.log("Middleware - No userId, redirecting to sign-in");
      // User is not signed in, redirect to /sign-in
      const signInUrl = new URL("/sign-in", req.url);
      signInUrl.searchParams.set("redirect_url", req.url);
      return NextResponse.redirect(signInUrl);
    }

    console.log("Middleware - User authenticated, allowing access");
  }

  console.log("Middleware - Other route, allowing access");
  // For all other routes, allow access (they can check auth status in the component)
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
