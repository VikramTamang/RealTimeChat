import { User } from './user.model';
import { ChatMessage } from './message.model';

export interface Room {
  id: string;
  name: string;
  description?: string;
  isGroup: boolean;
  createdBy: string;
  createdAt: string;
  memberCount: number;
  lastMessage?: ChatMessage;
  members?: User[];
}

export interface CreateRoomRequest {
  name: string;
  description?: string;
  isGroup: boolean;
  memberUserIds?: string[];
}
