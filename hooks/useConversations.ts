import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  conversationApi,
  CreateConversationRequest,
  CreateMessageRequest,
  GenerateTitleRequest,
  UpdateConversationRequest,
} from "@/lib/api";

// Query keys
export const conversationKeys = {
  all: ["conversations"] as const,
  lists: () => [...conversationKeys.all, "list"] as const,
  list: (filters: string) =>
    [...conversationKeys.lists(), { filters }] as const,
  details: () => [...conversationKeys.all, "detail"] as const,
  detail: (id: string) => [...conversationKeys.details(), id] as const,
  messages: (conversationId: string) =>
    [...conversationKeys.detail(conversationId), "messages"] as const,
};

// Hook to get all conversations
export const useConversations = (enabled: boolean = true) => {

  return useQuery({
    queryKey: conversationKeys.lists(),
    queryFn: async () => {
      try {
        const response = await fetch("/api/conversations");

        if (!response.ok) {
          const errorText = await response.text();
          if (response.status === 401) {
            throw new Error("Unauthorized - User not authenticated");
          }
          throw new Error(
            `HTTP error! status: ${response.status}, message: ${errorText}`
          );
        }

        const data = await response.json();

        // Ensure we always return an array
        const result = Array.isArray(data) ? data : [];
        return result;
      } catch (error) {
        console.error("💥 Error fetching conversations:", error);
        throw error;
      }
    },
    // Remove initialData to ensure query runs when enabled
    // initialData: [],
    // Only fetch when enabled (i.e., when user is loaded)
    enabled: enabled,
    // Force refetch when enabled changes
    staleTime: 0,
    gcTime: 0,
  });
};

// Hook to get conversation by ID
export const useConversation = (id: string) => {
  return useQuery({
    queryKey: conversationKeys.detail(id),
    queryFn: () => conversationApi.getById(id),
    enabled: !!id,
  });
};

// Hook to create a new conversation
export const useCreateConversation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateConversationRequest) =>
      conversationApi.create(data),
    onSuccess: () => {
      // Invalidate and refetch conversations list
      queryClient.invalidateQueries({ queryKey: conversationKeys.lists() });
    },
  });
};

// Hook to update conversation
export const useUpdateConversation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: UpdateConversationRequest;
    }) => conversationApi.update(id, data),
    onSuccess: (data, variables) => {
      // Update the specific conversation in cache
      queryClient.setQueryData(conversationKeys.detail(variables.id), data);
      // Invalidate conversations list
      queryClient.invalidateQueries({ queryKey: conversationKeys.lists() });
    },
  });
};

// Hook to delete conversation
export const useDeleteConversation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => conversationApi.delete(id),
    onSuccess: (_, id) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: conversationKeys.detail(id) });
      // Invalidate conversations list
      queryClient.invalidateQueries({ queryKey: conversationKeys.lists() });
    },
  });
};

// Hook to add message to conversation
export const useAddMessage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      conversationId,
      message,
    }: {
      conversationId: string;
      message: CreateMessageRequest;
    }) => conversationApi.addMessage(conversationId, message),
    onSuccess: (data, variables) => {
      // Invalidate messages for this conversation
      queryClient.invalidateQueries({
        queryKey: conversationKeys.messages(variables.conversationId),
      });
    },
  });
};

// Hook to generate conversation title
export const useGenerateTitle = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: GenerateTitleRequest) =>
      conversationApi.generateTitle(data),
    onSuccess: (data, variables) => {
      // Update conversation title in cache
      queryClient.setQueryData(
        conversationKeys.detail(variables.sessionId),
        (old: any) => (old ? { ...old, title: data.title } : old)
      );
      // Invalidate conversations list
      queryClient.invalidateQueries({ queryKey: conversationKeys.lists() });
    },
  });
};
