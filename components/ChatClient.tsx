"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { createPortal } from "react-dom";

import {
  PanelLeft,
  Plus,
  Menu,
  MoreHorizontal,
  Archive,
  Trash2,
  Upload,
  LogOut,
  User,
  Settings as SettingsIcon,
  HelpCircle,
  Wand2,
  ArrowRight,
  CreditCard,
} from "lucide-react";

import PricingPage from "@/app/pricing/page";
import { useChat } from "@ai-sdk/react";

import { Logo } from "@/components/logo";
import MobileSidebar from "@/components/mobile_sidebar";
import CustomInputArea from "@/components/Custom_input_area";
import { useUser, useClerk } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import ChatConversation from "./ChatConversation";
import GptLabelDropDown from "./GptLabelDropDown";
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
  }[];
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const firstMessageTriggeredRef = useRef(false);
  const { user } = useUser();
  const { signOut } = useClerk();

  const createConversationMutation = useCreateConversation();
  const deleteConversationMutation = useDeleteConversation();
  const addMessageMutation = useAddMessage();
  const generateTitleMutation = useGenerateTitle();
  const updateConversationMutation = useUpdateConversation();
  const { refetch: refetchConversations } = useConversations();

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [currentPage, setCurrentPage] = useState("chat"); // "chat" or "pricing"
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
      id: m._id || "",
      createdAt: m.createdAt ? new Date(m.createdAt) : undefined,
      role: m.role as "system" | "user" | "assistant" | "data",
    })),

    onFinish: async (aiMessage) => {
      console.log("Calling and doing onFinish");
      console.log("sessionTitle:", sessionTitle);
      console.log("messages.length:", messages.length);

      await addMessageMutation.mutateAsync({
        conversationId: sessionId,
        message: aiMessage,
      });

      // Check if we should generate a title
      console.log("Checking title generation condition:");
      console.log(
        "- sessionTitle === 'New Chat':",
        sessionTitle === "New Chat"
      );
      console.log("- messages.length >= 2:", messages.length >= 2);

      // Generate title if it's still the default or if we have enough messages
      const shouldGenerateTitle =
        (sessionTitle === "New Chat" ||
          !sessionTitle ||
          sessionTitle === "ChatGPT") &&
        messages.length >= 2;

      if (shouldGenerateTitle) {
        console.log("Generating title");
        // Get the last few messages for context
        const recentMessages = messages.slice(-4); // Last 4 messages for context

        console.log("recentMessages", recentMessages);

        const context = recentMessages
          .map((msg) => `${msg.role}: ${msg.content}`)
          .join("\n");

        console.log("context", context);

        try {
          const { title } = await generateTitleMutation.mutateAsync({
            sessionId,
            context,
          });

          console.log("title", title);

          // If a title was generated, update the conversation in the database
          if (title) {
            console.log("Updating conversation title to:", title);
            await updateConversationMutation.mutateAsync({
              id: sessionId,
              data: { title: title },
            });
            console.log("Conversation title updated successfully");

            // Trigger a refetch of conversations to update the sidebar
            refetchConversations();
          }
        } catch (error) {
          console.error("Failed to generate title:", error);
        }
      }
    },
    onResponse: (response) => {
      console.log("response", response);
    },
    onError: (error) => {
      console.error("Chat error:", error);
    },
  });

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

  const handleMessage = async (message: {
    content: string;
    role: "user";
    type?: string;
    fileUrl?: string;
    fileName?: string;
    fileType?: string;
  }) => {
    console.log("handleMessage called with:", message);

    if (message.fileUrl) {
      // Send a single multimodal message (file + text)
      const multimodalMsg = {
        ...message,
      };

      console.log("=== Multimodal Message Debug ===");
      console.log("Multimodal Message:", multimodalMsg);
      console.log("=== Multimodal Message Debug End ===");

      await addMessageMutation.mutateAsync({
        conversationId: sessionId,
        message: multimodalMsg,
      });

      // 1. Add the full multimodal message to local UI immediately (shows image + text)
      const fullMessage = {
        role: "user" as const,
        content: message.fileUrl,
        data: message.fileUrl,
        type: message.type || "image",
        id: `temp-${Date.now()}`, // Temporary ID for local state
      };
      setMessages([...messages, fullMessage]);

      // 2. Append the query to AI (only text content for the AI)
      append({
        role: "user",
        content: message.content,
        data: message.fileUrl, // This will be used by the backend for multimodal processing
      });
    } else {
      // Only text
      await addMessageMutation.mutateAsync({
        conversationId: sessionId,
        message: message,
      });
      append({ role: "user", content: message.content });
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
    return <PricingPage onBack={() => setCurrentPage("chat")} />;
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
          <ChatHistory currentSessionId={sessionId} />

          {/* Sidebar Footer - Fixed */}
          <SideBarFooter setCurrentPage={setCurrentPage} />
        </div>
      )}

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && isMobile && (
        <div className="fixed inset-0 z-[100]">
          <MobileSidebar
            setSidebarOpen={setSidebarOpen}
            setCurrentPage={setCurrentPage}
          />
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-full max-h-full relative">
        {/* Top Header */}
        <header className="flex items-center justify-between px-4 py-3 ">
          <div className="flex items-center gap-1">
            {/* show this when the side pannel is collapsed  */}
            {isMobile ||
              (!sidebarOpen && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="w-8 h-8 text-gray-400 hover:text-white hover:bg-gray-700 mr-2"
                  onClick={() => setSidebarOpen(true)}
                >
                  {isMobile ? (
                    <Menu className="w-4 h-4" />
                  ) : (
                    <PanelLeft className="w-4 h-4" />
                  )}
                </Button>
              ))}

            {/* Dropdown for ChatGPT label */}
            {!isMobile ? (
              <GptLabelDropDown />
            ) : (
              <Button
                variant="ghost"
                size="icon"
                className="w-8  h-8 text-gray-400 hover:text-white hover:bg-gray-700 mr-2"
                onClick={() => setSidebarOpen(true)}
              >
                <PanelLeft className="w-4 h-4" />
              </Button>
            )}
          </div>

          <div className="flex items-center gap-3">
            {/* Share Button */}
            <Button
              variant="ghost"
              size="icon"
              className="w-8 h-8 text-gray-400 hover:text-white hover:bg-gray-700"
              onClick={handleShare}
            >
              <Upload className="w-4 h-4" />
            </Button>
            {/* Action Button */}
            <Button
              ref={actionBtnRef}
              variant="ghost"
              size="icon"
              className="w-8 h-8 text-gray-400 hover:text-white hover:bg-gray-700"
              onClick={() => setMenuOpen(!menuOpen)}
              data-menu-button
            >
              <MoreHorizontal className="w-4 h-4" />
            </Button>
            {/* User Avatar/Profile Button */}
            {!isMobile && (
              <div
                ref={avatarBtnRef}
                className="w-8 h-8 bg-[#6366f1] rounded-full flex items-center justify-center text-sm font-medium cursor-pointer hover:ring-2 hover:ring-[#8b5cf6] transition"
                onClick={() => setProfileMenuOpen((v) => !v)}
                data-profile-menu-button
                tabIndex={0}
              >
                {user?.primaryEmailAddress?.emailAddress
                  ? user.primaryEmailAddress.emailAddress[0].toUpperCase()
                  : "U"}
              </div>
            )}
          </div>
        </header>

        {/* Action Menu Portal */}
        {menuOpen && menuPos && typeof window !== "undefined"
          ? createPortal(
              <div
                style={{
                  position: "fixed",
                  top: menuPos.top,
                  left: menuPos.left,
                  zIndex: 9999,
                  minWidth: 140,
                }}
                className="bg-[#232323] border border-[#2a2a2a] shadow-lg rounded-xl py-1 flex flex-col text-sm animate-fade-in"
                onClick={(e) => e.stopPropagation()}
                data-menu-portal
              >
                <button
                  onClick={handleArchive}
                  className="flex items-center gap-2 px-4 py-2 hover:bg-[#353740] text-white w-full text-left"
                  data-menu-item
                >
                  <Archive className="w-4 h-4" /> Archive
                </button>
                <div className="border-t border-[#353740] my-1" />
                <button
                  onClick={handleDelete}
                  className="flex items-center gap-2 px-4 py-2 hover:bg-[#353740] text-red-400 w-full text-left"
                  data-menu-item
                >
                  <Trash2 className="w-4 h-4" /> Delete
                </button>
              </div>,
              document.body
            )
          : null}

        {/* Profile Menu Portal */}
        {profileMenuOpen && profileMenuPos && typeof window !== "undefined"
          ? createPortal(
              <div
                style={{
                  position: "fixed",
                  top: profileMenuPos.top,
                  left: profileMenuPos.left,
                  zIndex: 9999,
                  minWidth: 280,
                }}
                className="bg-[#232323] border border-[#2a2a2a] shadow-lg rounded-xl py-2 flex flex-col text-sm animate-fade-in"
                data-profile-menu-portal
              >
                <div className="flex items-center gap-2 px-5 py-2 text-gray-300 text-[15px] font-medium border-b border-[#353740] mb-1">
                  <User className="w-4 h-4" />
                  <span className="truncate">
                    {user?.primaryEmailAddress?.emailAddress ||
                      "user@example.com"}
                  </span>
                </div>
                <button
                  className="flex items-center gap-2 px-5 py-2 hover:bg-[#353740] text-white w-full text-left"
                  onClick={() => {
                    setProfileMenuOpen(false);
                    setCurrentPage("pricing");
                  }}
                >
                  <CreditCard className="w-4 h-4" /> Upgrade plan
                </button>
                <button className="flex items-center gap-2 px-5 py-2 hover:bg-[#353740] text-white w-full text-left">
                  <Wand2 className="w-4 h-4" /> Customize ChatGPT
                </button>
                <button className="flex items-center gap-2 px-5 py-2 hover:bg-[#353740] text-white w-full text-left">
                  <SettingsIcon className="w-4 h-4" /> Settings
                </button>
                <div className="border-t border-[#353740] my-1" />
                <button className="flex items-center gap-2 px-5 py-2 hover:bg-[#353740] text-white w-full text-left">
                  <HelpCircle className="w-4 h-4" /> Help
                  <ArrowRight className="w-4 h-4 ml-auto" />
                </button>
                <button
                  className="flex items-center gap-2 px-5 py-2 hover:bg-[#353740] text-white w-full text-left"
                  onClick={() => {
                    setProfileMenuOpen(false);
                    signOut();
                  }}
                >
                  <LogOut className="w-4 h-4" /> Log out
                </button>
              </div>,
              document.body
            )
          : null}

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto px-4 pb-28 sm:pb-6">
          <ChatConversation
            messages={messages.map((msg) => ({
              _id: msg.id,
              id: msg.id,
              role: msg.role,
              content: msg.content,
              createdAt:
                typeof msg.createdAt === "string"
                  ? msg.createdAt
                  : msg.createdAt?.toISOString(),
              type: msg.type || "text",
              fileUrl: msg.fileUrl || "",
              fileName: msg.fileName || "",
              fileType: msg.fileType || "",
            }))}
            isLoading={isLoading}
            status={status}
            reload={reload}
            setMessages={setMessages}
            sessionId={sessionId}
          />

          <div ref={scrollRef} />
        </div>

        {/* Desktop: Centered, Mobile: Hidden */}
        <div className="hidden sm:block w-full max-w-2xl mx-auto sticky bottom-0 bg-[#212121] pb-6 z-10">
          <CustomInputArea
            input={input}
            setInput={setInput}
            handleSendButtonClick={handleMessage}
            isLoading={isLoading}
            stop={stop}
            status={status}
          />
        </div>

        {/* Mobile: Fixed bottom, Desktop: Hidden */}
        <div className="block sm:hidden fixed bottom-0 left-0 right-0 w-full bg-[#212121] z-50 px-2 pb-2">
          <div className="max-w-2xl mx-auto">
            <CustomInputArea
              input={input}
              setInput={setInput}
              handleSendButtonClick={handleMessage}
              isLoading={isLoading}
              stop={stop}
              status={status}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
