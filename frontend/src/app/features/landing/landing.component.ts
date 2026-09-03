import { Component, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth.service';

interface DemoMessage {
  id: string;
  sender: string;
  avatarClass: string;
  content: string;
  time: string;
  isSelf: boolean;
}

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="landing-page">
      <!-- BACKGROUND AMBIENT GLOWS -->
      <div class="ambient-glow glow-top-left"></div>
      <div class="ambient-glow glow-top-right"></div>
      <div class="ambient-glow glow-center"></div>

      <!-- NAVIGATION BAR -->
      <nav class="landing-nav glass-panel">
        <div class="nav-content">
          <div class="brand-logo" routerLink="/">
            <div class="brand-icon">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"></path>
              </svg>
            </div>
            <span class="brand-name">Pulse<span>Chat</span></span>
          </div>

          <div class="nav-links">
            <a href="#features" class="nav-link">Features</a>
            <a href="#architecture" class="nav-link">Architecture</a>
            <a href="#presence" class="nav-link">Presence & Typing</a>
            <a href="#security" class="nav-link">Security</a>
          </div>

          <div class="nav-actions">
            @if (authService.isAuthenticated()) {
              <a routerLink="/chat" class="btn btn-primary btn-sm">
                <span>Enter Chat</span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                  <polyline points="12 5 19 12 12 19"></polyline>
                </svg>
              </a>
            } @else {
              <a routerLink="/login" class="btn btn-ghost btn-sm">Sign In</a>
              <a routerLink="/login" class="btn btn-primary btn-sm">Get Started</a>
            }
          </div>
        </div>
      </nav>

      <!-- HERO SECTION -->
      <header class="hero-section">
        <div class="hero-container">
          <div class="hero-badge">
            <span class="status-dot online"></span>
            <span>Distributed Real-Time Messaging Platform</span>
          </div>

          <h1 class="hero-title">
            Real-time communication with the <span class="gradient-text">pulse of your team.</span>
          </h1>

          <p class="hero-description">
            Experience ultra low-latency group channels, direct 1:1 messaging, live typing events, and active presence tracking powered by Spring Boot STOMP, Redis Pub/Sub, and MySQL.
          </p>

          <div class="hero-actions">
            <a [routerLink]="authService.isAuthenticated() ? '/chat' : '/login'" class="btn btn-primary btn-lg">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
              </svg>
              <span>{{ authService.isAuthenticated() ? 'Open PulseChat' : 'Start Chatting Free' }}</span>
            </a>
            <a href="#interactive-demo" class="btn btn-secondary btn-lg">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"></circle>
                <polygon points="10 8 16 12 10 16 10 8"></polygon>
              </svg>
              <span>Interactive Sandbox</span>
            </a>
          </div>

          <!-- HERO STATS STRIP -->
          <div class="stats-strip glass-panel">
            <div class="stat-item">
              <span class="stat-number">&lt; 15ms</span>
              <span class="stat-label">WebSocket Dispatch</span>
            </div>
            <div class="stat-divider"></div>
            <div class="stat-item">
              <span class="stat-number">100%</span>
              <span class="stat-label">Stateless JWT Auth</span>
            </div>
            <div class="stat-divider"></div>
            <div class="stat-item">
              <span class="stat-number">Java 21</span>
              <span class="stat-label">Virtual Threads Core</span>
            </div>
            <div class="stat-divider"></div>
            <div class="stat-item">
              <span class="stat-number">Redis + STOMP</span>
              <span class="stat-label">Distributed Cluster</span>
            </div>
          </div>

          <!-- INTERACTIVE LIVE CHAT PREVIEW WIDGET -->
          <div id="interactive-demo" class="demo-window-wrapper">
            <div class="demo-window glass-panel">
              <!-- Window Header -->
              <div class="demo-header">
                <div class="demo-traffic-lights">
                  <span class="light red"></span>
                  <span class="light yellow"></span>
                  <span class="light green"></span>
                </div>
                <div class="demo-room-info">
                  <div class="demo-room-icon">#</div>
                  <span class="demo-room-name">engineering-core</span>
                  <span class="badge badge-emerald">
                    <span class="status-dot online"></span> 4 Online
                  </span>
                </div>
                <div class="demo-cluster-tag">
                  <span class="pulse-wave-icon">
                    <span></span><span></span><span></span>
                  </span>
                  <span>STOMP Connected</span>
                </div>
              </div>

              <!-- Window Body: Chat stream -->
              <div class="demo-messages-stream">
                @for (msg of demoMessages(); track msg.id) {
                  <div class="demo-msg-row" [class.self]="msg.isSelf">
                    @if (!msg.isSelf) {
                      <div class="avatar avatar-sm {{ msg.avatarClass }}">
                        {{ msg.sender.charAt(0) }}
                      </div>
                    }
                    <div class="demo-msg-bubble">
                      @if (!msg.isSelf) {
                        <div class="demo-msg-author">{{ msg.sender }}</div>
                      }
                      <p class="demo-msg-text">{{ msg.content }}</p>
                      <span class="demo-msg-time">{{ msg.time }}</span>
                    </div>
                  </div>
                }

                @if (simulatedTyping()) {
                  <div class="demo-typing-indicator">
                    <div class="typing-dots">
                      <span></span><span></span><span></span>
                    </div>
                    <span><strong>{{ simulatedTyping() }}</strong> is typing...</span>
                  </div>
                }
              </div>

              <!-- Interactive Simulator Input -->
              <div class="demo-composer">
                <input 
                  type="text" 
                  class="demo-input" 
                  [(ngModel)]="demoInputText" 
                  (keyup.enter)="sendDemoMessage()" 
                  placeholder="Type a message into the real-time simulation..." />
                <button class="btn btn-primary btn-sm" (click)="sendDemoMessage()" [disabled]="!demoInputText.trim()">
                  <span>Send</span>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                    <line x1="22" y1="2" x2="11" y2="13"></line>
                    <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <!-- SECTION 2: REAL-TIME COMMUNICATION ARCHITECTURE -->
      <section id="architecture" class="section architecture-section">
        <div class="section-container">
          <div class="section-header">
            <span class="badge badge-brand">Architecture & Scalability</span>
            <h2>Engineered for High-Throughput Distributed Messaging</h2>
            <p>A resilient real-time architecture orchestrating Java 21 Virtual Threads, Spring Boot WebSocket brokers, Redis Pub/Sub, and MySQL persistence.</p>
          </div>

          <div class="arch-diagram-grid">
            <!-- Node 1 -->
            <div class="arch-node glass-panel">
              <div class="node-icon-box">💻</div>
              <h3>Client Layer</h3>
              <p>Angular 19 Standalone Signals UI connected via <code>/ws</code> SockJS handshake with secure JWT query credentials.</p>
              <div class="node-badge">STOMP Protocol</div>
            </div>

            <!-- Flow Arrow 1 -->
            <div class="arch-flow-arrow">
              <div class="flow-line"></div>
              <div class="flow-pulse"></div>
            </div>

            <!-- Node 2 -->
            <div class="arch-node glass-panel highlight-node">
              <div class="node-icon-box">⚡</div>
              <h3>Spring Boot 3 Broker</h3>
              <p>Virtual Threads (Java 21) handling lightweight concurrency. Dispatches <code>/app/chat.*</code> to <code>/topic/room.*</code>.</p>
              <div class="node-badge">Virtual Threads</div>
            </div>

            <!-- Flow Arrow 2 -->
            <div class="arch-flow-arrow">
              <div class="flow-line"></div>
              <div class="flow-pulse"></div>
            </div>

            <!-- Node 3 -->
            <div class="arch-node glass-panel">
              <div class="node-icon-box">🗄️</div>
              <h3>Persistence & Pub/Sub</h3>
              <p>MySQL relational schema for history, users & channels with Redis Pub/Sub backing presence and cluster fan-out.</p>
              <div class="node-badge">MySQL + Redis</div>
            </div>
          </div>
        </div>
      </section>

      <!-- SECTION 3: KEY PRODUCT PILLARS -->
      <section id="features" class="section features-section">
        <div class="section-container">
          <div class="section-header">
            <span class="badge badge-cyan">Features</span>
            <h2>Everything your team needs to communicate effortlessly</h2>
            <p>From public developer channels to confidential 1:1 direct conversations.</p>
          </div>

          <div class="features-grid">
            <!-- Feature 1 -->
            <div class="feature-card glass-panel">
              <div class="feature-icon-box">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                  <circle cx="9" cy="7" r="4"></circle>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                </svg>
              </div>
              <h3>Public & Group Channels</h3>
              <p>Create organized spaces for topics, squads, and projects. Instant discovery and one-click join capabilities.</p>
              <div class="feature-preview-tag"><code>/topic/room.&#123;roomId&#125;</code></div>
            </div>

            <!-- Feature 2 -->
            <div class="feature-card glass-panel">
              <div class="feature-icon-box">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
                </svg>
              </div>
              <h3>1-on-1 Direct Messaging</h3>
              <p>Instant personal conversations delivered through secure dedicated user queues with zero latency.</p>
              <div class="feature-preview-tag"><code>/user/queue/private</code></div>
            </div>

            <!-- Feature 3 -->
            <div class="feature-card glass-panel">
              <div class="feature-icon-box">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="10"></circle>
                  <polyline points="12 6 12 12 16 14"></polyline>
                </svg>
              </div>
              <h3>Live Presence & Heartbeats</h3>
              <p>Real-time TTL-based active status tracking. Instant online/offline transitions across every conversation.</p>
              <div class="feature-preview-tag"><code>/topic/presence</code></div>
            </div>

            <!-- Feature 4 -->
            <div class="feature-card glass-panel">
              <div class="feature-icon-box">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="4 17 10 11 4 5"></polyline>
                  <line x1="12" y1="19" x2="20" y2="19"></line>
                </svg>
              </div>
              <h3>Ephemeral Typing Indicators</h3>
              <p>Real-time typing feedback dispatched via lightweight in-memory broker without exhausting DB writes.</p>
              <div class="feature-preview-tag"><code>/topic/room.&#123;id&#125;.typing</code></div>
            </div>

            <!-- Feature 5 -->
            <div class="feature-card glass-panel">
              <div class="feature-icon-box">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                </svg>
              </div>
              <h3>Stateless JWT Security</h3>
              <p>Protected REST APIs and WebSocket handshake authentication with room subscription authorization checks.</p>
              <div class="feature-preview-tag"><code>HMAC-SHA256 Signed</code></div>
            </div>

            <!-- Feature 6 -->
            <div class="feature-card glass-panel">
              <div class="feature-icon-box">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="11" cy="11" r="8"></circle>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                </svg>
              </div>
              <h3>Instant User & Room Discovery</h3>
              <p>Debounced search across the entire user base. Start a DM or join a public channel in under 2 clicks.</p>
              <div class="feature-preview-tag"><code>Fast Search Index</code></div>
            </div>
          </div>
        </div>
      </section>

      <!-- SECTION 4: SECURITY & RELIABILITY -->
      <section id="security" class="section security-section">
        <div class="section-container">
          <div class="security-card glass-panel">
            <div class="security-content">
              <span class="badge badge-emerald">Enterprise Grade</span>
              <h2>Security at Every Layer</h2>
              <p>
                PulseChat never compromises on access control. Every HTTP request requires a cryptographically validated Bearer token, WebSocket handshakes enforce JWT token verification, and <code>TopicSubscriptionInterceptor</code> guarantees users cannot subscribe to channels they do not belong to.
              </p>
              <ul class="security-list">
                <li>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2.5">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                  <span>Stateless 24-hour expiration JWT tokens</span>
                </li>
                <li>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2.5">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                  <span>Channel membership enforcement on STOMP SUBSCRIBE</span>
                </li>
                <li>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2.5">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                  <span>BCrypt password hashing & SQL injection protection</span>
                </li>
              </ul>
            </div>
            <div class="security-visual">
              <div class="shield-badge">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                </svg>
                <span class="shield-status">ACTIVE</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- SECTION 5: FINAL CALL TO ACTION -->
      <section class="section cta-section">
        <div class="section-container">
          <div class="cta-card glass-panel">
            <div class="cta-glow"></div>
            <h2>Ready to experience real-time messaging?</h2>
            <p>Join PulseChat today. Connect with colleagues, explore open community rooms, or start direct conversations in seconds.</p>
            <div class="cta-buttons">
              <a [routerLink]="authService.isAuthenticated() ? '/chat' : '/login'" class="btn btn-primary btn-lg">
                <span>{{ authService.isAuthenticated() ? 'Launch PulseChat' : 'Create Free Account' }}</span>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                  <polyline points="12 5 19 12 12 19"></polyline>
                </svg>
              </a>
            </div>
          </div>
        </div>
      </section>

      <!-- FOOTER -->
      <footer class="landing-footer">
        <div class="footer-container">
          <div class="footer-brand">
            <div class="brand-logo">
              <div class="brand-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                  <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"></path>
                </svg>
              </div>
              <span class="brand-name">Pulse<span>Chat</span></span>
            </div>
            <p class="footer-desc">Distributed real-time messaging platform powered by Spring Boot STOMP, Redis, and Angular.</p>
          </div>

          <div class="footer-links-group">
            <div class="footer-col">
              <h4>Product</h4>
              <a routerLink="/chat">Channels</a>
              <a routerLink="/chat">Direct Messages</a>
              <a routerLink="/chat">Explore Rooms</a>
            </div>
            <div class="footer-col">
              <h4>Architecture</h4>
              <a href="#architecture">STOMP WebSockets</a>
              <a href="#presence">Redis Heartbeats</a>
              <a href="#security">JWT Auth</a>
            </div>
            <div class="footer-col">
              <h4>Account</h4>
              <a routerLink="/login">Sign In</a>
              <a routerLink="/login">Create Account</a>
            </div>
          </div>
        </div>

        <div class="footer-bottom">
          <p>© 2026 PulseChat Platform. All rights reserved.</p>
        </div>
      </footer>
    </div>
  `,
  styles: [`
    .landing-page {
      position: relative;
      background-color: var(--bg-space);
      color: var(--text-primary);
      min-height: 100vh;
      overflow-x: hidden;
    }

    /* AMBIENT GLOWS */
    .ambient-glow {
      position: absolute;
      border-radius: 50%;
      pointer-events: none;
      filter: blur(120px);
      z-index: 0;
    }

    .glow-top-left {
      width: 550px;
      height: 550px;
      background: radial-gradient(circle, rgba(99, 102, 241, 0.18) 0%, transparent 70%);
      top: -100px;
      left: -100px;
    }

    .glow-top-right {
      width: 500px;
      height: 500px;
      background: radial-gradient(circle, rgba(168, 85, 247, 0.15) 0%, transparent 70%);
      top: 100px;
      right: -100px;
    }

    .glow-center {
      width: 700px;
      height: 700px;
      background: radial-gradient(circle, rgba(6, 182, 212, 0.08) 0%, transparent 70%);
      top: 40%;
      left: 30%;
    }

    /* NAVIGATION */
    .landing-nav {
      position: sticky;
      top: 16px;
      margin: 0 auto;
      max-width: 1200px;
      width: calc(100% - 32px);
      z-index: 100;
      border-radius: var(--radius-lg);
      padding: 12px 24px;
    }

    .nav-content {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .brand-logo {
      display: flex;
      align-items: center;
      gap: 10px;
      text-decoration: none;
      cursor: pointer;
    }

    .brand-icon {
      width: 36px;
      height: 36px;
      border-radius: var(--radius-sm);
      background: var(--brand-gradient);
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 0 15px rgba(99, 102, 241, 0.4);
    }

    .brand-name {
      font-size: 1.25rem;
      font-weight: 800;
      color: var(--text-white);
      letter-spacing: -0.02em;
    }

    .brand-name span {
      background: var(--brand-gradient);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    .nav-links {
      display: flex;
      align-items: center;
      gap: 28px;
    }

    .nav-link {
      color: var(--text-secondary);
      text-decoration: none;
      font-size: 0.9rem;
      font-weight: 500;
      transition: color var(--transition-fast);
    }

    .nav-link:hover {
      color: var(--text-primary);
    }

    .nav-actions {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    /* HERO SECTION */
    .hero-section {
      position: relative;
      padding: 90px 20px 60px;
      z-index: 10;
    }

    .hero-container {
      max-width: 1080px;
      margin: 0 auto;
      text-align: center;
      display: flex;
      flex-direction: column;
      align-items: center;
    }

    .hero-badge {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 6px 16px;
      border-radius: var(--radius-full);
      background: rgba(99, 102, 241, 0.12);
      border: 1px solid rgba(99, 102, 241, 0.3);
      font-size: 0.82rem;
      font-weight: 600;
      color: #a5b4fc;
      margin-bottom: 24px;
      animation: fadeIn 0.6s ease-out;
    }

    .hero-title {
      font-size: clamp(2.4rem, 5vw, 4rem);
      font-weight: 800;
      line-height: 1.12;
      letter-spacing: -0.03em;
      margin-bottom: 20px;
      max-width: 900px;
    }

    .gradient-text {
      background: var(--brand-gradient);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    .hero-description {
      font-size: 1.15rem;
      color: var(--text-secondary);
      max-width: 680px;
      line-height: 1.6;
      margin-bottom: 36px;
    }

    .hero-actions {
      display: flex;
      gap: 16px;
      margin-bottom: 48px;
      flex-wrap: wrap;
      justify-content: center;
    }

    /* STATS STRIP */
    .stats-strip {
      display: flex;
      align-items: center;
      justify-content: space-around;
      width: 100%;
      max-width: 860px;
      padding: 18px 24px;
      border-radius: var(--radius-lg);
      margin-bottom: 60px;
      gap: 16px;
    }

    .stat-item {
      display: flex;
      flex-direction: column;
      align-items: center;
    }

    .stat-number {
      font-size: 1.4rem;
      font-weight: 800;
      color: var(--text-white);
      font-family: var(--font-mono);
    }

    .stat-label {
      font-size: 0.78rem;
      color: var(--text-muted);
      font-weight: 500;
    }

    .stat-divider {
      width: 1px;
      height: 32px;
      background: var(--border-light);
    }

    /* INTERACTIVE DEMO WINDOW */
    .demo-window-wrapper {
      width: 100%;
      max-width: 860px;
      perspective: 1000px;
    }

    .demo-window {
      border-radius: var(--radius-lg);
      box-shadow: var(--shadow-lg), 0 0 50px rgba(99, 102, 241, 0.25);
      border: 1px solid var(--border-medium);
      overflow: hidden;
      text-align: left;
    }

    .demo-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 14px 20px;
      background: rgba(14, 20, 34, 0.8);
      border-bottom: 1px solid var(--border-light);
    }

    .demo-traffic-lights {
      display: flex;
      gap: 6px;
    }

    .light {
      width: 10px;
      height: 10px;
      border-radius: 50%;
    }
    .light.red { background: #ef4444; }
    .light.yellow { background: #f59e0b; }
    .light.green { background: #10b981; }

    .demo-room-info {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .demo-room-icon {
      color: var(--pulse-indigo);
      font-weight: 700;
    }

    .demo-room-name {
      font-weight: 700;
      font-size: 0.92rem;
      color: var(--text-white);
    }

    .demo-cluster-tag {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 0.75rem;
      color: var(--pulse-cyan);
      font-family: var(--font-mono);
    }

    .pulse-wave-icon {
      display: flex;
      gap: 2px;
      align-items: center;
    }

    .pulse-wave-icon span {
      width: 2px;
      height: 12px;
      background: var(--pulse-cyan);
      border-radius: 1px;
      animation: pulse-wave 1.2s infinite ease-in-out;
    }
    .pulse-wave-icon span:nth-child(2) { animation-delay: 0.2s; height: 16px; }
    .pulse-wave-icon span:nth-child(3) { animation-delay: 0.4s; height: 10px; }

    .demo-messages-stream {
      padding: 24px 20px;
      height: 280px;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 14px;
      background: rgba(11, 15, 25, 0.5);
    }

    .demo-msg-row {
      display: flex;
      gap: 12px;
      align-items: flex-end;
      animation: fadeIn 0.3s ease-out;
    }

    .demo-msg-row.self {
      justify-content: flex-end;
    }

    .avatar-sm {
      width: 32px;
      height: 32px;
      font-size: 0.8rem;
    }

    .demo-msg-bubble {
      max-width: 70%;
      padding: 10px 14px;
      border-radius: var(--radius-md);
      background: var(--bg-tertiary);
      border: 1px solid var(--border-light);
    }

    .demo-msg-row.self .demo-msg-bubble {
      background: var(--brand-gradient);
      color: white;
      border: none;
      box-shadow: 0 4px 14px rgba(99, 102, 241, 0.3);
    }

    .demo-msg-author {
      font-size: 0.75rem;
      font-weight: 700;
      color: var(--pulse-cyan);
      margin-bottom: 2px;
    }

    .demo-msg-text {
      font-size: 0.88rem;
      line-height: 1.4;
    }

    .demo-msg-time {
      display: block;
      font-size: 0.65rem;
      color: var(--text-muted);
      text-align: right;
      margin-top: 4px;
    }

    .demo-msg-row.self .demo-msg-time {
      color: rgba(255, 255, 255, 0.75);
    }

    .demo-typing-indicator {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 0.78rem;
      color: var(--text-muted);
      padding: 4px 8px;
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

    .demo-composer {
      display: flex;
      gap: 10px;
      padding: 14px 20px;
      background: rgba(17, 23, 40, 0.8);
      border-top: 1px solid var(--border-light);
    }

    .demo-input {
      flex: 1;
      padding: 10px 14px;
      background: var(--bg-input);
      border: 1px solid var(--border-light);
      border-radius: var(--radius-sm);
      color: var(--text-primary);
      font-size: 0.88rem;
      outline: none;
    }

    .demo-input:focus {
      border-color: var(--pulse-indigo);
    }

    /* SECTIONS */
    .section {
      padding: 100px 20px;
      position: relative;
      z-index: 10;
    }

    .section-container {
      max-width: 1100px;
      margin: 0 auto;
    }

    .section-header {
      text-align: center;
      margin-bottom: 60px;
    }

    .section-header h2 {
      font-size: clamp(1.8rem, 3.5vw, 2.5rem);
      font-weight: 800;
      letter-spacing: -0.02em;
      margin: 14px 0 12px;
      color: var(--text-white);
    }

    .section-header p {
      color: var(--text-secondary);
      font-size: 1.05rem;
      max-width: 620px;
      margin: 0 auto;
    }

    /* ARCHITECTURE DIAGRAM */
    .arch-diagram-grid {
      display: grid;
      grid-template-columns: 1fr auto 1fr auto 1fr;
      align-items: center;
      gap: 16px;
    }

    .arch-node {
      padding: 30px 24px;
      text-align: center;
      border-radius: var(--radius-lg);
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 12px;
    }

    .arch-node.highlight-node {
      border-color: var(--pulse-indigo);
      box-shadow: 0 0 30px rgba(99, 102, 241, 0.25);
    }

    .node-icon-box {
      font-size: 2rem;
      width: 56px;
      height: 56px;
      border-radius: var(--radius-md);
      background: var(--bg-tertiary);
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 4px;
    }

    .arch-node h3 {
      font-size: 1.1rem;
      font-weight: 700;
      color: var(--text-white);
    }

    .arch-node p {
      font-size: 0.85rem;
      color: var(--text-secondary);
      line-height: 1.5;
    }

    .node-badge {
      font-family: var(--font-mono);
      font-size: 0.72rem;
      padding: 3px 10px;
      border-radius: var(--radius-full);
      background: rgba(255, 255, 255, 0.06);
      color: var(--pulse-cyan);
    }

    .arch-flow-arrow {
      position: relative;
      width: 48px;
      height: 2px;
      background: var(--border-medium);
    }

    .flow-pulse {
      position: absolute;
      width: 8px;
      height: 8px;
      background: var(--pulse-cyan);
      border-radius: 50%;
      top: -3px;
      animation: flowAcross 2s infinite linear;
      box-shadow: 0 0 8px var(--pulse-cyan);
    }

    @keyframes flowAcross {
      0% { left: 0%; opacity: 0; }
      50% { opacity: 1; }
      100% { left: 100%; opacity: 0; }
    }

    /* FEATURES GRID */
    .features-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
      gap: 24px;
    }

    .feature-card {
      padding: 32px 28px;
      border-radius: var(--radius-lg);
      display: flex;
      flex-direction: column;
      gap: 14px;
      transition: all var(--transition-normal);
    }

    .feature-card:hover {
      transform: translateY(-4px);
      border-color: var(--border-accent);
      box-shadow: var(--shadow-md), var(--glow-indigo);
    }

    .feature-icon-box {
      width: 48px;
      height: 48px;
      border-radius: var(--radius-md);
      background: var(--brand-gradient-subtle);
      border: 1px solid var(--border-accent);
      color: var(--pulse-indigo);
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .feature-card h3 {
      font-size: 1.15rem;
      font-weight: 700;
      color: var(--text-white);
    }

    .feature-card p {
      font-size: 0.9rem;
      color: var(--text-secondary);
      line-height: 1.6;
    }

    .feature-preview-tag {
      margin-top: auto;
      font-size: 0.75rem;
      font-family: var(--font-mono);
      color: var(--pulse-purple);
    }

    /* SECURITY SECTION */
    .security-card {
      padding: 48px;
      border-radius: var(--radius-xl);
      display: grid;
      grid-template-columns: 1.4fr 1fr;
      align-items: center;
      gap: 40px;
    }

    .security-content h2 {
      font-size: 2rem;
      font-weight: 800;
      color: var(--text-white);
      margin: 12px 0;
    }

    .security-content p {
      color: var(--text-secondary);
      line-height: 1.6;
      margin-bottom: 24px;
    }

    .security-list {
      list-style: none;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .security-list li {
      display: flex;
      align-items: center;
      gap: 12px;
      font-size: 0.92rem;
      color: var(--text-primary);
    }

    .security-visual {
      display: flex;
      justify-content: center;
      align-items: center;
    }

    .shield-badge {
      width: 140px;
      height: 140px;
      border-radius: var(--radius-xl);
      background: rgba(16, 185, 129, 0.1);
      border: 2px solid rgba(16, 185, 129, 0.4);
      color: var(--status-online);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 8px;
      box-shadow: 0 0 40px rgba(16, 185, 129, 0.25);
      animation: float-slow 4s ease-in-out infinite;
    }

    .shield-status {
      font-size: 0.72rem;
      font-weight: 800;
      letter-spacing: 0.1em;
      color: var(--status-online);
    }

    /* CTA SECTION */
    .cta-section {
      padding-bottom: 120px;
    }

    .cta-card {
      position: relative;
      padding: 60px 40px;
      border-radius: var(--radius-xl);
      text-align: center;
      overflow: hidden;
      border: 1px solid var(--border-accent);
    }

    .cta-glow {
      position: absolute;
      width: 400px;
      height: 400px;
      background: radial-gradient(circle, rgba(168, 85, 247, 0.25) 0%, transparent 70%);
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      pointer-events: none;
    }

    .cta-card h2 {
      font-size: 2.2rem;
      font-weight: 800;
      color: var(--text-white);
      margin-bottom: 14px;
    }

    .cta-card p {
      color: var(--text-secondary);
      font-size: 1.1rem;
      max-width: 580px;
      margin: 0 auto 32px;
    }

    .cta-buttons {
      display: flex;
      justify-content: center;
      gap: 16px;
    }

    /* FOOTER */
    .landing-footer {
      background: var(--bg-primary);
      border-top: 1px solid var(--border-light);
      padding: 60px 20px 30px;
      position: relative;
      z-index: 10;
    }

    .footer-container {
      max-width: 1100px;
      margin: 0 auto;
      display: flex;
      justify-content: space-between;
      gap: 40px;
      margin-bottom: 40px;
      flex-wrap: wrap;
    }

    .footer-brand {
      max-width: 340px;
    }

    .footer-desc {
      font-size: 0.85rem;
      color: var(--text-muted);
      margin-top: 12px;
      line-height: 1.6;
    }

    .footer-links-group {
      display: flex;
      gap: 60px;
      flex-wrap: wrap;
    }

    .footer-col {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .footer-col h4 {
      font-size: 0.85rem;
      font-weight: 700;
      color: var(--text-white);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 6px;
    }

    .footer-col a {
      color: var(--text-secondary);
      text-decoration: none;
      font-size: 0.85rem;
      transition: color var(--transition-fast);
    }

    .footer-col a:hover {
      color: var(--text-white);
    }

    .footer-bottom {
      max-width: 1100px;
      margin: 0 auto;
      border-top: 1px solid var(--border-subtle);
      padding-top: 24px;
      text-align: center;
      font-size: 0.8rem;
      color: var(--text-muted);
    }

    /* RESPONSIVENESS */
    @media (max-width: 900px) {
      .nav-links { display: none; }
      .arch-diagram-grid {
        grid-template-columns: 1fr;
        gap: 20px;
      }
      .arch-flow-arrow {
        width: 2px;
        height: 24px;
        margin: 0 auto;
      }
      .security-card {
        grid-template-columns: 1fr;
        padding: 32px 24px;
      }
      .security-visual { display: none; }
    }
  `]
})
export class LandingComponent implements OnInit, OnDestroy {
  demoInputText = '';
  simulatedTyping = signal<string | null>(null);

  demoMessages = signal<DemoMessage[]>([
    {
      id: '1',
      sender: 'Alex (Backend)',
      avatarClass: 'avatar-gradient-1',
      content: 'STOMP broker connected over SockJS. Redis fan-out is active!',
      time: '10:42 AM',
      isSelf: false
    },
    {
      id: '2',
      sender: 'Maya (Design)',
      avatarClass: 'avatar-gradient-3',
      content: 'The new real-time presence indicators look incredible.',
      time: '10:43 AM',
      isSelf: false
    },
    {
      id: '3',
      sender: 'Jordan (DevOps)',
      avatarClass: 'avatar-gradient-2',
      content: 'MySQL transactions and Spring Boot Virtual Threads are cruising at <15ms latency.',
      time: '10:43 AM',
      isSelf: false
    }
  ]);

  private timerRef?: any;

  constructor(public authService: AuthService, private router: Router) {}

  ngOnInit(): void {
    // Simulated typing cycle for live demo effect
    let step = 0;
    this.timerRef = setInterval(() => {
      step++;
      if (step % 4 === 1) {
        this.simulatedTyping.set('Maya');
      } else if (step % 4 === 2) {
        this.simulatedTyping.set(null);
        if (this.demoMessages().length < 6) {
          this.demoMessages.update(msgs => [
            ...msgs,
            {
              id: String(Date.now()),
              sender: 'Maya (Design)',
              avatarClass: 'avatar-gradient-3',
              content: 'Sending live events through /app/chat.typing in real-time!',
              time: 'Just now',
              isSelf: false
            }
          ]);
        }
      } else {
        this.simulatedTyping.set(null);
      }
    }, 4500);
  }

  ngOnDestroy(): void {
    if (this.timerRef) {
      clearInterval(this.timerRef);
    }
  }

  sendDemoMessage(): void {
    if (!this.demoInputText.trim()) return;

    const userText = this.demoInputText.trim();
    this.demoInputText = '';

    this.demoMessages.update(msgs => [
      ...msgs,
      {
        id: String(Date.now()),
        sender: 'You',
        avatarClass: 'avatar-gradient-4',
        content: userText,
        time: 'Just now',
        isSelf: true
      }
    ]);

    // Simulated quick response
    setTimeout(() => {
      this.demoMessages.update(msgs => [
        ...msgs,
        {
          id: String(Date.now() + 1),
          sender: 'PulseBot',
          avatarClass: 'avatar-gradient-1',
          content: `⚡ Received! WebSocket STOMP message delivered with sub-millisecond dispatch.`,
          time: 'Just now',
          isSelf: false
        }
      ]);
    }, 900);
  }
}
