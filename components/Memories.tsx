"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Trash2, Search, Clock, MessageCircle, Loader2 } from "lucide-react";
import { useUser } from "@clerk/nextjs";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useSearchMemories, useDeleteMemory } from "@/hooks/useMemories";

export default function Memories() {
  const { user } = useUser();
  const [searchQuery, setSearchQuery] = useState("");

  // Use TanStack Query hooks
  const { memories, isLoading, totalCount, filteredCount } = useSearchMemories(
    searchQuery,
    user?.id
  );
  const deleteMemoryMutation = useDeleteMemory();

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getMemoryContent = (memory: any) => {
    return (
      memory.memory || memory.text || memory.content || "No content available"
    );
  };

  const handleDeleteMemory = async (memoryId: string) => {
    deleteMemoryMutation.mutate({ memoryId });
  };

  return (
    <div className="flex flex-col h-screen w-full bg-[#212121] text-white overflow-hidden ">
      <div className="flex-1 flex justify-center min-h-0">
        <div className="w-full max-w-4xl bg-[#212121] flex flex-col h-full">
          {/* Header */}
          <div className="flex-shrink-0 border-b border-[#424242] px-4 py-3 md:px-6 md:py-4">
            <h2 className="text-lg font-semibold text-[#ececec] md:text-xl">
              Memories
            </h2>
            <p className="text-sm text-[#b4b4b4] mt-1">Your conversation history</p>
          </div>

          {/* Search Bar */}
          <div className="flex-shrink-0 p-4 border-b border-[#424242] md:px-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#8e8ea0] w-4 h-4" />
              <Input
                type="text"
                placeholder="Search memories..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-[#2f2f2f] border-[#424242] text-[#ececec] placeholder-[#8e8ea0] text-sm h-10 w-full focus:border-[#565869] focus:ring-[#565869] hover:bg-[#343541]"
              />
            </div>
          </div>

          {/* Stats */}
          <div className="flex-shrink-0 p-4 border-b border-[#424242] md:px-6">
            <div className="bg-[#2f2f2f] rounded-lg p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MessageCircle className="w-4 h-4 text-[#10a37f]" />
                  <span className="text-sm text-[#b4b4b4]">Total:</span>
                  <span className="text-sm text-[#ececec] font-medium">
                    {totalCount}
                  </span>
                </div>
                {searchQuery && (
                  <div className="text-sm text-[#8e8ea0]">
                    {filteredCount} of {totalCount}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ✅ FIXED: Memories List with proper scroll handling */}
          <div className="flex-1 overflow-y-auto min-h-0">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-[#10a37f]" />
                <span className="ml-3 text-sm text-[#b4b4b4]">
                  Loading memories...
                </span>
              </div>
            ) : memories.length === 0 ? (
              <div className="text-center py-12 px-4">
                <MessageCircle className="w-12 h-12 text-[#565869] mx-auto mb-4" />
                <h3 className="text-lg font-medium text-[#ececec] mb-2">
                  {searchQuery ? "No memories found" : "No memories yet"}
                </h3>
                <p className="text-sm text-[#b4b4b4] max-w-md mx-auto">
                  {searchQuery
                    ? "Try adjusting your search terms to find what you're looking for"
                    : "Your conversation memories will appear here as you chat"}
                </p>
              </div>
            ) : (
              <div className="p-4 space-y-3 md:p-6 md:space-y-4 no-scrollbar ">
                {memories.map((memory) => (
                  <div
                    key={memory.id}
                    className="bg-[#2f2f2f] no-scrollbar border border-[#424242] rounded-lg p-4 hover:border-[#565869] hover:bg-[#343541] transition-all duration-200"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-[#8e8ea0] flex-shrink-0" />
                            <span className="text-xs text-[#8e8ea0]">
                              {memory.metadata?.timestamp
                                ? formatDate(memory.metadata.timestamp)
                                : memory.created_at
                                ? formatDate(memory.created_at)
                                : "Unknown date"}
                            </span>
                          </div>
                          {memory.metadata?.messageCount && (
                            <span className="text-xs bg-[#40414f] px-2 py-1 rounded-full text-[#b4b4b4] border border-[#565869]">
                              {memory.metadata.messageCount} messages
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-[#ececec] leading-relaxed line-clamp-3 md:line-clamp-2">
                          {getMemoryContent(memory)}
                        </p>
                      </div>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="w-8 h-8 text-[#f18a85] hover:text-[#ff6b6b] hover:bg-[#ff6b6b]/10 flex-shrink-0 p-0"
                            disabled={deleteMemoryMutation.isPending}
                          >
                            {deleteMemoryMutation.isPending ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="bg-[#2f2f2f] border-[#424242] mx-4 max-w-md">
                          <AlertDialogHeader>
                            <AlertDialogTitle className="text-[#ececec]">
                              Delete Memory
                            </AlertDialogTitle>
                            <AlertDialogDescription className="text-[#b4b4b4]">
                              Are you sure you want to delete this memory? This
                              action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter className="flex-col gap-2 sm:flex-row">
                            <AlertDialogCancel className="bg-[#40414f] text-[#ececec] hover:bg-[#525468] border-[#565869]">
                              Cancel
                            </AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeleteMemory(memory.id)}
                              className="bg-[#ff6b6b] text-white hover:bg-[#ff5252] border-[#ff6b6b]"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
