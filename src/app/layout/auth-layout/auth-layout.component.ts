import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-auth-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet],
  template: `
    <div class="auth-container">
      <div class="auth-content">
        <router-outlet></router-outlet>
      </div>
    </div>
  `,
  styles: [`
    .auth-container {
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      background-color: var(--color-surface);
    }
    .auth-content {
      width: 100%;
      max-width: 400px;
      padding: var(--spacing-4);
    }
  `]
})
export class AuthLayoutComponent {}
