"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import "./hide-scrollbar.css";

import { PanelLeft } from "lucide-react";

import PricingPage from "@/app/pricing/page";
import { useChat } from "@ai-sdk/react";

import { Logo } from "@/components/logo";
import MobileSidebar from "@/components/MobileSideBar";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import SideBarNavigation from "./SideBarNavigation";
import ChatHistory from "./ChatHistory";
import SideBarFooter from "./SideBarFooter";
import { ConfirmDialog } from "@/components/ConfirmDialog";

// Import the new hooks
import {
  useAddMessage,
  useCreateConversation,
  useDeleteConversation,
  useGenerateTitle,
  useUpdateConversation,
  useConversations,
} from "@/hooks/useConversations";
import { useIsMobile } from "@/hooks/use-mobile";
import MemoriesPage from "./Memories";
import MainChatScreen from "./MainChatScreen";
import { DatabaseMessage, toSendMessageFormat } from "@/lib/message-utils";

export default function ChatClient({
  sessionId,
  sessionTitle,
  initialMessages,
  userId,
}: {
  sessionId: string;
  sessionTitle: string;
  initialMessages: any[];
  userId?: string;
}) {
  const router = useRouter();
  const { user } = useUser();

  const createConversationMutation = useCreateConversation();
  const deleteConversationMutation = useDeleteConversation();
  const addMessageMutation = useAddMessage();
  const generateTitleMutation = useGenerateTitle();
  const updateConversationMutation = useUpdateConversation();
  const { refetch: refetchConversations } = useConversations();

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [currentPage, setCurrentPage] = useState("chat");
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [mounted, setMounted] = useState(false);

  const isMobile = useIsMobile();

  // Use the new AI SDK v5 properly
  const { messages, sendMessage, setMessages, stop, status, regenerate } =
    useChat({
      id: sessionId,
      onFinish: async ({ message }) => {
        console.log("AI response completed:", message);

        // Only save if it's an AI response and hasn't been saved already
        if (
          message &&
          message.role === "assistant" &&
          !savedMessageIds.current.has(message.id)
        ) {
          // Mark this message as being saved
          savedMessageIds.current.add(message.id);

          // Extract text content safely
          let content = "";
          if (message.parts) {
            content = message.parts
              .filter((p: any) => p.type === "text")
              .map((p: any) => p.text || "")
              .join("");
          }

          const aiDbMessage: DatabaseMessage = {
            id: message.id,
            role: "assistant",
            content: content,
            type: "text",
            createdAt: new Date().toISOString(),
          };

          try {
            // Save AI response to database
            const savedMessage = await addMessageMutation.mutateAsync({
              conversationId: sessionId,
              message: aiDbMessage,
            });

            console.log("AI message saved to database:", savedMessage);

            // Update the message with the database ID so edit/delete work properly
            if (savedMessage && savedMessage._id) {
              const dbId = String(savedMessage._id);
              setMessages((prevMessages) =>
                prevMessages.map((msg) =>
                  msg.id === message.id ? { ...msg, id: dbId, _id: dbId } : msg
                )
              );

              // Update the saved message IDs with the new database ID
              savedMessageIds.current.delete(message.id);
              savedMessageIds.current.add(dbId);
            }
          } catch (error) {
            console.error("Failed to save AI message:", error);
            // Remove from saved set if save failed
            savedMessageIds.current.delete(message.id);
          }

          console.log("sessionTitle", sessionTitle);
          // Generate title if needed
          const shouldGenerateTitle =
            (sessionTitle === "New Chat" ||
              !sessionTitle ||
              sessionTitle === "ChatGPT") &&
            messages.length >= 2;

          if (shouldGenerateTitle) {
            console.log("Generating title");
            const recentMessages = messages.slice(-4);
            const context = recentMessages
              .map((msg) => {
                // Extract text content from parts
                let content = "";
                if (msg.parts && Array.isArray(msg.parts)) {
                  content = msg.parts
                    .filter((p: any) => p.type === "text")
                    .map((p: any) => p.text || "")
                    .join(" ");
                }
                return `${msg.role}: ${content}`;
              })
              .join("\n");

            try {
              const { title } = await generateTitleMutation.mutateAsync({
                sessionId,
                context,
              });

              console.log("title", title);

              if (title) {
                await updateConversationMutation.mutateAsync({
                  id: sessionId,
                  data: { title: title },
                });
                refetchConversations();
              }
            } catch (error) {
              console.error("Failed to generate title:", error);
            }
          }
        }
      },
    });

  // Track saved message IDs to prevent duplicate saves
  const savedMessageIds = useRef(new Set<string>());

  useEffect(() => {
    setMounted(true);
  }, []);

  // Track if we've already triggered the auto-response to prevent duplicates
  const autoTriggeredRef = useRef(false);

  useEffect(() => {
    // Mark all existing messages as already saved to prevent re-saving on reload
    initialMessages.forEach((msg: any) => {
      if (msg.id) {
        savedMessageIds.current.add(msg.id);
      }
    });

    // Check if the last message is from user and trigger AI response if needed
    // Only trigger once per session load
    if (initialMessages.length > 0 && !autoTriggeredRef.current) {
      const lastMessage = initialMessages[initialMessages.length - 1];
      console.log("ChatClient: Last message:", lastMessage);

      // If last message is from user, it means AI response is pending
      if (lastMessage.role === "user") {
        console.log(
          "ChatClient: Last message is from user, removing from initial and triggering via sendMessage..."
        );

        // Mark as triggered to prevent multiple calls
        autoTriggeredRef.current = true;

        // Set all messages normally
        setMessages(initialMessages);

        // Small delay to ensure everything is initialized
        setTimeout(() => {
          console.log(
            "ChatClient: Using reload to trigger AI response for last user message"
          );

          // Use regenerate() which will detect the last message is from user
          // and automatically trigger AI response without adding duplicate message
          regenerate();
        }, 500);
      } else {
        // No pending user message, set all messages normally
        setMessages(initialMessages);
      }
    } else {
      // No auto-trigger needed, set all messages normally
      setMessages(initialMessages);
    }
  }, [initialMessages, setMessages, regenerate]);

  useEffect(() => {
    // Only update sidebar state after component is mounted to prevent hydration mismatch
    if (mounted) {
      if (isMobile) {
        setSidebarOpen(false);
      } else {
        setSidebarOpen(true);
      }
    }
  }, [isMobile, mounted]);

  async function regenerateMessage(options?: { messageId?: string }) {
    const messageId = options?.messageId;
    if (!messageId) return;

    const messageIndex = messages.findIndex((msg) => msg.id === messageId);
    if (messageIndex === -1) return;

    // Find the user message that we need to resend (the one before the AI message we're regenerating)
    const userMessageIndex = messageIndex - 1;
    if (userMessageIndex < 0 || messages[userMessageIndex].role !== "user") {
      console.error(
        "No user message found before the AI message to regenerate"
      );
      return;
    }

    const userMessage = messages[userMessageIndex];
    console.log("User message to regenerate from:", userMessage);

    try {
      // 1. Delete messages from backend (from the user message onwards, including target)
      const deleteResponse = await fetch(
        `/api/conversations/${sessionId}/messages?after=${userMessage.id}&includeTarget=true`,
        {
          method: "DELETE",
        }
      );

      if (!deleteResponse.ok) {
        console.error(
          "Failed to delete messages for regeneration:",
          deleteResponse.status
        );
        return;
      }

      // 2. Update UI to show only messages up to (but not including) the user message
      const newMessages = messages.slice(0, userMessageIndex);
      setMessages([...newMessages, userMessage]); // Keep the user message

      // 3. Use regenerate to trigger AI response from the user message
      console.log("Using regenerate to regenerate AI response");
      await regenerate();
    } catch (error) {
      console.error("Error regenerating message:", error);
      // Revert UI changes on error
      setMessages(messages);
    }
  }

  const handleNewChat = async () => {
    try {
      const data = await createConversationMutation.mutateAsync({
        title: "New Chat",
      });
      if (data._id) {
        router.push(`/chat/${data._id}`);
      } else {
        alert("Failed to create new chat session.");
      }
    } catch (err) {
      alert("Error creating new chat session.");
    }
  };

  const handleMessage = async (message: {
    content: string;
    role: "user";
    type?: string;
    fileUrl?: string;
    fileName?: string;
    fileType?: string;
    attachmentUrls?: string[];
    attachmentTypes?: string[];
    attachmentNames?: string[];
  }) => {
    console.log("Sending message to ai sdk v5", message);

    // Convert to proper DatabaseMessage format
    const dbMessage: DatabaseMessage = {
      ...message,
      type: (message.type as "text" | "image" | "file" | "mixed") || "text",
    };

    console.log("message from input box ", message);

    // Use utility function to convert to sendMessage format
    const sendFormat = toSendMessageFormat(dbMessage);

    console.log("Send format:", sendFormat);

    // Create UI message format and append to conversation
    const uiMessage: any = {
      role: "user",
      parts: [{ type: "text", text: message.content }],
    };

    // Add file parts if attachments exist
    if (message.attachmentUrls && message.attachmentUrls.length > 0) {
      message.attachmentUrls.forEach((url, index) => {
        const fileName = message.attachmentNames?.[index] || "unknown";
        const fileType = message.attachmentTypes?.[index];

        uiMessage.parts.push({
          type: "file",
          url: url,
          filename: fileName,
          mediaType:
            fileType === "image"
              ? "image/jpeg"
              : fileType === "pdf"
              ? "application/pdf"
              : "application/octet-stream",
        });
      });
    } else if (message.fileUrl) {
      uiMessage.parts.push({
        type: "file",
        url: message.fileUrl,
        filename: message.fileName || "unknown",
        mediaType: message.fileType || "application/octet-stream",
      });
    }

    console.log("UI message to send:", uiMessage);

    // Send message using AI SDK v5 - this triggers the API call
    sendMessage(uiMessage);

    console.log("Message sent to ai sdk v5", sendFormat);

    // Check if this message already has a database ID (meaning it was saved by Home page)
    const hasDbId = (message as any).id || (message as any)._id;

    if (hasDbId) {
      console.log(
        "Message already has DB ID, skipping database save:",
        hasDbId
      );
      // Track the database ID
      savedMessageIds.current.add(String(hasDbId));
    } else {
      console.log("Saving message to database", dbMessage);

      // Save the message to the database and update the message ID
      try {
        const savedUserMessage = await addMessageMutation.mutateAsync({
          conversationId: sessionId,
          message: {
            role: dbMessage.role,
            content: dbMessage.content,
            type: dbMessage.type,
            fileUrl: dbMessage.fileUrl,
            fileName: dbMessage.fileName,
            fileType: dbMessage.fileType,
            // Map the attachmentUrls, attachmentTypes, attachmentNames to the attachments array
            attachments: dbMessage.attachmentUrls?.map((url, index) => ({
              url: url,
              fileName: dbMessage.attachmentNames?.[index] || "unknown",
              fileType:
                dbMessage.attachmentTypes?.[index] ||
                "application/octet-stream",
              type:
                dbMessage.attachmentTypes?.[index] === "image"
                  ? "image"
                  : dbMessage.attachmentTypes?.[index] === "pdf"
                  ? "pdf"
                  : "file",
            })),
          },
        });

        console.log("User message saved to database:", savedUserMessage);

        // Update the user message with the database ID so edit/delete work properly
        // We need to find the last user message that matches our content
        if (savedUserMessage && savedUserMessage._id) {
          const dbId = String(savedUserMessage._id);

          // Use a timeout to ensure the message has been added to the messages array
          setTimeout(() => {
            setMessages((prevMessages) => {
              const lastUserMessage = [...prevMessages]
                .reverse()
                .find(
                  (msg) =>
                    msg.role === "user" &&
                    msg.parts.some(
                      (part: any) =>
                        part.type === "text" && part.text === message.content
                    )
                );

              if (lastUserMessage) {
                return prevMessages.map((msg) =>
                  msg.id === lastUserMessage.id ? { ...msg, id: dbId } : msg
                );
              }
              return prevMessages;
            });

            // Track the database ID
            savedMessageIds.current.add(dbId);
          }, 100);
        }
      } catch (error) {
        console.error("Failed to save user message:", error);
      }
    }
  };

  const handleDelete = () => {
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    setDeleting(true);
    try {
      await deleteConversationMutation.mutateAsync(sessionId);
      router.push("/");
    } catch (error) {
      console.error("Delete failed:", error);
      alert("Failed to delete conversation");
    } finally {
      setDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  if (currentPage === "pricing") {
    return <PricingPage />;
  }

  return (
    <div className="flex h-screen bg-[#212121] text-white">
      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        onConfirm={confirmDelete}
        loading={deleting}
        title="Delete chat?"
        description={
          <>
            This will delete <b>{sessionTitle || "this chat"}</b>.
          </>
        }
        confirmLabel="Delete"
        cancelLabel="Cancel"
        confirmVariant="destructive"
      />

      {/* Sidebar - Hidden on mobile */}
      {mounted && sidebarOpen && !isMobile && (
        <div className="w-64 bg-[#171717] flex flex-col h-full">
          {/* Sidebar Header - Fixed */}
          <div className="flex-shrink-0 p-2">
            <div className="flex justify-between items-center gap-2 mb-2">
              <Logo />
              <Button
                variant="ghost"
                size="icon"
                className="w-8 h-8 text-gray-400 hover:text-white hover:bg-gray-700 p-0"
                onClick={() => setSidebarOpen(false)}
              >
                <PanelLeft className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Navigation - Fixed */}
          <SideBarNavigation
            handleNewChat={handleNewChat}
            setCurrentPage={setCurrentPage}
          />

          {/* Chat History - Scrollable */}
          <ChatHistory
            currentSessionId={sessionId}
            setCurrentPage={setCurrentPage}
          />

          {/* Sidebar Footer - Fixed */}
          <SideBarFooter setCurrentPage={setCurrentPage} />
        </div>
      )}

      {/* Mobile Sidebar Overlay */}
      {mounted && sidebarOpen && isMobile && (
        <div className="fixed inset-0 z-[100]">
          <MobileSidebar
            sidebarOpen={sidebarOpen}
            setSidebarOpen={setSidebarOpen}
            setCurrentPage={setCurrentPage}
          />
        </div>
      )}

      {/* Main Content */}
      {currentPage === "chat" && (
        <MainChatScreen
          regenerate={regenerateMessage}
          messages={messages}
          sendMessage={sendMessage}
          status={status}
          isMobile={isMobile}
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          handleDelete={handleDelete}
          handleMessage={handleMessage}
          sessionId={sessionId}
          setCurrentPage={setCurrentPage}
          userId={user?.id}
          stop={stop}
          setMessages={setMessages}
        />
      )}

      {/* Memories Section - Conditionally shown */}
      {currentPage === "memory" && (
        <div className="flex-1 flex flex-col">
          <MemoriesPage />
        </div>
      )}
    </div>
  );
}
