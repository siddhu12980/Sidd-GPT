"use client";

import { useState, useRef, useEffect } from "react";
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
  useCreateConversation,
  useDeleteConversation,
  useAddMessage,
  useGenerateTitle,
  useConversations,
  useUpdateConversation,
} from "@/hooks/useConversations";
import { useIsMobile } from "@/hooks/use-mobile";
import MemoriesPage from "./Memories";
import MainChatScreen from "./MainChatScreen";

export default function ChatClient({
  sessionId,
  sessionTitle,
  initialMessages,
}: {
  sessionId: string;
  sessionTitle?: string;
  initialMessages: {
    _id?: string;
    role: string;
    content: string;
    createdAt?: string;
    type?: string;
    fileUrl?: string;
    fileName?: string;
    fileType?: string;
    // NEW: Multiple attachments support
    attachments?: {
      type: string;
      url: string;
      fileName: string;
      fileType: string;
    }[];
    attachmentUrls?: string[];
    attachmentTypes?: string[];
    attachmentNames?: string[];
    attachmentCount?: number;
    hasMultipleAttachments?: boolean;
  }[];
}) {
  const router = useRouter();
  const firstMessageTriggeredRef = useRef(false);
  const { user } = useUser();

  const createConversationMutation = useCreateConversation();
  const deleteConversationMutation = useDeleteConversation();
  const addMessageMutation = useAddMessage();
  const generateTitleMutation = useGenerateTitle();
  const updateConversationMutation = useUpdateConversation();
  const { refetch: refetchConversations } = useConversations();

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [currentPage, setCurrentPage] = useState("chat"); // "chat" or "pricing" or memory
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuPos, setMenuPos] = useState<{ top: number; left: number } | null>(
    null
  );

  const isMobile = useIsMobile();

  const actionBtnRef = useRef<HTMLButtonElement>(null);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [profileMenuPos, setProfileMenuPos] = useState<{
    top: number;
    left: number;
  } | null>(null);

  const avatarBtnRef = useRef<HTMLDivElement>(null);

  // Add state for delete dialog
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Add state to track pending message updates
  const [pendingMessageUpdate, setPendingMessageUpdate] = useState<{
    id: string;
    properties: {
      type?: string;
      fileUrl?: string;
      fileName?: string;
      fileType?: string;
      // NEW: Multiple attachments support
      attachmentUrls?: string[];
      attachmentTypes?: string[];
      attachmentNames?: string[];
    };
  } | null>(null);

  useEffect(() => {
    if (isMobile) {
      setSidebarOpen(false);
    } else {
      setSidebarOpen(true);
    }
  }, [isMobile]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Element;
      const isMenuButton = target.closest("[data-menu-button]");
      const isMenuPortal = target.closest("[data-menu-portal]");
      const isMenuItem = target.closest("[data-menu-item]");

      if (isMenuButton || isMenuPortal || isMenuItem) {
        return;
      }

      setMenuOpen(false);
    }

    if (menuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [menuOpen]);

  useEffect(() => {
    if (menuOpen && actionBtnRef.current) {
      const rect = actionBtnRef.current.getBoundingClientRect();
      setMenuPos({
        top: rect.bottom + 8,
        left: rect.right - 40,
      });
    }
  }, [menuOpen]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Element;
      const isMenuButton = target.closest("[data-profile-menu-button]");
      const isMenuPortal = target.closest("[data-profile-menu-portal]");
      if (isMenuButton || isMenuPortal) return;
      setProfileMenuOpen(false);
    }
    if (profileMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [profileMenuOpen]);

  useEffect(() => {
    if (profileMenuOpen && avatarBtnRef.current) {
      const rect = avatarBtnRef.current.getBoundingClientRect();
      setProfileMenuPos({
        top: rect.bottom + 8,
        left: rect.right - 240,
      });
    }
  }, [profileMenuOpen]);

  const {
    messages,
    input,
    setInput,
    append,
    isLoading,
    status,
    stop,
    reload,
    setMessages,
    handleSubmit,
  } = useChat({
    api: "/api/chat",
    body: {
      userId: user?.id || "anonymous",
      sessionId: sessionId, // sessionId for memory isolation
    },

    initialMessages: initialMessages.map((m) => ({
      ...m,
      type: m.type || "text",
      fileUrl: m.fileUrl || "",
      fileName: m.fileName || "",
      fileType: m.fileType || "",
      // NEW: Include attachment data for multiple files
      attachments: m.attachments || [],
      attachmentUrls: m.attachmentUrls || [],
      attachmentTypes: m.attachmentTypes || [],
      attachmentNames: m.attachmentNames || [],
      attachmentCount: m.attachmentCount || 0,
      hasMultipleAttachments: m.hasMultipleAttachments || false,
      id: m._id || `temp-${Date.now()}`, // Use _id as id for useChat
      createdAt: m.createdAt ? new Date(m.createdAt) : undefined,
      role: m.role as "system" | "user" | "assistant" | "data",
    })),

    onFinish: async (aiMessage) => {
      // Save AI message to database and get the real _id
      const savedAiMessage = await addMessageMutation.mutateAsync({
        conversationId: sessionId,
        message: aiMessage,
      });

      console.log("Saved AI message with real _id:", savedAiMessage);

      // Update the AI message in the hook state with the real _id
      // setMessages((currentMessages) => {
      //   return currentMessages.map((msg, index) => {
      //     // Find the AI message that was just added (should be the last one)
      //     if (
      //       index === currentMessages.length - 1 &&
      //       msg.role === "assistant" &&
      //       msg.content === aiMessage.content &&
      //       savedAiMessage._id
      //     ) {
      //       return {
      //         ...msg,
      //         id: savedAiMessage._id, // Update with real MongoDB _id
      //       };
      //     }
      //     return msg;
      //   });
      // });

      // Generate title if needed
      const shouldGenerateTitle =
        (sessionTitle === "New Chat" ||
          !sessionTitle ||
          sessionTitle === "ChatGPT") &&
        messages.length >= 2;

      if (shouldGenerateTitle) {
        const recentMessages = messages.slice(-4);
        const context = recentMessages
          .map((msg) => `${msg.role}: ${msg.content}`)
          .join("\n");

        try {
          const { title } = await generateTitleMutation.mutateAsync({
            sessionId,
            context,
          });

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
    },
    onResponse: (response) => {
      // Handle response if needed
    },
    onError: (error) => {
      console.error("Chat error:", error);
    },
  });

  // useEffect to update message properties after append completes - moved after useChat
  useEffect(() => {
    if (pendingMessageUpdate) {
      const messageExists = messages.some(
        (msg) => msg.id === pendingMessageUpdate.id
      );

      if (messageExists) {
        setMessages((currentMessages) => {
          return currentMessages.map((msg) => {
            if (msg.id === pendingMessageUpdate.id) {
              return {
                ...msg,
                ...pendingMessageUpdate.properties,
              };
            }
            return msg;
          });
        });

        // Only clear pending update when streaming is done
        // Don't clear during streaming to maintain properties
        if (status === "ready" || status === "error") {
          setPendingMessageUpdate(null);
        }
      }
    }
  }, [messages, pendingMessageUpdate, status]); // Added status to dependencies

  // Check if we need to trigger AI response for first message
  useEffect(() => {
    if (
      !firstMessageTriggeredRef.current &&
      initialMessages.length === 1 &&
      initialMessages[0].role === "user" &&
      !isLoading
    ) {
      // This is a new conversation with only a user message, trigger AI response
      firstMessageTriggeredRef.current = true; // Mark as triggered

      // Trigger AI response to the existing user message
      reload();
    }
  }, [initialMessages, reload, isLoading]);

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

  // testing reload

  const handleMessage = async (message: {
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
  }) => {
    // Save user message to database first to get real _id
    const savedUserMessage = await addMessageMutation.mutateAsync({
      conversationId: sessionId,
      message: {
        ...message,
        type: message.type as "text" | "image" | "file" | "mixed",
        // NEW: Construct attachments array if multiple attachments exist
        ...(message.attachmentUrls &&
          message.attachmentUrls.length > 0 && {
            attachments: message.attachmentUrls.map((url, index) => ({
              type: (message.attachmentTypes?.[index] || "file") as
                | "image"
                | "pdf"
                | "file",
              url: url,
              fileName:
                message.attachmentNames?.[index] ||
                url.split("/").pop() ||
                "unknown",
              fileType:
                message.attachmentTypes?.[index] === "image"
                  ? "image/*"
                  : message.attachmentTypes?.[index] === "pdf"
                  ? "application/pdf"
                  : "application/octet-stream",
            })),
          }),
      },
    });

    // Check if this is a multiple attachments message
    if (message.attachmentUrls && message.attachmentUrls.length > 0) {
      // For multiple attachments, append with the new format and include in body
      append(
        {
          id: savedUserMessage._id,
          role: "user",
          content: message.content,
        } as any,
        {
          body: {
            userId: user?.id || "anonymous",
            sessionId: sessionId,
            attachmentUrls: message.attachmentUrls,
            attachmentTypes: message.attachmentTypes,
          },
        }
      );

      // Set pending update for display properties
      setPendingMessageUpdate({
        id: savedUserMessage._id || `temp-${Date.now()}`,
        properties: {
          type: "mixed" as "text" | "image" | "file" | "mixed",
          // Store attachment info for display
          attachmentUrls: message.attachmentUrls,
          attachmentTypes: message.attachmentTypes,
          attachmentNames: message.attachmentNames,
        },
      });
    } else {
      // LEGACY: Single file handling (backward compatibility)
      append({
        id: savedUserMessage._id,
        role: "user",
        content: message.content,
        ...(message.fileUrl && { data: message.fileUrl }), // Include data for backend processing
      } as any);

      // Set up pending update for extended properties if needed
      if (message.fileUrl || message.type) {
        setPendingMessageUpdate({
          id: savedUserMessage._id || `temp-${Date.now()}`,
          properties: {
            type: (message.type || (message.fileUrl ? "image" : "text")) as
              | "text"
              | "image"
              | "file"
              | "mixed",
            fileUrl: message.fileUrl || "",
            fileName: message.fileName || "",
            fileType: message.fileType || "",
          },
        });
      }
    }
  };

  // Share conversation handler
  const handleShare = async () => {
    try {
      const shareUrl = `${window.location.origin}/chat/${sessionId}`;

      if (navigator.share) {
        await navigator.share({
          title: sessionTitle || "ChatGPT Conversation",
          url: shareUrl,
        });
      } else {
        await navigator.clipboard.writeText(shareUrl);
        alert("Link copied to clipboard!");
      }
    } catch (error) {
      console.error("Share failed:", error);
    }
  };

  const handleArchive = async () => {
    setMenuOpen(false);
    try {
      alert("Archive functionality coming soon!");
    } catch (error) {
      console.error("Archive failed:", error);
    }
  };

  const handleDelete = () => {
    setMenuOpen(false);
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

  append;

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
            This will delete <b>{sessionTitle || "this chat"}</b>.<br />
            Visit{" "}
            <a href="/settings" className="underline">
              settings
            </a>{" "}
            to delete any memories saved during this chat.
          </>
        }
        confirmLabel="Delete"
        cancelLabel="Cancel"
        confirmVariant="destructive"
        highlight={sessionTitle}
      />
      {/* Sidebar - Hidden on mobile */}
      {sidebarOpen && !isMobile && (
        <div className="w-64 bg-[#171717] flex flex-col  h-full">
          {/* Sidebar Header - Fixed */}
          <div className="flex-shrink-0 p-2">
            <div className="flex justify-between items-center gap-2 mb-2">
              <Logo />

              <Button
                variant="ghost"
                size="icon"
                className="w-8 h-8 text-gray-400 hover:text-white hover:bg-gray-700 p-0"
                onClick={() => {
                  setSidebarOpen(!sidebarOpen);
                }}
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
      {sidebarOpen && isMobile && (
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
          append={append}
          stop={stop}
          avatarBtnRef={avatarBtnRef}
          input={input}
          messages={messages}
          setInput={setInput}
          isMobile={isMobile}
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          handleShare={handleShare}
          handleArchive={handleArchive}
          handleDelete={handleDelete}
          handleMessage={handleMessage}
          isLoading={isLoading}
          status={status}
          reload={reload}
          setMessages={setMessages}
          sessionId={sessionId}
          setProfileMenuOpen={setProfileMenuOpen}
          profileMenuOpen={profileMenuOpen}
          profileMenuPos={profileMenuPos}
          setCurrentPage={setCurrentPage}
          menuOpen={menuOpen}
          menuPos={menuPos}
          setMenuOpen={setMenuOpen}
          userId={user?.id}
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
