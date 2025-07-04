import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import ChatHistoryItem from "./ChatHistoryItem";
import { ScrollArea } from "./ui/scroll-area";

interface Conversation {
  _id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
}

export default function ChatHistory({
  currentSessionId,
  onRefresh,
}: {
  currentSessionId?: string;
  onRefresh?: () => void;
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
      onRefresh?.(); // Call parent refresh function if provided
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch conversations");
    } finally {
      setLoading(false);
    }
  };

  const handleConversationClick = (conversationId: string) => {
    router.push(`/chat/${conversationId}`);
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col min-h-0">
        <div className="flex-shrink-0 py-2 px-3">
          <h3 className="text-sm font-medium text-gray-400 mb-2">Chats</h3>
        </div>
        <ScrollArea className="flex-1 px-1">
          <div className="space-y-1 pb-2">
            {[...Array(5)].map((_, index) => (
              <div key={index} className="h-10 bg-gray-700 rounded-lg animate-pulse" />
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
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <div className="flex-shrink-0 py-2 px-3">
        <h3 className="text-sm font-medium text-gray-400 mb-2">Chats</h3>
      </div>

      <ScrollArea className="flex-1 px-1">
        <div className="space-y-1 pb-2">
          {conversations.length === 0 ? (
            <p className="text-gray-500 text-sm px-3 py-2">No conversations yet</p>
          ) : (
            conversations.map((conversation) => (
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
