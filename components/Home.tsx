"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";

import {
  PanelLeft,
  Plus,
  Search,
  BookOpen,
  Sparkles,
  Bot,
  ChevronDown,
  Settings,
  Maximize2,
  Edit,
  Menu,
  Check,
  MessageCircleDashed,
} from "lucide-react";

import PricingPage from "@/app/pricing/page";
import { useChat } from "@ai-sdk/react";

import { Logo } from "@/components/logo";
import CustomSidePannelTopButton from "@/components/Custom_side_pannel_top_button";
import MobileSidebar from "@/components/mobile_sidebar";
import CustomInputArea from "@/components/Custom_input_area";
import PlusIcon from "@/components/Plus_icon";
import ChatHistory from "@/components/ChatHistory";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [currentPage, setCurrentPage] = useState("chat"); // "chat" or "pricing"
  const [isMobile, setIsMobile] = useState(false);

  const { user } = useUser();

  // Use Vercel AI SDK's useChat hook
  const { messages, input, setInput, append, isLoading } = useChat({
    api: "/api/chat",
    onResponse: (response) => {
      console.log("response", response);
    },
    onFinish: (message) => {
      console.log("Chat finished:", message);
    },
    onError: (error) => {
      console.error("Chat error:", error);
    },
  });

  // Custom send handler to create conversation on first message
  const handleSend = async () => {
    if (!input.trim()) return;

    // If this is the first message, create conversation and redirect
    if (messages.length === 0) {
      try {
        // Create new conversation first
        const res = await fetch("/api/conversations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: "New Chat" }),
        });
        
        const data = await res.json();
        if (data._id) {
          // Save the user message to the new conversation
          await fetch(`/api/conversations/${data._id}/messages`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
              role: "user", 
              content: input.trim() 
            }),
          });
          
          // Redirect to the new conversation page
          router.push(`/chat/${data._id}`);
          return; // Don't append here, let the ChatClient handle it
        }
      } catch (error) {
        console.error("Failed to create conversation:", error);
      }
    }

    // For subsequent messages (shouldn't happen on Home page)
    append({ role: "user", content: input.trim() });
  };

  console.log("user", user);
  console.log("messages", messages);
  console.log("isLoading", isLoading);

  useEffect(() => {
    const checkScreenSize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile) {
        setSidebarOpen(false);
      } else {
        setSidebarOpen(true);
      }
    };

    checkScreenSize();
    window.addEventListener("resize", checkScreenSize);
    return () => window.removeEventListener("resize", checkScreenSize);
  }, []);

  // if input box is active and
  const [isInputActive, setIsInputActive] = useState(false);

  const handleInputActive = () => {
    setIsInputActive(true);
  };

  // New chat handler
  const handleNewChat = async () => {
    try {
      const res = await fetch("/api/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "New Chat" }),
      });
      const data = await res.json();
      if (data._id) {
        router.push(`/chat/${data._id}`);
      } else {
        // Optionally show error to user
        alert("Failed to create new chat session.");
      }
    } catch (err) {
      alert("Error creating new chat session.");
    }
  };

  if (currentPage === "pricing") {
    return <PricingPage onBack={() => setCurrentPage("chat")} />;
  }

  return (
    <div className="flex h-screen bg-[#212121] text-white">
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
          <div className="flex-shrink-0 flex flex-col  px-1 pb-2">
            <CustomSidePannelTopButton
              buttonText="New chat"
              icon={<Edit />}
              onClick={handleNewChat}
            />

            <div className="mb-4">
              <CustomSidePannelTopButton
                buttonText="Search chats"
                icon={<Search />}
                onClick={() => setCurrentPage("chat")}
              />

              <CustomSidePannelTopButton
                buttonText="Library"
                icon={<BookOpen />}
                onClick={() => setCurrentPage("chat")}
              />
            </div>

            <div>
              <CustomSidePannelTopButton
                buttonText="Sora"
                icon={<Sparkles />}
                onClick={() => setCurrentPage("chat")}
              />

              <CustomSidePannelTopButton
                buttonText="GPTs"
                icon={<Bot />}
                onClick={() => setCurrentPage("chat")}
              />
            </div>
          </div>

          {/* Chat History - Scrollable */}
          <ChatHistory />

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
          setSidebarOpen={setSidebarOpen}
          setCurrentPage={setCurrentPage}
          chatHistory={[]} // No longer needed as ChatHistory component handles history
        />
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
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
        <div className="flex-1 flex flex-col items-center justify-center px-4 pb-40 relative ">
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
                append={handleSend}
                isLoading={isLoading}
              />
            </>
          ) : (
            <div className="w-full max-w-4xl flex flex-col h-full">
              {/* Messages */}
              <div className="flex-1 overflow-y-auto mb-4">
                {messages.map((message, index) => (
                  <div
                    key={index}
                    className={`mb-4 ${
                      message.role === "user" ? "text-right" : "text-left"
                    }`}
                  >
                    <div
                      className={`inline-block max-w-[80%] p-3 rounded-lg ${
                        message.role === "user"
                          ? "bg-blue-600 text-white"
                          : "bg-gray-700 text-white"
                      }`}
                    >
                      {message.content}
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="text-left mb-4">
                    <div className="inline-block max-w-[80%] p-3 rounded-lg bg-gray-700 text-white">
                      <div className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Thinking...
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Input Area */}
              <div className="flex-shrink-0">
                <CustomInputArea
                  input={input}
                  setInput={setInput}
                  append={handleSend}
                  isLoading={isLoading}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {!isMobile && (
        <div className="absolute start-1/2 pt-3 translate-x-[62%]">
          <PlusIcon />
        </div>
      )}
    </div>
  );
}
