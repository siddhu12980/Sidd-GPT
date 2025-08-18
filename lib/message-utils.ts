/**
 * Client-safe message conversion utilities
 * These functions handle conversion between AI SDK v5 UIMessage format and database format
 * without any server-side dependencies (no Mongoose models)
 */

// Type definitions for better type safety
export interface UIMessagePart {
  type: 'text' | 'file';
  text?: string;
  mediaType?: string;
  url?: string;
  filename?: string;
}

export interface UIMessage {
  id: string;
  role: 'user' | 'assistant';
  parts: UIMessagePart[];
  createdAt?: string;
}

export interface DatabaseMessage {
  _id?: string;
  id?: string;
  role: 'user' | 'assistant';
  content: string;
  type: 'text' | 'image' | 'file' | 'mixed';
  createdAt?: string;
  
  // Legacy single file fields (for backward compatibility)
  fileName?: string;
  fileType?: string;
  fileUrl?: string;
  
  // New multiple attachments support
  attachments?: Array<{
    type: 'image' | 'pdf' | 'file';
    url: string;
    fileName: string;
    fileType: string;
    fileSize?: number;
  }>;
  
  // UI display arrays (for ChatConversation component)
  attachmentUrls?: string[];
  attachmentTypes?: string[];
  attachmentNames?: string[];
  attachmentCount?: number;
  hasMultipleAttachments?: boolean;
}

/**
 * Convert AI SDK v5 UIMessage format to database format
 */
export function fromUIMessage(uiMessage: UIMessage, conversationId?: string): DatabaseMessage {
  const message: DatabaseMessage = {
    role: uiMessage.role,
    content: '',
    attachments: [],
    type: 'text',
    id: uiMessage.id,
    createdAt: uiMessage.createdAt || new Date().toISOString(),
  };

  // Process message parts
  if (uiMessage.parts) {
    uiMessage.parts.forEach((part: UIMessagePart) => {
      if (part.type === 'text') {
        message.content += part.text || '';
      } else if (part.type === 'file') {
        message.attachments!.push({
          type: part.mediaType?.startsWith('image/')
            ? 'image'
            : part.mediaType?.startsWith('application/pdf')
            ? 'pdf'
            : 'file',
          url: part.url || '',
          fileName: part.filename || 'unknown',
          fileType: part.mediaType || 'application/octet-stream',
        });
      }
    });
  }

  // Set message type based on attachments
  if (message.attachments && message.attachments.length > 0) {
    const imageCount = message.attachments.filter(att => att.type === 'image').length;
    const pdfCount = message.attachments.filter(att => att.type === 'pdf').length;
    
    if (imageCount > 0 && pdfCount > 0) {
      message.type = 'mixed';
    } else if (imageCount > 0) {
      message.type = 'image';
    } else if (pdfCount > 0) {
      message.type = 'file';
    }

    // Populate display arrays for UI components
    message.attachmentUrls = message.attachments.map(att => att.url);
    message.attachmentTypes = message.attachments.map(att => att.type);
    message.attachmentNames = message.attachments.map(att => att.fileName);
    message.attachmentCount = message.attachments.length;
    message.hasMultipleAttachments = message.attachments.length > 1;
  }

  return message;
}

/**
 * Convert database format to AI SDK v5 UIMessage format
 */
export function toUIMessage(dbMessage: DatabaseMessage): UIMessage {
  const parts: UIMessagePart[] = [];

  // Add text content as first part
  if (dbMessage.content) {
    parts.push({
      type: 'text',
      text: dbMessage.content,
    });
  }

  // Add file attachments as file parts
  if (dbMessage.attachments && dbMessage.attachments.length > 0) {
    dbMessage.attachments.forEach((attachment) => {
      parts.push({
        type: 'file',
        mediaType: attachment.fileType,
        url: attachment.url,
        filename: attachment.fileName,
      });
    });
  }

  // Handle legacy single file (backward compatibility)
  if (!dbMessage.attachments?.length && dbMessage.fileUrl) {
    parts.push({
      type: 'file',
      mediaType: dbMessage.fileType,
      url: dbMessage.fileUrl,
      filename: dbMessage.fileName,
    });
  }

  return {
    id: dbMessage._id?.toString() || dbMessage.id || `temp-${Date.now()}`,
    role: dbMessage.role,
    parts: parts,
    createdAt: dbMessage.createdAt,
  } as UIMessage;
}

/**
 * Convert array of database messages to UI format
 */
export function toUIMessages(dbMessages: DatabaseMessage[]): UIMessage[] {
  return dbMessages.map(msg => toUIMessage(msg));
}

/**
 * Convert array of UI messages to database format
 */
export function fromUIMessages(uiMessages: UIMessage[], conversationId?: string): DatabaseMessage[] {
  return uiMessages.map(msg => fromUIMessage(msg, conversationId));
}

