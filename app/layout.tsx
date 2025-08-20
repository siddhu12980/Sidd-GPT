import type { Metadata } from "next";
import "./globals.css";
import "katex/dist/katex.min.css"; // KaTeX CSS for math rendering
import { Providers } from "./providers";
import { SearchProvider } from "@/components/GlobalSearchShortcut";

export const metadata: Metadata = {
  title: "ChatGPT",
  description: "ChatGPT",
  generator: "sidd.dev",
};

import { ClerkProvider } from "@clerk/nextjs";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body>
          <Providers>
            <SearchProvider>{children}</SearchProvider>
          </Providers>
        </body>
      </html>
    </ClerkProvider>
  );
}
