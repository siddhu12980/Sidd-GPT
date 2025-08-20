"use client";

import { useEffect, useState } from "react";

const getMobileDetect = (userAgent: string) => {
  const isAndroid = (): boolean => Boolean(userAgent.match(/Android/i));
  const isIos = (): boolean => Boolean(userAgent.match(/iPhone|iPad|iPod/i));
  const isOpera = (): boolean => Boolean(userAgent.match(/Opera Mini/i));
  const isWindows = (): boolean => Boolean(userAgent.match(/IEMobile/i));
  const isSSR = (): boolean => Boolean(userAgent.match(/SSR/i));

  const isMobile = (): boolean =>
    Boolean(isAndroid() || isIos() || isOpera() || isWindows());
  const isDesktop = (): boolean => Boolean(!isMobile() && !isSSR());
  return {
    isMobile,
    isDesktop,
    isAndroid,
    isIos,
    isSSR,
  };
};

export const useIsMobile = () => {
  // Initialize with false to match server rendering
  const [isMobile, setIsMobile] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    const checkIsMobile = () => {
      // Check both user agent and window width for responsive behavior
      const userAgent = navigator.userAgent;
      const device = getMobileDetect(userAgent);
      const isUserAgentMobile = device.isMobile();

      // Also check window width (768px is common mobile breakpoint)
      const isWindowMobile = window.innerWidth < 768;

      // Consider mobile if either user agent suggests mobile OR window is small
      setIsMobile(isUserAgentMobile || isWindowMobile);
    };

    // Initial check
    checkIsMobile();

    // Listen for window resize events
    window.addEventListener("resize", checkIsMobile);

    // Cleanup event listener
    return () => window.removeEventListener("resize", checkIsMobile);
  }, []);

  // Return false during SSR and initial render to prevent hydration mismatch
  if (!mounted) {
    return false;
  }

  return isMobile;
};
