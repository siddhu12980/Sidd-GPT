"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import "./hide-scrollbar.css";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";

import {
  PanelLeft,
  Plus,
  ChevronDown,
  Settings,
  Menu,
  Check,
  MessageCircleDashed,
} from "lucide-react";

import PricingPage from "@/app/pricing/page";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";

import { Logo } from "@/components/logo";
import MobileSidebar from "@/components/MobileSideBar";
import CustomInputArea from "@/components/CustomInputArea";
import PlusIcon from "@/components/PlusIcon";
import ChatHistory from "@/components/ChatHistory";
import { useUser } from "@clerk/nextjs";
// import { useRouter } from "next/navigation";

// Import the new hooks
import { useCreateConversation } from "@/hooks/useConversations";
import { useConversations } from "@/hooks/useConversations";
import MemoriesPage from "@/components/Memories";
import SideBarNavigation from "./SideBarNavigation";
import { useIsMobile } from "@/hooks/use-mobile";
import { useRouter } from "next/navigation";

export default function Home() {
  try {
    const router = useRouter();

    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [currentPage, setCurrentPage] = useState("chat"); // "chat" or "pricing"
    const [isMobile, setIsMobile] = useState(false);
    const [input, setInput] = useState("");

    // Use Clerk hook with error handling
    const { user, isLoaded: isUserLoaded } = useUser();

    // Initialize TanStack Query hooks
    const createConversationMutation = useCreateConversation();

    // Add conversations hook for debugging - only fetch when user is loaded
    const {
      data: conversations,
      isLoading: conversationsLoading,
      error: conversationsError,
      refetch: refetchConversations,
      isFetching,
      isStale,
    } = useConversations(isUserLoaded && !!user?.id); // Only fetch when user is loaded

    console.log("user", user);
    console.log("isUserLoaded", isUserLoaded);
    console.log("user?.id", user?.id);
    console.log("enabled condition:", isUserLoaded && !!user?.id);
    console.log("conversations", conversations);
    console.log("conversationsLoading", conversationsLoading);
    console.log("isFetching", isFetching);
    console.log("isStale", isStale);
    console.log("conversationsError", conversationsError);

    // Use Vercel AI SDK's useChat hook with new v5 API
    const { messages, sendMessage, status } = useChat({
      transport: new DefaultChatTransport({
        api: "/api/chat",
      }),
    });

    // Custom send handler to create conversation on first message
    const handleSend = async () => {
      if (!input.trim()) return;
      if (messages.length === 0) {
        try {
          const data = await createConversationMutation.mutateAsync({
            title: "New Chat",
          });
          if (data._id) {
            await fetch(`/api/conversations/${data._id}/messages`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                role: "user",
                content: input.trim(),
              }),
            });

            // router.push(`/chat/${data._id}`);
            return;
          }
        } catch (error) {
          console.error("Failed to create conversation:", error);
        }
      }

      sendMessage({ text: input.trim() });
      setInput("");
    };

    // Wrapper function for CustomInputArea compatibility
    const handleMessage = (message: {
      content: string;
      role: "user";
      type?: string;
    }) => {
      // For Home page, we only handle text messages and create new conversations
      if (message.type === "text" || !message.type) {
        handleSend();
      }
    };

    console.log("user", user);
    console.log("messages", messages);
    console.log("status", status);

    // Check if loading (equivalent to old isLoading)
    const isLoading = status === "submitted" || status === "streaming";

    // Use the mobile hook properly with error handling
    const isMobileFromHook = useIsMobile();

    useEffect(() => {
      try {
        setIsMobile(isMobileFromHook);
        if (isMobileFromHook) {
          setSidebarOpen(false);
        } else {
          setSidebarOpen(true);
        }
      } catch (error) {
        console.error("Error in mobile effect:", error);
      }
    }, [isMobileFromHook]);

    // New chat handler using the new hook
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
        console.error("Error in handleNewChat:", err);
      }
    };

    if (currentPage === "pricing") {
      return <PricingPage />;
    }

    // Show loading if user is not loaded yet
    if (!isUserLoaded) {
      return (
        <div className="flex h-screen bg-[#212121] text-white items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mb-4"></div>
            <p>Loading...</p>
          </div>
        </div>
      );
    }

    return (
      <div className="flex h-screen bg-[#212121] text-white">
        {/* Sidebar - Hidden on mobile */}
        {sidebarOpen && !isMobile && (
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
              setCurrentPage={setCurrentPage}
              handleNewChat={handleNewChat}
            />
            {/* Chat History - Scrollable */}
            <ChatHistory setCurrentPage={setCurrentPage} />

            {/* Sidebar Footer - Fixed */}
            <div className="flex-shrink-0 p-2 border-t border-gray-700">
              <Button
                variant="ghost"
                className="w-full justify-start gap-3 text-gray-300 hover:text-white hover:bg-gray-700 h-auto py-2 px-3 rounded-lg"
                onClick={() => setCurrentPage("pricing")}
              >
                <Settings className="w-4 h-4 flex-shrink-0" />
                <div className="flex flex-col items-start text-left">
                  <span className="text-sm font-medium">Upgrade plan</span>
                  <span className="text-xs text-gray-500">
                    More access to the best models
                  </span>
                </div>
              </Button>
            </div>
          </div>
        )}

        {/* Mobile Sidebar Overlay */}
        {sidebarOpen && isMobile && (
          <MobileSidebar
            sidebarOpen={sidebarOpen}
            setSidebarOpen={setSidebarOpen}
            setCurrentPage={setCurrentPage}
          />
        )}

        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          {/* Top Header */}
          <header className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-1">
              {/* show this when the side pannel is collapsed  */}
              {(isMobile || !sidebarOpen) && (
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
              )}

              {/* Dropdown for ChatGPT label */}
              {!isMobile ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      className="flex items-center gap-1 text-lg font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-indigo-500 bg-transparent"
                      aria-haspopup="menu"
                      aria-label="ChatGPT options"
                    >
                      ChatGPT
                      <ChevronDown className="w-4 h-4 text-gray-400" />
                    </button>
                  </DropdownMenuTrigger>

                  <DropdownMenuContent
                    align="start"
                    className="w-72 bg-[#232323] border border-[#2a2a2a] shadow-lg rounded-xl p-0 mt-2"
                  >
                    <DropdownMenuItem className="flex items-center gap-3 px-4 py-2 cursor-pointer data-[highlighted]:bg-[#d9d9d9]/20">
                      <span className="inline-block w-5 h-5 bg-gradient-to-tr from-yellow-400 to-pink-500 rounded-full"></span>
                      <div className="flex flex-col flex-1">
                        <span className="text-sm font-medium text-white">
                          ChatGPT Plus
                        </span>
                        <span className="text-xs text-gray-400 mt-0.5">
                          Our smartest model & more
                        </span>
                      </div>

                      <button className="ml-4 px-3 py-1 bg-[#353740] hover:bg-[#40414f] text-white text-xs rounded-md font-medium focus:outline-none">
                        Upgrade
                      </button>
                    </DropdownMenuItem>

                    <DropdownMenuItem className="flex items-center gap-3 px-4 py-2 cursor-pointer data-[highlighted]:bg-[#d9d9d9]/20">
                      <span className="inline-block w-5 h-5 bg-gradient-to-tr from-yellow-400 to-pink-500 rounded-full"></span>
                      <div className="flex flex-col flex-1">
                        <span className="text-sm font-medium text-white">
                          ChatGPT Plus
                        </span>
                        <span className="text-xs text-gray-400 mt-0.5">
                          Our smartest model & more
                        </span>
                      </div>

                      <Check className="w-4 h-4 text-white" />
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <span className="text-lg font-medium">ChatGPT</span>
              )}
            </div>

            <div className="flex items-center gap-3">
              {isMobile && (
                <Button
                  className="bg-[#8b5cf6] hover:bg-[#7c3aed] text-white gap-2 h-8 px-3 rounded-full text-sm font-medium"
                  onClick={() => setCurrentPage("pricing")}
                >
                  <Plus className="w-3 h-3" />
                  Get Plus
                </Button>
              )}

              <Button
                variant="ghost"
                size="icon"
                className="w-8 h-8 text-gray-400 hover:text-white hover:bg-gray-700"
              >
                <MessageCircleDashed size={20} className="w-5 h-5 text-white" />
              </Button>
              {!isMobile && (
                <div className="w-8 h-8 bg-[#6366f1] rounded-full flex items-center justify-center text-sm font-medium">
                  SA
                </div>
              )}
            </div>
          </header>

          {/* Chat Area */}
          {currentPage !== "memory" ? (
            <div className="flex-1 flex flex-col items-center justify-center px-4 pb-40 relative">
              {messages.length === 0 ? (
                <>
                  <div className="text-center mb-8">
                    <h1
                      className={`font-normal text-white ${
                        isMobile ? "text-2xl" : "text-3xl"
                      }`}
                    >
                      Good to see you, sidd.
                    </h1>
                  </div>

                  {/* Input Area */}
                  <CustomInputArea
                    input={input}
                    setInput={setInput}
                    handleSendButtonClick={handleSend}
                    isLoading={isLoading}
                  />
                </>
              ) : (
                <div className="w-full max-w-4xl flex flex-col h-full">
                  {/* Input Area */}
                  <div className="flex-shrink-0">
                    <CustomInputArea
                      input={input}
                      setInput={setInput}
                      handleSendButtonClick={handleMessage}
                      isLoading={isLoading}
                    />
                  </div>
                </div>
              )}
            </div>
          ) : (
            <MemoriesPage />
          )}

          {!isMobile && (
            <div className="absolute start-1/2 pt-3 translate-x-[62%]">
              <PlusIcon />
            </div>
          )}
        </div>
      </div>
    );
  } catch (error) {
    console.error("Error in Home component:", error);
    return (
      <div className="flex h-screen bg-[#212121] text-white items-center justify-center">
        <div className="text-center">
          <p className="text-red-400">Something went wrong</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-[#6366f1] text-white rounded"
          >
            Reload Page
          </button>
        </div>
      </div>
    );
  }
}
