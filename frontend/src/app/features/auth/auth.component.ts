import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth.service';

@Component({
  selector: 'app-auth',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="auth-split-wrapper">
      <!-- AMBIENT BACKGROUND GLOWS -->
      <div class="ambient-glow glow-left"></div>
      <div class="ambient-glow glow-right"></div>

      <!-- LEFT COLUMN: BRAND VISUAL & IDENTITY -->
      <div class="auth-brand-side">
        <div class="brand-side-content">
          <!-- Logo & Name -->
          <div class="brand-header" routerLink="/">
            <div class="brand-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"></path>
              </svg>
            </div>
            <span class="brand-title">Pulse<span>Chat</span></span>
          </div>

          <!-- Hero Statement -->
          <div class="brand-statement">
            <h2>Real-time messaging engineered for the future.</h2>
            <p>Connect instantly with low-latency STOMP channels, direct conversations, live presence signals, and active typing feedback.</p>
          </div>

          <!-- Animated Network Visual Card -->
          <div class="pulse-visual-card glass-panel">
            <div class="visual-card-header">
              <div class="live-beacon">
                <span class="status-dot online"></span>
                <span>Active Cluster Node</span>
              </div>
              <span class="cluster-id">node-us-east-01</span>
            </div>

            <div class="visual-waveform">
              <span class="wave-bar"></span>
              <span class="wave-bar"></span>
              <span class="wave-bar"></span>
              <span class="wave-bar"></span>
              <span class="wave-bar"></span>
              <span class="wave-bar"></span>
              <span class="wave-bar"></span>
              <span class="wave-bar"></span>
              <span class="wave-bar"></span>
              <span class="wave-bar"></span>
            </div>

            <div class="visual-features">
              <div class="feature-chip">
                <span class="chip-dot"></span> Java 21 Concurrency
              </div>
              <div class="feature-chip">
                <span class="chip-dot"></span> Spring STOMP / WS
              </div>
              <div class="feature-chip">
                <span class="chip-dot"></span> Stateless JWT
              </div>
            </div>
          </div>

          <!-- Footer Testimonial / Tag -->
          <div class="brand-footer-note">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2.5">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
            </svg>
            <span>Protected with stateless HMAC-SHA256 JWT cryptography</span>
          </div>
        </div>
      </div>

      <!-- RIGHT COLUMN: AUTHENTICATION FORM -->
      <div class="auth-form-side">
        <div class="form-container glass-panel">
          <!-- Mobile Brand Header (Visible only on small screens) -->
          <div class="mobile-brand-header">
            <div class="brand-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"></path>
              </svg>
            </div>
            <span class="brand-title">Pulse<span>Chat</span></span>
          </div>

          <!-- Form Header & Switcher Tabs -->
          <div class="form-header">
            <h1>{{ isLoginMode() ? 'Welcome back' : 'Create an account' }}</h1>
            <p class="form-subtitle">
              {{ isLoginMode() ? 'Sign in to access your channels and direct messages.' : 'Start communicating with your team in real time.' }}
            </p>
          </div>

          <div class="tab-switcher">
            <button 
              type="button" 
              class="tab-btn" 
              [class.active]="isLoginMode()" 
              (click)="setMode(true)">
              Sign In
            </button>
            <button 
              type="button" 
              class="tab-btn" 
              [class.active]="!isLoginMode()" 
              (click)="setMode(false)">
              Create Account
            </button>
          </div>

          <!-- Alert Error Banner -->
          @if (errorMessage()) {
            <div class="alert-banner error">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
              <span>{{ errorMessage() }}</span>
            </div>
          }

          <!-- SIGN IN FORM -->
          @if (isLoginMode()) {
            <form (ngSubmit)="onLogin()" class="auth-form">
              <div class="form-group">
                <label class="form-label" for="loginUser">Username or Email</label>
                <div class="input-with-icon">
                  <svg class="input-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                    <circle cx="12" cy="7" r="4"></circle>
                  </svg>
                  <input 
                    id="loginUser"
                    type="text" 
                    class="form-input icon-input" 
                    [(ngModel)]="loginData.usernameOrEmail" 
                    name="usernameOrEmail" 
                    placeholder="e.g. alex or alex@example.com" 
                    required 
                    autofocus />
                </div>
              </div>

              <div class="form-group">
                <div class="label-row">
                  <label class="form-label" for="loginPass">Password</label>
                </div>
                <div class="input-with-icon">
                  <svg class="input-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                  </svg>
                  <input 
                    id="loginPass"
                    [type]="showPassword() ? 'text' : 'password'" 
                    class="form-input icon-input" 
                    [(ngModel)]="loginData.password" 
                    name="password" 
                    placeholder="Enter your password" 
                    required />
                  <button type="button" class="pwd-toggle-btn" (click)="togglePassword()">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      @if (showPassword()) {
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                        <line x1="1" y1="1" x2="23" y2="23"></line>
                      } @else {
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                        <circle cx="12" cy="12" r="3"></circle>
                      }
                    </svg>
                  </button>
                </div>
              </div>

              <button type="submit" class="btn btn-primary btn-block btn-lg" [disabled]="isLoading()">
                @if (isLoading()) {
                  <span class="spinner"></span> Authenticating...
                } @else {
                  <span>Sign In</span>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                    <polyline points="12 5 19 12 12 19"></polyline>
                  </svg>
                }
              </button>
            </form>
          } @else {
            <!-- CREATE ACCOUNT FORM -->
            <form (ngSubmit)="onRegister()" class="auth-form">
              <div class="form-group">
                <label class="form-label" for="regUsername">Choose a Username</label>
                <div class="input-with-icon">
                  <svg class="input-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                    <circle cx="12" cy="7" r="4"></circle>
                  </svg>
                  <input 
                    id="regUsername"
                    type="text" 
                    class="form-input icon-input" 
                    [(ngModel)]="registerData.username" 
                    name="username" 
                    placeholder="e.g. MayaLin" 
                    required 
                    autofocus />
                </div>
              </div>

              <div class="form-group">
                <label class="form-label" for="regEmail">Email Address</label>
                <div class="input-with-icon">
                  <svg class="input-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                    <polyline points="22,6 12,13 2,6"></polyline>
                  </svg>
                  <input 
                    id="regEmail"
                    type="email" 
                    class="form-input icon-input" 
                    [(ngModel)]="registerData.email" 
                    name="email" 
                    placeholder="maya@example.com" 
                    required />
                </div>
              </div>

              <div class="form-group">
                <label class="form-label" for="regPass">Create Password</label>
                <div class="input-with-icon">
                  <svg class="input-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                  </svg>
                  <input 
                    id="regPass"
                    [type]="showPassword() ? 'text' : 'password'" 
                    class="form-input icon-input" 
                    [(ngModel)]="registerData.password" 
                    name="password" 
                    placeholder="At least 6 characters" 
                    minlength="6" 
                    required />
                  <button type="button" class="pwd-toggle-btn" (click)="togglePassword()">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      @if (showPassword()) {
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                        <line x1="1" y1="1" x2="23" y2="23"></line>
                      } @else {
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                        <circle cx="12" cy="12" r="3"></circle>
                      }
                    </svg>
                  </button>
                </div>
              </div>

              <button type="submit" class="btn btn-primary btn-block btn-lg" [disabled]="isLoading()">
                @if (isLoading()) {
                  <span class="spinner"></span> Creating Account...
                } @else {
                  <span>Create Account</span>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                    <polyline points="12 5 19 12 12 19"></polyline>
                  </svg>
                }
              </button>
            </form>
          }

          <!-- Form Footer Notice -->
          <div class="form-footer-terms">
            <span>By continuing, you connect to the PulseChat distributed cluster.</span>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .auth-split-wrapper {
      display: flex;
      min-height: 100vh;
      background-color: var(--bg-space);
      position: relative;
      overflow: hidden;
    }

    .ambient-glow {
      position: absolute;
      border-radius: 50%;
      pointer-events: none;
      filter: blur(140px);
      z-index: 0;
    }

    .glow-left {
      width: 600px;
      height: 600px;
      background: radial-gradient(circle, rgba(99, 102, 241, 0.2) 0%, transparent 70%);
      top: -100px;
      left: -100px;
    }

    .glow-right {
      width: 550px;
      height: 550px;
      background: radial-gradient(circle, rgba(168, 85, 247, 0.15) 0%, transparent 70%);
      bottom: -100px;
      right: -100px;
    }

    /* LEFT BRAND SIDE */
    .auth-brand-side {
      flex: 1.1;
      padding: 60px 48px;
      display: flex;
      flex-direction: column;
      justify-content: center;
      position: relative;
      z-index: 10;
      border-right: 1px solid var(--border-subtle);
      background: radial-gradient(circle at 20% 50%, rgba(23, 32, 54, 0.5) 0%, transparent 80%);
    }

    .brand-side-content {
      max-width: 520px;
      margin: 0 auto;
      display: flex;
      flex-direction: column;
      gap: 36px;
    }

    .brand-header {
      display: flex;
      align-items: center;
      gap: 12px;
      text-decoration: none;
      cursor: pointer;
    }

    .brand-icon {
      width: 44px;
      height: 44px;
      border-radius: var(--radius-md);
      background: var(--brand-gradient);
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 0 20px rgba(99, 102, 241, 0.4);
    }

    .brand-title {
      font-size: 1.6rem;
      font-weight: 800;
      color: var(--text-white);
      letter-spacing: -0.02em;
    }

    .brand-title span {
      background: var(--brand-gradient);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    .brand-statement h2 {
      font-size: 2.2rem;
      font-weight: 800;
      line-height: 1.2;
      letter-spacing: -0.02em;
      color: var(--text-white);
      margin-bottom: 14px;
    }

    .brand-statement p {
      color: var(--text-secondary);
      font-size: 1.05rem;
      line-height: 1.6;
    }

    /* VISUAL CARD */
    .pulse-visual-card {
      padding: 24px;
      border-radius: var(--radius-lg);
      border: 1px solid var(--border-medium);
      display: flex;
      flex-direction: column;
      gap: 20px;
      box-shadow: var(--shadow-md);
    }

    .visual-card-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .live-beacon {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 0.82rem;
      font-weight: 600;
      color: #6ee7b7;
    }

    .cluster-id {
      font-family: var(--font-mono);
      font-size: 0.72rem;
      color: var(--text-muted);
    }

    .visual-waveform {
      display: flex;
      align-items: center;
      gap: 6px;
      height: 48px;
      padding: 0 10px;
    }

    .wave-bar {
      flex: 1;
      background: var(--brand-gradient);
      border-radius: 4px;
      animation: pulse-wave 1.5s infinite ease-in-out;
    }

    .wave-bar:nth-child(1) { height: 35%; animation-delay: 0.1s; }
    .wave-bar:nth-child(2) { height: 65%; animation-delay: 0.3s; }
    .wave-bar:nth-child(3) { height: 95%; animation-delay: 0.5s; }
    .wave-bar:nth-child(4) { height: 50%; animation-delay: 0.2s; }
    .wave-bar:nth-child(5) { height: 80%; animation-delay: 0.4s; }
    .wave-bar:nth-child(6) { height: 100%; animation-delay: 0.6s; }
    .wave-bar:nth-child(7) { height: 45%; animation-delay: 0.25s; }
    .wave-bar:nth-child(8) { height: 70%; animation-delay: 0.45s; }
    .wave-bar:nth-child(9) { height: 85%; animation-delay: 0.15s; }
    .wave-bar:nth-child(10) { height: 40%; animation-delay: 0.35s; }

    .visual-features {
      display: flex;
      gap: 10px;
      flex-wrap: wrap;
    }

    .feature-chip {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 5px 12px;
      border-radius: var(--radius-full);
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid var(--border-subtle);
      font-size: 0.75rem;
      font-weight: 500;
      color: var(--text-secondary);
    }

    .chip-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: var(--pulse-cyan);
    }

    .brand-footer-note {
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 0.82rem;
      color: var(--text-muted);
    }

    /* RIGHT FORM SIDE */
    .auth-form-side {
      flex: 1;
      padding: 60px 48px;
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
      z-index: 10;
    }

    .form-container {
      width: 100%;
      max-width: 440px;
      padding: 38px 34px;
      border-radius: var(--radius-xl);
      box-shadow: var(--shadow-lg);
      animation: fadeIn 0.4s ease-out;
    }

    .mobile-brand-header {
      display: none;
      align-items: center;
      gap: 10px;
      margin-bottom: 24px;
    }

    .form-header {
      margin-bottom: 22px;
    }

    .form-header h1 {
      font-size: 1.6rem;
      font-weight: 800;
      letter-spacing: -0.02em;
      color: var(--text-white);
    }

    .form-subtitle {
      font-size: 0.88rem;
      color: var(--text-secondary);
      margin-top: 4px;
    }

    .tab-switcher {
      display: flex;
      background: var(--bg-input);
      padding: 4px;
      border-radius: var(--radius-md);
      margin-bottom: 22px;
      border: 1px solid var(--border-light);
    }

    .tab-btn {
      flex: 1;
      padding: 10px;
      font-size: 0.88rem;
      font-weight: 600;
      background: transparent;
      border: none;
      color: var(--text-muted);
      border-radius: var(--radius-sm);
      cursor: pointer;
      transition: all var(--transition-fast);
    }

    .tab-btn.active {
      background: var(--bg-tertiary);
      color: var(--text-white);
      box-shadow: var(--shadow-sm);
    }

    .alert-banner {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 12px 14px;
      border-radius: var(--radius-md);
      font-size: 0.85rem;
      margin-bottom: 18px;
    }

    .alert-banner.error {
      background: rgba(239, 68, 68, 0.15);
      border: 1px solid rgba(239, 68, 68, 0.3);
      color: #fca5a5;
    }

    .input-with-icon {
      position: relative;
      display: flex;
      align-items: center;
    }

    .input-icon {
      position: absolute;
      left: 14px;
      color: var(--text-muted);
      pointer-events: none;
    }

    .form-input.icon-input {
      padding-left: 42px;
      padding-right: 42px;
    }

    .pwd-toggle-btn {
      position: absolute;
      right: 12px;
      background: transparent;
      border: none;
      color: var(--text-muted);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 4px;
    }

    .pwd-toggle-btn:hover {
      color: var(--text-primary);
    }

    .btn-block {
      width: 100%;
      margin-top: 8px;
    }

    .form-footer-terms {
      margin-top: 24px;
      text-align: center;
      font-size: 0.75rem;
      color: var(--text-muted);
      line-height: 1.4;
    }

    .spinner {
      width: 16px;
      height: 16px;
      border: 2px solid rgba(255, 255, 255, 0.3);
      border-top-color: white;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
      display: inline-block;
      margin-right: 6px;
    }

    /* RESPONSIVE */
    @media (max-width: 960px) {
      .auth-brand-side { display: none; }
      .mobile-brand-header { display: flex; }
      .auth-form-side { padding: 40px 20px; }
    }
  `]
})
export class AuthComponent implements OnInit {
  isLoginMode = signal<boolean>(true);
  isLoading = signal<boolean>(false);
  errorMessage = signal<string | null>(null);
  showPassword = signal<boolean>(false);

  loginData = {
    usernameOrEmail: '',
    password: ''
  };

  registerData = {
    username: '',
    email: '',
    password: ''
  };

  constructor(private authService: AuthService, private router: Router) {}

  ngOnInit(): void {
    // If already logged in, redirect straight to chat
    if (this.authService.isAuthenticated()) {
      this.router.navigate(['/chat']);
    }
  }

  setMode(isLogin: boolean): void {
    this.isLoginMode.set(isLogin);
    this.errorMessage.set(null);
  }

  togglePassword(): void {
    this.showPassword.update(v => !v);
  }

  onLogin(): void {
    if (!this.loginData.usernameOrEmail.trim() || !this.loginData.password.trim()) {
      this.errorMessage.set('Please fill in your username/email and password.');
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.authService.login(this.loginData).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.router.navigate(['/chat']);
      },
      error: (err) => {
        this.isLoading.set(false);
        this.errorMessage.set(err.error?.message || 'Invalid username/email or password.');
      }
    });
  }

  onRegister(): void {
    if (!this.registerData.username.trim() || !this.registerData.email.trim() || !this.registerData.password.trim()) {
      this.errorMessage.set('Please fill in all registration fields.');
      return;
    }

    if (this.registerData.password.length < 6) {
      this.errorMessage.set('Password must be at least 6 characters.');
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.authService.register(this.registerData).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.router.navigate(['/chat']);
      },
      error: (err) => {
        this.isLoading.set(false);
        this.errorMessage.set(err.error?.message || 'Failed to register account. Username or email may already exist.');
      }
    });
  }
}
