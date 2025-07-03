"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";

import { PanelLeft, Plus, Menu, MessageCircleDashed } from "lucide-react";

import PricingPage from "@/app/pricing/page";
import { Message, useChat } from "@ai-sdk/react";

import { Logo } from "@/components/logo";
import CustomSidePannelTopButton from "@/components/Custom_side_pannel_top_button";
import MobileSidebar from "@/components/mobile_sidebar";
import CustomInputArea from "@/components/Custom_input_area";
import PlusIcon from "@/components/Plus_icon";
import ChatHistoryItem from "@/components/ChatHistoryItem";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import ChatConversation from "./ChatConversation";
import GptLabelDropDown from "./GptLabelDropDown";
import SideBarNavigation from "./SideBarNavigation";
import ChatHistory from "./ChatHistory";
import SideBarFooter from "./SideBarFooter";

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
  }[];
}) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const router = useRouter();

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [currentPage, setCurrentPage] = useState("chat"); // "chat" or "pricing"
  const [isMobile, setIsMobile] = useState(false);

  // Scroll to bottom on new message
  const scrollToBottom = () => {
    setTimeout(() => {
      scrollRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  const { messages, input, setInput, append, isLoading, status, stop, reload } = useChat({
    api: "/api/chat",

    initialMessages: initialMessages.map((m) => ({
      ...m,
      id: m._id || "",
      createdAt: m.createdAt ? new Date(m.createdAt) : undefined,
      role: m.role as "system" | "user" | "assistant" | "data",
    })),

    onFinish: async (aiMessage) => {
      // Save AI message to DB
      await fetch(`/api/conversations/${sessionId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(aiMessage),
      });
    },
    onResponse: (response) => {
      console.log("response", response);
    },
    onError: (error) => {
      console.error("Chat error:", error);
    },
  });

  console.log("messages", messages);

  const chatHistory = [
    "Mobile Responsiveness and ARIA",
    "NFT Metadata URI Usage",
    "Sports Betting Terms Explained",
    "Response to Job Inquiry",
    "VM Network Setup Troublesho...",
    "Kubernetes Configuration Issues",
    "Pipeline Script Improvement",
    "Centering Carousel for Hero",
    "Responsive Width Classes",
    "Ecommerce Schema Optimiza...",
    "Formalizing PR Description",
    "TypeScript Property Error Fix",
    "Convert code to Hono middle...",
    "Form Refresh Issue",
    "Python Exam Preparation",
  ];

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

  const handleSend = async () => {
    if (!input.trim()) return;
    const userMessage = { role: "user", content: input.trim() };

    // Save user message to DB
    await fetch(`/api/conversations/${sessionId}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(userMessage),
    });

    append(userMessage as Message);
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
          <SideBarNavigation
            handleNewChat={handleNewChat}
            setCurrentPage={setCurrentPage}
          />

          {/* Chat History - Scrollable */}
          <ChatHistory chatHistory={chatHistory} />

          {/* Sidebar Footer - Fixed */}
          <SideBarFooter setCurrentPage={setCurrentPage} />
        </div>
      )}

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && isMobile && (
        <MobileSidebar
          setSidebarOpen={setSidebarOpen}
          setCurrentPage={setCurrentPage}
          chatHistory={chatHistory}
        />
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-full max-h-full">
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
        <div className="flex-1 overflow-y-auto px-4">
          <ChatConversation
            messages={messages.map((msg) => ({
              ...msg,
              createdAt: msg.createdAt?.toISOString(),
            }))}
            isLoading={isLoading}
            status={status}
            reload={reload}
          />

          <div ref={scrollRef} />
        </div>

        {/* Input Area */}
        <div className="w-full max-w-3xl mx-auto sticky bottom-0 bg-[#212121] pb-6 pt-2 z-10">
          <CustomInputArea
            input={input}
            setInput={setInput}
            append={handleSend}
            isLoading={isLoading}
            stop={stop}
            status={status}
          />
        </div>
      </div>
    </div>
  );
}
