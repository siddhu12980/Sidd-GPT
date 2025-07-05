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
    type?: string;
    fileName?: string;
    fileType?: string;
    fileUrl?: string;
    parts?: { text: string }[];
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
    console.log("=== handleEditSave Debug ===");
    console.log("Message object:", msg);
    console.log("Message _id:", msg._id);
    console.log("Message id:", msg.id);
    console.log("Edit value:", editValue);
    console.log("Session ID:", sessionId);

    const newMessages = [
      ...messages.slice(0, idx),
      { ...msg, content: editValue },
    ];
    setEditingId(null);
    setEditValue("");
    setMessages?.(newMessages);

    const messageId = msg._id || msg.id;

    if (!messageId) {
      console.error("No message ID found!");
      return;
    }

    // PATCH edited message
    await fetch(`/api/conversations/${sessionId}/messages/${messageId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: editValue }),
    });
    
    // Delete all messages after the edited message
    await fetch(`/api/conversations/${sessionId}/messages?after=${messageId}`, {
      method: "DELETE",
    });

    // Reload to get the new AI response
    reload?.();
  };

  const handleDelete = async (msg: any, idx: number) => {
    // Remove this and all after
    const newMessages = messages.slice(0, idx);
    setMessages?.(newMessages);

    const messageId = msg._id;

    console.log("Deleting message", messageId);

    // Delete all messages after the deleted message
    await fetch(`/api/conversations/${sessionId}/messages?after=${messageId}`, {
      method: "DELETE",
    });

    // Reload to get the updated conversation
    reload?.();
  };

  // Helper function to determine if content is a URL and what type
  const getContentType = (content: string) => {
    if (!content) return 'text';
    
    // Check if it's a URL
    try {
      const url = new URL(content);
      const pathname = url.pathname.toLowerCase();
      
      // Check for image extensions
      if (pathname.match(/\.(jpg|jpeg|png|gif|webp|svg|bmp)$/)) {
        return 'image';
      }
      
      // Check for file extensions
      if (pathname.match(/\.(pdf|doc|docx|txt|csv|xlsx|xls|ppt|pptx|zip|rar)$/)) {
        return 'file';
      }
      
      // If it's a URL but not a recognized file type, treat as text
      return 'text';
    } catch {
      // Not a valid URL, treat as text
      return 'text';
    }
  };

  // Helper function to get filename from URL
  const getFileName = (content: string) => {
    try {
      const url = new URL(content);
      const pathname = url.pathname;
      return pathname.split('/').pop() || 'Download file';
    } catch {
      return 'Download file';
    }
  };

  console.log("messages", messages);

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
              {(() => {
                const contentType = getContentType(message.content);
                if (contentType === "image") {
                  return <img src={message.content} alt="uploaded" className="max-w-xs rounded-lg" />;
                } else if (contentType === "file") {
                  return (
                    <a href={message.content} target="_blank" rel="noopener" className="underline">
                      {getFileName(message.content)}
                    </a>
                  );
                } else {
                  return <Markdown>{message.content}</Markdown>;
                }
              })()}
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
                  {(() => {
                    // If it's an image message with fileUrl, show the image and text
                    if (message.type === "image" && message.fileUrl) {
                      return (
                        <div className="flex flex-col items-end">
                          <img src={message.fileUrl} alt={message.fileName || "uploaded"} className="max-w-xs rounded-lg mb-2" />
                          {(message.content || (message.parts && message.parts[0]?.text)) && (
                            <div className="prose prose-invert break-words px-4 py-3 rounded-2xl text-base max-w-[90%] bg-[#353740] text-white mt-1">
                              <span>{message.content || message.parts?.[0]?.text}</span>
                            </div>
                          )}
                        </div>
                      );
                    }
                    // If it's a temporary image message (type is image but no fileUrl), show only the image from content
                    if (message.type === "image" && !message.fileUrl && message.content) {
                      return (
                        <div className="flex flex-col items-end">
                          <img src={message.content} alt="uploaded" className="max-w-xs rounded-lg" />
                        </div>
                      );
                    }
                    // Fallback to your existing logic
                    const contentType = getContentType(message.content);
                    if (contentType === "image") {
                      return <img src={message.content} alt="uploaded" className="max-w-xs rounded-lg" />;
                    } else if (contentType === "file") {
                      return (
                        <a href={message.content} target="_blank" rel="noopener" className="underline">
                          {getFileName(message.content)}
                        </a>
                      );
                    } else {
                      return (
                        <div className="prose prose-invert break-words px-4 py-3 rounded-2xl text-base max-w-[90%] bg-[#353740] text-white">
                          <span>{message.content}</span>
                        </div>
                      );
                    }
                  })()}
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
