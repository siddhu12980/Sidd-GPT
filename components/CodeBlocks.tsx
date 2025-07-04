"use client";

import React from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import {
  oneDark,
  duotoneLight,
} from "react-syntax-highlighter/dist/esm/styles/prism";

import { vs } from "react-syntax-highlighter/dist/esm/styles/prism";

interface CodeBlockProps {
  node: any;
  inline: boolean;
  className: string;
  children: any;
}

export function CodeBlock({
  node,
  inline,
  className,
  children,
  ...props
}: CodeBlockProps) {
  const [copied, setCopied] = React.useState(false);

  // Extract language from className like "language-js"
  const match = /language-(\w+)/.exec(className || "");
  const language = match ? match[1] : "";

  const isDarkMode =
    typeof window !== "undefined" &&
    window.matchMedia &&
    window.matchMedia("(prefers-color-scheme: dark)").matches;

  const handleCopy = async () => {
    const text = Array.isArray(children) ? children.join("") : String(children);
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch (e) {
      setCopied(false);
    }
  };

  if (!inline) {
    return (
      <div className="not-prose my-4 w-full max-w-3xl min-w-0 overflow-x-auto rounded-xl bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 relative pt-6">
        {/* Language label */}
        {language && (
          <span
            className="absolute top-2 left-3 text-xs font-mono text-gray-400 bg-transparent select-none z-10"
            style={{ pointerEvents: "none", letterSpacing: "0.01em" }}
          >
            {language}
          </span>
        )}
        {/* Copy button */}
        <button
          type="button"
          onClick={handleCopy}
          aria-label="Copy code"
          className="absolute top-2 right-2 z-10 flex items-center gap-1 px-1 py-0.5 bg-transparent text-gray-400 hover:text-gray-600 dark:text-zinc-400 dark:hover:text-zinc-200 border-none shadow-none text-xs font-normal"
          style={{ boxShadow: "none" }}
        >
          <svg
            width="15"
            height="15"
            viewBox="0 0 20 20"
            fill="none"
            style={{ display: "block" }}
          >
            <rect
              x="7"
              y="2.5"
              width="6"
              height="1.2"
              rx="0.6"
              stroke="currentColor"
              strokeWidth="1"
              fill="none"
            />
            <rect
              x="4.5"
              y="5.5"
              width="11"
              height="11"
              rx="1.2"
              stroke="currentColor"
              strokeWidth="1"
              fill="none"
            />
          </svg>
          <span>Copy</span>
        </button>

        {copied && (
          <span className="absolute top-2 right-12 text-xs bg-black text-white px-2 py-0.5 rounded select-none shadow">
            Copied!
          </span>
        )}

        <SyntaxHighlighter
          language={language}
          style={isDarkMode ? oneDark : vs}
          customStyle={{
            margin: 0,
            fontSize: "0.9rem",
            padding: "1rem 1.25rem",
            background: "transparent",
            fontFamily: "'Fira Code', Menlo, monospace",
            overflowX: "auto",
            whiteSpace: "pre",
          }}
          codeTagProps={{ style: { whiteSpace: "pre" } }}
        >
          {String(children)}
        </SyntaxHighlighter>
      </div>
    );
  }

  return (
    <code
      className={`${className} text-sm bg-zinc-100 dark:bg-zinc-800 py-0.5 px-1 rounded-md font-mono`}
      {...props}
    >
      {children}
    </code>
  );
}
