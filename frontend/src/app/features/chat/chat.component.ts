import { Component, OnInit, OnDestroy, signal, computed, ViewChild, ElementRef, AfterViewChecked, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Subscription } from 'rxjs';
import { AuthService } from '../../core/auth.service';
import { ChatService } from '../../core/chat.service';
import { PresenceService } from '../../core/presence.service';
import { Room, CreateRoomRequest } from '../../models/room.model';
import { ChatMessage, PageResponse, TypingEvent } from '../../models/message.model';
import { User } from '../../models/user.model';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="chat-app-layout">
      <!-- SIDEBAR -->
      <aside class="chat-sidebar">
        <!-- User Profile Bar -->
        <div class="sidebar-header">
          <div class="user-profile-info">
            <div class="user-avatar gradient-avatar">
              {{ getUserInitial(currentUser()?.username) }}
              <span class="status-dot online"></span>
            </div>
            <div class="user-details">
              <span class="user-name">{{ currentUser()?.username }}</span>
              <span class="user-status-text">Connected</span>
            </div>
          </div>
          <button class="btn-icon" (click)="logout()" title="Logout">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
              <polyline points="16 17 21 12 16 7"></polyline>
              <line x1="21" y1="12" x2="9" y2="12"></line>
            </svg>
          </button>
        </div>

        <!-- Connection Status Banner -->
        <div class="connection-status-pill" [class.connected]="chatService.isConnected()">
          <span class="status-dot" [class.online]="chatService.isConnected()" [class.offline]="!chatService.isConnected()"></span>
          <span>{{ chatService.isConnected() ? 'STOMP & Redis Online' : 'Connecting to cluster...' }}</span>
        </div>

        <!-- Sidebar Navigation Tabs -->
        <div class="sidebar-tabs">
          <button 
            class="tab-link" 
            [class.active]="activeTab() === 'channels'" 
            (click)="activeTab.set('channels')">
            Channels
          </button>
          <button 
            class="tab-link" 
            [class.active]="activeTab() === 'direct'" 
            (click)="activeTab.set('direct')">
            Direct Messages
          </button>
          <button 
            class="tab-link" 
            [class.active]="activeTab() === 'explore'" 
            (click)="loadPublicRooms(); activeTab.set('explore')">
            Explore
          </button>
        </div>

        <!-- Action Buttons -->
        <div class="sidebar-actions">
          @if (activeTab() === 'channels') {
            <button class="btn btn-secondary btn-sm w-full" (click)="showCreateRoomModal.set(true)">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
              New Channel
            </button>
          } @else if (activeTab() === 'direct') {
            <button class="btn btn-secondary btn-sm w-full" (click)="showUserSearchModal.set(true)">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
              New Direct Message
            </button>
          }
        </div>

        <!-- Room / User List -->
        <div class="sidebar-list">
          @if (activeTab() === 'channels') {
            @for (room of myGroupRooms(); track room.id) {
              <div 
                class="list-item room-item" 
                [class.active]="currentRoom()?.id === room.id" 
                (click)="selectRoom(room)">
                <div class="item-icon-box">#</div>
                <div class="item-content">
                  <div class="item-title">{{ room.name }}</div>
                  <div class="item-subtitle">{{ room.lastMessage?.content || room.description || 'No messages yet' }}</div>
                </div>
                <div class="item-badge">{{ room.memberCount }}</div>
              </div>
            } @empty {
              <div class="empty-state">
                <p>No joined channels yet.</p>
                <button class="btn-text" (click)="activeTab.set('explore')">Browse public channels</button>
              </div>
            }
          } @else if (activeTab() === 'direct') {
            @for (room of myDirectRooms(); track room.id) {
              <div 
                class="list-item dm-item" 
                [class.active]="currentRoom()?.id === room.id" 
                (click)="selectRoom(room)">
                <div class="user-avatar small-avatar">
                  {{ getUserInitial(room.name) }}
                  @if (isOtherUserOnline(room)) {
                    <span class="status-dot online"></span>
                  }
                </div>
                <div class="item-content">
                  <div class="item-title">{{ room.name }}</div>
                  <div class="item-subtitle">{{ room.lastMessage?.content || 'Direct conversation' }}</div>
                </div>
              </div>
            } @empty {
              <div class="empty-state">
                <p>No active conversations.</p>
                <button class="btn-text" (click)="showUserSearchModal.set(true)">Find someone to chat with</button>
              </div>
            }
          } @else {
            <!-- Explore Public Rooms -->
            @for (room of publicRooms(); track room.id) {
              <div class="list-item explore-item">
                <div class="item-icon-box">🌐</div>
                <div class="item-content">
                  <div class="item-title">{{ room.name }}</div>
                  <div class="item-subtitle">{{ room.description || 'Public channel' }} • {{ room.memberCount }} members</div>
                </div>
                @if (isAlreadyMember(room.id)) {
                  <button class="btn btn-secondary btn-xs" (click)="selectRoom(room)">Open</button>
                } @else {
                  <button class="btn btn-primary btn-xs" (click)="joinRoom(room)">Join</button>
                }
              </div>
            } @empty {
              <div class="empty-state">
                <p>No public channels found.</p>
              </div>
            }
          }
        </div>
      </aside>

      <!-- MAIN CHAT AREA -->
      <main class="chat-main">
        @if (currentRoom()) {
          <!-- Chat Header -->
          <header class="chat-header">
            <div class="header-room-info">
              <div class="header-icon">
                @if (currentRoom()?.isGroup) {
                  <span>#</span>
                } @else {
                  <div class="user-avatar small-avatar">
                    {{ getUserInitial(currentRoom()?.name) }}
                    @if (isOtherUserOnline(currentRoom()!)) {
                      <span class="status-dot online"></span>
                    }
                  </div>
                }
              </div>
              <div>
                <h2>{{ currentRoom()?.name }}</h2>
                <span class="header-sub">
                  @if (currentRoom()?.isGroup) {
                    {{ currentRoom()?.description || 'Public Group Room' }} • {{ currentRoom()?.memberCount }} members
                  } @else {
                    {{ isOtherUserOnline(currentRoom()!) ? 'Online' : 'Offline' }} • 1:1 Direct Message
                  }
                </span>
              </div>
            </div>

            <div class="header-right-badges">
              <div class="cluster-badge">
                <span class="badge-dot"></span> Redis Fan-Out Active
              </div>
            </div>
          </header>

          <!-- Messages Scrollable Thread -->
          <div class="messages-container" #messagesContainer>
            @if (hasMoreMessages()) {
              <div class="load-more-wrapper">
                <button class="btn btn-secondary btn-sm" (click)="loadOlderMessages()" [disabled]="isLoadingMore()">
                  {{ isLoadingMore() ? 'Loading...' : '↑ Load older messages' }}
                </button>
              </div>
            }

            <div class="messages-list">
              @for (msg of messages(); track msg.id || msg.createdAt) {
                <div 
                  class="message-bubble-wrapper" 
                  [class.outgoing]="msg.senderId === currentUser()?.id" 
                  [class.incoming]="msg.senderId !== currentUser()?.id">
                  
                  @if (msg.senderId !== currentUser()?.id) {
                    <div class="msg-avatar">
                      {{ getUserInitial(msg.senderUsername) }}
                    </div>
                  }

                  <div class="message-body">
                    @if (msg.senderId !== currentUser()?.id && currentRoom()?.isGroup) {
                      <span class="msg-sender-name">{{ msg.senderUsername }}</span>
                    }
                    <div class="msg-bubble">
                      <p class="msg-text">{{ msg.content }}</p>
                      <span class="msg-timestamp">{{ formatTime(msg.createdAt) }}</span>
                    </div>
                  </div>
                </div>
              } @empty {
                <div class="empty-messages-placeholder">
                  <div class="placeholder-icon">💬</div>
                  <h3>Welcome to {{ currentRoom()?.name }}!</h3>
                  <p>Send the first message to start the conversation.</p>
                </div>
              }
            </div>

            <!-- Typing Indicator Bubble -->
            @if (currentTypingUser()) {
              <div class="typing-indicator-bar">
                <div class="typing-dots">
                  <span></span><span></span><span></span>
                </div>
                <span><strong>{{ currentTypingUser() }}</strong> is typing...</span>
              </div>
            }
          </div>

          <!-- Message Composer Input -->
          <footer class="chat-input-area">
            <form (ngSubmit)="sendMessage()" class="composer-form">
              <input 
                type="text" 
                class="form-input composer-input" 
                [(ngModel)]="messageText" 
                name="messageText" 
                (ngModelChange)="onTypingChange()" 
                placeholder="Type a message to {{ currentRoom()?.name }}..." 
                autocomplete="off" />

              <button type="submit" class="btn btn-primary send-btn" [disabled]="!messageText.trim()">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                  <line x1="22" y1="2" x2="11" y2="13"></line>
                  <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                </svg>
                <span>Send</span>
              </button>
            </form>
          </footer>
        } @else {
          <!-- Empty State: No room selected -->
          <div class="no-room-selected">
            <div class="no-room-card glass-panel">
              <div class="logo-badge large">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                </svg>
              </div>
              <h2>Select a channel or conversation</h2>
              <p>Join an active channel on the sidebar or start a 1:1 direct message.</p>
              <div class="quick-action-buttons">
                <button class="btn btn-primary" (click)="showCreateRoomModal.set(true)">Create Channel</button>
                <button class="btn btn-secondary" (click)="activeTab.set('explore'); loadPublicRooms()">Browse Public Rooms</button>
              </div>
            </div>
          </div>
        }
      </main>
    </div>

    <!-- MODAL: CREATE CHANNEL -->
    @if (showCreateRoomModal()) {
      <div class="modal-backdrop" (click)="showCreateRoomModal.set(false)">
        <div class="modal-card glass-panel" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3>Create New Channel</h3>
            <button class="btn-icon" (click)="showCreateRoomModal.set(false)">✕</button>
          </div>
          <form (ngSubmit)="createRoom()">
            <div class="form-group">
              <label class="form-label">Channel Name</label>
              <input type="text" class="form-input" [(ngModel)]="newRoomData.name" name="name" placeholder="e.g. backend-engineering" required />
            </div>
            <div class="form-group">
              <label class="form-label">Description (Optional)</label>
              <input type="text" class="form-input" [(ngModel)]="newRoomData.description" name="description" placeholder="What's this channel about?" />
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" (click)="showCreateRoomModal.set(false)">Cancel</button>
              <button type="submit" class="btn btn-primary" [disabled]="!newRoomData.name.trim()">Create Channel</button>
            </div>
          </form>
        </div>
      </div>
    }

    <!-- MODAL: START DIRECT MESSAGE -->
    @if (showUserSearchModal()) {
      <div class="modal-backdrop" (click)="showUserSearchModal.set(false)">
        <div class="modal-card glass-panel" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3>Start Direct Conversation</h3>
            <button class="btn-icon" (click)="showUserSearchModal.set(false)">✕</button>
          </div>
          <div class="form-group">
            <input 
              type="text" 
              class="form-input" 
              [(ngModel)]="userSearchQuery" 
              (ngModelChange)="searchUsers()" 
              placeholder="Search user by username..." 
              autofocus />
          </div>
          <div class="user-search-results">
            @for (user of searchResults(); track user.id) {
              <div class="user-search-item" (click)="startDirectChat(user)">
                <div class="user-avatar small-avatar">
                  {{ getUserInitial(user.username) }}
                  @if (presenceService.isUserOnline(user.id)) {
                    <span class="status-dot online"></span>
                  }
                </div>
                <div class="user-search-info">
                  <span class="user-search-name">{{ user.username }}</span>
                  <span class="user-search-email">{{ user.email }}</span>
                </div>
                <button class="btn btn-primary btn-xs">Message</button>
              </div>
            } @empty {
              <div class="empty-state">
                <p>No matching users found.</p>
              </div>
            }
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .chat-app-layout {
      display: flex;
      height: 100vh;
      width: 100vw;
      background-color: var(--bg-primary);
      overflow: hidden;
    }

    /* SIDEBAR */
    .chat-sidebar {
      width: 320px;
      min-width: 280px;
      max-width: 360px;
      background-color: var(--bg-secondary);
      border-right: 1px solid var(--border-light);
      display: flex;
      flex-direction: column;
      height: 100%;
    }

    .sidebar-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 16px;
      border-bottom: 1px solid var(--border-light);
    }

    .user-profile-info {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .user-avatar {
      position: relative;
      width: 40px;
      height: 40px;
      border-radius: var(--radius-md);
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      color: white;
      font-size: 1rem;
      background: var(--accent-gradient);
    }

    .user-avatar.small-avatar {
      width: 34px;
      height: 34px;
      font-size: 0.85rem;
      border-radius: 50%;
    }

    .user-avatar .status-dot {
      position: absolute;
      bottom: -2px;
      right: -2px;
      border: 2px solid var(--bg-secondary);
    }

    .user-details {
      display: flex;
      flex-direction: column;
    }

    .user-name {
      font-weight: 700;
      font-size: 0.95rem;
      color: var(--text-primary);
    }

    .user-status-text {
      font-size: 0.75rem;
      color: var(--status-online);
    }

    .connection-status-pill {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 6px 16px;
      background: rgba(0, 0, 0, 0.25);
      font-size: 0.76rem;
      color: var(--text-muted);
      border-bottom: 1px solid var(--border-light);
    }

    .connection-status-pill.connected {
      color: var(--text-secondary);
    }

    .sidebar-tabs {
      display: flex;
      padding: 8px 12px 0 12px;
      gap: 6px;
      border-bottom: 1px solid var(--border-light);
    }

    .tab-link {
      flex: 1;
      padding: 8px 4px;
      background: transparent;
      border: none;
      color: var(--text-muted);
      font-size: 0.8rem;
      font-weight: 600;
      cursor: pointer;
      border-bottom: 2px solid transparent;
      transition: all 0.2s;
    }

    .tab-link.active {
      color: var(--text-primary);
      border-bottom-color: var(--accent-primary);
    }

    .sidebar-actions {
      padding: 10px 12px;
    }

    .sidebar-list {
      flex: 1;
      overflow-y: auto;
      padding: 6px 12px;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .list-item {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 10px 12px;
      border-radius: var(--radius-md);
      cursor: pointer;
      transition: all 0.15s ease-in-out;
      border: 1px solid transparent;
    }

    .list-item:hover {
      background: rgba(255, 255, 255, 0.04);
    }

    .list-item.active {
      background: rgba(99, 102, 241, 0.15);
      border-color: rgba(99, 102, 241, 0.35);
    }

    .item-icon-box {
      width: 32px;
      height: 32px;
      border-radius: var(--radius-sm);
      background: var(--bg-tertiary);
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      color: var(--text-secondary);
      font-size: 0.95rem;
    }

    .item-content {
      flex: 1;
      min-width: 0;
    }

    .item-title {
      font-weight: 600;
      font-size: 0.88rem;
      color: var(--text-primary);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .item-subtitle {
      font-size: 0.75rem;
      color: var(--text-muted);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .item-badge {
      font-size: 0.72rem;
      padding: 2px 6px;
      background: var(--bg-tertiary);
      border-radius: var(--radius-full);
      color: var(--text-muted);
    }

    .btn-xs {
      padding: 4px 8px;
      font-size: 0.75rem;
      border-radius: var(--radius-sm);
    }

    .btn-sm {
      padding: 8px 12px;
      font-size: 0.82rem;
    }

    .w-full {
      width: 100%;
    }

    .btn-text {
      background: none;
      border: none;
      color: var(--accent-primary);
      cursor: pointer;
      font-size: 0.8rem;
      margin-top: 6px;
      text-decoration: underline;
    }

    .empty-state {
      padding: 24px 12px;
      text-align: center;
      color: var(--text-muted);
      font-size: 0.85rem;
    }

    /* CHAT MAIN */
    .chat-main {
      flex: 1;
      display: flex;
      flex-direction: column;
      height: 100%;
      background-color: var(--bg-primary);
      position: relative;
    }

    .chat-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 16px 24px;
      border-bottom: 1px solid var(--border-light);
      background: var(--bg-secondary);
      backdrop-filter: blur(10px);
    }

    .header-room-info {
      display: flex;
      align-items: center;
      gap: 14px;
    }

    .header-icon {
      font-size: 1.4rem;
      font-weight: 700;
      color: var(--accent-primary);
    }

    .header-room-info h2 {
      font-size: 1.15rem;
      font-weight: 700;
    }

    .header-sub {
      font-size: 0.8rem;
      color: var(--text-muted);
    }

    .cluster-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 4px 10px;
      background: rgba(16, 185, 129, 0.12);
      border: 1px solid rgba(16, 185, 129, 0.25);
      border-radius: var(--radius-full);
      font-size: 0.72rem;
      font-weight: 600;
      color: #34d399;
    }

    .badge-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: #10b981;
    }

    /* MESSAGES */
    .messages-container {
      flex: 1;
      overflow-y: auto;
      padding: 20px 24px;
      display: flex;
      flex-direction: column;
    }

    .load-more-wrapper {
      text-align: center;
      margin-bottom: 16px;
    }

    .messages-list {
      display: flex;
      flex-direction: column;
      gap: 16px;
      margin-top: auto;
    }

    .message-bubble-wrapper {
      display: flex;
      gap: 10px;
      max-width: 75%;
      animation: fadeIn 0.2s ease-out;
    }

    .message-bubble-wrapper.outgoing {
      align-self: flex-end;
      flex-direction: row-reverse;
    }

    .message-bubble-wrapper.incoming {
      align-self: flex-start;
    }

    .msg-avatar {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: var(--bg-tertiary);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.8rem;
      font-weight: 700;
      color: var(--text-primary);
      flex-shrink: 0;
    }

    .message-body {
      display: flex;
      flex-direction: column;
    }

    .msg-sender-name {
      font-size: 0.75rem;
      font-weight: 600;
      color: var(--text-muted);
      margin-bottom: 4px;
      margin-left: 4px;
    }

    .msg-bubble {
      padding: 10px 14px;
      border-radius: var(--radius-md);
      position: relative;
      word-break: break-word;
    }

    .message-bubble-wrapper.outgoing .msg-bubble {
      background: var(--accent-gradient);
      color: white;
      border-bottom-right-radius: 2px;
      box-shadow: 0 4px 12px rgba(99, 102, 241, 0.35);
    }

    .message-bubble-wrapper.incoming .msg-bubble {
      background: var(--bg-tertiary);
      color: var(--text-primary);
      border-bottom-left-radius: 2px;
      border: 1px solid var(--border-light);
    }

    .msg-text {
      font-size: 0.92rem;
      line-height: 1.45;
    }

    .msg-timestamp {
      display: block;
      font-size: 0.68rem;
      margin-top: 4px;
      opacity: 0.7;
      text-align: right;
    }

    .empty-messages-placeholder {
      text-align: center;
      padding: 60px 20px;
      color: var(--text-muted);
    }

    .placeholder-icon {
      font-size: 2.5rem;
      margin-bottom: 12px;
    }

    .typing-indicator-bar {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 0.78rem;
      color: var(--text-muted);
      margin-top: 10px;
      padding: 6px 12px;
      border-radius: var(--radius-full);
      background: rgba(0, 0, 0, 0.2);
      width: fit-content;
    }

    .typing-dots {
      display: flex;
      gap: 3px;
    }

    .typing-dots span {
      width: 5px;
      height: 5px;
      background: var(--accent-primary);
      border-radius: 50%;
      animation: bounce 1.4s infinite ease-in-out both;
    }
    .typing-dots span:nth-child(1) { animation-delay: -0.32s; }
    .typing-dots span:nth-child(2) { animation-delay: -0.16s; }

    /* COMPOSER */
    .chat-input-area {
      padding: 16px 24px;
      background: var(--bg-secondary);
      border-top: 1px solid var(--border-light);
    }

    .composer-form {
      display: flex;
      gap: 12px;
      align-items: center;
    }

    .composer-input {
      flex: 1;
      padding: 14px 18px;
      border-radius: var(--radius-lg);
    }

    .send-btn {
      padding: 12px 20px;
      border-radius: var(--radius-lg);
      flex-shrink: 0;
    }

    /* EMPTY CHAT SCREEN */
    .no-room-selected {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 24px;
    }

    .no-room-card {
      max-width: 440px;
      text-align: center;
      padding: 40px 32px;
      border-radius: var(--radius-lg);
    }

    .logo-badge.large {
      width: 72px;
      height: 72px;
      margin: 0 auto 20px auto;
    }

    .quick-action-buttons {
      display: flex;
      gap: 12px;
      justify-content: center;
      margin-top: 24px;
    }

    /* MODAL */
    .modal-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.7);
      backdrop-filter: blur(8px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      padding: 20px;
    }

    .modal-card {
      width: 100%;
      max-width: 460px;
      padding: 28px;
      border-radius: var(--radius-lg);
      box-shadow: var(--shadow-lg);
    }

    .modal-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 20px;
    }

    .modal-footer {
      display: flex;
      justify-content: flex-end;
      gap: 10px;
      margin-top: 20px;
    }

    .user-search-results {
      max-height: 280px;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 6px;
      margin-top: 12px;
    }

    .user-search-item {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 8px 12px;
      border-radius: var(--radius-md);
      cursor: pointer;
      background: var(--bg-tertiary);
    }

    .user-search-item:hover {
      background: rgba(255, 255, 255, 0.08);
    }

    .user-search-info {
      flex: 1;
      display: flex;
      flex-direction: column;
    }

    .user-search-name {
      font-weight: 600;
      font-size: 0.88rem;
    }

    .user-search-email {
      font-size: 0.75rem;
      color: var(--text-muted);
    }
  `]
})
export class ChatComponent implements OnInit, OnDestroy, AfterViewChecked {
  @ViewChild('messagesContainer') private messagesContainer?: ElementRef;

  public authService = inject(AuthService);
  public chatService = inject(ChatService);
  public presenceService = inject(PresenceService);
  private http = inject(HttpClient);

  currentUser = this.authService.currentUser;
  activeTab = signal<'channels' | 'direct' | 'explore'>('channels');

  myRooms = signal<Room[]>([]);
  publicRooms = signal<Room[]>([]);
  currentRoom = signal<Room | null>(null);
  messages = signal<ChatMessage[]>([]);

  // Pagination state
  currentPage = signal<number>(0);
  hasMoreMessages = signal<boolean>(false);
  isLoadingMore = signal<boolean>(false);

  // Modals & Search
  showCreateRoomModal = signal<boolean>(false);
  showUserSearchModal = signal<boolean>(false);
  newRoomData: CreateRoomRequest = { name: '', description: '', isGroup: true };
  userSearchQuery = '';
  searchResults = signal<User[]>([]);

  // Composer
  messageText = '';
  private typingTimeout?: any;
  currentTypingUser = signal<string | null>(null);
  private typingResetTimeout?: any;

  private subscriptions: Subscription[] = [];
  private shouldScrollToBottom = false;

  myGroupRooms = computed(() => this.myRooms().filter(r => r.isGroup));
  myDirectRooms = computed(() => this.myRooms().filter(r => !r.isGroup));

  constructor() {}

  ngOnInit(): void {
    // 1. Establish STOMP connection
    this.chatService.connect();

    // 2. Fetch User's joined rooms
    this.loadUserRooms();

    // 3. Listen to incoming room messages
    this.subscriptions.push(
      this.chatService.roomMessages$.subscribe(msg => {
        if (this.currentRoom() && this.currentRoom()?.id === msg.roomId) {
          this.messages.update(list => [...list, msg]);
          this.shouldScrollToBottom = true;
        }
        this.updateLastMessageInRoomList(msg);
      })
    );

    // 4. Listen to incoming private DMs
    this.subscriptions.push(
      this.chatService.privateMessages$.subscribe(msg => {
        if (this.currentRoom() && this.currentRoom()?.id === msg.roomId) {
          this.messages.update(list => [...list, msg]);
          this.shouldScrollToBottom = true;
        }
        this.loadUserRooms();
      })
    );

    // 5. Listen to ephemeral typing events
    this.subscriptions.push(
      this.chatService.typingEvents$.subscribe(event => {
        if (this.currentRoom() && this.currentRoom()?.id === event.roomId) {
          if (event.userId !== this.currentUser()?.id && event.isTyping) {
            this.currentTypingUser.set(event.username);
            clearTimeout(this.typingResetTimeout);
            this.typingResetTimeout = setTimeout(() => {
              this.currentTypingUser.set(null);
            }, 3000);
          } else {
            this.currentTypingUser.set(null);
          }
        }
      })
    );
  }

  ngAfterViewChecked(): void {
    if (this.shouldScrollToBottom) {
      this.scrollToBottom();
      this.shouldScrollToBottom = false;
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(s => s.unsubscribe());
    this.chatService.disconnect();
  }

  loadUserRooms(): void {
    this.http.get<Room[]>('/api/rooms').subscribe({
      next: (rooms) => {
        this.myRooms.set(rooms);
        // Batch check presence for members in direct rooms
        const memberIds = rooms.flatMap(r => r.members ? r.members.map(m => m.id) : []);
        if (memberIds.length > 0) {
          this.presenceService.fetchBatchPresence(memberIds).subscribe(presenceMap => {
            Object.entries(presenceMap).forEach(([id, status]) => {
              this.presenceService.updatePresenceStatus(id, status);
            });
          });
        }
      },
      error: (err) => console.error('Failed to load user rooms', err)
    });
  }

  loadPublicRooms(): void {
    this.http.get<Room[]>('/api/rooms/public').subscribe({
      next: (rooms) => this.publicRooms.set(rooms),
      error: (err) => console.error('Failed to load public rooms', err)
    });
  }

  selectRoom(room: Room): void {
    // Unsubscribe from previous room
    if (this.currentRoom()) {
      this.chatService.unsubscribeFromRoom(this.currentRoom()!.id);
    }

    this.currentRoom.set(room);
    this.messages.set([]);
    this.currentPage.set(0);
    this.hasMoreMessages.set(false);

    // Subscribe to STOMP destination /topic/room.{roomId}
    this.chatService.subscribeToRoom(room.id);

    // Load initial paginated history from PostgreSQL via REST
    this.loadMessages(room.id, 0);
  }

  loadMessages(roomId: string, page: number): void {
    this.http.get<PageResponse<ChatMessage>>(`/api/rooms/${roomId}/messages?page=${page}&size=40`).subscribe({
      next: (res) => {
        // Backend returns descending by createdAt, we reverse for ascending chat view
        const history = [...res.content].reverse();
        if (page === 0) {
          this.messages.set(history);
          this.shouldScrollToBottom = true;
        } else {
          this.messages.update(prev => [...history, ...prev]);
        }
        this.hasMoreMessages.set(res.hasNext);
        this.currentPage.set(page);
        this.isLoadingMore.set(false);
      },
      error: (err) => {
        console.error('Failed to load messages', err);
        this.isLoadingMore.set(false);
      }
    });
  }

  loadOlderMessages(): void {
    if (!this.currentRoom() || this.isLoadingMore()) return;
    this.isLoadingMore.set(true);
    this.loadMessages(this.currentRoom()!.id, this.currentPage() + 1);
  }

  sendMessage(): void {
    if (!this.messageText.trim() || !this.currentRoom()) return;

    const content = this.messageText.trim();
    this.messageText = '';

    // Cancel typing
    this.chatService.sendTyping(this.currentRoom()!.id, false);

    if (this.currentRoom()!.isGroup) {
      this.chatService.sendRoomMessage(this.currentRoom()!.id, content);
    } else {
      // Find other member
      const otherUser = this.currentRoom()!.members?.find(m => m.id !== this.currentUser()?.id);
      if (otherUser) {
        this.chatService.sendPrivateMessage(otherUser.id, otherUser.username, content);
      } else {
        this.chatService.sendRoomMessage(this.currentRoom()!.id, content);
      }
    }
  }

  onTypingChange(): void {
    if (!this.currentRoom()) return;

    this.chatService.sendTyping(this.currentRoom()!.id, true);
    clearTimeout(this.typingTimeout);
    this.typingTimeout = setTimeout(() => {
      if (this.currentRoom()) {
        this.chatService.sendTyping(this.currentRoom()!.id, false);
      }
    }, 2500);
  }

  createRoom(): void {
    if (!this.newRoomData.name.trim()) return;

    this.http.post<Room>('/api/rooms', this.newRoomData).subscribe({
      next: (created) => {
        this.showCreateRoomModal.set(false);
        this.newRoomData = { name: '', description: '', isGroup: true };
        this.loadUserRooms();
        this.selectRoom(created);
      },
      error: (err) => console.error('Failed to create room', err)
    });
  }

  joinRoom(room: Room): void {
    this.http.post<Room>(`/api/rooms/${room.id}/join`, {}).subscribe({
      next: (joined) => {
        this.loadUserRooms();
        this.selectRoom(joined);
        this.activeTab.set('channels');
      },
      error: (err) => console.error('Failed to join room', err)
    });
  }

  searchUsers(): void {
    if (!this.userSearchQuery.trim()) {
      this.searchResults.set([]);
      return;
    }

    this.http.get<User[]>(`/api/users?q=${encodeURIComponent(this.userSearchQuery)}`).subscribe({
      next: (users) => this.searchResults.set(users),
      error: (err) => console.error('Search failed', err)
    });
  }

  startDirectChat(user: User): void {
    this.http.post<Room>(`/api/rooms/direct/${user.id}`, {}).subscribe({
      next: (room) => {
        this.showUserSearchModal.set(false);
        this.userSearchQuery = '';
        this.searchResults.set([]);
        this.loadUserRooms();
        this.selectRoom(room);
        this.activeTab.set('direct');
      },
      error: (err) => console.error('Failed to initiate direct chat', err)
    });
  }

  isAlreadyMember(roomId: string): boolean {
    return this.myRooms().some(r => r.id === roomId);
  }

  isOtherUserOnline(room: Room): boolean {
    const otherUser = room.members?.find(m => m.id !== this.currentUser()?.id);
    return otherUser ? this.presenceService.isUserOnline(otherUser.id) : false;
  }

  private updateLastMessageInRoomList(msg: ChatMessage): void {
    this.myRooms.update(rooms =>
      rooms.map(r => r.id === msg.roomId ? { ...r, lastMessage: msg } : r)
    );
  }

  private scrollToBottom(): void {
    try {
      if (this.messagesContainer) {
        this.messagesContainer.nativeElement.scrollTop = this.messagesContainer.nativeElement.scrollHeight;
      }
    } catch {}
  }

  getUserInitial(name?: string): string {
    return name ? name.charAt(0).toUpperCase() : '?';
  }

  formatTime(isoString?: string): string {
    if (!isoString) return '';
    const date = new Date(isoString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  logout(): void {
    this.authService.logout();
  }
}
