import { Injectable, signal } from '@angular/core';
import { Client, IMessage, StompSubscription } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { Subject, Observable } from 'rxjs';
import { ChatMessage, TypingEvent } from '../models/message.model';
import { PresenceInfo } from '../models/user.model';
import { AuthService } from './auth.service';
import { PresenceService } from './presence.service';

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  private stompClient?: Client;
  private roomSubscriptions = new Map<string, StompSubscription>();
  private typingSubscriptions = new Map<string, StompSubscription>();
  private privateMessageSubscription?: StompSubscription;
  private presenceSubscription?: StompSubscription;

  // Connection state signal
  isConnected = signal<boolean>(false);
  connectionError = signal<string | null>(null);

  // Event subjects
  private roomMessageSubject = new Subject<ChatMessage>();
  private privateMessageSubject = new Subject<ChatMessage>();
  private typingSubject = new Subject<TypingEvent>();
  private presenceSubject = new Subject<PresenceInfo>();

  // Observables for components
  roomMessages$: Observable<ChatMessage> = this.roomMessageSubject.asObservable();
  privateMessages$: Observable<ChatMessage> = this.privateMessageSubject.asObservable();
  typingEvents$: Observable<TypingEvent> = this.typingSubject.asObservable();
  presenceEvents$: Observable<PresenceInfo> = this.presenceSubject.asObservable();

  constructor(
    private authService: AuthService,
    private presenceService: PresenceService
  ) {}

  connect(): void {
    const token = this.authService.getToken();
    if (!token) {
      this.connectionError.set('No authentication token available');
      return;
    }

    if (this.stompClient && this.stompClient.active) {
      return;
    }

    // Connect via SockJS endpoint with token query parameter for HandshakeInterceptor
    const socketUrl = `/ws?token=${encodeURIComponent(token)}`;

    this.stompClient = new Client({
      webSocketFactory: () => new SockJS(socketUrl) as any,
      connectHeaders: {
        Authorization: `Bearer ${token}`
      },
      debug: (msg: string) => {
        // console.debug('[STOMP]', msg);
      },
      reconnectDelay: 4000,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
    });

    this.stompClient.onConnect = (frame) => {
      this.isConnected.set(true);
      this.connectionError.set(null);
      console.log('STOMP connected successfully:', frame);

      // 1. Subscribe to User's private direct messages
      this.subscribeToPrivateQueue();

      // 2. Subscribe to global presence events
      this.subscribeToPresenceTopic();

      // 3. Start periodic REST/WS heartbeat
      this.presenceService.startHeartbeat();
    };

    this.stompClient.onStompError = (frame) => {
      console.error('STOMP broker error:', frame.headers['message'], frame.body);
      this.connectionError.set(frame.headers['message'] || 'Connection error');
    };

    this.stompClient.onWebSocketClose = (event) => {
      this.isConnected.set(false);
      console.log('WebSocket connection closed');
    };

    this.stompClient.activate();
  }

  disconnect(): void {
    if (this.stompClient && this.stompClient.active) {
      this.stompClient.deactivate();
    }
    this.roomSubscriptions.clear();
    this.typingSubscriptions.clear();
    this.isConnected.set(false);
    this.presenceService.stopHeartbeat();
  }

  // Room Subscription: /topic/room.{roomId}
  subscribeToRoom(roomId: string): void {
    if (!this.stompClient || !this.isConnected()) return;

    if (this.roomSubscriptions.has(roomId)) return;

    // Room message subscription
    const sub = this.stompClient.subscribe(`/topic/room.${roomId}`, (message: IMessage) => {
      try {
        const chatMessage: ChatMessage = JSON.parse(message.body);
        this.roomMessageSubject.next(chatMessage);
      } catch (err) {
        console.error('Failed to parse room message:', err);
      }
    });
    this.roomSubscriptions.set(roomId, sub);

    // Typing indicators subscription: /topic/room.{roomId}.typing
    const typingSub = this.stompClient.subscribe(`/topic/room.${roomId}.typing`, (message: IMessage) => {
      try {
        const typingEvent: TypingEvent = JSON.parse(message.body);
        this.typingSubject.next(typingEvent);
      } catch (err) {
        console.error('Failed to parse typing event:', err);
      }
    });
    this.typingSubscriptions.set(roomId, typingSub);
  }

  unsubscribeFromRoom(roomId: string): void {
    const sub = this.roomSubscriptions.get(roomId);
    if (sub) {
      sub.unsubscribe();
      this.roomSubscriptions.delete(roomId);
    }
    const typingSub = this.typingSubscriptions.get(roomId);
    if (typingSub) {
      typingSub.unsubscribe();
      this.typingSubscriptions.delete(roomId);
    }
  }

  // Private Messages: /user/queue/private
  private subscribeToPrivateQueue(): void {
    if (!this.stompClient) return;

    if (this.privateMessageSubscription) {
      this.privateMessageSubscription.unsubscribe();
    }

    this.privateMessageSubscription = this.stompClient.subscribe('/user/queue/private', (message: IMessage) => {
      try {
        const chatMessage: ChatMessage = JSON.parse(message.body);
        this.privateMessageSubject.next(chatMessage);
      } catch (err) {
        console.error('Failed to parse private message:', err);
      }
    });
  }

  // Presence Events: /topic/presence
  private subscribeToPresenceTopic(): void {
    if (!this.stompClient) return;

    if (this.presenceSubscription) {
      this.presenceSubscription.unsubscribe();
    }

    this.presenceSubscription = this.stompClient.subscribe('/topic/presence', (message: IMessage) => {
      try {
        const presence: PresenceInfo = JSON.parse(message.body);
        this.presenceSubject.next(presence);
        this.presenceService.updatePresenceStatus(presence.userId, presence.status);
      } catch (err) {
        console.error('Failed to parse presence update:', err);
      }
    });
  }

  // Publishing Actions
  sendRoomMessage(roomId: string, content: string): void {
    const user = this.authService.currentUser();
    if (!this.stompClient || !this.isConnected() || !user) return;

    const payload = {
      roomId,
      senderId: user.id,
      senderUsername: user.username,
      content,
      type: 'TEXT'
    };

    this.stompClient.publish({
      destination: '/app/chat.send',
      body: JSON.stringify(payload)
    });
  }

  sendPrivateMessage(recipientId: string, recipientUsername: string, content: string): void {
    const user = this.authService.currentUser();
    if (!this.stompClient || !this.isConnected() || !user) return;

    const payload = {
      senderId: user.id,
      senderUsername: user.username,
      recipientId,
      recipientUsername,
      content,
      type: 'TEXT'
    };

    this.stompClient.publish({
      destination: '/app/chat.private',
      body: JSON.stringify(payload)
    });
  }

  sendTyping(roomId: string, isTyping: boolean): void {
    const user = this.authService.currentUser();
    if (!this.stompClient || !this.isConnected() || !user) return;

    const payload: TypingEvent = {
      roomId,
      userId: user.id,
      username: user.username,
      isTyping
    };

    this.stompClient.publish({
      destination: '/app/chat.typing',
      body: JSON.stringify(payload)
    });
  }
}
