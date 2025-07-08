"use client";

import React, {
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback,
} from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Search, MessageCircle, ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { useConversations } from "@/hooks/useConversations";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import debounce from "lodash/debounce";

interface SearchModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface Conversation {
  _id: string;
  title: string;
  createdAt: string;
  updatedAt?: string;
}

export function SearchModal({ open, onOpenChange }: SearchModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const isMobile = useIsMobile();

  const { data: conversations = [], isLoading } = useConversations();

  // Debounced search query update
  useEffect(() => {
    const handler = debounce(() => {
      setDebouncedQuery(searchQuery);
    }, 300);

    handler();
    return () => handler.cancel();
  }, [searchQuery]);

  // Memoized filtered conversations
  const filteredConversations = useMemo(
    () =>
      conversations.filter((conv: Conversation) =>
        conv.title.toLowerCase().includes(debouncedQuery.toLowerCase())
      ),
    [conversations, debouncedQuery]
  );

  // Reset selection when search changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [searchQuery]);

  // Focus input when modal opens
  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus();
    }
  }, [open]);

  // Handle keyboard navigation
  useEffect(() => {
    if (!isMobile) {
      const handleKeyDown = (e: KeyboardEvent) => {
        if (!open) return;

        switch (e.key) {
          case "ArrowDown":
            e.preventDefault();
            setSelectedIndex((prev) =>
              prev < filteredConversations.length - 1 ? prev + 1 : 0
            );
            break;
          case "ArrowUp":
            e.preventDefault();
            setSelectedIndex((prev) =>
              prev > 0 ? prev - 1 : filteredConversations.length - 1
            );
            break;
          case "Enter":
            e.preventDefault();
            if (filteredConversations[selectedIndex]) {
              handleSelectConversation(
                filteredConversations[selectedIndex]._id
              );
            }
            break;
          case "Escape":
            onOpenChange(false);
            break;
        }
      };

      document.addEventListener("keydown", handleKeyDown);
      return () => document.removeEventListener("keydown", handleKeyDown);
    }
  }, [open, filteredConversations, selectedIndex, onOpenChange, isMobile]);

  const handleSelectConversation = useCallback(
    (conversationId: string) => {
      router.push(`/chat/${conversationId}`);
      onOpenChange(false);
      setSearchQuery("");
    },
    [router, onOpenChange]
  );

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      return "Just now";
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`;
    } else if (diffInHours < 24 * 7) {
      return `${Math.floor(diffInHours / 24)}d ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const mobileContent = (
    <>
      <h1 className="sr-only">Search Conversations</h1>

      {/* Header with back button and search input */}
      <div className="p-4 border-b border-gray-600/50">
        <div className="flex items-center gap-3">
          <button
            onClick={() => onOpenChange(false)}
            className="p-1 hover:bg-gray-700 rounded-lg transition-colors"
            aria-label="Back"
          >
            <ArrowLeft className="w-5 h-5 text-gray-400" />
          </button>
          <div className="relative flex-1">
            <Search
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4"
              aria-hidden="true"
            />
            <Input
              ref={inputRef}
              type="text"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-[#2d2d30] border-gray-600/50 text-white placeholder-gray-400 h-10 w-full focus:border-gray-500 focus:ring-0 rounded"
              aria-label="Search conversations"
              role="searchbox"
            />
          </div>
        </div>
      </div>

      {/* Results list */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="text-center py-8 px-4">
            <p className="text-sm text-gray-400">Loading conversations...</p>
          </div>
        ) : filteredConversations.length === 0 ? (
          <div className="text-center py-8 px-4">
            <p className="text-sm text-gray-400">
              {debouncedQuery
                ? `No conversations found for "${debouncedQuery}"`
                : "Start typing to search"}
            </p>
          </div>
        ) : (
          <div className="p-2" role="listbox" aria-label="Conversation results">
            {filteredConversations.map(
              (conversation: Conversation, index: number) => (
                <button
                  key={conversation._id}
                  onClick={() => handleSelectConversation(conversation._id)}
                  className="w-full text-left p-3 rounded hover:bg-[#2d2d30] transition-colors"
                  role="option"
                  aria-selected={selectedIndex === index}
                >
                  <div className="flex items-center gap-3">
                    <MessageCircle
                      className="w-4 h-4 text-gray-400 flex-shrink-0"
                      aria-hidden="true"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-200 truncate">
                          {conversation.title}
                        </span>
                        <span className="text-xs text-gray-400 ml-2">
                          {formatDate(
                            conversation.updatedAt || conversation.createdAt
                          )}
                        </span>
                      </div>
                    </div>
                  </div>
                </button>
              )
            )}
          </div>
        )}
      </div>
    </>
  );

  const desktopContent = (
    <>
      <DialogTitle className="sr-only">Search Conversations</DialogTitle>

      {/* Header with search input */}
      <div className="p-4 border-b border-gray-600/50">
        <div className="relative">
          <Search
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4"
            aria-hidden="true"
          />
          <Input
            ref={inputRef}
            type="text"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-[#2d2d30] border-gray-600/50 text-white placeholder-gray-400 h-10 w-full focus:border-gray-500 focus:ring-0 rounded"
            aria-label="Search conversations"
            role="searchbox"
          />
        </div>
      </div>

      {/* Results list */}
      <div className="flex-1 overflow-y-auto max-h-[400px]">
        {isLoading ? (
          <div className="text-center py-8 px-4">
            <p className="text-sm text-gray-400">Loading conversations...</p>
          </div>
        ) : filteredConversations.length === 0 ? (
          <div className="text-center py-8 px-4">
            <p className="text-sm text-gray-400">
              {debouncedQuery
                ? `No conversations found for "${debouncedQuery}"`
                : "Start typing to search"}
            </p>
          </div>
        ) : (
          <div className="p-2" role="listbox" aria-label="Conversation results">
            {filteredConversations.map(
              (conversation: Conversation, index: number) => (
                <button
                  key={conversation._id}
                  onClick={() => handleSelectConversation(conversation._id)}
                  className={cn(
                    "w-full text-left p-3 rounded hover:bg-[#2d2d30] transition-colors",
                    selectedIndex === index && "bg-[#2d2d30]"
                  )}
                  role="option"
                  aria-selected={selectedIndex === index}
                >
                  <div className="flex items-center gap-3">
                    <MessageCircle
                      className="w-4 h-4 text-gray-400 flex-shrink-0"
                      aria-hidden="true"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-200 truncate">
                          {conversation.title}
                        </span>
                        <span className="text-xs text-gray-400 ml-2">
                          {formatDate(
                            conversation.updatedAt || conversation.createdAt
                          )}
                        </span>
                      </div>
                    </div>
                  </div>
                </button>
              )
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-gray-600/50 text-xs text-gray-400">
        <div className="flex justify-between">
          <div className="flex gap-4">
            <span>↑↓ to navigate</span>
            <span>Enter to select</span>
            <span>Esc to close</span>
          </div>
          <span>{filteredConversations.length} result(s)</span>
        </div>
      </div>
    </>
  );

  if (isMobile) {
    return open ? (
      <div className="fixed inset-0 z-50 bg-[#202123] flex flex-col">
        {mobileContent}
      </div>
    ) : null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="p-0 gap-0 bg-transparent border-none shadow-none max-w-xl w-full">
        {/* Simple background overlay */}
        <div
          className="fixed inset-0 bg-black/50"
          onClick={() => onOpenChange(false)}
        />

        {/* Plain modal content */}
        <div className="relative bg-[#202123] border border-gray-600/50 rounded-lg shadow-lg max-h-[70vh] flex flex-col">
          {desktopContent}
        </div>
      </DialogContent>
    </Dialog>
  );
}
