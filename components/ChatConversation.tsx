"use client";

import ReactMarkdown from "react-markdown";
import { useEffect, useRef } from "react";
import ChatActionBar from "./ChatActionBar";
import "./hide-scrollbar.css";

export default function ChatConversation({
  messages,
  isLoading,
  status,
  reload,
}: {
  messages: {
    _id?: string;
    role: string;
    content: string;
    createdAt?: string;
  }[];
  isLoading: boolean;
  status?: string;
  reload?: () => void;
}) {
  const lastMessageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (lastMessageRef.current) {
      lastMessageRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [messages.length]);

  return (
    <div className="flex flex-col gap-4 w-full max-w-2xl mx-auto py-6 hide-scrollbar overflow-y-auto">
      {messages.map((message, index) => (
        <div
          key={message._id || index}
          className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
          ref={index === messages.length - 1 ? lastMessageRef : undefined}
        >
          <div
            className={`prose prose-invert break-words px-4 py-3 rounded-2xl text-base max-w-[90%] ${
              message.role === "user"
                ? "bg-[#353740] text-white rounded-2xl"
                : "bg-transparent text-white"
            }`}
          >
            {message.role === "assistant" ? (
              <>
                <ReactMarkdown>{message.content}</ReactMarkdown>
                <ChatActionBar
                  content={message.content}
                  onRegenerate={
                    status === "ready" || status === "error" ? reload : undefined
                  }
                />
              </>
            ) : (
              message.content
            )}
          </div>
        </div>
      ))}
      {isLoading && (
        <div className="flex justify-start">
          <div className="px-4 py-3 rounded-xl text-white flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-white animate-pulse"></span>
          </div>
        </div>
      )}
    </div>
  );
}
