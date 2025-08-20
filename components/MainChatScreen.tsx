"use client";

import {
  LogOut,
  Menu,
  Upload,
  MoreHorizontal,
  Wand2,
  SettingsIcon,
  HelpCircle,
  ArrowRight,
  CreditCard,
  User,
  Archive,
  Trash2,
} from "lucide-react";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { PanelLeft } from "lucide-react";
import CustomInputArea from "./CustomInputArea";
import { Button } from "./ui/button";
import GptLabelDropDown from "./GptLabelDropDown";
import { useClerk, useUser } from "@clerk/nextjs";
import ChatConversation from "./ChatConversation";
import { createPortal } from "react-dom";
import { toConversationMessages, UIMessage } from "@/lib/message-utils";
import { ChatRequestOptions } from "ai";

export default function MainChatScreen({
  isSidebarOpen,
  messages: initialMessages,
  sendMessage,
  status,
  isMobile,
  sidebarOpen,
  setSidebarOpen,
  handleDelete,
  handleMessage,
  sessionId,
  setCurrentPage,
  userId,
  regenerate,
  stop,
  setMessages,
  apiError,
  onClearError,
}: {
  isSidebarOpen: boolean;
  messages: any[];
  sendMessage: (message: { text: string; files?: FileList }) => void;
  status: string;
  isMobile: boolean;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  handleDelete: () => void;

  regenerate: (
    options?: {
      messageId?: string;
    } & ChatRequestOptions
  ) => Promise<void>;

  handleMessage: (message: {
    content: string;
    role: "user";
    type?: string;
    fileUrl?: string;
    fileName?: string;
    fileType?: string;
    attachmentUrls?: string[];
    attachmentTypes?: string[];
    attachmentNames?: string[];
  }) => void;
  sessionId: string;
  setCurrentPage: (page: string) => void;
  userId?: string;
  stop: () => Promise<void>;
  setMessages: (messages: any[]) => void;
  apiError?: string | null;
  onClearError?: () => void;
}) {
  const actionBtnRef = useRef<HTMLButtonElement>(null);
  const { signOut } = useClerk();
  const router = useRouter();

  const [input, setInput] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuPos, setMenuPos] = useState<{ top: number; left: number } | null>(
    null
  );
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [profileMenuPos, setProfileMenuPos] = useState<{
    top: number;
    left: number;
  } | null>(null);


  const avatarBtnRef = useRef<HTMLDivElement>(null);

  console.log("Messages in MainChatScreen", initialMessages);

  // Check authentication state properly
  const { user, isLoaded } = useUser();

  // Move router redirect to useEffect to avoid render-time navigation
  useEffect(() => {
    // Only redirect if Clerk has finished loading and user is definitely not authenticated
    if (isLoaded && !user) {
      router.push("/");
    }
  }, [user, isLoaded, router]);

  // Handle menu positioning
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
    if (profileMenuOpen && avatarBtnRef.current) {
      const rect = avatarBtnRef.current.getBoundingClientRect();
      setProfileMenuPos({
        top: rect.bottom + 8,
        left: rect.right - 240,
      });
    }
  }, [profileMenuOpen]);

  // Handle share functionality
  const handleShare = async () => {
    try {
      const shareUrl = `${window.location.origin}/chat/${sessionId}`;
      if (navigator.share) {
        await navigator.share({
          title: "ChatGPT Conversation",
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
    alert("Archive functionality coming soon!");
  };

  const isLoading = status === "submitted" || status === "streaming";

  const scrollRef = useRef<HTMLDivElement>(null);

  return (
    <div className="flex-1 flex flex-col h-full max-h-full relative">
      {/* Top Header */}
      <header className="flex items-center justify-between px-4 py-3">
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
              onClick={() => setProfileMenuOpen(!profileMenuOpen)}
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

      {/* API Error Banner */}
      {apiError && !(isMobile && isSidebarOpen) && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 mx-4 rounded-lg mb-4">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium">⚠️ {apiError}</p>
            </div>
            <button
              onClick={onClearError}
              className="text-red-300 hover:text-red-200 text-xs underline ml-4"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto pb-28 sm:pb-6 hide-scrollbar">
        <div className="h-full flex flex-col px-4">
          <ChatConversation
            reload={regenerate}
            handleMessage={handleMessage}
            messages={toConversationMessages(initialMessages)}
            isLoading={isLoading}
            status={status}
            sessionId={sessionId}
            userId={userId}
            sendMessage={sendMessage}
            setMessages={setMessages}
          />
        </div>
        <div ref={scrollRef} />
      </div>

      {/* Desktop: Centered, Mobile: Hidden */}
      <div className="hidden sm:block w-full max-w-2xl mx-auto sticky bottom-0 bg-[#212121] pb-6 z-10">
        <CustomInputArea
          input={input}
          setInput={setInput}
          handleSendButtonClick={(message) => handleMessage(message)}
          isLoading={isLoading}
          status={status}
          stop={stop}
        />
      </div>

      {/* Mobile: Fixed bottom, Desktop: Hidden */}
      <div className="block sm:hidden fixed bottom-0 left-0 right-0 w-full bg-[#212121] z-50 px-2 pb-2">
        <div className="max-w-2xl mx-auto">
          <CustomInputArea
            input={input}
            setInput={setInput}
            handleSendButtonClick={(message) => handleMessage(message)}
            isLoading={isLoading}
            status={status}
            stop={stop}
          />
        </div>
      </div>
    </div>
  );
}
