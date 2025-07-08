"use client";

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
  userId,
}: {
  handleMessage: (msg: {
    content: string;
    role: "user";
    type?: string;
    fileUrl?: string;
    fileName?: string;
    fileType?: string;
    // NEW: Multiple attachments support
    attachmentUrls?: string[];
    attachmentTypes?: string[];
    attachmentNames?: string[];
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
    // NEW: Multiple attachments support
    attachmentUrls?: string[];
    attachmentTypes?: string[];
    attachmentNames?: string[];
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
  userId?: string;
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

  const handleEditSave = async () => {
    if (editingId && editValue.trim() !== "") {
      // 1. Create updated message with preserved properties
      const originalMessage = messages.find((msg) => msg.id === editingId);
      if (!originalMessage) return;

      const updatedMessage = {
        ...originalMessage,
        content: editValue.trim(),
      };

      // 2. Update UI immediately
      const messageIndex = messages.findIndex((msg) => msg.id === editingId);
      if (messageIndex === -1) return;

      // Update the message and remove all messages after it
      const updatedMessages = [
        ...messages.slice(0, messageIndex),
        updatedMessage,
      ];

      if (setMessages) {
        setMessages(updatedMessages);
      }
      setEditingId(null);
      setEditValue("");

      try {
        // 3. Update the message on the server (PATCH request)
        const response = await fetch(
          `/api/conversations/${sessionId}/messages/${editingId}`,
          {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              content: editValue.trim(),
            }),
          }
        );

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        // 4. ✅ FIXED: Delete subsequent messages using the correct bulk deletion API
        if (messageIndex < messages.length - 1) {
          // There are messages after the edited one that need to be deleted
          const deleteResponse = await fetch(
            `/api/conversations/${sessionId}/messages?after=${editingId}&includeTarget=false`,
            {
              method: "DELETE",
            }
          );

          if (!deleteResponse.ok) {
            console.error("Failed to delete subsequent messages:", deleteResponse.status);
          } else {
            const deleteResult = await deleteResponse.json();
            console.log("Bulk deletion result:", deleteResult);
          }
        }

        // 5. Trigger AI response with the updated context
        const msg = updatedMessage;

        // ✅ FIXED: Handle multiple attachments in reload call
        if (reload) {
          if (msg.attachmentUrls && msg.attachmentUrls.length > 0) {
            // Multiple attachments - use correct body structure
            reload({
              body: {
                userId: userId || "anonymous",
                sessionId: sessionId,
                attachmentUrls: msg.attachmentUrls,
                attachmentTypes: msg.attachmentTypes,
              },
            });
          } else if (msg.fileUrl) {
            // Single file - legacy support
            reload({
              body: {
                userId: userId || "anonymous",
                sessionId: sessionId,
                data: msg.fileUrl,
              },
            });
          } else {
            // Text only message
            reload({
              body: {
                userId: userId || "anonymous",
                sessionId: sessionId,
              },
            });
          }
        }
      } catch (error) {
        console.error("Error updating message:", error);
        // Revert UI changes on error
        if (setMessages) {
          setMessages(messages);
        }
      }
    }
  };

  const handleDelete = async (msg: any, idx: number) => {
    const messageId = msg._id || msg.id;

    // Remove this message and all after it
    const newMessages = messages.slice(0, idx);
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
            <div className="prose prose-invert break-words  py-3 rounded-2xl text-base max-w-[90%] bg-transparent text-white hide-scrollbar overflow-x-auto">
              <div className="min-w-0 w-full overflow-x-auto">
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
              </div>
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
                <div className="prose prose-invert break-words px-4 py-3 rounded-2xl text-base max-w-[90%] bg-[#353740] text-white hide-scrollbar overflow-x-auto">
                  <textarea
                    className="w-full bg-transparent text-white resize-none border-none outline-none p-0 m-0 hide-scrollbar"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleEditSave();
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
                    // NEW: Handle multiple attachments (mixed type OR multiple attachments detected)
                    if (
                      (message.type === "mixed" ||
                        (message.attachmentUrls &&
                          message.attachmentUrls.length > 1)) &&
                      message.attachmentUrls &&
                      message.attachmentUrls.length > 0
                    ) {
                      return (
                        <div className="flex flex-col items-end">
                          {/* Display all attachments */}
                          <div className="flex flex-wrap gap-2 mb-2 max-w-md">
                            {message.attachmentUrls.map((url, index) => {
                              const type =
                                message.attachmentTypes?.[index] || "file";
                              const name =
                                message.attachmentNames?.[index] ||
                                `Attachment ${index + 1}`;

                              if (
                                type === "image" ||
                                url.match(/\.(jpg|jpeg|png|gif|webp|svg|bmp)$/i)
                              ) {
                                return (
                                  <img
                                    key={index}
                                    src={url}
                                    alt={name}
                                    className="w-20 h-20 object-cover rounded-lg"
                                  />
                                );
                              } else {
                                // File attachment
                                const isPdf =
                                  name.toLowerCase().endsWith(".pdf") ||
                                  type === "application/pdf";
                                const isDoc = name
                                  .toLowerCase()
                                  .match(/\.(doc|docx)$/);

                                return (
                                  <div
                                    key={index}
                                    className="flex items-center gap-2 bg-[#232323] rounded-xl p-2 min-w-[120px]"
                                  >
                                    <div className="flex-shrink-0">
                                      {isPdf ? (
                                        <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                                          <span className="text-red-600 text-sm font-bold">
                                            📄
                                          </span>
                                        </div>
                                      ) : isDoc ? (
                                        <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                                          <span className="text-blue-600 text-sm font-bold">
                                            📝
                                          </span>
                                        </div>
                                      ) : (
                                        <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                                          <span className="text-gray-600 text-sm font-bold">
                                            📎
                                          </span>
                                        </div>
                                      )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <p className="text-xs font-medium text-white truncate">
                                        {name}
                                      </p>
                                    </div>
                                  </div>
                                );
                              }
                            })}
                          </div>
                          {/* Show text content if any */}
                          {message.content &&
                            message.content.trim() !==
                              `Analyze these ${message.attachmentUrls.length} files` && (
                              <div className="prose prose-invert break-words px-4 py-3 rounded-2xl text-base max-w-[90%] bg-[#353740] text-white mt-1 hide-scrollbar">
                                <span>{message.content}</span>
                              </div>
                            )}
                        </div>
                      );
                    }

                    // If it's an image message with fileUrl, show the image and text
                    if (message.type === "image" && message.fileUrl) {
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
                      const isPdf =
                        message.fileName?.toLowerCase().endsWith(".pdf") ||
                        message.fileType === "application/pdf";
                      const isDoc =
                        message.fileName
                          ?.toLowerCase()
                          .match(/\.(doc|docx)$/) ||
                        message.fileType?.includes("word");

                      return (
                        <div className="flex flex-col items-end">
                          <div className="flex items-center gap-3 mb-2 bg-[#232323] rounded-xl p-3 max-w-xs">
                            <div className="flex-shrink-0">
                              {isPdf ? (
                                <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                                  <span className="text-red-600 text-xl font-bold">
                                    📄
                                  </span>
                                </div>
                              ) : isDoc ? (
                                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                  <span className="text-blue-600 text-xl font-bold">
                                    📝
                                  </span>
                                </div>
                              ) : (
                                <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                                  <span className="text-gray-600 text-xl font-bold">
                                    📎
                                  </span>
                                </div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-white truncate">
                                {message.fileName || "Document"}
                              </p>
                              <p className="text-xs text-gray-400">
                                {isPdf
                                  ? "PDF Document"
                                  : isDoc
                                  ? "Word Document"
                                  : "File"}
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
