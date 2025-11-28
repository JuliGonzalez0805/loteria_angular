import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { AuthService } from '../../core/services/auth.service';

/**
 * Dashboard de Anfitrión
 * Pantalla principal después del login con opciones para gestionar visitas
 */
@Component({
  selector: 'app-anfitrion-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule,
    MatCardModule
  ],
  template: `
    <div class="dashboard-container">
      <!-- Header -->
      <header class="dashboard-header">
        <div class="header-content">
          <div class="user-info">
            <mat-icon class="user-icon">account_circle</mat-icon>
            <div>
              <h2 class="user-name">{{ authService.currentUser()?.fullName }}</h2>
              <p class="user-role">Anfitrión</p>
            </div>
          </div>
          <button
            mat-raised-button
            color="warn"
            (click)="logout()"
            class="logout-btn"
          >
            <mat-icon>logout</mat-icon>
            Cerrar Sesión
          </button>
        </div>
      </header>

      <!-- Contenido principal -->
      <main class="dashboard-main">
        <div class="welcome-section">
          <h1 class="welcome-title">Panel de Gestión de Visitas</h1>
          <p class="welcome-subtitle">Seleccione una opción</p>
        </div>

        <!-- Tarjetas de acción -->
        <div class="action-cards">
          <mat-card class="action-card preautorizacion-card" (click)="goToPreautorizacion()">
            <mat-card-content>
              <mat-icon class="card-icon">event_available</mat-icon>
              <h3 class="card-title">PREAUTORIZACIÓN VISITA</h3>
              <p class="card-description">
                Registrar una visita anticipada con datos del visitante
              </p>
            </mat-card-content>
          </mat-card>

          <mat-card class="action-card detalles-card" (click)="goToDetalles()">
            <mat-card-content>
              <mat-icon class="card-icon">list_alt</mat-icon>
              <h3 class="card-title">DETALLES DE VISITA</h3>
              <p class="card-description">
                Ver y gestionar las visitas programadas para hoy
              </p>
            </mat-card-content>
          </mat-card>
        </div>
      </main>
    </div>
  `,
  styles: [`
    .dashboard-container {
      @apply min-h-screen flex flex-col bg-gray-50;
    }

    .dashboard-header {
      @apply bg-white shadow-md;
    }

    .header-content {
      @apply max-w-7xl mx-auto px-8 py-6 flex justify-between items-center;
    }

    .user-info {
      @apply flex items-center gap-4;
    }

    .user-icon {
      @apply text-5xl text-blue-600;
    }

    .user-name {
      @apply text-2xl font-bold text-gray-800;
    }

    .user-role {
      @apply text-sm text-gray-600;
    }

    .logout-btn {
      @apply flex items-center gap-2;
    }

    .dashboard-main {
      @apply flex-1 max-w-7xl mx-auto px-8 py-12 w-full;
    }

    .welcome-section {
      @apply text-center mb-12;
    }

    .welcome-title {
      @apply text-4xl font-bold text-gray-800 mb-2;
    }

    .welcome-subtitle {
      @apply text-xl text-gray-600;
    }

    .action-cards {
      @apply grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto;
    }

    .action-card {
      @apply cursor-pointer transform transition-all duration-300 hover:scale-105 hover:shadow-2xl;
    }

    .action-card mat-card-content {
      @apply flex flex-col items-center text-center py-12 px-6 gap-4;
    }

    .preautorizacion-card {
      @apply bg-gradient-to-br from-blue-500 to-blue-700 text-white;
    }

    .detalles-card {
      @apply bg-gradient-to-br from-green-500 to-green-700 text-white;
    }

    .card-icon {
      @apply text-8xl mb-4;
    }

    .card-title {
      @apply text-2xl font-bold;
    }

    .card-description {
      @apply text-lg opacity-90;
    }
  `]
})
export class AnfitrionDashboardComponent {
  readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  goToPreautorizacion(): void {
    this.router.navigate(['/anfitrion/preautorizacion']);
  }

  goToDetalles(): void {
    this.router.navigate(['/anfitrion/detalles']);
  }

  logout(): void {
    this.authService.logout();
  }
}
