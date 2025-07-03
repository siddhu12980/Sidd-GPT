import ChatHistoryItem from "./ChatHistoryItem";

import { ScrollArea } from "./ui/scroll-area";

export default function ChatHistory({
  chatHistory,
}: {
  chatHistory: string[];
}) {
  return (
    <div className="flex-1 flex flex-col min-h-0">
      <div className="flex-shrink-0  py-2 px-3 ">
        <h3 className="text-sm font-medium text-gray-400 mb-2">Chats</h3>
      </div>

      <ScrollArea className="flex-1 px-1">
        <div className="space-y-1 pb-2">
          {chatHistory.map((chat, index) => (
            <ChatHistoryItem key={index} title={chat} />
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
