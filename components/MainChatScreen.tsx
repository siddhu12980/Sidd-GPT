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
import { useEffect, useRef } from "react";

import { PanelLeft } from "lucide-react";
import CustomInputArea from "./CustomInputArea";
import { Button } from "./ui/button";
import GptLabelDropDown from "./GptLabelDropDown";
import { useClerk, useUser } from "@clerk/nextjs";
import ChatConversation from "./ChatConversation";
import { UIMessageExtended } from "@ai-sdk/react";
import { createPortal } from "react-dom";
import { ChatRequestOptions } from "ai";

export default function MainChatScreen({
  append,
  avatarBtnRef,
  input,
  setInput,
  isMobile,
  sidebarOpen,
  setSidebarOpen,
  handleShare,
  handleArchive,
  handleDelete,
  handleMessage,
  isLoading,
  status,
  reload,
  setMessages,
  sessionId,
  messages,
  setProfileMenuOpen,
  profileMenuOpen,
  profileMenuPos,
  setCurrentPage,
  menuOpen,
  menuPos,
  setMenuOpen,
  stop,
}: {
  append: (message: { role: "user"; content: string; data?: string }) => void;
  avatarBtnRef: React.RefObject<HTMLDivElement | null>;
  input: string;
  messages: UIMessageExtended[];
  setInput: (input: string) => void;
  isMobile: boolean;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  handleShare: () => void;
  handleArchive: () => void;
  handleDelete: () => void;
  handleMessage: (message: {
    content: string;
    role: "user";
    type?: string;
    fileUrl?: string;
    fileName?: string;
    fileType?: string;
  }) => void;
  isLoading: boolean;
  status: string;
  reload: (
    chatRequestOptions?: ChatRequestOptions
  ) => Promise<string | null | undefined>;
  setMessages: (messages: UIMessageExtended[]) => void;
  sessionId: string;
  setProfileMenuOpen: (open: boolean) => void;
  profileMenuOpen: boolean;
  profileMenuPos: { top: number; left: number } | null;
  setCurrentPage: (page: string) => void;
  menuOpen: boolean;
  menuPos: { top: number; left: number } | null;
  setMenuOpen: (open: boolean) => void;
  stop: () => void;
}) {
  const actionBtnRef = useRef<HTMLButtonElement>(null);
  const { signOut } = useClerk();

  const { user } = useUser();

  const router = useRouter();

  // Move router redirect to useEffect to avoid render-time navigation
  useEffect(() => {
    if (!user) {
      router.push("/");
    }
  }, [user, router]);

  const scrollRef = useRef<HTMLDivElement>(null);

  console.log("checking messages", messages);

  return (
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

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto px-4 pb-28 sm:pb-6 hide-scrollbar">
        <ChatConversation
          handleMessage={handleMessage}
          messages={messages.map((msg: UIMessageExtended) => ({
            _id: msg._id,
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
          append={append}
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
  );
}
