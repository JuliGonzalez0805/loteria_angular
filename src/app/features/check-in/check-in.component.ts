import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { KioskButtonComponent } from '../../shared/components/kiosk-button.component';
import { QrScannerComponent } from './qr-scanner.component';
import { ScanDniComponent } from './scan-dni.component';
import { VisitsService } from '../../core/services/visits.service';
import { CreateVisitDto } from '../../core/models/visitor.model';

/**
 * Componente principal de Check-In en modo kiosco
 */
@Component({
  selector: 'app-check-in',
  imports: [
    CommonModule,
    FormsModule,
    MatIconModule,
    MatProgressSpinnerModule,
    KioskButtonComponent,
    QrScannerComponent,
    ScanDniComponent
  ],
  template: `
    <div class="check-in-container">
      <header class="header">
        <h1 class="title">Lotería de Córdoba</h1>
        <h2 class="subtitle">Sistema de Control de Accesos</h2>
      </header>

      <div class="content">
        <!-- Tabs -->
        <div class="tabs">
          <button
            [class.active]="activeTab() === 'qr'"
            (click)="activeTab.set('qr')"
            class="tab-button"
            type="button"
          >
            <mat-icon>qr_code_2</mat-icon>
            QR Rápido
          </button>
          <button
            [class.active]="activeTab() === 'dni'"
            (click)="activeTab.set('dni')"
            class="tab-button"
            type="button"
          >
            <mat-icon>badge</mat-icon>
            DNI / Manual
          </button>
        </div>

        <!-- Contenido según tab activa -->
        <div class="tab-content">
          @if (activeTab() === 'qr') {
            <div class="qr-tab">
              <app-qr-scanner (qrScanned)="onQrScanned($event)" />
            </div>
          }

          @if (activeTab() === 'dni') {
            <div class="dni-tab">
              @if (showForm()) {
                <!-- Formulario Manual -->
                <form (submit)="onSubmitForm($event)" class="visitor-form">
                  <h3 class="form-title">Datos del Visitante</h3>
                  
                  <div class="form-row">
                    <div class="form-group">
                      <label>DNI *</label>
                      <input
                        type="text"
                        [(ngModel)]="formData.dni"
                        name="dni"
                        required
                        class="form-input"
                      />
                    </div>
                  </div>

                  <div class="form-row">
                    <div class="form-group">
                      <label>Nombre *</label>
                      <input
                        type="text"
                        [(ngModel)]="formData.firstName"
                        name="firstName"
                        required
                        class="form-input"
                      />
                    </div>
                    <div class="form-group">
                      <label>Apellido *</label>
                      <input
                        type="text"
                        [(ngModel)]="formData.lastName"
                        name="lastName"
                        required
                        class="form-input"
                      />
                    </div>
                  </div>

                  <div class="form-row">
                    <div class="form-group">
                      <label>Empresa</label>
                      <input
                        type="text"
                        [(ngModel)]="formData.company"
                        name="company"
                        class="form-input"
                      />
                    </div>
                  </div>

                  <div class="form-row">
                    <div class="form-group">
                      <label>Motivo de Visita *</label>
                      <input
                        type="text"
                        [(ngModel)]="formData.purpose"
                        name="purpose"
                        required
                        class="form-input"
                      />
                    </div>
                  </div>

                  <div class="form-row">
                    <div class="form-group">
                      <label>Persona a Visitar *</label>
                      <input
                        type="text"
                        [(ngModel)]="formData.hostName"
                        name="hostName"
                        required
                        class="form-input"
                      />
                    </div>
                    <div class="form-group">
                      <label>Área *</label>
                      <input
                        type="text"
                        [(ngModel)]="formData.hostArea"
                        name="hostArea"
                        required
                        class="form-input"
                      />
                    </div>
                  </div>

                  <div class="form-actions">
                    <button type="submit" class="btn-submit" [disabled]="isSubmitting()">
                      @if (isSubmitting()) {
                        <mat-spinner diameter="20" class="inline-block"></mat-spinner>
                        Procesando...
                      } @else {
                        <mat-icon>check</mat-icon>
                        Registrar Ingreso
                      }
                    </button>
                    <button type="button" (click)="resetForm()" class="btn-cancel">
                      <mat-icon>close</mat-icon>
                      Cancelar
                    </button>
                  </div>
                </form>
              } @else {
                <!-- Opciones iniciales -->
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <app-kiosk-button
                    label="Escanear DNI"
                    icon="camera"
                    variant="primary"
                    (clicked)="startDniScan()"
                  />
                  <app-kiosk-button
                    label="Ingreso Manual"
                    icon="pencil"
                    variant="secondary"
                    (clicked)="startManualEntry()"
                  />
                </div>

                @if (showDniScanner()) {
                  <div class="mt-8">
                    <app-scan-dni (dniDataExtracted)="onDniDataExtracted($event)" />
                  </div>
                }
              }
            </div>
          }
        </div>

        @if (successMessage()) {
          <div class="success-alert">
            <mat-icon>check_circle</mat-icon>
            {{ successMessage() }}
          </div>
        }

        @if (errorMessage()) {
          <div class="error-alert">
            <mat-icon>warning</mat-icon>
            {{ errorMessage() }}
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .check-in-container {
      @apply min-h-screen bg-gray-50 p-4;
    }

    .header {
      @apply text-center mb-8 bg-white p-6 rounded-lg shadow;
    }

    .title {
      @apply text-4xl font-bold text-blue-900 mb-2;
    }

    .subtitle {
      @apply text-xl text-gray-600;
    }

    .content {
      @apply max-w-6xl mx-auto;
    }

    .tabs {
      @apply flex gap-4 mb-6;
    }

    .tab-button {
      @apply flex-1 py-4 px-6 rounded-lg font-bold text-lg 
             transition-colors flex items-center justify-center gap-2;
      
      &:not(.active) {
        @apply bg-white text-gray-600 hover:bg-gray-100;
      }
      
      &.active {
        @apply bg-blue-600 text-white shadow-lg;
      }
    }

    .tab-content {
      @apply bg-white p-8 rounded-lg shadow-lg min-h-[500px];
    }

    .visitor-form {
      @apply max-w-3xl mx-auto;
    }

    .form-title {
      @apply text-2xl font-bold text-gray-800 mb-6;
    }

    .form-row {
      @apply grid grid-cols-1 md:grid-cols-2 gap-4 mb-4;
    }

    .form-group {
      @apply flex flex-col;

      label {
        @apply text-sm font-semibold text-gray-700 mb-2;
      }
    }

    .form-input {
      @apply px-4 py-3 border border-gray-300 rounded-lg 
             focus:ring-2 focus:ring-blue-500 focus:border-transparent 
             text-lg;
    }

    .form-actions {
      @apply flex gap-4 mt-8;
    }

    .btn-submit {
      @apply flex-1 bg-green-600 text-white py-4 px-6 rounded-lg 
             font-bold text-lg hover:bg-green-700 disabled:opacity-50 
             flex items-center justify-center gap-2;
    }

    .btn-cancel {
      @apply bg-gray-600 text-white py-4 px-6 rounded-lg 
             font-bold text-lg hover:bg-gray-700 flex items-center gap-2;
    }

    .success-alert {
      @apply mt-6 p-4 bg-green-50 text-green-700 rounded-lg 
             flex items-center gap-2 text-lg;
    }

    .error-alert {
      @apply mt-6 p-4 bg-red-50 text-red-700 rounded-lg 
             flex items-center gap-2 text-lg;
    }
  `]
})
export class CheckInComponent {
  private readonly visitsService = inject(VisitsService);
  private readonly router = inject(Router);

