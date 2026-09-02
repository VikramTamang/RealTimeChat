import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/auth.service';

@Component({
  selector: 'app-auth',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="auth-container">
      <div class="auth-background-glow"></div>

      <div class="auth-card glass-panel">
        <div class="auth-header">
          <div class="logo-badge">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
            </svg>
          </div>
          <h1>PulseChat</h1>
          <p class="subtitle">Distributed Real-Time Messaging Platform</p>
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

        <!-- LOGIN FORM -->
        @if (isLoginMode()) {
          <form (ngSubmit)="onLogin()" class="auth-form">
            <div class="form-group">
              <label class="form-label" for="loginUser">Username or Email</label>
              <input 
                id="loginUser"
                type="text" 
                class="form-input" 
                [(ngModel)]="loginData.usernameOrEmail" 
                name="usernameOrEmail" 
                placeholder="e.g. alex or alex@example.com" 
                required 
                autofocus />
            </div>

            <div class="form-group">
              <label class="form-label" for="loginPass">Password</label>
              <input 
                id="loginPass"
                type="password" 
                class="form-input" 
                [(ngModel)]="loginData.password" 
                name="password" 
                placeholder="••••••••" 
                required />
            </div>

            <button type="submit" class="btn btn-primary btn-block" [disabled]="isLoading()">
              @if (isLoading()) {
                <span class="spinner"></span> Authenticating...
              } @else {
                Sign In to Chat
              }
            </button>
          </form>
        } @else {
          <!-- REGISTER FORM -->
          <form (ngSubmit)="onRegister()" class="auth-form">
            <div class="form-group">
              <label class="form-label" for="regUsername">Username</label>
              <input 
                id="regUsername"
                type="text" 
                class="form-input" 
                [(ngModel)]="registerData.username" 
                name="username" 
                placeholder="e.g. SarahConnor" 
                required />
            </div>

            <div class="form-group">
              <label class="form-label" for="regEmail">Email Address</label>
              <input 
                id="regEmail"
                type="email" 
                class="form-input" 
                [(ngModel)]="registerData.email" 
                name="email" 
                placeholder="sarah@example.com" 
                required />
            </div>

            <div class="form-group">
              <label class="form-label" for="regPass">Password</label>
              <input 
                id="regPass"
                type="password" 
                class="form-input" 
                [(ngModel)]="registerData.password" 
                name="password" 
                placeholder="At least 6 characters" 
                minlength="6" 
                required />
            </div>

            <button type="submit" class="btn btn-primary btn-block" [disabled]="isLoading()">
              @if (isLoading()) {
                <span class="spinner"></span> Creating Account...
              } @else {
                Create My Account
              }
            </button>
          </form>
        }

        <div class="auth-footer">
          <div class="feature-tag">
            <span class="pulse-indicator"></span>
            Spring Boot 3.5 • Redis Pub/Sub • STOMP
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .auth-container {
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      background: radial-gradient(circle at 50% 20%, #1e1b4b 0%, var(--bg-primary) 70%);
      padding: 24px;
      overflow: hidden;
    }

    .auth-background-glow {
      position: absolute;
      width: 600px;
      height: 600px;
      background: radial-gradient(circle, rgba(99, 102, 241, 0.15) 0%, transparent 70%);
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      pointer-events: none;
      filter: blur(40px);
    }

    .auth-card {
      position: relative;
      width: 100%;
      max-width: 440px;
      padding: 36px 32px;
      border-radius: var(--radius-lg);
      box-shadow: var(--shadow-lg);
      z-index: 10;
      animation: fadeIn 0.4s ease-out;
    }

    .auth-header {
      text-align: center;
      margin-bottom: 24px;
    }

    .logo-badge {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 56px;
      height: 56px;
      background: var(--accent-gradient);
      border-radius: var(--radius-md);
      color: white;
      margin-bottom: 16px;
      box-shadow: 0 4px 20px rgba(99, 102, 241, 0.4);
    }

    .auth-header h1 {
      font-size: 1.8rem;
      font-weight: 800;
      letter-spacing: -0.02em;
      background: linear-gradient(135deg, #ffffff 0%, #cbd5e1 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    .subtitle {
      font-size: 0.88rem;
      color: var(--text-secondary);
      margin-top: 4px;
    }

    .tab-switcher {
      display: flex;
      background: var(--bg-tertiary);
      padding: 4px;
      border-radius: var(--radius-md);
      margin-bottom: 24px;
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
      transition: all 0.2s;
    }

    .tab-btn.active {
      background: var(--bg-card);
      color: var(--text-primary);
      box-shadow: var(--shadow-sm);
    }

    .alert-banner {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 12px 14px;
      border-radius: var(--radius-md);
      font-size: 0.85rem;
      margin-bottom: 20px;
    }

    .alert-banner.error {
      background: rgba(239, 68, 68, 0.15);
      border: 1px solid rgba(239, 68, 68, 0.3);
      color: #fca5a5;
    }

    .auth-form {
      display: flex;
      flex-direction: column;
    }

    .btn-block {
      width: 100%;
      padding: 14px;
      font-size: 0.95rem;
      margin-top: 10px;
    }

    .auth-footer {
      margin-top: 28px;
      text-align: center;
      border-top: 1px solid var(--border-light);
      padding-top: 18px;
    }

    .feature-tag {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      font-size: 0.78rem;
      font-weight: 500;
      color: var(--text-muted);
    }

    .pulse-indicator {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background-color: var(--status-online);
      box-shadow: 0 0 8px rgba(16, 185, 129, 0.8);
      animation: pulse-dot 2s infinite;
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

    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  `]
})
export class AuthComponent {
  isLoginMode = signal<boolean>(true);
  isLoading = signal<boolean>(false);
  errorMessage = signal<string | null>(null);

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

  setMode(isLogin: boolean): void {
    this.isLoginMode.set(isLogin);
    this.errorMessage.set(null);
  }

  onLogin(): void {
    if (!this.loginData.usernameOrEmail || !this.loginData.password) {
      this.errorMessage.set('Please fill in all fields');
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
        this.errorMessage.set(err.error?.message || 'Invalid username or password');
      }
    });
  }

  onRegister(): void {
    if (!this.registerData.username || !this.registerData.email || !this.registerData.password) {
      this.errorMessage.set('Please fill in all fields');
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
        this.errorMessage.set(err.error?.message || 'Failed to register account');
      }
    });
  }
}
