import React, { memo } from "react";
import ReactMarkdown from "react-markdown";
import type { Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import { CodeBlock } from "@/components/CodeBlocks";

import "katex/dist/katex.min.css";

const preprocessNumberFormatting = (content: string): string => {
  let processed = content;

  processed = processed.replace(
    /(\d+(?:\.\d+)?)(billion|million|trillion|B|M|T)(?=\s|$)/gi,
    "$1 $2"
  );
  processed = processed.replace(/(\d{4})(to|by|in)(\d{4})/gi, "$1 $2 $3");

  // Only add spaces for actual currency patterns (no space between $ and number)
  processed = processed.replace(/(\$)(\d+(?:\.\d+)?)/g, "$1 $2");

  return processed;
};

const latexMatrixRegex =
  /\\begin\{(pmatrix|bmatrix|matrix)\}([\s\S]*?)\\end\{\1\}/g;

function latexMatrixToAsciiTable(latex: string): string {
  // Split rows by \\ and cells by &
  return latex
    .trim()
    .split("\\\\")
    .map(
      (row) =>
        "| " +
        row
          .trim()
          .split("&")
          .map((cell) => cell.trim())
          .join("  ") +
        " |"
    )
    .join("\n");
}

const preprocessMathContent = (content: string): string => {
  let processed = content;

  // 1. Convert LaTeX matrices to ASCII/markdown tables (per MATRIX_FORMATTING_RULE)
  processed = processed.replace(latexMatrixRegex, (_, _type, matrixContent) => {
    return latexMatrixToAsciiTable(matrixContent);
  });

  // 2. Block math normalization (for non-matrix math)
  processed = processed.replace(
    /\\\[([\s\S]*?)\\\]/g,
    (_, expr) => `\n\n$$${expr.trim()}$$\n\n`
  );
  processed = processed.replace(
    /\\\\\[([\s\S]*?)\\\\\]/g,
    (_, expr) => `\n\n$$${expr.trim()}$$\n\n`
  );

  // 3. Inline math normalization
  processed = processed.replace(
    /\\\(([\s\S]*?)\\\)/g,
    (_, expr) => `$${expr.trim()}$`
  );
  processed = processed.replace(
    /\\\\\(([\s\S]*?)\\\\\)/g,
    (_, expr) => `$${expr.trim()}$`
  );

  return processed;
};

const components: Partial<Components> = {
  code: (props: any) => (
    <CodeBlock
      node={props.node}
      inline={props.inline ?? false}
      className={props.className ?? ""}
      {...props}
    >
      {props.children}
    </CodeBlock>
  ),
  pre: ({ children }) => <>{children}</>,
  table: ({ children, ...props }) => (
    <div className="w-full overflow-x-auto">
      <table
        className="min-w-[600px] border-collapse border border-gray-300 dark:border-gray-600 my-4 w-full"
        {...props}
      >
        {children}
      </table>
    </div>
  ),
  thead: ({ children, ...props }) => (
    <thead className="bg-gray-50 dark:bg-gray-800" {...props}>
      {children}
    </thead>
  ),
  tbody: ({ children, ...props }) => <tbody {...props}>{children}</tbody>,
  tr: ({ children, ...props }) => (
    <tr className="border-b border-gray-200 dark:border-gray-700" {...props}>
      {children}
    </tr>
  ),
  th: ({ children, ...props }) => (
    <th
      className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-left font-semibold bg-gray-100 dark:bg-gray-700 dark:text-gray-100"
      {...props}
    >
      {children}
    </th>
  ),
  td: ({ children, ...props }) => (
    <td
      className="border border-gray-300 dark:border-gray-600 px-4 py-2 dark:text-gray-100"
      {...props}
    >
      {children}
    </td>
  ),
  ol: ({ children, ...props }) => (
    <ol className="list-decimal list-outside ml-4" {...props}>
      {children}
    </ol>
  ),
  li: ({ children, ...props }) => (
    <li className="py-1" {...props}>
      {children}
    </li>
  ),
  ul: ({ children, ...props }) => (
    <ul className="list-disc list-outside ml-4" {...props}>
      {children}
    </ul>
  ),
  strong: ({ children, ...props }) => (
    <span className="font-semibold" {...props}>
      {children}
    </span>
  ),
  a: ({ children, ...props }) => (
    <a
      className="text-blue-500 hover:underline"
      target="_blank"
      rel="noreferrer"
      {...props}
    >
      {children}
    </a>
  ),
  h1: ({ children, ...props }) => (
    <h1 className="text-3xl font-semibold mt-6 mb-2" {...props}>
      {children}
    </h1>
  ),
  h2: ({ children, ...props }) => (
    <h2 className="text-2xl font-semibold mt-6 mb-2" {...props}>
      {children}
    </h2>
  ),
  h3: ({ children, ...props }) => (
    <h3 className="text-xl font-semibold mt-6 mb-2" {...props}>
      {children}
    </h3>
  ),
  h4: ({ children, ...props }) => (
    <h4 className="text-lg font-semibold mt-6 mb-2" {...props}>
      {children}
    </h4>
  ),
  h5: ({ children, ...props }) => (
    <h5 className="text-base font-semibold mt-6 mb-2" {...props}>
      {children}
    </h5>
  ),
  h6: ({ children, ...props }) => (
    <h6 className="text-sm font-semibold mt-6 mb-2" {...props}>
      {children}
    </h6>
  ),
};

const NonMemoizedMarkdown = ({ children }: { children: string }) => {
  const formattedContent = preprocessNumberFormatting(children);
  const processedContent = preprocessMathContent(formattedContent);

  return (
    <div className="max-w-full overflow-x-auto pl-2 text-white bg-transparent">
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeRaw, rehypeKatex]}
        components={components}
      >
        {processedContent}
      </ReactMarkdown>
    </div>
  );
};

export const Markdown = memo(
  NonMemoizedMarkdown,
  (prevProps, nextProps) => prevProps.children === nextProps.children
);
