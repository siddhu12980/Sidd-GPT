import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ScrollArea } from "@radix-ui/react-scroll-area";
import { Button } from "./ui/button";
import { Bot, Settings } from "lucide-react";
import { Search, Sparkles } from "lucide-react";
import { BookOpen, Edit, Brain } from "lucide-react";
import { PanelLeft } from "lucide-react";
import { Logo } from "./logo";

interface Conversation {
  _id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
}

export default function MobileSidebar({
  setSidebarOpen,
  setCurrentPage,
  sidebarOpen,
}: {
  setSidebarOpen: (open: boolean) => void;
  setCurrentPage: (page: string) => void;
  sidebarOpen: boolean;
}) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    fetchConversations();
  }, []);

  const fetchConversations = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/conversations");
      if (!response.ok) {
        throw new Error("Failed to fetch conversations");
      }
      const data = await response.json();
      setConversations(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch conversations"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleConversationClick = (conversationId: string) => {
    setSidebarOpen(false);
    setCurrentPage("chat");
    router.push(`/chat/${conversationId}`);
  };

  return (
    <>
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40"
        onClick={() => setSidebarOpen(false)}
      />
      <div className="fixed left-0 top-0 h-full w-64 bg-[#171717] flex flex-col z-50">
        {/* Sidebar Header - Fixed */}
        <div className="flex-shrink-0 p-2">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-6 h-6  rounded-full flex items-center justify-center">
                <Logo />
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="w-8 h-8 text-gray-400 hover:text-white hover:bg-gray-700 p-0"
              onClick={() => setSidebarOpen(false)}
            >
              <PanelLeft className="w-4 h-4" />
            </Button>
          </div>

          <Button className="w-full bg-transparent hover:bg-gray-700 text-white border border-gray-600 justify-start gap-2 h-9 px-3 rounded-lg">
            <Edit className="w-4 h-4" />
            New chat
          </Button>
        </div>

        {/* Navigation - Fixed */}
        <div className="flex-shrink-0 px-2 pb-2">
          <div className="space-y-1">
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 text-gray-300 hover:text-white hover:bg-gray-700 h-9 px-3 rounded-lg"
            >
              <Search className="w-4 h-4" />
              <span className="text-sm">Search chats</span>
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 text-gray-300 hover:text-white hover:bg-gray-700 h-9 px-3 rounded-lg"
            >
              <BookOpen className="w-4 h-4" />
              <span className="text-sm">Library</span>
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 text-gray-300 hover:text-white hover:bg-gray-700 h-9 px-3 rounded-lg"
            >
              <Sparkles className="w-4 h-4" />
              <span className="text-sm">Sora</span>
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 text-gray-300 hover:text-white hover:bg-gray-700 h-9 px-3 rounded-lg"
            >
              <Bot className="w-4 h-4" />
              <span className="text-sm">GPTs</span>
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 text-gray-300 hover:text-white hover:bg-gray-700 h-9 px-3 rounded-lg"
              onClick={() => {
                setSidebarOpen(false);
                setCurrentPage("memory");
              }}
            >
              <Brain className="w-4 h-4" />
              <span className="text-sm">Memories</span>
            </Button>
          </div>
        </div>

        {/* Chat History - Scrollable */}
        <div className="flex-1 flex flex-col min-h-0">
          <div className="flex-shrink-0 px-3 py-2">
            <h3 className="text-xs font-medium text-gray-400 mb-2">Chats</h3>
          </div>
          <ScrollArea className="flex-1 px-2">
            <div className="space-y-1 pb-4">
              {loading ? (
                [...Array(5)].map((_, index) => (
                  <div
                    key={index}
                    className="h-10 bg-gray-700 rounded-lg animate-pulse"
                  />
                ))
              ) : error ? (
                <p className="text-red-400 text-sm px-3 py-2">{error}</p>
              ) : conversations.length === 0 ? (
                <p className="text-gray-500 text-sm px-3 py-2">
                  No conversations yet
                </p>
              ) : (
                conversations.map((conversation) => (
                  <Button
                    key={conversation._id}
                    variant="ghost"
                    className="w-full justify-start text-left text-gray-300 hover:text-white hover:bg-gray-700 h-auto py-2 px-3 rounded-lg"
                    onClick={() => handleConversationClick(conversation._id)}
                  >
                    <span className="truncate text-sm font-normal">
                      {conversation.title}
                    </span>
                  </Button>
                ))
              )}
            </div>
          </ScrollArea>
        </div>

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
    </>
  );
}
