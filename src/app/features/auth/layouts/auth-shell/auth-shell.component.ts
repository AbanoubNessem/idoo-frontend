import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AUTH_ASSETS } from '../../../../core/config/auth-assets.config';

@Component({
  selector: 'app-auth-shell',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="auth-layout">
      <!-- Left Panel (Hidden on Mobile) -->
      <aside class="illustration-panel">
        <div class="panel-content">
          <div class="brand">
            <img [src]="assets.logoWhite" alt="iDoo ERP" class="logo" />
            <div class="brand-text">
              <div class="brand-tagline">Enterprise Resource<br>Planning System</div>
              <p class="brand-sub">One platform. All your business.<br>Anywhere, anytime.</p>
            </div>
          </div>
        </div>

        <div class="decorative-shape shape-1"></div>
        <div class="decorative-shape shape-2"></div>

        <div class="illustration-container">
          <img [src]="assets.dashboardIllustration" alt="Dashboard" class="illustration" loading="lazy" />
        </div>
      </aside>

      <!-- Right Panel -->
      <main class="auth-content">
        <div class="mobile-header">
          <img [src]="assets.logoColored" alt="iDoo ERP Logo" class="mobile-logo" />
        </div>
        
        <div class="card-container">
          <router-outlet></router-outlet>
        </div>
        
        <footer class="auth-footer">
          <div class="footer-feature">
            <span class="icon">🛡️</span>
            <div>
              <strong>Secure & Protected</strong>
            </div>
          </div>
          <div class="footer-feature">
            <span class="icon">⚡</span>
            <div>
              <strong>Fast & Reliable</strong>
            </div>
          </div>
          <div class="footer-feature">
            <span class="icon">📊</span>
            <div>
              <strong>Powerful Analytics</strong>
            </div>
          </div>
          <div class="footer-feature">
            <span class="icon">👥</span>
            <div>
              <strong>Multi-Tenant Ready</strong>
            </div>
          </div>
        </footer>

      </main>
    </div>
  `,
  styles: [`
    .auth-layout {
      display: flex;
      height: 100vh;
      overflow: hidden;
      background-color: var(--color-background);
      font-family: 'Inter', -apple-system, sans-serif;
    }

    /* Left Panel */
    .illustration-panel {
      display: none;
      width: 45%;
      background: linear-gradient(135deg, #1565D8 0%, #0F62FE 50%, #1976D2 100%);
      color: white;
      position: relative;
      overflow: hidden;
      flex-direction: column;
    }

    @media (min-width: 768px) {
      .illustration-panel {
        display: flex;
      }
    }

    .panel-content {
      padding: 40px 40px 24px;
      position: relative;
      z-index: 10;
    }

    .brand {
      display: flex;
      flex-direction: column;
      gap: 12px;
      margin-bottom: 0;
    }

    .brand .logo {
      height: 42px;
      width: auto;
      object-fit: contain;
      object-position: left;
    }

    .brand-tagline {
      font-size: 22px;
      font-weight: 700;
      line-height: 1.25;
      color: white;
    }

    .brand-sub {
      font-size: 14px;
      line-height: 1.5;
      color: rgba(255,255,255,0.8);
      margin: 6px 0 0;
    }

    .decorative-shape {
      position: absolute;
      border-radius: 50%;
      background: radial-gradient(circle, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0) 70%);
      z-index: 1;
    }

    .shape-1 {
      width: 400px;
      height: 400px;
      top: -100px;
      left: -100px;
    }

    .shape-2 {
      width: 300px;
      height: 300px;
      bottom: 20%;
      right: -50px;
    }

    .glass-card {
      position: absolute;
      background: rgba(255, 255, 255, 0.1);
      backdrop-filter: blur(10px);
      -webkit-backdrop-filter: blur(10px);
      border: 1px solid rgba(255, 255, 255, 0.2);
      padding: var(--spacing-3) var(--spacing-6);
      border-radius: var(--radius-md);
      font-weight: 600;
      z-index: 5;
      box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.1);
    }

    .glass-1 { top: 20%; right: 10%; animation: float 6s ease-in-out infinite; }
    .glass-2 { top: 40%; left: 5%; animation: float 5s ease-in-out infinite 1s; }
    .glass-3 { bottom: 30%; right: 5%; animation: float 7s ease-in-out infinite 2s; }
    .glass-4 { bottom: 15%; left: 15%; animation: float 6s ease-in-out infinite 0.5s; }

    @keyframes float {
      0% { transform: translateY(0px); }
      50% { transform: translateY(-10px); }
      100% { transform: translateY(0px); }
    }

    .illustration-container {
      flex: 1;
      display: flex;
      align-items: flex-end;
      justify-content: center;
      padding: 0 24px;
      position: relative;
      z-index: 2;
    }

    .illustration {
      width: 100%;
      max-width: 520px;
      height: auto;
      object-fit: contain;
      object-position: bottom;
    }

    /* Right Panel */
    .auth-content {
      flex: 1;
      display: flex;
      flex-direction: column;
      position: relative;
      overflow: hidden;
    }

    .mobile-header {
      display: block;
      padding: var(--spacing-6);
      text-align: center;
    }

    @media (min-width: 768px) {
      .mobile-header {
        display: none;
      }
    }

    .mobile-logo {
      height: 32px;
    }

    .card-container {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: var(--spacing-4);
      overflow-y: auto;
    }

    /* Footer */
    .auth-footer {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 8px;
      padding: 12px 40px;
      background-color: var(--color-surface);
      border-top: 1px solid var(--color-border);
      flex-shrink: 0;
    }

    @media (max-width: 1024px) {
      .auth-footer {
        grid-template-columns: repeat(2, 1fr);
        padding: 12px 24px;
      }
    }

    @media (max-width: 767px) {
      .auth-footer {
        grid-template-columns: repeat(2, 1fr);
        justify-items: center;
        text-align: center;
        padding: 10px 16px;
      }
    }

    .footer-feature {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .footer-feature .icon {
      font-size: 20px;
    }

    .footer-feature strong {
      display: block;
      font-size: 12px;
      font-weight: 600;
      color: var(--color-text-primary);
    }
  `]
})
export class AuthShellComponent {
  assets = AUTH_ASSETS;
}
