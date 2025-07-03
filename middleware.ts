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
]);

export default clerkMiddleware(async (auth, req) => {
  // Allow public routes
  if (isPublicRoute(req)) return;

  // Check if it's a protected route
  if (isProtectedRoute(req)) {
    const { userId } = await auth();

    console.log("userId in middleware", userId);

    if (!userId) {
      // User is not signed in, redirect to /sign-in
      const signInUrl = new URL("/sign-in", req.url);
      signInUrl.searchParams.set("redirect_url", req.url);
      return NextResponse.redirect(signInUrl);
    }
  }

  // For all other routes, allow access (they can check auth status in the component)
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
