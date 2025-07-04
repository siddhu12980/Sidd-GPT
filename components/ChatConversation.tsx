"use client";

import ReactMarkdown from "react-markdown";
import { useEffect, useRef, useState } from "react";
import { Edit, Trash2, Brain } from "lucide-react";
import ChatActionBar from "./ChatActionBar";
import "./hide-scrollbar.css";
import { Markdown } from "./Format";

export default function ChatConversation({
  messages,
  isLoading,
  status,
  reload,
  setMessages,
  sessionId,
}: {
  messages: {
    _id?: string;
    id?: string;
    role: string;
    content: string;
    createdAt?: string;
  }[];
  isLoading: boolean;
  status?: string;
  reload?: () => void;
  setMessages?: (msgs: any[]) => void;
  sessionId?: string;
}) {
  const lastMessageRef = useRef<HTMLDivElement>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");

  useEffect(() => {
    if (lastMessageRef.current) {
      lastMessageRef.current.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  }, [messages.length]);

  const handleEdit = (msg: any) => {
    setEditingId(msg._id || msg.id);
    setEditValue(msg.content);
  };

  const handleEditSave = async (msg: any, idx: number) => {
    const newMessages = [
      ...messages.slice(0, idx),
      { ...msg, content: editValue },
    ];
    setEditingId(null);
    setEditValue("");
    setMessages?.(newMessages);

    const messageId = msg._id;

    // PATCH edited message
    await fetch(`/api/conversations/${sessionId}/messages/${messageId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: editValue }),
    });
    
    await fetch(`/api/conversations/${sessionId}/messages?after=${messageId}`, {
      method: "DELETE",
    });

    reload?.();
  };

  const handleDelete = async (msg: any, idx: number) => {
    // Remove this and all after
    const newMessages = messages.slice(0, idx);
    setMessages?.(newMessages);

    const messageId = msg._id;

    await fetch(`/api/conversations/${sessionId}/messages?after=${messageId}`, {
      method: "DELETE",
    });
  };

  return (
    <div className="flex flex-col gap-4 w-full max-w-2xl mx-auto py-6 hide-scrollbar overflow-y-auto">
      {messages.map((message, index) => (
        <div
          key={message._id || message.id || index}
          className={`flex ${
            message.role === "user" ? "justify-end" : "justify-start"
          }`}
          ref={index === messages.length - 1 ? lastMessageRef : undefined}
        >
          {message.role === "assistant" ? (
            <div className="prose prose-invert break-words px-4 py-3 rounded-2xl text-base max-w-[90%] bg-transparent text-white">
              <Markdown>{message.content}</Markdown>
              <ChatActionBar
                content={message.content}
                onRegenerate={
                  status === "ready" || status === "error"
                    ? reload
                    : undefined
                }
              />
              {/* Memory indicator - show on first AI message or when context is used */}
              {index === 1 && (
                <div className="flex items-center gap-1 mt-2 text-xs text-gray-400">
                  <Brain className="w-3 h-3" />
                  <span>Using conversation memory</span>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-end group">
              {editingId === (message._id || message.id) ? (
                <div className="prose prose-invert break-words px-4 py-3 rounded-2xl text-base max-w-[90%] bg-[#353740] text-white">
                  <textarea
                    className="w-full bg-transparent text-white resize-none border-none outline-none p-0 m-0"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleEditSave(message, index);
                      } else if (e.key === 'Escape') {
                        setEditingId(null);
                        setEditValue("");
                      }
                    }}
                    rows={Math.max(1, editValue.split('\n').length)}
                    autoFocus
                  />
                </div>
              ) : (
                <>
                  <div className="prose prose-invert break-words px-4 py-3 rounded-2xl text-base max-w-[90%] bg-[#353740] text-white">
                    <span>{message.content}</span>
                  </div>
                  
                  <div className="flex gap-4 mt-2 items-center text-gray-400 pt-2 pb-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200  rounded-lg">
                    <button
                      onClick={() => handleEdit(message)}
                      title="Edit"
                      className="hover:text-blue-400"
                    >
                      <Edit size={18} />
                    </button>
                    <button
                      onClick={() => handleDelete(message, index)}
                      title="Delete"
                      className="hover:text-red-400"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
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
