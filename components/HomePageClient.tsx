"use client";

import { useUser } from "@clerk/nextjs";
import { useState, useEffect } from "react";
import Home from "@/components/Home";
import LandingPage from "@/components/LandingPage";

interface HomePageClientProps {
  initialUserId: string | null;
}

export default function HomePageClient({ initialUserId }: HomePageClientProps) {
  const { user, isLoaded } = useUser();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // During SSR and initial render, use the server-provided auth state
  if (!mounted) {
    if (initialUserId) {
      return <Home />;
    } else {
      return <LandingPage />;
    }
  }

  // After mounting, use the client-side auth state (more accurate)
  if (!isLoaded) {
    // Show loading state while Clerk is loading
    return (
      <div className="flex justify-center items-center h-screen bg-[#212121]">
        <div className="w-10 h-10 border-t-transparent border-solid animate-spin rounded-full border-blue-500 border-8"></div>
      </div>
    );
  }

  if (user) {
    return <Home />;
  } else {
    return <LandingPage />;
  }
}
