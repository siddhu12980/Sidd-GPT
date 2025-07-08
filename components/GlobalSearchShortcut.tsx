"use client";
import { createContext, useContext, useEffect, useState } from "react";
import { SearchModal } from "./SearchModal";

interface SearchContextType {
  isSearchOpen: boolean;
  setIsSearchOpen: (open: boolean) => void;
}

export const SearchContext = createContext<SearchContextType>({
  isSearchOpen: false,
  setIsSearchOpen: () => {},
});

export function useSearch() {
  return useContext(SearchContext);
}

export function SearchProvider({ children }: { children: React.ReactNode }) {
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check for Ctrl+K (Windows/Linux) or Cmd+K (Mac)
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        e.stopPropagation();
        setIsSearchOpen((prev) => !prev);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <SearchContext.Provider value={{ isSearchOpen, setIsSearchOpen }}>
      {children}
      <SearchModal open={isSearchOpen} onOpenChange={setIsSearchOpen} />
    </SearchContext.Provider>
  );
}

// This component is now just a wrapper for the provider
export function GlobalSearchShortcut() {
  return null;
}