  // Signals para UI
  readonly activeTab = signal<'qr' | 'dni'>('qr');
  readonly showForm = signal(false);
  readonly showDniScanner = signal(false);
  readonly isSubmitting = signal(false);
  readonly successMessage = signal<string | null>(null);
  readonly errorMessage = signal<string | null>(null);

  // Datos del formulario
  formData = {
    dni: '',
    firstName: '',
    lastName: '',
    company: '',
    purpose: '',
    hostName: '',
    hostArea: ''
  };

  protected onQrScanned(qrCode: string): void {
    this.isSubmitting.set(true);
    this.visitsService.checkInByQr(qrCode).subscribe({
      next: (visit) => {
        this.successMessage.set('¡Check-in exitoso! Bienvenido.');
        this.clearMessages(3000);
        this.isSubmitting.set(false);
      },
      error: (err) => {
        this.errorMessage.set('Error al procesar QR. Intenta nuevamente.');
        this.clearMessages(5000);
        this.isSubmitting.set(false);
      }
    });
  }

  protected startDniScan(): void {
    this.showDniScanner.set(true);
  }

  protected startManualEntry(): void {
    this.showForm.set(true);
  }

  protected onDniDataExtracted(data: any): void {
    this.formData.dni = data.dni || '';
    this.formData.firstName = data.firstName || '';
    this.formData.lastName = data.lastName || '';
    this.showDniScanner.set(false);
    this.showForm.set(true);
  }

  protected onSubmitForm(event: Event): void {
    event.preventDefault();
    this.isSubmitting.set(true);

    const visitData: CreateVisitDto = {
      visitor: {
        dni: this.formData.dni,
        firstName: this.formData.firstName,
        lastName: this.formData.lastName,
        company: this.formData.company
      },
      purpose: this.formData.purpose,
      hostName: this.formData.hostName,
      hostArea: this.formData.hostArea
    };

    this.visitsService.createVisit(visitData).subscribe({
      next: (visit) => {
        this.successMessage.set('¡Registro exitoso! Bienvenido.');
        this.resetForm();
        this.clearMessages(3000);
        this.isSubmitting.set(false);
      },
      error: (err) => {
        this.errorMessage.set('Error al registrar. Verifica los datos.');
        this.clearMessages(5000);
        this.isSubmitting.set(false);
      }
    });
  }

  protected resetForm(): void {
    this.formData = {
      dni: '',
      firstName: '',
      lastName: '',
      company: '',
      purpose: '',
      hostName: '',
      hostArea: ''
    };
    this.showForm.set(false);
    this.showDniScanner.set(false);
  }

  private clearMessages(delay: number): void {
    setTimeout(() => {
      this.successMessage.set(null);
      this.errorMessage.set(null);
    }, delay);
  }
}
