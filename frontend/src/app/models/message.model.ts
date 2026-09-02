export type MessageType = 'TEXT' | 'JOIN' | 'LEAVE' | 'TYPING';

export interface ChatMessage {
  id?: string;
  roomId: string;
  senderId: string;
  senderUsername: string;
  recipientId?: string;
  recipientUsername?: string;
  content: string;
  type: MessageType;
  createdAt: string;
}

export interface TypingEvent {
  roomId: string;
  userId: string;
  username: string;
  isTyping: boolean;
}

export interface PageResponse<T> {
  content: T[];
  pageNumber: number;
  pageSize: number;
  totalElements: number;
  totalPages: number;
  isFirst: boolean;
  isLast: boolean;
  hasNext: boolean;
}
