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

// Individual attachment interface
export interface Attachment {
  type: "image" | "pdf" | "file";
  url: string;
  fileName: string;
  fileType: string; // MIME type
  fileSize?: number; // Size in bytes
  uploadedAt?: string;
}

// Attachment summary interface
export interface AttachmentSummary {
  imageCount: number;
  pdfCount: number;
  totalSize: number;
}

export interface Message {
  _id?: string;
  role: "user" | "assistant";
  content: string;
  sessionId: string;
  type?: "text" | "image" | "file";
  createdAt?: Date;
  
  // Legacy single file support (for backward compatibility)
  fileUrl?: string;
  fileName?: string;
  fileType?: string;
  data?: string; // Legacy field for single file URL
  
  // NEW: Multiple attachments support using simple arrays
  attachmentUrls?: string[];     // Array of file URLs
  attachmentTypes?: string[];    // Array of file types: 'image', 'pdf', 'file'
  
  // Computed fields (populated by backend)
  attachmentCount?: number;
  hasMultipleAttachments?: boolean;
}

export interface ChatRequest {
  messages: Message[];
  userId?: string;
  sessionId?: string;
  data?: string; // Legacy single file URL
  
  // NEW: Multiple attachments
  attachmentUrls?: string[];
  attachmentTypes?: string[];
}

export interface ChatResponse {
  success: boolean;
  message?: string;
  error?: string;
}

export interface UploadResponse {
  success: boolean;
  fileUrl?: string;
  fileName?: string;
  fileType?: string;
  fileSize?: number;
  error?: string;
}

// Helper types for frontend
export interface AttachmentInfo {
  url: string;
  type: 'image' | 'pdf' | 'file';
  name: string;
  size?: number;
}

export interface CreateConversationRequest {
  title: string;
}

export interface CreateMessageRequest {
  role: "user" | "assistant" | "system" | "data";
  content: string;
  type?: "text" | "image" | "file" | "mixed";
  
  // Legacy single file fields (for backward compatibility)
  fileUrl?: string;
  fileName?: string;
  fileType?: string;
  
  // New multiple attachments support
  attachments?: Attachment[];
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
