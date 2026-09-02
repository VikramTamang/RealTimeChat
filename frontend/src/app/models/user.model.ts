export interface User {
  id: string;
  username: string;
  email: string;
  avatarUrl?: string;
  createdAt?: string;
}

export interface AuthResponse {
  token: string;
  tokenType: string;
  expiresIn: number;
  user: User;
}

export interface PresenceInfo {
  userId: string;
  username: string;
  status: 'ONLINE' | 'OFFLINE';
  lastSeen?: string;
}
