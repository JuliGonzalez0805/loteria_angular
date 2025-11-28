import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../../core/services/auth.service';

/**
 * Componente de Login
 */
@Component({
  selector: 'app-login',
  imports: [
    CommonModule,
    FormsModule,
    MatInputModule,
    MatFormFieldModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule
  ],
  template: `
    <div class="login-container">
      <div class="login-card">
        <div class="login-header">
          <mat-icon class="text-6xl text-blue-600 mb-4">business</mat-icon>
          <h1 class="text-3xl font-bold text-gray-800">Lotería de Córdoba</h1>
          <p class="text-gray-600 mt-2">Sistema de Control de Accesos</p>
        </div>

        <form (submit)="onSubmit($event)" class="login-form">
          <mat-form-field appearance="outline" class="w-full">
            <mat-label>DNI</mat-label>
            <input
              matInput
              type="text"
              [(ngModel)]="credentials.dni"
              name="dni"
              required
              placeholder="Ingresa tu DNI"
              [disabled]="isLoading()"
            />
            <mat-icon matPrefix>badge</mat-icon>
          </mat-form-field>

          <mat-form-field appearance="outline" class="w-full">
            <mat-label>Contraseña</mat-label>
            <input
              matInput
              [type]="hidePassword ? 'password' : 'text'"
              [(ngModel)]="credentials.password"
              name="password"
              required
              placeholder="Ingresa tu contraseña"
              [disabled]="isLoading()"
            />
            <mat-icon matPrefix>lock</mat-icon>
            <button
              mat-icon-button
              matSuffix
              type="button"
              (click)="hidePassword = !hidePassword"
              [disabled]="isLoading()"
            >
              <mat-icon>{{ hidePassword ? 'visibility_off' : 'visibility' }}</mat-icon>
            </button>
          </mat-form-field>

          @if (errorMessage()) {
            <div class="error-message">
              <mat-icon>warning</mat-icon>
              {{ errorMessage() }}
            </div>
          }

          <button
            mat-raised-button
            color="primary"
            type="submit"
            class="w-full h-12"
            [disabled]="!credentials.dni || !credentials.password || isLoading()"
          >
            @if (isLoading()) {
              <mat-spinner diameter="24" class="inline-block mr-2"></mat-spinner>
              <span>Iniciando...</span>
            } @else {
              <span class="flex items-center justify-center gap-2">
                <mat-icon>login</mat-icon>
                Iniciar Sesión
              </span>
            }
          </button>
        </form>

        <div class="login-footer">
          <p class="text-sm text-gray-600">
            ¿Necesitas ayuda? Contacta al administrador
          </p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .login-container {
      @apply min-h-screen bg-gradient-to-br from-blue-500 to-blue-700 
             flex items-center justify-center p-4;
    }

    .login-card {
      @apply bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md;
    }

    .login-header {
      @apply text-center mb-8;
    }

    .login-form {
      @apply space-y-6;
    }

    .form-group {
      @apply space-y-2;

      label {
        @apply block text-sm font-semibold text-gray-700;
      }
    }

    .error-message {
      @apply bg-red-50 text-red-700 p-4 rounded-lg 
             flex items-center gap-2 text-sm;
    }

    .login-footer {
      @apply mt-6 text-center;
    }
  `]
})
export class LoginComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  // Signals
  readonly isLoading = signal(false);
  readonly errorMessage = signal<string | null>(null);
  hidePassword = true;

  credentials = {
    dni: '',
    password: ''
  };

  protected onSubmit(event: Event): void {
    event.preventDefault();
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.authService.login(this.credentials.dni, this.credentials.password)
      .subscribe({
        next: (response) => {
          if (response.success) {
            // Obtener el usuario actual y redirigir según su rol
            const currentUser = this.authService.currentUser();
            if (currentUser) {
              const redirectUrl = this.authService.getRedirectUrlByRole(currentUser.role);
              const returnUrl = this.route.snapshot.queryParams['returnUrl'] || redirectUrl;
              this.router.navigate([returnUrl]);
            } else {
              this.router.navigate(['/detalles']);
            }
          } else {
            this.errorMessage.set(response.message || 'Error en el login');
          }
          this.isLoading.set(false);
        },
        error: (err) => {
          this.errorMessage.set(
            err.error?.message || 'DNI o contraseña incorrectos'
          );
          this.isLoading.set(false);
          console.error('Error de login:', err);
        }
      });
  }
}