/**
 * Convert UI messages to legacy ChatConversation format (for backward compatibility)
 */
export function toConversationMessages(uiMessages: UIMessage[]): DatabaseMessage[] {
  return uiMessages.map((msg) => {
    const message: DatabaseMessage = {
      _id: msg.id,
      id: msg.id,
      role: msg.role,
      content: '',
      createdAt: msg.createdAt || new Date().toISOString(),
      type: 'text',
      fileUrl: '',
      fileName: '',
      fileType: '',
      attachments: [],
      attachmentUrls: [],
      attachmentTypes: [],
      attachmentNames: [],
      attachmentCount: 0,
      hasMultipleAttachments: false,
    };

    // Process message parts to extract content and attachments
    if (msg.parts) {
      const textParts: string[] = [];
      const fileAttachments: Array<{
        type: 'image' | 'pdf' | 'file';
        url: string;
        fileName: string;
        fileType: string;
      }> = [];

      msg.parts.forEach((part) => {
        if (part.type === 'text') {
          textParts.push(part.text || '');
        } else if (part.type === 'file') {
          fileAttachments.push({
            type: part.mediaType?.startsWith('image/')
              ? 'image'
              : part.mediaType?.startsWith('application/pdf')
              ? 'pdf'
              : 'file',
            url: part.url || '',
            fileName: part.filename || 'unknown',
            fileType: part.mediaType || 'application/octet-stream',
          });
        }
      });

      // Set content from text parts
      message.content = textParts.join(' ');

      // Handle attachments
      if (fileAttachments.length > 0) {
        message.attachments = fileAttachments;
        message.attachmentUrls = fileAttachments.map(att => att.url);
        message.attachmentTypes = fileAttachments.map(att => att.type);
        message.attachmentNames = fileAttachments.map(att => att.fileName);
        message.attachmentCount = fileAttachments.length;
        message.hasMultipleAttachments = fileAttachments.length > 1;

        // Set message type based on attachments
        const imageCount = fileAttachments.filter(att => att.type === 'image').length;
        const pdfCount = fileAttachments.filter(att => att.type === 'pdf').length;
        
        if (imageCount > 0 && pdfCount > 0) {
          message.type = 'mixed';
        } else if (imageCount > 0) {
          message.type = 'image';
        } else if (pdfCount > 0) {
          message.type = 'file';
        }

        // For backward compatibility - set legacy fields for the first attachment
        if (fileAttachments.length > 0) {
          const firstAttachment = fileAttachments[0];
          message.fileUrl = firstAttachment.url;
          message.fileName = firstAttachment.fileName;
          message.fileType = firstAttachment.fileType;
        }
      }
    }

    return message;
  });
}

/**
 * Convert database message format to AI SDK v5 sendMessage format
 * This creates the proper structure for sendMessage({ text, files })
 */
export function toSendMessageFormat(dbMessage: DatabaseMessage): {
  text: string;
  files?: Array<{
    type: 'file';
    mediaType: string;
    url: string;
    filename?: string;
  }>;
} {
  const result: { 
    text: string; 
    files?: Array<{
      type: 'file';
      mediaType: string;
      url: string;
      filename?: string;
    }>;
  } = {
    text: dbMessage.content || '',
  };

  // Handle multiple attachments
  if (dbMessage.attachmentUrls && dbMessage.attachmentUrls.length > 0) {
    result.files = dbMessage.attachmentUrls.map((url, index) => {
      const fileName = dbMessage.attachmentNames?.[index] || `attachment-${index}`;
      const fileType = dbMessage.attachmentTypes?.[index] || 'file';
      
      // Convert your attachment type to proper MIME type
      let mediaType: string;
      if (fileType === 'image') {
        mediaType = fileName.toLowerCase().endsWith('.png') ? 'image/png' : 'image/jpeg';
      } else if (fileType === 'pdf') {
        mediaType = 'application/pdf';
      } else {
        mediaType = 'application/octet-stream';
      }

      return {
        type: 'file' as const,
        mediaType: mediaType,
        url: url,
        filename: fileName,
      };
    });
  }
  
  // Handle legacy single file (backward compatibility)
  else if (dbMessage.fileUrl && dbMessage.fileName) {
    let mediaType = dbMessage.fileType || 'application/octet-stream';
    if (dbMessage.type === 'image') {
      mediaType = dbMessage.fileName.toLowerCase().endsWith('.png') ? 'image/png' : 'image/jpeg';
    } else if (dbMessage.type === 'file') {
      mediaType = 'application/pdf';
    }

    result.files = [{
      type: 'file' as const,
      mediaType: mediaType,
      url: dbMessage.fileUrl,
      filename: dbMessage.fileName,
    }];
  }

  return result;
}
