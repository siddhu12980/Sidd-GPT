import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { conversationApi, Memory } from "@/lib/api";
import { useUser } from "@clerk/nextjs";

// Query key factory for memories
export const memoryKeys = {
  all: ["memories"] as const,
  lists: () => [...memoryKeys.all, "list"] as const,
  list: (userId: string) => [...memoryKeys.lists(), userId] as const,
  details: () => [...memoryKeys.all, "detail"] as const,
  detail: (id: string) => [...memoryKeys.details(), id] as const,
};

// Hook to fetch all memories for a user
export const useMemories = (userId?: string) => {
  return useQuery({
    queryKey: memoryKeys.list(userId || ""),
    queryFn: () => conversationApi.getMemories(userId || ""),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
};

// Hook to delete a memory
export const useDeleteMemory = () => {
  const queryClient = useQueryClient();
  const { user } = useUser();

  return useMutation({
    mutationFn: ({ memoryId }: { memoryId: string }) =>
      conversationApi.deleteMemory(memoryId, { userId: user?.id || "" }),
    onSuccess: (_, { memoryId }) => {
      // Optimistically update the memories list
      queryClient.setQueryData(
        memoryKeys.list(user?.id || ""),
        (oldData: any) => {
          if (!oldData?.memories) return oldData;
          return {
            ...oldData,
            memories: oldData.memories.filter(
              (memory: Memory) => memory.id !== memoryId
            ),
          };
        }
      );
    },
    onError: (error, { memoryId }) => {
      console.error("Failed to delete memory:", error);
      // Revert optimistic update on error
      queryClient.invalidateQueries({
        queryKey: memoryKeys.list(user?.id || ""),
      });
    },
  });
};

// Hook to search memories (client-side filtering)
export const useSearchMemories = (searchQuery: string, userId?: string) => {
  const { data: memoriesData, isLoading, error } = useMemories(userId);

  const filteredMemories =
    memoriesData?.memories?.filter((memory: Memory) => {
      const content = (
        memory.memory ||
        memory.text ||
        memory.content ||
        ""
      ).toLowerCase();
      return content.includes(searchQuery.toLowerCase());
    }) || [];

  return {
    memories: filteredMemories,
    isLoading,
    error,
    totalCount: memoriesData?.memories?.length || 0,
    filteredCount: filteredMemories.length,
  };
};
