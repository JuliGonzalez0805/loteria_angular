import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

/**
 * Componente principal de Kiosco - Pantalla de Inicio
 * Permite seleccionar entre acceso ANFITRIÓN o VISITANTE
 */
@Component({
  selector: 'app-kiosco',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule
  ],
  template: `
    <div class="kiosco-container">
      <!-- Header con logo -->
      <header class="kiosco-header">
        <div class="logo-container">
          <mat-icon class="logo-icon">business</mat-icon>
          <div class="logo-text-container">
            <h1 class="logo-text">Lotería de Córdoba</h1>
            <p class="logo-subtitle">Sistema de Gestión de Visitas</p>
          </div>
        </div>
      </header>

      <!-- Contenido principal -->
      <main class="kiosco-main">
        <div class="welcome-section">
          <h2 class="welcome-title">Bienvenido</h2>
          <p class="welcome-subtitle">Seleccione el tipo de acceso</p>
        </div>

        <!-- Botones principales -->
        <div class="action-buttons">
          <button
            mat-raised-button
            color="primary"
            class="action-btn anfitrion-btn"
            (click)="goToLogin()"
          >
            <mat-icon class="btn-icon">person</mat-icon>
            <div class="btn-content">
              <span class="btn-text">ANFITRIÓN</span>
              <span class="btn-description">Acceso para empleados</span>
            </div>
          </button>

          <button
            mat-raised-button
            color="accent"
            class="action-btn visitante-btn"
            (click)="goToVisitanteSolicitud()"
          >
            <mat-icon class="btn-icon">groups</mat-icon>
            <div class="btn-content">
              <span class="btn-text">VISITANTE</span>
              <span class="btn-description">Solicitar una visita</span>
            </div>
          </button>
        </div>
      </main>

      <!-- Footer -->
      <footer class="kiosco-footer">
        <p class="footer-text">© 2025 Lotería de Córdoba - Todos los derechos reservados</p>
      </footer>
    </div>
  `,
  styles: [`
    .kiosco-container {
      @apply min-h-screen flex flex-col bg-gradient-to-br from-blue-50 to-gray-100;
    }

    .kiosco-header {
      @apply bg-white shadow-md px-8 py-6;
    }

    .logo-container {
      @apply flex items-center gap-4;
    }

    .logo-icon {
      @apply text-6xl text-blue-600;
    }

    .logo-text-container {
      @apply flex flex-col;
    }

    .logo-text {
      @apply text-4xl font-bold text-gray-800;
    }

    .logo-subtitle {
      @apply text-lg text-gray-600;
    }

    .kiosco-main {
      @apply flex-1 flex flex-col items-center justify-center px-8 py-16;
    }

    .welcome-section {
      @apply text-center mb-12;
    }

    .welcome-title {
      @apply text-5xl font-bold text-gray-800 mb-4;
    }

    .welcome-subtitle {
      @apply text-2xl text-gray-600;
    }

    .action-buttons {
      @apply grid grid-cols-1 md:grid-cols-2 gap-12 max-w-5xl w-full;
    }

    .action-btn {
      @apply h-auto py-12 px-8 rounded-2xl shadow-xl 
             transform transition-all duration-300 hover:scale-105 
             hover:shadow-2xl flex flex-col items-center gap-6;
    }

    .anfitrion-btn {
      @apply bg-blue-600 hover:bg-blue-700 text-white;
    }

    .visitante-btn {
      @apply bg-green-600 hover:bg-green-700 text-white;
    }

    .btn-icon {
      @apply text-8xl;
    }

    .btn-content {
      @apply flex flex-col items-center gap-2;
    }

    .btn-text {
      @apply text-3xl font-bold;
    }

    .btn-description {
      @apply text-lg opacity-90;
    }

    .kiosco-footer {
      @apply bg-white shadow-md px-8 py-4 text-center;
    }

    .footer-text {
      @apply text-gray-600;
    }
  `]
})
export class KioscoComponent {
  private readonly router = inject(Router);

  goToLogin(): void {
    this.router.navigate(['/auth/login']);
  }

  goToVisitanteSolicitud(): void {
    this.router.navigate(['/visitante/solicitud']);
  }
}
