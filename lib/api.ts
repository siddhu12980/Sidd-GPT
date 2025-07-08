import axios from "axios";

// Create axios instance with base configuration
const api = axios.create({
  baseURL: "/api",
  headers: {
    "Content-Type": "application/json",
  },
});

// Types for API responses
export interface Conversation {
  _id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  _id?: string;
  role: "user" | "assistant" | "system" | "data";
  content: string;
  type?: string;
  fileUrl?: string;
  fileName?: string;
  fileType?: string;
  createdAt?: string;
}

export interface CreateConversationRequest {
  title: string;
}

export interface CreateMessageRequest {
  role: "user" | "assistant" | "system" | "data";
  content: string;
  type?: string;
  fileUrl?: string;
  fileName?: string;
  fileType?: string;
}

export interface GenerateTitleRequest {
  sessionId: string;
  context: string;
}

export interface GenerateTitleResponse {
  title: string;
}

export interface UpdateConversationRequest {
  title: string;
}

export interface Memory {
  id: string;
  memory?: string;
  text?: string;
  content?: string;
  metadata?: {
    timestamp?: string;
    messageCount?: number;
    [key: string]: any;
  };
  created_at?: string;
  updated_at?: string;
}

export interface GetMemoriesResponse {
  success: boolean;
  memories: Memory[];
}

export interface DeleteMemoryRequest {
  userId: string;
}

export interface DeleteMemoryResponse {
  success: boolean;
  message: string;
}

// API functions
export const conversationApi = {
  // Create new conversation
  create: async (data: CreateConversationRequest): Promise<Conversation> => {
    const response = await api.post("/conversations", data);
    return response.data;
  },

  // Get conversation by ID
  getById: async (id: string): Promise<Conversation> => {
    const response = await api.get(`/conversations/${id}`);
    return response.data;
  },

  // Update conversation
  update: async (
    id: string,
    data: UpdateConversationRequest
  ): Promise<Conversation> => {
    const response = await api.patch(`/conversations/${id}`, data);
    return response.data;
  },

  // Delete conversation
  delete: async (id: string): Promise<void> => {
    await api.delete(`/conversations/${id}`);
  },

  // Add message to conversation
  addMessage: async (
    conversationId: string,
    message: CreateMessageRequest
  ): Promise<Message> => {
    const response = await api.post(
      `/conversations/${conversationId}/messages`,
      message
    );
    return response.data;
  },

  // Generate title for conversation
  generateTitle: async (
    data: GenerateTitleRequest
  ): Promise<GenerateTitleResponse> => {
    const response = await api.post("/conversations/generate-title", data);
    return response.data;
  },

  // Get all memories for a user
  getMemories: async (userId: string): Promise<GetMemoriesResponse> => {
    const response = await api.get(`/memories?userId=${userId}`);
    return response.data;
  },

  // Delete a specific memory
  deleteMemory: async (
    memoryId: string,
    data: DeleteMemoryRequest
  ): Promise<DeleteMemoryResponse> => {
    const response = await api.delete(`/memories/${memoryId}`, { data });
    return response.data;
  },
};

export default api;
