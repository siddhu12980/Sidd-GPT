"use client";

import { useSignIn } from "@clerk/nextjs";
import { Phone } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function SignInPage() {
  const { isLoaded, signIn, setActive } = useSignIn();
  const [emailAddress, setEmailAddress] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoaded) return;

    setIsLoading(true);
    setError("");

    try {
      const result = await signIn.create({
        identifier: emailAddress,
        password,
      });

      if (result.status === "complete") {
        await setActive({ session: result.createdSessionId });
        router.push("/");
      } else {
        console.error("Sign-in result:", JSON.stringify(result, null, 2));
        setError("Sign-in failed. Please try again.");
      }
    } catch (err: any) {
      console.error("Sign-in error:", err);
      setError(err.errors?.[0]?.message || "An error occurred during sign-in");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOAuthSignIn = async (
    provider: "oauth_google" | "oauth_microsoft" | "oauth_apple"
  ) => {
    if (!isLoaded) return;

    try {
      await signIn.authenticateWithRedirect({
        strategy: provider,
        redirectUrl: "/sso-callback",
        redirectUrlComplete: "/",
      });
    } catch (err: any) {
      setError(err.errors?.[0]?.message || "OAuth sign in failed");
    }
  };

  const handlePhoneSignIn = async () => {
    router.push("/sign-in/phone");
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-[#fafafa] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fafafa] flex flex-col">
      {/* Top Bar */}
      <header className="flex items-center h-16 px-6 border-b border-black/10">
        <span className="text-xl font-semibold">ChatGPT</span>
      </header>
      <main className="flex-1 flex flex-col items-center justify-center">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8 flex flex-col gap-6">
          <h1 className="text-2xl font-semibold text-center mb-2">
            Welcome back
          </h1>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            <div className="flex flex-col gap-2">
              <label htmlFor="email" className="text-sm font-medium">
                Email address
              </label>
              <input
                id="email"
                type="email"
                value={emailAddress}
                onChange={(e) => setEmailAddress(e.target.value)}
                className="border border-gray-300 rounded-lg px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-[#a3a3ff]"
                placeholder="Email address"
                autoComplete="email"
                required
              />
            </div>
            <div className="flex flex-col gap-2">
              <label htmlFor="password" className="text-sm font-medium">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="border border-gray-300 rounded-lg px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-[#a3a3ff]"
                placeholder="Enter your password"
                autoComplete="current-password"
                required
              />
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-black text-white rounded-full py-3 font-medium text-base hover:bg-gray-900 transition disabled:opacity-50"
            >
              {isLoading ? "Signing in..." : "Sign in"}
            </button>
          </form>

          <div className="text-center text-sm text-gray-600">
            Don&apos;t have an account?{" "}
            <a href="/sign-up" className="text-[#4f46e5] hover:underline">
              Sign up
            </a>
          </div>

          <div className="flex items-center gap-2 my-2">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-xs text-gray-400">OR</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          <div className="flex flex-col gap-3">
            <button
              onClick={() => handleOAuthSignIn("oauth_google")}
              type="button"
              className="flex items-center gap-3 border border-gray-200 rounded-full py-2 px-4 bg-white hover:bg-gray-50 transition"
            >
              <img src="/google-tile.svg" alt="Google" className="w-5 h-5" />
              Continue with Google
            </button>
            <button
              onClick={() => handleOAuthSignIn("oauth_microsoft")}
              type="button"
              className="flex items-center gap-3 border border-gray-200 rounded-full py-2 px-4 bg-white hover:bg-gray-50 transition"
            >
              <img src="/microsoft-5.svg" alt="Microsoft" className="w-5 h-5" />
              Continue with Microsoft Account
            </button>
            <button
              onClick={() => handleOAuthSignIn("oauth_apple")}
              type="button"
              className="flex items-center gap-3 border border-gray-200 rounded-full py-2 px-4 bg-white hover:bg-gray-50 transition"
            >
              <img src="/apple-icon.svg" alt="Apple" className="w-5 h-5" />
              Continue with Apple
            </button>
            <button
              onClick={handlePhoneSignIn}
              type="button"
              className="flex items-center gap-3 border border-gray-200 rounded-full py-2 px-4 bg-white hover:bg-gray-50 transition"
            >
              <Phone className="w-5 h-5" />
              Continue with phone
            </button>
          </div>

          <div className="flex justify-center gap-2 mt-4 text-xs text-gray-400">
            <a href="#" className="hover:underline">
              Terms of Use
            </a>
            <span>|</span>
            <a href="#" className="hover:underline">
              Privacy Policy
            </a>
          </div>
        </div>
      </main>
    </div>
  );
}
