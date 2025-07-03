"use client";

import { useSignUp } from "@clerk/nextjs";
import { Phone } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function SignUpPage() {
  const { isLoaded, signUp, setActive } = useSignUp();
  const [emailAddress, setEmailAddress] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [pendingVerification, setPendingVerification] = useState(false);
  const [code, setCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [step, setStep] = useState(1); // 1: email/password, 2: name, 3: verification
  const router = useRouter();

  const handleEmailPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoaded) return;

    setIsLoading(true);
    setError("");

    try {
      await signUp.create({
        emailAddress,
        password,
      });

      setStep(2);
    } catch (err: any) {
      console.error("SignUp error:", err);
      if (err.errors?.[0]?.code === "form_identifier_exists") {
        setError(
          "An account with this email already exists. Try signing in instead."
        );
      } else if (err.errors?.[0]?.code === "form_password_pwned") {
        setError(
          "This password has been compromised. Please choose a different password."
        );
      } else if (err.errors?.[0]?.code === "form_password_length_too_short") {
        setError("Password must be at least 8 characters long.");
      } else {
        setError(err.errors?.[0]?.message || "An error occurred during signup");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleNameSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoaded) return;

    setIsLoading(true);
    setError("");

    try {
      // Update the signup with first name and last name
      await signUp.update({
        firstName,
        lastName,
      });

      // Prepare email verification
      await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
      setPendingVerification(true);
      setStep(3);
    } catch (err: any) {
      setError(
        err.errors?.[0]?.message ||
          "An error occurred while updating your information"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerificationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoaded) return;

    setIsLoading(true);
    setError("");

    try {
      const result = await signUp.attemptEmailAddressVerification({
        code,
      });

      if (result.status === "complete") {
        await setActive({ session: result.createdSessionId });
        router.push("/");
      }
    } catch (err: any) {
      setError(err.errors?.[0]?.message || "Invalid verification code");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOAuthSignUp = async (
    provider: "oauth_google" | "oauth_microsoft" | "oauth_apple"
  ) => {
    if (!isLoaded) return;

    try {
      await signUp.authenticateWithRedirect({
        strategy: provider,
        redirectUrl: "/sso-callback",
        redirectUrlComplete: "/",
      });
    } catch (err: any) {
      setError(err.errors?.[0]?.message || "OAuth sign up failed");
    }
  };

  const handlePhoneSignUp = async () => {
    router.push("/sign-up/phone");
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
            Create your account
          </h1>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Step 1: Email and Password */}
          {step === 1 && (
            <form
              onSubmit={handleEmailPasswordSubmit}
              className="flex flex-col gap-6"
            >
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
                  placeholder="Create a password (min. 8 characters)"
                  autoComplete="new-password"
                  minLength={8}
                  required
                />
                {password && password.length < 8 && (
                  <p className="text-xs text-red-600">
                    Password must be at least 8 characters long
                  </p>
                )}
              </div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-black text-white rounded-full py-3 font-medium text-base hover:bg-gray-900 transition disabled:opacity-50"
              >
                {isLoading ? "Continue..." : "Continue"}
              </button>
            </form>
          )}

          {/* Step 2: First Name and Last Name */}
          {step === 2 && (
            <form onSubmit={handleNameSubmit} className="flex flex-col gap-6">
              <div className="text-center mb-2">
                <p className="text-sm text-gray-600">Tell us about yourself</p>
              </div>
              <div className="flex flex-col gap-2">
                <label htmlFor="firstName" className="text-sm font-medium">
                  First name
                </label>
                <input
                  id="firstName"
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="border border-gray-300 rounded-lg px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-[#a3a3ff]"
                  placeholder="First name"
                  autoComplete="given-name"
                  required
                />
              </div>
              <div className="flex flex-col gap-2">
                <label htmlFor="lastName" className="text-sm font-medium">
                  Last name
                </label>
                <input
                  id="lastName"
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="border border-gray-300 rounded-lg px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-[#a3a3ff]"
                  placeholder="Last name"
                  autoComplete="family-name"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-black text-white rounded-full py-3 font-medium text-base hover:bg-gray-900 transition disabled:opacity-50"
              >
                {isLoading ? "Creating account..." : "Create account"}
              </button>
            </form>
          )}

          {/* Step 3: Email Verification */}
          {step === 3 && (
            <form
              onSubmit={handleVerificationSubmit}
              className="flex flex-col gap-6"
            >
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-4">
                  We've sent a verification code to{" "}
                  <strong>{emailAddress}</strong>
                </p>
              </div>
              <div className="flex flex-col gap-2">
                <label htmlFor="code" className="text-sm font-medium">
                  Verification Code
                </label>
                <input
                  id="code"
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="border border-gray-300 rounded-lg px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-[#a3a3ff]"
                  placeholder="Enter verification code"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-black text-white rounded-full py-3 font-medium text-base hover:bg-gray-900 transition disabled:opacity-50"
              >
                {isLoading ? "Verifying..." : "Verify email"}
              </button>
            </form>
          )}

          <div className="text-center text-sm text-gray-600">
            Already have an account?{" "}
            <a href="/sign-in" className="text-[#4f46e5] hover:underline">
              Sign in
            </a>
          </div>

          <div className="flex items-center gap-2 my-2">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-xs text-gray-400">OR</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          <div className="flex flex-col gap-3">
            <button
              onClick={() => handleOAuthSignUp("oauth_google")}
              type="button"
              className="flex items-center gap-3 border border-gray-200 rounded-full py-2 px-4 bg-white hover:bg-gray-50 transition"
            >
              <img src="/google-tile.svg" alt="Google" className="w-5 h-5" />
              Continue with Google
            </button>
            <button
              onClick={() => handleOAuthSignUp("oauth_microsoft")}
              type="button"
              className="flex items-center gap-3 border border-gray-200 rounded-full py-2 px-4 bg-white hover:bg-gray-50 transition"
            >
              <img src="/microsoft-5.svg" alt="Microsoft" className="w-5 h-5" />
              Continue with Microsoft Account
            </button>
            <button
              onClick={() => handleOAuthSignUp("oauth_apple")}
              type="button"
              className="flex items-center gap-3 border border-gray-200 rounded-full py-2 px-4 bg-white hover:bg-gray-50 transition"
            >
              <img src="/apple-icon.svg" alt="Apple" className="w-5 h-5" />
              Continue with Apple
            </button>
            <button
              onClick={handlePhoneSignUp}
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
