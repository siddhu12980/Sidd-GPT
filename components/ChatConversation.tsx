"use client";

import ReactMarkdown from "react-markdown";
import { useEffect, useRef, useState } from "react";
import { Edit, Trash2, Brain } from "lucide-react";
import ChatActionBar from "./ChatActionBar";
import "./hide-scrollbar.css";
import { Markdown } from "./Format";
import { ChatRequestOptions } from "ai";

export default function ChatConversation({
  handleMessage,
  messages,
  isLoading,
  status,
  reload,
  setMessages,
  sessionId,
  append,
}: {
  handleMessage: (msg: {
    content: string;
    role: "user";
    type?: string;
    fileUrl?: string;
    fileName?: string;
    fileType?: string;
  }) => void;
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
  reload?: (
    chatRequestOptions?: ChatRequestOptions
  ) => Promise<string | null | undefined>;
  setMessages?: (msgs: any[]) => void;
  sessionId?: string;
  append?: (message: {
    role: "user";
    content: string;
    data?: string;
    id?: string;
  }) => void;
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

  console.log("messages in chat conversation", messages);

  const handleEdit = (msg: any) => {
    console.log("=== handleEdit Debug ===");
    console.log("Message object:", msg);
    console.log("Message _id:", msg._id);
    console.log("Message id:", msg.id);
    console.log("Message content:", msg.content);
    setEditingId(msg._id || msg.id);
    setEditValue(msg.content);
  };

  const handleEditSave = async (msg: any, idx: number) => {
    console.log("=== handleEditSave Debug ===");
    console.log("Original message object:", msg);
    console.log("Message _id:", msg._id);
    console.log("Message id:", msg.id);
    console.log("Edit value:", editValue);
    console.log("Session ID:", sessionId);
    console.log("Message index:", idx);

    console.log("Message properties to preserve:", {
      type: msg.type,
      fileUrl: msg.fileUrl,
      fileName: msg.fileName,
      fileType: msg.fileType,
    });

    const messageId = msg._id || msg.id;

    if (!messageId) {
      console.error("No message ID found!");
      return;
    }

    // Create updated message preserving ALL original properties except content
    const updatedMessage = {
      ...msg, // Preserve all original properties
      content: editValue, // Only update content
    };

    console.log("Updated message object:", updatedMessage);

    // First, update the UI immediately with the edited message
    // Keep messages up to and including the edited message, remove all after
    const newMessages = [
      ...messages.slice(0, idx), // All messages before the edited one
      updatedMessage, // The edited message with new content
      // Remove all messages after the edited one
    ];

    console.log("New messages array:", newMessages);
    setEditingId(null);
    setEditValue("");
    setMessages?.(newMessages);

    // PATCH edited message - only send content to preserve other fields
    try {
      const patchResponse = await fetch(
        `/api/conversations/${sessionId}/messages/${messageId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: editValue }),
        }
      );

      if (!patchResponse.ok) {
        console.error("Failed to update message:", patchResponse.status);
        const errorText = await patchResponse.text();
        console.error("Error details:", errorText);
        return;
      }

      const updatedMessageFromServer = await patchResponse.json();
      console.log("Message updated on server:", updatedMessageFromServer);
    } catch (error) {
      console.error("Error updating message:", error);
      return;
    }

    // Delete all messages after the edited message (but keep the edited message)
    try {
      const deleteResponse = await fetch(
        `/api/conversations/${sessionId}/messages?after=${messageId}&includeTarget=false`,
        {
          method: "DELETE",
        }
      );

      if (!deleteResponse.ok) {
        console.error(
          "Failed to delete subsequent messages:",
          deleteResponse.status
        );
        return;
      }

      const deleteResult = await deleteResponse.json();
      console.log(
        "Successfully deleted messages after edited message:",
        deleteResult
      );
    } catch (error) {
      console.error("Error deleting subsequent messages:", error);
      return;
    }

    // Trigger AI response using reload() to avoid creating duplicate messages
    // reload() works on the current message state and doesn't add new messages
    if (reload) {
      console.log("Triggering AI response with reload()");
      try {
        // For multimodal messages, pass the file data to reload()
        if (msg.fileUrl) {
          await reload({
            data: msg.fileUrl, // Pass the file URL as data
            body: {
              // Any additional multimodal context if needed
              fileType: msg.fileType,
              fileName: msg.fileName,
            },
          });
        } else {
          // For text-only messages
          await reload();
        }
      } catch (error) {
        console.error("Error triggering AI response:", error);
      }
    } else {
      console.log("No reload function available");
    }
  };

  const handleDelete = async (msg: any, idx: number) => {
    const messageId = msg._id || msg.id;

    console.log("=== handleDelete Debug ===");
    console.log("Deleting message", messageId);
    console.log("Message index:", idx);

    // Remove this message and all after it
    const newMessages = messages.slice(0, idx);
    console.log("New messages after delete:", newMessages);
    setMessages?.(newMessages);

    // Delete this message and all messages after it from the server (includeTarget=true)
    try {
      const deleteResponse = await fetch(
        `/api/conversations/${sessionId}/messages?after=${messageId}&includeTarget=true`,
        {
          method: "DELETE",
        }
      );

      if (!deleteResponse.ok) {
        console.error("Failed to delete messages:", deleteResponse.status);
        return;
      }

      const deleteResult = await deleteResponse.json();
      console.log("Successfully deleted messages from server:", deleteResult);
    } catch (error) {
      console.error("Error deleting messages:", error);
      return;
    }
  };

  // Helper function to determine if content is a URL and what type
  const getContentType = (content: string) => {
    if (!content) return "text";

    // Check if it's a URL
    try {
      const url = new URL(content);
      const pathname = url.pathname.toLowerCase();

      // Check for image extensions
      if (pathname.match(/\.(jpg|jpeg|png|gif|webp|svg|bmp)$/)) {
        return "image";
      }

      // Check for file extensions
      if (
        pathname.match(/\.(pdf|doc|docx|txt|csv|xlsx|xls|ppt|pptx|zip|rar)$/)
      ) {
        return "file";
      }

      // If it's a URL but not a recognized file type, treat as text
      return "text";
    } catch {
      // Not a valid URL, treat as text
      return "text";
    }
  };

  // Helper function to get filename from URL
  const getFileName = (content: string) => {
    try {
      const url = new URL(content);
      const pathname = url.pathname;
      return pathname.split("/").pop() || "Download file";
    } catch {
      return "Download file";
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
            <div className="prose prose-invert break-words px-4 py-3 rounded-2xl text-base max-w-[90%] bg-transparent text-white hide-scrollbar">
              {(() => {
                const contentType = getContentType(message.content);
                if (contentType === "image") {
                  return (
                    <img
                      src={message.content}
                      alt="uploaded"
                      className="max-w-xs rounded-lg"
                    />
                  );
                } else if (contentType === "file") {
                  return (
                    <a
                      href={message.content}
                      target="_blank"
                      rel="noopener"
                      className="underline"
                    >
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
                  status === "ready" || status === "error" ? reload : undefined
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
                <div className="prose prose-invert break-words px-4 py-3 rounded-2xl text-base max-w-[90%] bg-[#353740] text-white hide-scrollbar">
                  <textarea
                    className="w-full bg-transparent text-white resize-none border-none outline-none p-0 m-0 hide-scrollbar"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleEditSave(message, index);
                      } else if (e.key === "Escape") {
                        setEditingId(null);
                        setEditValue("");
                      }
                    }}
                    rows={Math.max(1, editValue.split("\n").length)}
                    autoFocus
                  />
                </div>
              ) : (
                <>
                  {(() => {
                    console.log("=== Message Rendering Debug ===");
                    console.log("Message:", message);
                    console.log("Message type:", message.type);
                    console.log("Message fileUrl:", message.fileUrl);
                    console.log("Message fileName:", message.fileName);
                    console.log("Message fileType:", message.fileType);
                    console.log("=== End Debug ===");
                    
                    // If it's an image message with fileUrl, show the image and text
                    if (message.type === "image" && message.fileUrl) {
                      console.log("🖼️ Rendering image message");
                      return (
                        <div className="flex flex-col items-end">
                          <img
                            src={message.fileUrl}
                            alt={message.fileName || "uploaded"}
                            className="max-w-xs rounded-lg mb-2"
                          />
                          {(message.content ||
                            (message.parts && message.parts[0]?.text)) && (
                            <div className="prose prose-invert break-words px-4 py-3 rounded-2xl text-base max-w-[90%] bg-[#353740] text-white mt-1 hide-scrollbar">
                              <span>
                                {message.content || message.parts?.[0]?.text}
                              </span>
                            </div>
                          )}
                        </div>
                      );
                    }
                    
                    // If it's a file message (PDF, DOC, etc.) with fileUrl, show file icon and text
                    if (message.type === "file" && message.fileUrl) {
                      console.log("📄 Rendering file message - this should be your PDF!");
                      const isPdf = message.fileName?.toLowerCase().endsWith('.pdf') || message.fileType === 'application/pdf';
                      const isDoc = message.fileName?.toLowerCase().match(/\.(doc|docx)$/) || message.fileType?.includes('word');
                      console.log("isPdf:", isPdf, "isDoc:", isDoc);
                      
                      return (
                        <div className="flex flex-col items-end">
                          <div className="flex items-center gap-3 mb-2 bg-[#232323] rounded-xl p-3 max-w-xs">
                            <div className="flex-shrink-0">
                              {isPdf ? (
                                <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                                  <span className="text-red-600 text-xl font-bold">📄</span>
                                </div>
                              ) : isDoc ? (
                                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                  <span className="text-blue-600 text-xl font-bold">📝</span>
                                </div>
                              ) : (
                                <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                                  <span className="text-gray-600 text-xl font-bold">📎</span>
                                </div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-white truncate">
                                {message.fileName || "Document"}
                              </p>
                              <p className="text-xs text-gray-400">
                                {isPdf ? "PDF Document" : isDoc ? "Word Document" : "File"}
                              </p>
                            </div>
                          </div>
                          {(message.content ||
                            (message.parts && message.parts[0]?.text)) && (
                            <div className="prose prose-invert break-words px-4 py-3 rounded-2xl text-base max-w-[90%] bg-[#353740] text-white mt-1 hide-scrollbar">
                              <span>
                                {message.content || message.parts?.[0]?.text}
                              </span>
                            </div>
                          )}
                        </div>
                      );
                    }
                    
                    // If it's a temporary image message (type is image but no fileUrl), show only the image from content
                    if (
                      message.type === "image" &&
                      !message.fileUrl &&
                      message.content
                    ) {
                      return (
                        <div className="flex flex-col items-end">
                          <img
                            src={message.content}
                            alt="uploaded"
                            className="max-w-xs rounded-lg"
                          />
                        </div>
                      );
                    }
                    
                    // Fallback to your existing logic
                    const contentType = getContentType(message.content);
                    if (contentType === "image") {
                      return (
                        <img
                          src={message.content}
                          alt="uploaded"
                          className="max-w-xs rounded-lg"
                        />
                      );
                    } else if (contentType === "file") {
                      return (
                        <a
                          href={message.content}
                          target="_blank"
                          rel="noopener"
                          className="underline"
                        >
                          {getFileName(message.content)}
                        </a>
                      );
                    } else {
                      return (
                        <div className="prose prose-invert break-words px-4 py-3 rounded-2xl text-base max-w-[90%] bg-[#353740] text-white hide-scrollbar">
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
