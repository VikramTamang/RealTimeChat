import { 
  Component, 
  OnInit, 
  OnDestroy, 
  signal, 
  computed, 
  ViewChild, 
  ElementRef, 
  AfterViewChecked, 
  inject
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router, RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { AuthService } from '../../core/auth.service';
import { ChatService } from '../../core/chat.service';
import { PresenceService } from '../../core/presence.service';
import { Room, CreateRoomRequest } from '../../models/room.model';
import { ChatMessage, PageResponse, TypingEvent } from '../../models/message.model';
import { User } from '../../models/user.model';

interface Toast {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="chat-workspace-layout" [class.mobile-view-chat]="isMobile() && currentRoom()">
      <!-- 1. WORKSPACE RAIL -->
      <nav class="workspace-rail">
        <div class="rail-top">
          <a routerLink="/" class="rail-brand-logo" title="PulseChat Home">
            <div class="brand-icon">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"></path>
              </svg>
            </div>
          </a>

          <div class="rail-divider"></div>

          <button 
            class="rail-btn" 
            [class.active]="activeTab() === 'channels'" 
            (click)="activeTab.set('channels')" 
            title="Channels">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="4" y1="9" x2="20" y2="9"></line>
              <line x1="4" y1="15" x2="20" y2="15"></line>
              <line x1="10" y1="3" x2="8" y2="21"></line>
              <line x1="16" y1="3" x2="14" y2="21"></line>
            </svg>
            <span class="rail-tooltip">Channels</span>
            @if (myGroupRooms().length > 0) {
              <span class="rail-counter">{{ myGroupRooms().length }}</span>
            }
          </button>

          <button 
            class="rail-btn" 
            [class.active]="activeTab() === 'direct'" 
            (click)="activeTab.set('direct')" 
            title="Direct Messages">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
            </svg>
            <span class="rail-tooltip">Direct Messages</span>
            @if (myDirectRooms().length > 0) {
              <span class="rail-counter">{{ myDirectRooms().length }}</span>
            }
          </button>

          <button 
            class="rail-btn" 
            [class.active]="activeTab() === 'explore'" 
            (click)="loadPublicRooms(); activeTab.set('explore')" 
            title="Explore Rooms">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"></circle>
              <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"></polygon>
            </svg>
            <span class="rail-tooltip">Explore Rooms</span>
          </button>
        </div>

        <div class="rail-bottom">
          <button class="rail-profile-btn" (click)="showProfileModal.set(true)" title="My Profile & Settings">
            <div class="avatar avatar-sm avatar-gradient-1">
              {{ getUserInitial(currentUser()?.username) }}
              <span class="status-dot online"></span>
            </div>
            <span class="rail-tooltip">{{ currentUser()?.username }}</span>
          </button>

          <button class="rail-btn logout-btn" (click)="logout()" title="Logout">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
              <polyline points="16 17 21 12 16 7"></polyline>
              <line x1="21" y1="12" x2="9" y2="12"></line>
            </svg>
            <span class="rail-tooltip">Logout</span>
          </button>
        </div>
      </nav>

      <!-- 2. CONVERSATIONS SIDEBAR -->
      <aside class="conversations-sidebar">
        <div class="sidebar-header">
          <div class="sidebar-title-row">
            <h2>
              @if (activeTab() === 'channels') { Channels }
              @else if (activeTab() === 'direct') { Direct Messages }
              @else { Explore Rooms }
            </h2>

            @if (activeTab() === 'channels') {
              <button class="btn-icon btn-sm action-add-btn" (click)="showCreateRoomModal.set(true)" title="Create Channel">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                  <line x1="12" y1="5" x2="12" y2="19"></line>
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
              </button>
            } @else if (activeTab() === 'direct') {
              <button class="btn-icon btn-sm action-add-btn" (click)="showUserSearchModal.set(true)" title="New Direct Message">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                  <line x1="12" y1="5" x2="12" y2="19"></line>
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
              </button>
            }
          </div>

          <div class="sidebar-search-box">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            <input 
              type="text" 
              class="sidebar-search-input" 
              [(ngModel)]="sidebarSearchQuery" 
              placeholder="Search conversations..." />
            @if (sidebarSearchQuery) {
              <button class="clear-search-btn" (click)="sidebarSearchQuery = ''">✕</button>
            }
          </div>

          <div class="connection-status-pill" [class.connected]="chatService.isConnected()">
            <span class="status-dot" [class.online]="chatService.isConnected()" [class.offline]="!chatService.isConnected()"></span>
            <span class="status-label">{{ chatService.isConnected() ? 'STOMP Cluster Connected' : 'Connecting...' }}</span>
          </div>
        </div>

        <div class="conversations-scroll-list">
          <!-- CHANNELS TAB -->
          @if (activeTab() === 'channels') {
            @for (room of filteredGroupRooms(); track room.id) {
              <div 
                class="conversation-row channel-row" 
                [class.active]="currentRoom()?.id === room.id" 
                (click)="selectRoom(room)">
                <div class="channel-icon-tag">#</div>
                <div class="row-main-content">
                  <div class="row-title-row">
                    <span class="row-name">{{ room.name }}</span>
                    <span class="row-badge">{{ room.memberCount }}</span>
                  </div>
                  <p class="row-last-msg">
                    @if (room.lastMessage) {
                      <span class="msg-sender">{{ room.lastMessage.senderUsername }}:</span>
                      {{ room.lastMessage.content }}
                    } @else {
                      {{ room.description || 'No messages yet' }}
                    }
                  </p>
                </div>
              </div>
            } @empty {
              <div class="empty-list-state">
                <div class="empty-icon">#</div>
                <p>No channels found.</p>
                <button class="btn btn-secondary btn-xs" (click)="showCreateRoomModal.set(true)">Create Channel</button>
              </div>
            }
          }

          <!-- DIRECT MESSAGES TAB -->
          @else if (activeTab() === 'direct') {
            @for (room of filteredDirectRooms(); track room.id) {
              <div 
                class="conversation-row dm-row" 
                [class.active]="currentRoom()?.id === room.id" 
                (click)="selectRoom(room)">
                <div class="avatar avatar-sm avatar-gradient-2">
                  {{ getUserInitial(room.name) }}
                  @if (isOtherUserOnline(room)) {
                    <span class="status-dot online"></span>
                  } @else {
                    <span class="status-dot offline"></span>
                  }
                </div>
                <div class="row-main-content">
                  <div class="row-title-row">
                    <span class="row-name">{{ room.name }}</span>
                    @if (room.lastMessage) {
                      <span class="row-time">{{ formatTime(room.lastMessage.createdAt) }}</span>
                    }
                  </div>
                  <p class="row-last-msg">
                    {{ room.lastMessage?.content || 'Direct conversation' }}
                  </p>
                </div>
              </div>
            } @empty {
              <div class="empty-list-state">
                <div class="empty-icon">💬</div>
                <p>No direct conversations.</p>
                <button class="btn btn-secondary btn-xs" (click)="showUserSearchModal.set(true)">Find Someone</button>
              </div>
            }
          }

          <!-- EXPLORE PUBLIC ROOMS TAB -->
          @else {
            @for (room of filteredPublicRooms(); track room.id) {
              <div class="conversation-row explore-row">
                <div class="channel-icon-tag explore-tag">🌐</div>
                <div class="row-main-content">
                  <div class="row-title-row">
                    <span class="row-name">{{ room.name }}</span>
                    <span class="row-badge">{{ room.memberCount }} members</span>
                  </div>
                  <p class="row-last-msg">{{ room.description || 'Public channel' }}</p>
                </div>
                <div class="explore-action">
                  @if (isAlreadyMember(room.id)) {
                    <button class="btn btn-secondary btn-xs" (click)="selectRoom(room); activeTab.set('channels')">Open</button>
                  } @else {
                    <button class="btn btn-primary btn-xs" (click)="joinRoom(room)">Join</button>
                  }
                </div>
              </div>
            } @empty {
              <div class="empty-list-state">
                <div class="empty-icon">🌐</div>
                <p>No public channels found.</p>
              </div>
            }
          }
        </div>
      </aside>

      <!-- 3. MAIN CHAT AREA -->
      <main class="chat-main-area">
        @if (currentRoom()) {
          <!-- Chat Header -->
          <header class="chat-header glass-panel">
            <div class="header-left">
              <button class="btn-icon mobile-back-btn" (click)="currentRoom.set(null)" title="Back to list">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                  <line x1="19" y1="12" x2="5" y2="12"></line>
                  <polyline points="12 19 5 12 12 5"></polyline>
                </svg>
              </button>

              <div class="header-avatar-box">
                @if (currentRoom()?.isGroup) {
                  <div class="channel-header-icon">#</div>
                } @else {
                  <div class="avatar avatar-sm avatar-gradient-3">
                    {{ getUserInitial(currentRoom()?.name) }}
                    @if (isOtherUserOnline(currentRoom()!)) {
                      <span class="status-dot online"></span>
                    } @else {
                      <span class="status-dot offline"></span>
                    }
                  </div>
                }
              </div>

              <div class="header-details">
                <div class="header-title-row">
                  <h2>{{ currentRoom()?.name }}</h2>
                  @if (currentRoom()?.isGroup) {
                    <span class="badge badge-brand">{{ currentRoom()?.memberCount }} members</span>
                  } @else {
                    <span class="badge" [class.badge-emerald]="isOtherUserOnline(currentRoom()!)" [class.badge-brand]="!isOtherUserOnline(currentRoom()!)">
                      {{ isOtherUserOnline(currentRoom()!) ? 'Online' : 'Offline' }}
                    </span>
                  }
                </div>
                <p class="header-subtitle">
                  @if (currentRoom()?.isGroup) {
                    {{ currentRoom()?.description || 'Public Channel • Real-time STOMP topic' }}
                  } @else {
                    Direct 1-on-1 messaging queue
                  }
                </p>
              </div>
            </div>

            <div class="header-right">
              <button 
                class="btn-icon" 
                [class.active-btn]="showDetailsDrawer()" 
                (click)="toggleDetailsDrawer()" 
                title="Room Details & Members">
                <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                  <circle cx="9" cy="7" r="4"></circle>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                </svg>
              </button>
            </div>
          </header>

          <!-- Messages Scrollable Thread -->
          <div class="messages-container" #messagesContainer (scroll)="onMessagesScroll($event)">
            @if (hasMoreMessages()) {
              <div class="load-older-banner">
                <button class="btn btn-secondary btn-xs" (click)="loadOlderMessages()" [disabled]="isLoadingMore()">
                  @if (isLoadingMore()) {
                    <span class="spinner-xs"></span> Loading history...
                  } @else {
                    <span>↑ Load older messages</span>
                  }
                </button>
              </div>
            }

            <div class="messages-stream">
              @for (msg of messages(); track msg.id || msg.createdAt) {
                @if (msg.type === 'JOIN' || msg.type === 'LEAVE') {
                  <div class="system-message-row">
                    <div class="system-message-pill">
                      <span>{{ msg.content }}</span>
                      <span class="system-time">{{ formatTime(msg.createdAt) }}</span>
                    </div>
                  </div>
                } @else {
                  <div 
                    class="message-row" 
                    [class.outgoing]="msg.senderId === currentUser()?.id" 
                    [class.incoming]="msg.senderId !== currentUser()?.id">
                    
                    @if (msg.senderId !== currentUser()?.id) {
                      <div class="avatar avatar-sm avatar-gradient-4">
                        {{ getUserInitial(msg.senderUsername) }}
                      </div>
                    }

                    <div class="message-content-group">
                      @if (msg.senderId !== currentUser()?.id && currentRoom()?.isGroup) {
                        <span class="message-sender-label">{{ msg.senderUsername }}</span>
                      }
                      
                      <div class="message-bubble">
                        <p class="message-text">{{ msg.content }}</p>
                        <span class="message-meta-time">{{ formatTime(msg.createdAt) }}</span>
                      </div>
                    </div>
                  </div>
                }
              } @empty {
                <div class="empty-conversation-state">
                  <div class="empty-conversation-icon">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                    </svg>
                  </div>
                  <h3>Welcome to {{ currentRoom()?.name }}</h3>
                  <p>This is the start of your real-time conversation. Send a message below to get started!</p>
                </div>
              }
            </div>

            @if (currentTypingUser()) {
              <div class="live-typing-bar">
                <div class="typing-dots">
                  <span></span><span></span><span></span>
                </div>
                <span><strong>{{ currentTypingUser() }}</strong> is typing...</span>
              </div>
            }

            @if (showScrollBottomBtn()) {
              <button class="scroll-bottom-fab" (click)="scrollToBottom(true)" title="Jump to latest messages">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                  <line x1="12" y1="5" x2="12" y2="19"></line>
                  <polyline points="19 12 12 19 5 12"></polyline>
                </svg>
              </button>
            }
          </div>

          <!-- Message Composer Bar -->
          <footer class="composer-container glass-panel">
            <div class="composer-toolbar">
              <div class="quick-emojis">
                <button type="button" class="emoji-chip" (click)="appendEmoji('👍')">👍</button>
                <button type="button" class="emoji-chip" (click)="appendEmoji('🔥')">🔥</button>
                <button type="button" class="emoji-chip" (click)="appendEmoji('🎉')">🎉</button>
                <button type="button" class="emoji-chip" (click)="appendEmoji('❤️')">❤️</button>
                <button type="button" class="emoji-chip" (click)="appendEmoji('⚡')">⚡</button>
                <button type="button" class="emoji-chip" (click)="appendEmoji('🚀')">🚀</button>
              </div>
              <span class="composer-hint">Press <strong>Enter</strong> to send • <strong>Shift+Enter</strong> for newline</span>
            </div>

            <form (ngSubmit)="sendMessage()" class="composer-form">
              <textarea 
                class="composer-textarea" 
                [(ngModel)]="messageText" 
                name="messageText" 
                (keydown)="onComposerKeyDown($event)"
                (ngModelChange)="onTypingChange()" 
                [placeholder]="'Message ' + (currentRoom()?.isGroup ? '#' : '@') + (currentRoom()?.name || '') + '...'" 
                rows="1"
                #composerTextarea></textarea>

              <button 
                type="submit" 
                class="btn btn-primary send-action-btn" 
                [disabled]="!messageText.trim()">
                <span>Send</span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                  <line x1="22" y1="2" x2="11" y2="13"></line>
                  <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                </svg>
              </button>
            </form>
          </footer>
        } @else {
          <!-- Empty State: No room active -->
          <div class="empty-workspace-state">
            <div class="empty-workspace-card glass-panel">
              <div class="brand-icon large-icon">
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                  <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"></path>
                </svg>
              </div>
              <h2>Select a channel or direct conversation</h2>
              <p>Join a real-time topic channel on the sidebar, start a direct message with a team member, or explore open public rooms.</p>
              
              <div class="empty-action-row">
                <button class="btn btn-primary" (click)="showCreateRoomModal.set(true)">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                    <line x1="12" y1="5" x2="12" y2="19"></line>
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                  </svg>
                  <span>New Channel</span>
                </button>
                <button class="btn btn-secondary" (click)="showUserSearchModal.set(true)">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                  </svg>
                  <span>Direct Message</span>
                </button>
              </div>
            </div>
          </div>
        }
      </main>

      <!-- 4. RIGHT DETAILS & MEMBER DRAWER -->
      @if (currentRoom() && showDetailsDrawer()) {
        <aside class="details-drawer glass-panel">
          <div class="drawer-header">
            <h3>Room Details</h3>
            <button class="btn-icon btn-sm" (click)="showDetailsDrawer.set(false)">✕</button>
          </div>

          <div class="drawer-content">
            <div class="drawer-overview-card">
              <div class="drawer-avatar-large">
                @if (currentRoom()?.isGroup) {
                  <span>#</span>
                } @else {
                  {{ getUserInitial(currentRoom()?.name) }}
                }
              </div>
              <h4>{{ currentRoom()?.name }}</h4>
              <p class="drawer-desc">{{ currentRoom()?.description || 'No description provided.' }}</p>
            </div>

            <div class="drawer-members-section">
              <div class="members-header">
                <h5>Members</h5>
                <span class="badge badge-brand">{{ currentRoom()?.members?.length || 1 }}</span>
              </div>

              <div class="members-list">
                @for (member of currentRoom()?.members || []; track member.id) {
                  <div class="member-row">
                    <div class="avatar avatar-sm avatar-gradient-1">
                      {{ getUserInitial(member.username) }}
                      @if (presenceService.isUserOnline(member.id)) {
                        <span class="status-dot online"></span>
                      } @else {
                        <span class="status-dot offline"></span>
                      }
                    </div>
                    <div class="member-info">
                      <span class="member-name">{{ member.username }}</span>
                      <span class="member-status-text">
                        {{ presenceService.isUserOnline(member.id) ? 'Online' : 'Offline' }}
                      </span>
                    </div>

                    @if (member.id !== currentUser()?.id) {
                      <button class="btn btn-ghost btn-xs" (click)="startDirectChat(member)" title="Message directly">
                        💬
                      </button>
                    }
                  </div>
                }
              </div>
            </div>
          </div>
        </aside>
      }
    </div>

    <!-- MODAL: CREATE CHANNEL -->
    @if (showCreateRoomModal()) {
      <div class="modal-backdrop" (click)="showCreateRoomModal.set(false)">
        <div class="modal-card glass-panel" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <div class="modal-title-box">
              <div class="modal-icon-badge">#</div>
              <h3>Create Channel</h3>
            </div>
            <button class="btn-icon" (click)="showCreateRoomModal.set(false)">✕</button>
          </div>

          <form (ngSubmit)="createRoom()">
            <div class="form-group">
              <label class="form-label">Channel Name</label>
              <input 
                type="text" 
                class="form-input" 
                [(ngModel)]="newRoomData.name" 
                name="name" 
                placeholder="e.g. backend-squad or announcements" 
                required 
                autofocus />
            </div>

            <div class="form-group">
              <label class="form-label">Topic / Description (Optional)</label>
              <input 
                type="text" 
                class="form-input" 
                [(ngModel)]="newRoomData.description" 
                name="description" 
                placeholder="What is this channel about?" />
            </div>

            <div class="form-group">
              <label class="form-label">Add Members (Optional)</label>
              <input 
                type="text" 
                class="form-input" 
                [(ngModel)]="memberSearchQuery" 
                (ngModelChange)="searchMembersForRoom()" 
                placeholder="Search user to add..." />

              @if (selectedMembersForNewRoom.length > 0) {
                <div class="chips-container">
                  @for (user of selectedMembersForNewRoom; track user.id) {
                    <div class="chip">
                      <span>{{ user.username }}</span>
                      <button type="button" class="chip-remove" (click)="removeSelectedMember(user.id)">✕</button>
                    </div>
                  }
                </div>
              }

              @if (memberSearchResults().length > 0) {
                <div class="member-search-dropdown glass-panel">
                  @for (user of memberSearchResults(); track user.id) {
                    <div class="dropdown-item" (click)="addSelectedMember(user)">
                      <div class="avatar avatar-xs avatar-gradient-2">
                        {{ getUserInitial(user.username) }}
                      </div>
                      <div class="dropdown-user-info">
                        <span class="dropdown-username">{{ user.username }}</span>
                        <span class="dropdown-email">{{ user.email }}</span>
                      </div>
                      <button type="button" class="btn btn-primary btn-xs">+ Add</button>
                    </div>
                  }
                </div>
              }
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
            <div class="modal-title-box">
              <div class="modal-icon-badge">&#64;</div>
              <h3>New Direct Message</h3>
            </div>
            <button class="btn-icon" (click)="showUserSearchModal.set(false)">✕</button>
          </div>

          <div class="form-group">
            <input 
              type="text" 
              class="form-input" 
              [(ngModel)]="userSearchQuery" 
              (ngModelChange)="searchUsers()" 
              placeholder="Search user by username or email..." 
              autofocus />
          </div>

          <div class="user-search-list">
            @for (user of searchResults(); track user.id) {
              <div class="user-search-item" (click)="startDirectChat(user)">
                <div class="avatar avatar-sm avatar-gradient-3">
                  {{ getUserInitial(user.username) }}
                  @if (presenceService.isUserOnline(user.id)) {
                    <span class="status-dot online"></span>
                  } @else {
                    <span class="status-dot offline"></span>
                  }
                </div>
                <div class="user-item-info">
                  <span class="user-item-name">{{ user.username }}</span>
                  <span class="user-item-email">{{ user.email }}</span>
                </div>
                <button class="btn btn-primary btn-xs">Message</button>
              </div>
            } @empty {
              <div class="empty-search-state">
                <p>{{ userSearchQuery ? 'No matching users found.' : 'Type a username to find anyone on PulseChat.' }}</p>
              </div>
            }
          </div>
        </div>
      </div>
    }

    <!-- MODAL: USER PROFILE & SETTINGS -->
    @if (showProfileModal()) {
      <div class="modal-backdrop" (click)="showProfileModal.set(false)">
        <div class="modal-card glass-panel" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3>My Profile & Connection</h3>
            <button class="btn-icon" (click)="showProfileModal.set(false)">✕</button>
          </div>

          <div class="profile-modal-body">
            <div class="profile-header-card">
              <div class="avatar avatar-lg avatar-gradient-1">
                {{ getUserInitial(currentUser()?.username) }}
                <span class="status-dot online"></span>
              </div>
              <div class="profile-header-info">
                <h4>{{ currentUser()?.username }}</h4>
                <p>{{ currentUser()?.email }}</p>
                <span class="badge badge-emerald">Online & Connected</span>
              </div>
            </div>

            <div class="profile-stats-grid">
              <div class="profile-stat-box">
                <span class="stat-label">Channels Joined</span>
                <span class="stat-val">{{ myGroupRooms().length }}</span>
              </div>
              <div class="profile-stat-box">
                <span class="stat-label">Direct Chats</span>
                <span class="stat-val">{{ myDirectRooms().length }}</span>
              </div>
              <div class="profile-stat-box">
                <span class="stat-label">WebSocket Status</span>
                <span class="stat-val text-emerald">{{ chatService.isConnected() ? 'STOMP Active' : 'Offline' }}</span>
              </div>
              <div class="profile-stat-box">
                <span class="stat-label">Heartbeat Interval</span>
                <span class="stat-val">15s (TTL 30s)</span>
              </div>
            </div>
          </div>

          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" (click)="showProfileModal.set(false)">Close</button>
            <button type="button" class="btn btn-outline" (click)="logout()">Sign Out</button>
          </div>
        </div>
      </div>
    }

    <!-- TOAST NOTIFICATIONS CONTAINER -->
    <div class="toast-container">
      @for (toast of toasts(); track toast.id) {
        <div class="toast-item {{ toast.type }}">
          <span>{{ toast.message }}</span>
        </div>
      }
    </div>
  `,
  styles: [`
    .chat-workspace-layout {
      display: flex;
      height: 100vh;
      width: 100vw;
      background-color: var(--bg-space);
      overflow: hidden;
      position: relative;
    }

    /* 1. WORKSPACE RAIL */
    .workspace-rail {
      width: 68px;
      min-width: 68px;
      background: var(--bg-primary);
      border-right: 1px solid var(--border-subtle);
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      align-items: center;
      padding: 16px 0;
      z-index: 30;
    }

    .rail-top, .rail-bottom {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 12px;
      width: 100%;
    }

    .rail-brand-logo {
      text-decoration: none;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 6px;
    }

    .rail-brand-logo .brand-icon {
      width: 42px;
      height: 42px;
      border-radius: var(--radius-md);
      background: var(--brand-gradient);
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 0 16px rgba(99, 102, 241, 0.4);
    }

    .rail-divider {
      width: 32px;
      height: 1px;
      background: var(--border-light);
      margin: 4px 0;
    }

    .rail-btn {
      position: relative;
      width: 44px;
      height: 44px;
      border-radius: var(--radius-md);
      background: transparent;
      border: 1px solid transparent;
      color: var(--text-muted);
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all var(--transition-fast);
    }

    .rail-btn:hover {
      background: var(--bg-tertiary);
      color: var(--text-primary);
    }

    .rail-btn.active {
      background: var(--bg-tertiary);
      color: var(--pulse-indigo);
      border-color: var(--border-accent);
      box-shadow: 0 0 15px rgba(99, 102, 241, 0.25);
    }

    .rail-counter {
      position: absolute;
      top: -2px;
      right: -2px;
      background: var(--pulse-indigo);
      color: white;
      font-size: 0.65rem;
      font-weight: 800;
      padding: 1px 5px;
      border-radius: var(--radius-full);
      border: 2px solid var(--bg-primary);
    }

    .rail-profile-btn {
      background: transparent;
      border: none;
      cursor: pointer;
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 2px;
      border-radius: var(--radius-md);
      transition: transform var(--transition-fast);
    }

    .rail-profile-btn:hover {
      transform: scale(1.08);
    }

    .logout-btn:hover {
      color: #f87171;
    }

    .rail-tooltip {
      display: none;
      position: absolute;
      left: calc(100% + 10px);
      background: var(--bg-elevated);
      color: var(--text-white);
      padding: 4px 10px;
      border-radius: var(--radius-sm);
      font-size: 0.75rem;
      font-weight: 600;
      white-space: nowrap;
      z-index: 100;
      box-shadow: var(--shadow-md);
      border: 1px solid var(--border-light);
      pointer-events: none;
    }

    .rail-btn:hover .rail-tooltip,
    .rail-profile-btn:hover .rail-tooltip {
      display: block;
    }

    /* 2. CONVERSATIONS SIDEBAR */
    .conversations-sidebar {
      width: 300px;
      min-width: 270px;
      max-width: 340px;
      background: var(--bg-secondary);
      border-right: 1px solid var(--border-subtle);
      display: flex;
      flex-direction: column;
      height: 100%;
      z-index: 20;
    }

    .sidebar-header {
      padding: 16px 16px 12px;
      border-bottom: 1px solid var(--border-subtle);
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .sidebar-title-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .sidebar-title-row h2 {
      font-size: 1.15rem;
      font-weight: 800;
      color: var(--text-white);
      letter-spacing: -0.01em;
    }

    .action-add-btn {
      width: 30px;
      height: 30px;
      background: var(--bg-tertiary);
      border: 1px solid var(--border-light);
      border-radius: var(--radius-sm);
      color: var(--text-primary);
    }

    .action-add-btn:hover {
      background: var(--pulse-indigo);
      border-color: var(--pulse-indigo);
      color: white;
    }

    .sidebar-search-box {
      position: relative;
      display: flex;
      align-items: center;
    }

    .sidebar-search-box svg {
      position: absolute;
      left: 10px;
      color: var(--text-muted);
      pointer-events: none;
    }

    .sidebar-search-input {
      width: 100%;
      padding: 8px 28px 8px 32px;
      background: var(--bg-input);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-sm);
      color: var(--text-primary);
      font-size: 0.82rem;
      outline: none;
    }

    .sidebar-search-input:focus {
      border-color: var(--pulse-indigo);
    }

    .clear-search-btn {
      position: absolute;
      right: 8px;
      background: transparent;
      border: none;
      color: var(--text-muted);
      font-size: 0.75rem;
      cursor: pointer;
    }

    .connection-status-pill {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 4px 10px;
      background: rgba(0, 0, 0, 0.2);
      border-radius: var(--radius-full);
      font-size: 0.72rem;
      color: var(--text-muted);
    }

    .connection-status-pill.connected {
      color: #6ee7b7;
    }

    .conversations-scroll-list {
      flex: 1;
      overflow-y: auto;
      padding: 10px 8px;
      display: flex;
      flex-direction: column;
      gap: 3px;
    }

    .conversation-row {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 10px 12px;
      border-radius: var(--radius-md);
      cursor: pointer;
      transition: all var(--transition-fast);
      border: 1px solid transparent;
      user-select: none;
    }

    .conversation-row:hover {
      background: var(--bg-tertiary);
    }

    .conversation-row.active {
      background: var(--bg-tertiary);
      border-color: var(--border-accent);
      box-shadow: 0 0 15px rgba(99, 102, 241, 0.15);
    }

    .channel-icon-tag {
      width: 34px;
      height: 34px;
      border-radius: var(--radius-sm);
      background: var(--bg-input);
      border: 1px solid var(--border-subtle);
      color: var(--pulse-indigo);
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 800;
      font-size: 1.1rem;
      flex-shrink: 0;
    }

    .conversation-row.active .channel-icon-tag {
      background: var(--brand-gradient);
      color: white;
      border: none;
    }

    .explore-tag {
      font-size: 1rem;
    }

    .avatar-sm {
      width: 36px;
      height: 36px;
      font-size: 0.85rem;
    }

    .avatar-sm .status-dot {
      position: absolute;
      bottom: -1px;
      right: -1px;
      border: 2px solid var(--bg-secondary);
    }

    .row-main-content {
      flex: 1;
      min-width: 0;
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .row-title-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 6px;
    }

    .row-name {
      font-weight: 700;
      font-size: 0.88rem;
      color: var(--text-white);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .row-badge {
      font-size: 0.7rem;
      color: var(--text-muted);
      font-family: var(--font-mono);
      background: rgba(255, 255, 255, 0.05);
      padding: 1px 6px;
      border-radius: var(--radius-full);
      flex-shrink: 0;
    }

    .row-time {
      font-size: 0.68rem;
      color: var(--text-muted);
      flex-shrink: 0;
    }

    .row-last-msg {
      font-size: 0.78rem;
      color: var(--text-muted);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .row-last-msg .msg-sender {
      color: var(--text-secondary);
      font-weight: 600;
    }

    .empty-list-state {
      text-align: center;
      padding: 40px 16px;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
      color: var(--text-muted);
    }

    .empty-icon {
      font-size: 2rem;
      margin-bottom: 4px;
    }

    /* 3. MAIN CHAT AREA */
    .chat-main-area {
      flex: 1;
      display: flex;
      flex-direction: column;
      height: 100%;
      background: var(--bg-primary);
      position: relative;
      overflow: hidden;
    }

    .chat-header {
      padding: 14px 20px;
      border-bottom: 1px solid var(--border-subtle);
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-radius: 0;
      z-index: 10;
    }

    .header-left {
      display: flex;
      align-items: center;
      gap: 12px;
      min-width: 0;
    }

    .mobile-back-btn {
      display: none;
    }

    .channel-header-icon {
      width: 38px;
      height: 38px;
      border-radius: var(--radius-md);
      background: var(--brand-gradient);
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 800;
      font-size: 1.2rem;
      box-shadow: 0 0 15px rgba(99, 102, 241, 0.3);
    }

    .header-details {
      display: flex;
      flex-direction: column;
      gap: 2px;
      min-width: 0;
    }

    .header-title-row {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .header-title-row h2 {
      font-size: 1.15rem;
      font-weight: 800;
      color: var(--text-white);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .header-subtitle {
      font-size: 0.78rem;
      color: var(--text-muted);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .header-right {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .active-btn {
      background: var(--bg-tertiary);
      color: var(--pulse-indigo);
      border-color: var(--border-accent);
    }

    /* MESSAGES CONTAINER */
    .messages-container {
      flex: 1;
      overflow-y: auto;
      padding: 20px 24px;
      display: flex;
      flex-direction: column;
      position: relative;
    }

    .load-older-banner {
      display: flex;
      justify-content: center;
      margin-bottom: 16px;
    }

    .messages-stream {
      display: flex;
      flex-direction: column;
      gap: 14px;
      margin-top: auto;
    }

    .message-row {
      display: flex;
      gap: 12px;
      max-width: 80%;
      animation: fadeIn 0.25s ease-out;
    }

    .message-row.outgoing {
      align-self: flex-end;
      flex-direction: row-reverse;
    }

    .message-row.incoming {
      align-self: flex-start;
    }

    .message-content-group {
      display: flex;
      flex-direction: column;
      gap: 3px;
    }

    .message-row.outgoing .message-content-group {
      align-items: flex-end;
    }

    .message-sender-label {
      font-size: 0.75rem;
      font-weight: 700;
      color: var(--pulse-cyan);
      margin-left: 6px;
    }

    .message-bubble {
      padding: 10px 16px;
      border-radius: var(--radius-lg);
      position: relative;
      word-break: break-word;
    }

    .message-row.outgoing .message-bubble {
      background: var(--brand-gradient);
      color: white;
      border-bottom-right-radius: 4px;
      box-shadow: 0 4px 16px rgba(99, 102, 241, 0.35);
    }

    .message-row.incoming .message-bubble {
      background: var(--bg-tertiary);
      color: var(--text-primary);
      border: 1px solid var(--border-light);
      border-bottom-left-radius: 4px;
    }

    .message-text {
      font-size: 0.92rem;
      line-height: 1.5;
    }

    .message-meta-time {
      display: block;
      font-size: 0.65rem;
      margin-top: 4px;
      opacity: 0.75;
      text-align: right;
    }

    .system-message-row {
      display: flex;
      justify-content: center;
      margin: 8px 0;
    }

    .system-message-pill {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 4px 14px;
      border-radius: var(--radius-full);
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid var(--border-subtle);
      font-size: 0.75rem;
      color: var(--text-muted);
    }

    .system-time {
      opacity: 0.6;
      font-size: 0.65rem;
    }

    .empty-conversation-state {
      text-align: center;
      padding: 80px 20px;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 12px;
      color: var(--text-muted);
    }

    .empty-conversation-icon {
      color: var(--pulse-indigo);
      margin-bottom: 8px;
    }

    .empty-conversation-state h3 {
      font-size: 1.3rem;
      font-weight: 800;
      color: var(--text-white);
    }

    .empty-conversation-state p {
      max-width: 420px;
      font-size: 0.9rem;
      line-height: 1.5;
    }

    /* TYPING INDICATOR */
    .live-typing-bar {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 0.78rem;
      color: var(--text-muted);
      padding: 8px 14px;
      margin-top: 10px;
      border-radius: var(--radius-full);
      background: rgba(0, 0, 0, 0.25);
      width: fit-content;
      animation: fadeIn 0.2s ease-out;
    }

    .typing-dots {
      display: flex;
      gap: 3px;
    }

    .typing-dots span {
      width: 5px;
      height: 5px;
      background: var(--pulse-indigo);
      border-radius: 50%;
      animation: bounce 1.4s infinite ease-in-out both;
    }
    .typing-dots span:nth-child(1) { animation-delay: -0.32s; }
    .typing-dots span:nth-child(2) { animation-delay: -0.16s; }

    .scroll-bottom-fab {
      position: absolute;
      bottom: 16px;
      right: 24px;
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: var(--bg-elevated);
      border: 1px solid var(--border-medium);
      color: var(--text-white);
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      box-shadow: var(--shadow-md);
      transition: transform var(--transition-fast);
      z-index: 20;
    }

    .scroll-bottom-fab:hover {
      transform: translateY(-2px);
      border-color: var(--pulse-indigo);
    }

    /* COMPOSER */
    .composer-container {
      padding: 12px 20px 16px;
      border-top: 1px solid var(--border-subtle);
      border-radius: 0;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .composer-toolbar {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .quick-emojis {
      display: flex;
      gap: 4px;
    }

    .emoji-chip {
      background: transparent;
      border: none;
      cursor: pointer;
      padding: 2px 4px;
      border-radius: var(--radius-xs);
      font-size: 0.95rem;
      transition: transform var(--transition-fast);
    }

    .emoji-chip:hover {
      transform: scale(1.2);
    }

    .composer-hint {
      font-size: 0.7rem;
      color: var(--text-muted);
    }

    .composer-form {
      display: flex;
      gap: 10px;
      align-items: flex-end;
    }

    .composer-textarea {
      flex: 1;
      padding: 12px 16px;
      background: var(--bg-input);
      border: 1px solid var(--border-light);
      border-radius: var(--radius-md);
      color: var(--text-primary);
      font-family: var(--font-sans);
      font-size: 0.92rem;
      outline: none;
      resize: none;
      min-height: 46px;
      max-height: 120px;
      line-height: 1.4;
    }

    .composer-textarea:focus {
      border-color: var(--pulse-indigo);
      box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.2);
    }

    .send-action-btn {
      height: 46px;
      padding: 0 18px;
      border-radius: var(--radius-md);
      flex-shrink: 0;
    }

    /* EMPTY WORKSPACE STATE */
    .empty-workspace-state {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 24px;
    }

    .empty-workspace-card {
      max-width: 480px;
      padding: 48px 36px;
      border-radius: var(--radius-xl);
      text-align: center;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 16px;
    }

    .large-icon {
      width: 64px;
      height: 64px;
      margin-bottom: 4px;
    }

    .empty-workspace-card h2 {
      font-size: 1.4rem;
      font-weight: 800;
      color: var(--text-white);
    }

    .empty-workspace-card p {
      font-size: 0.92rem;
      color: var(--text-secondary);
      line-height: 1.5;
    }

    .empty-action-row {
      display: flex;
      gap: 12px;
      margin-top: 8px;
    }

    /* 4. DETAILS DRAWER */
    .details-drawer {
      width: 280px;
      min-width: 260px;
      background: var(--bg-secondary);
      border-left: 1px solid var(--border-subtle);
      border-radius: 0;
      display: flex;
      flex-direction: column;
      height: 100%;
      z-index: 25;
      animation: slideInRight 0.25s ease-out;
    }

    .drawer-header {
      padding: 16px 18px;
      border-bottom: 1px solid var(--border-subtle);
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .drawer-header h3 {
      font-size: 1rem;
      font-weight: 700;
      color: var(--text-white);
    }

    .drawer-content {
      padding: 18px;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 24px;
    }

    .drawer-overview-card {
      text-align: center;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
    }

    .drawer-avatar-large {
      width: 56px;
      height: 56px;
      border-radius: var(--radius-lg);
      background: var(--brand-gradient);
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.4rem;
      font-weight: 800;
    }

    .drawer-desc {
      font-size: 0.82rem;
      color: var(--text-muted);
      line-height: 1.4;
    }

    .members-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 12px;
    }

    .members-header h5 {
      font-size: 0.85rem;
      font-weight: 700;
      color: var(--text-secondary);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .members-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .member-row {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 6px 8px;
      border-radius: var(--radius-sm);
    }

    .member-row:hover {
      background: var(--bg-tertiary);
    }

    .member-info {
      flex: 1;
      min-width: 0;
      display: flex;
      flex-direction: column;
    }

    .member-name {
      font-size: 0.85rem;
      font-weight: 600;
      color: var(--text-white);
    }

    .member-status-text {
      font-size: 0.7rem;
      color: var(--text-muted);
    }

    /* MODAL SYSTEM */
    .modal-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.75);
      backdrop-filter: blur(10px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      padding: 20px;
      animation: fadeIn 0.2s ease-out;
    }

    .modal-card {
      width: 100%;
      max-width: 480px;
      padding: 32px 28px;
      border-radius: var(--radius-xl);
      box-shadow: var(--shadow-lg);
      position: relative;
    }

    .modal-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 24px;
    }

    .modal-title-box {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .modal-icon-badge {
      width: 32px;
      height: 32px;
      border-radius: var(--radius-sm);
      background: var(--brand-gradient);
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 800;
    }

    .modal-footer {
      display: flex;
      justify-content: flex-end;
      gap: 10px;
      margin-top: 24px;
    }

    .chips-container {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      margin-top: 8px;
    }

    .chip {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 4px 10px;
      border-radius: var(--radius-full);
      background: var(--pulse-indigo);
      color: white;
      font-size: 0.78rem;
      font-weight: 600;
    }

    .chip-remove {
      background: transparent;
      border: none;
      color: white;
      cursor: pointer;
      font-size: 0.75rem;
    }

    .member-search-dropdown {
      margin-top: 8px;
      max-height: 180px;
      overflow-y: auto;
      border-radius: var(--radius-md);
      padding: 6px;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .dropdown-item {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 8px 10px;
      border-radius: var(--radius-sm);
      cursor: pointer;
    }

    .dropdown-item:hover {
      background: var(--bg-tertiary);
    }

    .dropdown-user-info {
      flex: 1;
      display: flex;
      flex-direction: column;
    }

    .dropdown-username {
      font-size: 0.82rem;
      font-weight: 600;
      color: var(--text-white);
    }

    .dropdown-email {
      font-size: 0.72rem;
      color: var(--text-muted);
    }

    .user-search-list {
      max-height: 280px;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 8px;
      margin-top: 8px;
    }

    .user-search-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 10px 14px;
      border-radius: var(--radius-md);
      background: var(--bg-input);
      border: 1px solid var(--border-subtle);
      cursor: pointer;
    }

    .user-search-item:hover {
      background: var(--bg-tertiary);
      border-color: var(--border-accent);
    }

    .user-item-info {
      flex: 1;
      display: flex;
      flex-direction: column;
    }

    .user-item-name {
      font-weight: 700;
      font-size: 0.88rem;
      color: var(--text-white);
    }

    .user-item-email {
      font-size: 0.75rem;
      color: var(--text-muted);
    }

    .empty-search-state {
      text-align: center;
      padding: 30px 16px;
      color: var(--text-muted);
      font-size: 0.85rem;
    }

    /* PROFILE MODAL */
    .profile-modal-body {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .profile-header-card {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 16px;
      border-radius: var(--radius-lg);
      background: var(--bg-tertiary);
    }

    .avatar-lg {
      width: 56px;
      height: 56px;
      font-size: 1.4rem;
    }

    .profile-header-info {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .profile-header-info h4 {
      font-size: 1.1rem;
      font-weight: 800;
      color: var(--text-white);
    }

    .profile-header-info p {
      font-size: 0.82rem;
      color: var(--text-muted);
    }

    .profile-stats-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
    }

    .profile-stat-box {
      padding: 14px;
      background: var(--bg-input);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-md);
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .profile-stat-box .stat-label {
      font-size: 0.72rem;
      color: var(--text-muted);
      text-transform: uppercase;
      font-weight: 600;
    }

    .profile-stat-box .stat-val {
      font-size: 1rem;
      font-weight: 800;
      color: var(--text-white);
      font-family: var(--font-mono);
    }

    .text-emerald { color: #6ee7b7 !important; }

    .spinner-xs {
      width: 12px;
      height: 12px;
      border: 2px solid rgba(255, 255, 255, 0.3);
      border-top-color: white;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
      display: inline-block;
      margin-right: 4px;
    }

    /* RESPONSIVE LAYOUT */
    @media (max-width: 768px) {
      .workspace-rail {
        display: none;
      }
      .conversations-sidebar {
        width: 100%;
        max-width: 100%;
      }
      .mobile-view-chat .conversations-sidebar {
        display: none;
      }
      .mobile-view-chat .chat-main-area {
        display: flex;
      }
      .mobile-back-btn {
        display: flex;
      }
      .details-drawer {
        position: fixed;
        right: 0;
        top: 0;
        bottom: 0;
        width: 85%;
        box-shadow: var(--shadow-lg);
      }
    }
  `]
})
export class ChatComponent implements OnInit, OnDestroy, AfterViewChecked {
  @ViewChild('messagesContainer') private messagesContainer?: ElementRef;
  @ViewChild('composerTextarea') private composerTextarea?: ElementRef;

  public authService = inject(AuthService);
  public chatService = inject(ChatService);
  public presenceService = inject(PresenceService);
  private http = inject(HttpClient);
  private router = inject(Router);

  currentUser = this.authService.currentUser;
  activeTab = signal<'channels' | 'direct' | 'explore'>('channels');

  // Rooms & Messages State
  myRooms = signal<Room[]>([]);
  publicRooms = signal<Room[]>([]);
  currentRoom = signal<Room | null>(null);
  messages = signal<ChatMessage[]>([]);

  // Search & Filters
  sidebarSearchQuery = '';

  // Pagination State
  currentPage = signal<number>(0);
  hasMoreMessages = signal<boolean>(false);
  isLoadingMore = signal<boolean>(false);
  showScrollBottomBtn = signal<boolean>(false);

  // Modals & Panels
  showCreateRoomModal = signal<boolean>(false);
  showUserSearchModal = signal<boolean>(false);
  showProfileModal = signal<boolean>(false);
  showDetailsDrawer = signal<boolean>(false);

  // Room creation data
  newRoomData: CreateRoomRequest = { name: '', description: '', isGroup: true };
  memberSearchQuery = '';
  memberSearchResults = signal<User[]>([]);
  selectedMembersForNewRoom: User[] = [];

  // Direct user search data
  userSearchQuery = '';
  searchResults = signal<User[]>([]);

  // Composer & Typing State
  messageText = '';
  private typingTimeout?: any;
  currentTypingUser = signal<string | null>(null);
  private typingResetTimeout?: any;

  // Toasts
  toasts = signal<Toast[]>([]);

  private subscriptions: Subscription[] = [];
  private shouldScrollToBottom = false;

  // Computed Room Lists
  myGroupRooms = computed(() => this.myRooms().filter(r => r.isGroup));
  myDirectRooms = computed(() => this.myRooms().filter(r => !r.isGroup));

  filteredGroupRooms = computed(() => {
    const q = this.sidebarSearchQuery.trim().toLowerCase();
    if (!q) return this.myGroupRooms();
    return this.myGroupRooms().filter(r => r.name.toLowerCase().includes(q) || r.description?.toLowerCase().includes(q));
  });

  filteredDirectRooms = computed(() => {
    const q = this.sidebarSearchQuery.trim().toLowerCase();
    if (!q) return this.myDirectRooms();
    return this.myDirectRooms().filter(r => r.name.toLowerCase().includes(q));
  });

  filteredPublicRooms = computed(() => {
    const q = this.sidebarSearchQuery.trim().toLowerCase();
    if (!q) return this.publicRooms();
    return this.publicRooms().filter(r => r.name.toLowerCase().includes(q) || r.description?.toLowerCase().includes(q));
  });

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
      this.scrollToBottom(false);
      this.shouldScrollToBottom = false;
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(s => s.unsubscribe());
    this.chatService.disconnect();
  }

  toggleDetailsDrawer(): void {
    this.showDetailsDrawer.update(v => !v);
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
      error: (err) => {
        console.error('Failed to load user rooms', err);
        this.addToast('error', 'Failed to load conversation list.');
      }
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

    // Load initial paginated history from MySQL via REST
    this.loadMessages(room.id, 0);
  }

  loadMessages(roomId: string, page: number): void {
    this.http.get<PageResponse<ChatMessage>>(`/api/rooms/${roomId}/messages?page=${page}&size=40`).subscribe({
      next: (res) => {
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
        this.addToast('error', 'Failed to retrieve message history.');
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
      const otherUser = this.currentRoom()!.members?.find(m => m.id !== this.currentUser()?.id);
      if (otherUser) {
        this.chatService.sendPrivateMessage(otherUser.id, otherUser.username, content);
      } else {
        this.chatService.sendRoomMessage(this.currentRoom()!.id, content);
      }
    }
  }

  onComposerKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
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

  appendEmoji(emoji: string): void {
    this.messageText += emoji;
    this.composerTextarea?.nativeElement.focus();
  }

  createRoom(): void {
    if (!this.newRoomData.name.trim()) return;

    const payload: CreateRoomRequest = {
      name: this.newRoomData.name.trim(),
      description: this.newRoomData.description?.trim(),
      isGroup: true,
      memberUserIds: this.selectedMembersForNewRoom.map(u => u.id)
    };

    this.http.post<Room>('/api/rooms', payload).subscribe({
      next: (created) => {
        this.showCreateRoomModal.set(false);
        this.newRoomData = { name: '', description: '', isGroup: true };
        this.selectedMembersForNewRoom = [];
        this.memberSearchQuery = '';
        this.memberSearchResults.set([]);
        this.loadUserRooms();
        this.selectRoom(created);
        this.addToast('success', `Channel #${created.name} created!`);
      },
      error: (err) => {
        console.error('Failed to create room', err);
        this.addToast('error', 'Failed to create channel.');
      }
    });
  }

  searchMembersForRoom(): void {
    if (!this.memberSearchQuery.trim()) {
      this.memberSearchResults.set([]);
      return;
    }

    this.http.get<User[]>(`/api/users?q=${encodeURIComponent(this.memberSearchQuery)}`).subscribe({
      next: (users) => {
        const selectedIds = new Set(this.selectedMembersForNewRoom.map(u => u.id));
        selectedIds.add(this.currentUser()?.id || '');
        this.memberSearchResults.set(users.filter(u => !selectedIds.has(u.id)));
      },
      error: (err) => console.error('Search failed', err)
    });
  }

  addSelectedMember(user: User): void {
    this.selectedMembersForNewRoom.push(user);
    this.memberSearchQuery = '';
    this.memberSearchResults.set([]);
  }

  removeSelectedMember(userId: string): void {
    this.selectedMembersForNewRoom = this.selectedMembersForNewRoom.filter(u => u.id !== userId);
  }

  joinRoom(room: Room): void {
    this.http.post<Room>(`/api/rooms/${room.id}/join`, {}).subscribe({
      next: (joined) => {
        this.loadUserRooms();
        this.selectRoom(joined);
        this.activeTab.set('channels');
        this.addToast('success', `Joined #${joined.name}`);
      },
      error: (err) => {
        console.error('Failed to join room', err);
        this.addToast('error', 'Failed to join room.');
      }
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
      error: (err) => {
        console.error('Failed to initiate direct chat', err);
        this.addToast('error', 'Failed to start direct message.');
      }
    });
  }

  isAlreadyMember(roomId: string): boolean {
    return this.myRooms().some(r => r.id === roomId);
  }

  isOtherUserOnline(room: Room): boolean {
    const otherUser = room.members?.find(m => m.id !== this.currentUser()?.id);
    return otherUser ? this.presenceService.isUserOnline(otherUser.id) : false;
  }

  onMessagesScroll(event: any): void {
    const target = event.target;
    const distanceToBottom = target.scrollHeight - target.scrollTop - target.clientHeight;
    this.showScrollBottomBtn.set(distanceToBottom > 200);
  }

  scrollToBottom(smooth: boolean = false): void {
    try {
      if (this.messagesContainer) {
        this.messagesContainer.nativeElement.scrollTo({
          top: this.messagesContainer.nativeElement.scrollHeight,
          behavior: smooth ? 'smooth' : 'auto'
        });
      }
    } catch {}
  }

  private updateLastMessageInRoomList(msg: ChatMessage): void {
    this.myRooms.update(rooms =>
      rooms.map(r => r.id === msg.roomId ? { ...r, lastMessage: msg } : r)
    );
  }

  addToast(type: 'success' | 'error' | 'info', message: string): void {
    const id = String(Date.now());
    this.toasts.update(t => [...t, { id, type, message }]);
    setTimeout(() => {
      this.toasts.update(t => t.filter(item => item.id !== id));
    }, 4000);
  }

  getUserInitial(name?: string): string {
    return name ? name.charAt(0).toUpperCase() : '?';
  }

  formatTime(isoString?: string): string {
    if (!isoString) return '';
    const date = new Date(isoString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  isMobile(): boolean {
    return typeof window !== 'undefined' && window.innerWidth < 768;
  }

  logout(): void {
    this.authService.logout();
  }
}
