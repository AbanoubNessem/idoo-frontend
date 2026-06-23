import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthFacade } from '../../../core/auth/facades/auth.facade';
import { AuthFlowStore } from '../../../core/auth/state/auth-flow.store';
import { ButtonSpinnerComponent } from '../../../shared/components/button-spinner/button-spinner.component';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule, ButtonSpinnerComponent],
  template: `
    <div class="auth-card">
      <div class="login-header">
        <h2>Welcome back</h2>
        <p>Please sign in to your account</p>
      </div>

      <form class="login-form" [formGroup]="loginForm" (ngSubmit)="onSubmit()">
        <div class="form-group">
          <label for="email">Email or Username</label>
          <div class="input-wrapper">
            <svg class="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
              <circle cx="12" cy="7" r="4"></circle>
            </svg>
            <input
              type="text"
              id="email"
              formControlName="email"
              placeholder="Enter your email or username"
              aria-label="Email or username"
              autocomplete="email" />
          </div>
          <div *ngIf="loginForm.get('email')?.touched && loginForm.get('email')?.invalid" class="error-text" role="alert">
            Valid email or username is required
          </div>
        </div>

        <div class="form-group">
          <label for="password">Password</label>
          <div class="input-wrapper">
            <svg class="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
            </svg>
            <input
              [type]="showPassword ? 'text' : 'password'"
              id="password"
              formControlName="password"
              placeholder="Enter your password"
              aria-label="Password"
              autocomplete="current-password" />
            <button type="button" class="password-toggle" (click)="togglePassword()" [attr.aria-label]="showPassword ? 'Hide password' : 'Show password'">
              <svg *ngIf="!showPassword" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                <circle cx="12" cy="12" r="3"></circle>
              </svg>
              <svg *ngIf="showPassword" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"></path>
                <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"></path>
                <line x1="1" y1="1" x2="23" y2="23"></line>
              </svg>
            </button>
          </div>
          <div *ngIf="loginForm.get('password')?.touched && loginForm.get('password')?.invalid" class="error-text" role="alert">
            Password is required
          </div>
        </div>

        <div class="form-options">
          <label class="checkbox-container">
            <input type="checkbox" formControlName="rememberMe" />
            <span class="checkmark"></span>
            <span>Remember me</span>
          </label>
          <a href="#" class="forgot-link">Forgot password?</a>
        </div>

        <div *ngIf="error()" class="error-message" role="alert">
          {{ error() }}
        </div>

        <app-button-spinner type="submit" [loading]="loading()">
          Sign In
        </app-button-spinner>

        <div class="divider">
          <span>or continue with</span>
        </div>

        <button type="button" class="btn-google">
          <svg viewBox="0 0 24 24" width="20" height="20">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Sign in with Google
        </button>
      </form>

      <div class="security-note">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" width="16" height="16">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
        </svg>
        <span>Secure access with enterprise-grade protection</span>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 100%;
    }

    .auth-card {
      width: 430px;
      max-width: calc(100vw - 32px);
      background-color: var(--color-surface);
      border-radius: 20px;
      padding: 40px 40px 32px;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.12), 0 4px 20px rgba(0, 0, 0, 0.06);
      border: 1px solid rgba(226, 232, 240, 0.8);
    }

    /* Header */
    .login-header {
      text-align: center;
      margin-bottom: 28px;
    }

    .login-header h2 {
      font-size: 26px;
      font-weight: 700;
      color: var(--color-text-primary);
      margin: 0 0 6px;
      letter-spacing: -0.3px;
    }

    .login-header p {
      color: var(--color-text-secondary);
      font-size: 14px;
      margin: 0;
    }

    /* Form */
    .login-form {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .form-group label {
      font-weight: 500;
      font-size: 13px;
      color: var(--color-text-primary);
      letter-spacing: 0.1px;
    }

    /* Inputs */
    .input-wrapper {
      position: relative;
      display: flex;
      align-items: center;
    }

    .input-icon {
      position: absolute;
      left: 12px;
      width: 17px;
      height: 17px;
      color: var(--color-text-secondary);
      flex-shrink: 0;
      pointer-events: none;
    }

    .form-group input {
      padding: 11px 40px 11px 38px;
      border: 1.5px solid var(--color-border);
      border-radius: 10px;
      font-size: 14px;
      outline: none;
      transition: border-color 0.15s, box-shadow 0.15s, background 0.15s;
      width: 100%;
      background-color: #FAFBFC;
      color: var(--color-text-primary);
      font-family: inherit;
    }

    .form-group input::placeholder {
      color: #B0BAC9;
    }

    .form-group input:focus {
      border-color: var(--color-primary);
      box-shadow: 0 0 0 3px rgba(15, 98, 254, 0.1);
      background-color: var(--color-surface);
    }

    .form-group input.ng-touched.ng-invalid {
      border-color: var(--color-danger);
      box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
    }

    /* Password toggle */
    .password-toggle {
      position: absolute;
      right: 10px;
      background: none;
      border: none;
      cursor: pointer;
      color: var(--color-text-secondary);
      padding: 4px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 4px;
      transition: color 0.15s;
    }

    .password-toggle svg {
      width: 17px;
      height: 17px;
    }

    .password-toggle:hover {
      color: var(--color-text-primary);
    }

    /* Error states */
    .error-text {
      color: var(--color-danger);
      font-size: 12px;
    }

    .error-message {
      color: var(--color-danger);
      background-color: #FFF5F5;
      border: 1px solid rgba(239, 68, 68, 0.2);
      padding: 10px 14px;
      border-radius: 10px;
      font-size: 13px;
      text-align: center;
    }

    /* Form Options */
    .form-options {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 13px;
      margin-top: -4px;
    }

    .checkbox-container {
      display: flex;
      align-items: center;
      gap: 8px;
      cursor: pointer;
      color: var(--color-text-secondary);
      user-select: none;
    }

    .checkbox-container input[type="checkbox"] {
      width: 15px;
      height: 15px;
      accent-color: var(--color-primary);
      cursor: pointer;
    }

    .forgot-link {
      color: var(--color-primary);
      text-decoration: none;
      font-weight: 500;
      font-size: 13px;
      transition: opacity 0.15s;
    }

    .forgot-link:hover {
      opacity: 0.8;
      text-decoration: underline;
    }

    /* Divider */
    .divider {
      display: flex;
      align-items: center;
      gap: 12px;
      margin: 4px 0;
    }

    .divider::before,
    .divider::after {
      content: '';
      flex: 1;
      height: 1px;
      background-color: var(--color-border);
    }

    .divider span {
      font-size: 12px;
      color: var(--color-text-secondary);
      white-space: nowrap;
    }

    /* Google Button */
    .btn-google {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      width: 100%;
      padding: 11px 16px;
      background-color: var(--color-surface);
      border: 1.5px solid var(--color-border);
      border-radius: 10px;
      font-size: 14px;
      font-weight: 500;
      color: var(--color-text-primary);
      cursor: pointer;
      transition: all 0.15s;
      font-family: inherit;
    }

    .btn-google:hover {
      background-color: var(--color-background);
      border-color: var(--color-border-hover);
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
    }

    /* Security note */
    .security-note {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      margin-top: 20px;
      color: var(--color-text-secondary);
      font-size: 12px;
    }

    .security-note svg {
      color: var(--color-text-secondary);
      flex-shrink: 0;
    }
  `]
})
export class LoginComponent implements OnInit {
  private fb = inject(FormBuilder);
  private authFacade = inject(AuthFacade);
  private authFlowStore = inject(AuthFlowStore);

  loginForm!: FormGroup;
  showPassword = false;

  readonly loading = this.authFlowStore.loading;
  readonly error = this.authFlowStore.error;

  constructor() {}

  ngOnInit(): void {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required]],
      password: ['', [Validators.required]],
      rememberMe: [false]
    });
  }

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    const credentials = {
      email: this.loginForm.value.email,
      password: this.loginForm.value.password
    };

    this.authFacade.login(credentials);
  }
}
