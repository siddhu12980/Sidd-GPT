import { useRouter } from "next/navigation";
import ChatHistoryItem from "./ChatHistoryItem";
import { ScrollArea } from "./ui/scroll-area";
import { useConversations } from "@/hooks/useConversations";
import "./hide-scrollbar.css";

export default function ChatHistory({
  currentSessionId,
  setCurrentPage,
}: {
  currentSessionId?: string;
  setCurrentPage?: (page: string) => void;
}) {
  const router = useRouter();

  // Use TanStack Query hook instead of manual fetch
  const {
    data: conversations = [],
    isLoading: loading,
    error,
  } = useConversations();

  // Ensure conversations is always an array
  const safeConversations = Array.isArray(conversations) ? conversations : [];

  const handleConversationClick = (conversationId: string) => {
    // Reset to chat page when navigating to a conversation
    setCurrentPage?.("chat");
    router.push(`/chat/${conversationId}`);
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col min-h-0">
        <div className="flex-shrink-0 py-2 px-3">
          <h3 className="text-sm font-medium text-gray-400 mb-2">Chats</h3>
        </div>
        <ScrollArea className="flex-1 px-1 hide-scrollbar">
          <div className="space-y-1 pb-2">
            {[...Array(5)].map((_, index) => (
              <div
                key={index}
                className="h-10 bg-gray-700 rounded-lg animate-pulse"
              />
            ))}
          </div>
        </ScrollArea>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex flex-col min-h-0">
        <div className="flex-shrink-0 py-2 px-3">
          <h3 className="text-sm font-medium text-gray-400 mb-2">Chats</h3>
        </div>
        <div className="flex-1 px-1 flex items-center justify-center">
          <p className="text-red-400 text-sm">
            {error.message || "Failed to load conversations"}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <div className="flex-shrink-0 py-2 px-3">
        <h3 className="text-sm font-medium text-gray-400 mb-2">Chats</h3>
      </div>

      <ScrollArea className="flex-1 px-1 hide-scrollbar">
        <div className="space-y-1 pb-2">
          {safeConversations.length === 0 ? (
            <p className="text-gray-500 text-sm px-3 py-2">
              No conversations yet
            </p>
          ) : (
            safeConversations.map((conversation: any) => (
              <ChatHistoryItem
                key={conversation._id}
                conversation={conversation}
                isActive={currentSessionId === conversation._id}
                onClick={() => handleConversationClick(conversation._id)}
              />
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
