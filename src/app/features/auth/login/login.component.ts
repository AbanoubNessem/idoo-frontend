import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { AuthFacade } from '../../../core/auth/facades/auth.facade';
import { AuthStateService } from '../../../core/auth/state/auth.state';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule],
  template: `
    <div class="login-card">
      <div class="login-header">
        <h1 class="brand-logo">iDoo <span>ERP</span></h1>
        <h2>Welcome back</h2>
        <p>Please sign in to your account</p>
      </div>

      <form class="login-form" [formGroup]="loginForm" (ngSubmit)="onSubmit()">
        <div class="form-group">
          <label for="email">Email or Username</label>
          <input type="text" id="email" formControlName="email" placeholder="Enter your email" />
          <div *ngIf="loginForm.get('email')?.touched && loginForm.get('email')?.invalid" class="error-text">
            Valid email or username is required
          </div>
        </div>

        <div class="form-group">
          <label for="password">Password</label>
          <input type="password" id="password" formControlName="password" placeholder="••••••••" />
          <div *ngIf="loginForm.get('password')?.touched && loginForm.get('password')?.invalid" class="error-text">
            Password is required
          </div>
        </div>

        <div class="form-options">
          <label class="checkbox-container">
            <input type="checkbox" formControlName="rememberMe" />
            <span class="checkmark"></span>
            Remember me
          </label>
          <a href="#" class="forgot-link">Forgot password?</a>
        </div>

        <div *ngIf="errorMessage" class="error-message">
          {{ errorMessage }}
        </div>

        <button type="submit" class="btn-primary" [disabled]="isLoading()">
          {{ isLoading() ? 'Signing in...' : 'Sign In' }}
        </button>
      </form>
    </div>
  `,
  styles: [`
    .login-card {
      background-color: var(--color-background);
      border-radius: var(--radius-lg);
      padding: var(--spacing-8);
      box-shadow: var(--shadow-2);
      border: 1px solid var(--color-border);
      width: 100%;
    }
    .login-header {
      text-align: center;
      margin-bottom: var(--spacing-6);
    }
    .brand-logo {
      color: var(--color-primary);
      margin-bottom: var(--spacing-4);
    }
    .brand-logo span {
      color: var(--color-text-secondary);
      font-weight: 400;
    }
    .login-header h2 {
      margin-bottom: var(--spacing-2);
    }
    .login-header p {
      color: var(--color-text-secondary);
      font-size: var(--body-size);
      margin: 0;
    }
    .login-form {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-4);
    }
    .form-group {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-2);
    }
    .form-group label {
      font-weight: 500;
      font-size: 14px;
      color: var(--color-text-primary);
    }
    .form-group input {
      padding: 10px var(--spacing-3);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-md);
      font-size: 14px;
      outline: none;
      transition: border-color 0.2s, box-shadow 0.2s;
      width: 100%;
      background-color: var(--color-background);
    }
    .form-group input:focus {
      border-color: var(--color-primary);
      box-shadow: 0 0 0 3px var(--color-primary-light);
    }
    .error-text {
      color: var(--color-danger);
      font-size: 12px;
      margin-top: -4px;
    }
    .error-message {
      color: var(--color-danger);
      background-color: var(--color-danger-bg);
      padding: var(--spacing-3);
      border-radius: var(--radius-md);
      font-size: 14px;
      text-align: center;
      margin-bottom: var(--spacing-2);
    }
    .form-options {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 14px;
      margin-top: var(--spacing-2);
      margin-bottom: var(--spacing-2);
    }
    .checkbox-container {
      display: flex;
      align-items: center;
      gap: var(--spacing-2);
      cursor: pointer;
    }
    .forgot-link {
      color: var(--color-primary);
      text-decoration: none;
      font-weight: 500;
    }
    .forgot-link:hover {
      text-decoration: underline;
    }
    .btn-primary {
      background-color: var(--color-primary);
      color: white;
      border: none;
      border-radius: var(--radius-md);
      padding: 12px;
      font-size: 16px;
      font-weight: 500;
      cursor: pointer;
      transition: background-color 0.2s;
      width: 100%;
      text-align: center;
    }
    .btn-primary:hover:not(:disabled) {
      background-color: var(--color-primary-dark);
    }
    .btn-primary:disabled {
      background-color: var(--color-border-hover);
      cursor: not-allowed;
    }
  `]
})
export class LoginComponent implements OnInit {
  private authFacade = inject(AuthFacade);
  private authState = inject(AuthStateService);
  private fb = inject(FormBuilder);

  loginForm!: FormGroup;
  readonly isLoading = this.authState.isLoading;
  errorMessage = '';

  constructor() {}

  ngOnInit(): void {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required]],
      password: ['', [Validators.required]],
      rememberMe: [false]
    });
  }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.errorMessage = '';

    const credentials = {
      email: this.loginForm.value.email,
      password: this.loginForm.value.password
    };

    this.authFacade.login(credentials).subscribe({
      next: () => {},
      error: (err) => {
        this.errorMessage = err.error?.message || 'Login failed. Please try again.';
      }
    });
  }
}
