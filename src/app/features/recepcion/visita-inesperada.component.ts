import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators';
import { VisitsService } from '../../core/services/visits.service';
import { AuthService } from '../../core/services/auth.service';

/**
 * Componente de Formulario de Visita Inesperada
 * Permite al recepcionista registrar visitas que llegan sin preautorización
 */
@Component({
  selector: 'app-visita-inesperada',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatAutocompleteModule,
    MatProgressSpinnerModule
  ],
  template: `
    <div class="visita-inesperada-container">
      <!-- Header -->
      <header class="visita-header">
        <button mat-icon-button (click)="volver()" class="back-btn">
          <mat-icon>arrow_back</mat-icon>
        </button>
        <div class="header-content">
          <h1 class="header-title">Registrar Visita Inesperada</h1>
          <p class="header-subtitle">Complete los datos del visitante</p>
        </div>
      </header>

      <!-- Formulario -->
      <main class="visita-main">
        <div class="form-container">
          <form [formGroup]="visitaForm" (ngSubmit)="onSubmit()">
            
            <!-- Datos del Visitante -->
            <div class="form-section">
              <h2 class="section-title">Datos del Visitante</h2>
              
              <div class="form-row">
                <mat-form-field appearance="outline" class="form-field">
                  <mat-label>Nombre</mat-label>
                  <input matInput formControlName="nombre" placeholder="Nombre del visitante">
                  <mat-icon matPrefix>person</mat-icon>
                  @if (visitaForm.get('nombre')?.hasError('required') && visitaForm.get('nombre')?.touched) {
                    <mat-error>El nombre es requerido</mat-error>
                  }
                </mat-form-field>

                <mat-form-field appearance="outline" class="form-field">
                  <mat-label>Apellido</mat-label>
                  <input matInput formControlName="apellido" placeholder="Apellido del visitante">
                  <mat-icon matPrefix>person</mat-icon>
                  @if (visitaForm.get('apellido')?.hasError('required') && visitaForm.get('apellido')?.touched) {
                    <mat-error>El apellido es requerido</mat-error>
                  }
                </mat-form-field>
              </div>

              <div class="form-row">
                <mat-form-field appearance="outline" class="form-field">
                  <mat-label>DNI</mat-label>
                  <input matInput formControlName="dni" placeholder="12345678" type="number">
                  <mat-icon matPrefix>badge</mat-icon>
                  @if (visitaForm.get('dni')?.hasError('required') && visitaForm.get('dni')?.touched) {
                    <mat-error>El DNI es requerido</mat-error>
                  }
                  @if (visitaForm.get('dni')?.hasError('pattern')) {
                    <mat-error>DNI inválido (7-8 dígitos)</mat-error>
                  }
                </mat-form-field>

                <mat-form-field appearance="outline" class="form-field">
                  <mat-label>Email</mat-label>
                  <input matInput formControlName="email" placeholder="email@ejemplo.com" type="email">
                  <mat-icon matPrefix>email</mat-icon>
                  @if (visitaForm.get('email')?.hasError('required') && visitaForm.get('email')?.touched) {
                    <mat-error>El email es requerido</mat-error>
                  }
                  @if (visitaForm.get('email')?.hasError('email')) {
                    <mat-error>Email inválido</mat-error>
                  }
                </mat-form-field>
              </div>

              <div class="form-row">
                <mat-form-field appearance="outline" class="form-field">
                  <mat-label>Empresa</mat-label>
                  <input matInput formControlName="empresa" placeholder="Nombre de la empresa">
                  <mat-icon matPrefix>business</mat-icon>
                </mat-form-field>
              </div>
            </div>

            <!-- Datos de la Visita -->
            <div class="form-section">
              <h2 class="section-title">Datos de la Visita</h2>
              
              <div class="form-row">
                <mat-form-field appearance="outline" class="form-field">
                  <mat-label>Persona a visitar</mat-label>
                  <input 
                    matInput 
                    formControlName="personaAVisitar"
                    [matAutocomplete]="autoPersona"
                    placeholder="Buscar persona...">
                  <mat-icon matPrefix>search</mat-icon>
                  <mat-autocomplete #autoPersona="matAutocomplete">
                    @for (persona of filteredPersonas$ | async; track persona) {
                      <mat-option [value]="persona">{{ persona }}</mat-option>
                    }
                  </mat-autocomplete>
                  @if (visitaForm.get('personaAVisitar')?.hasError('required') && visitaForm.get('personaAVisitar')?.touched) {
                    <mat-error>Debe seleccionar una persona</mat-error>
                  }
                </mat-form-field>

                <mat-form-field appearance="outline" class="form-field">
                  <mat-label>Área o Departamento</mat-label>
                  <mat-select formControlName="area" placeholder="Seleccione el área">
                    @for (area of areasDisponibles; track area.value) {
                      <mat-option [value]="area.value">{{ area.label }}</mat-option>
                    }
                  </mat-select>
                  <mat-icon matPrefix>business</mat-icon>
                  @if (visitaForm.get('area')?.hasError('required') && visitaForm.get('area')?.touched) {
                    <mat-error>El área es requerida</mat-error>
                  }
                </mat-form-field>
              </div>

              <div class="form-row">
                <mat-form-field appearance="outline" class="form-field">
                  <mat-label>Motivo de la visita</mat-label>
                  <mat-select formControlName="motivo" placeholder="Seleccione el motivo">
                    @for (motivo of motivosDisponibles; track motivo.value) {
                      <mat-option [value]="motivo.value">{{ motivo.label }}</mat-option>
                    }
                  </mat-select>
                  <mat-icon matPrefix>description</mat-icon>
                  @if (visitaForm.get('motivo')?.hasError('required') && visitaForm.get('motivo')?.touched) {
                    <mat-error>El motivo es requerido</mat-error>
                  }
                </mat-form-field>
              </div>

              <div class="form-row">
                <mat-form-field appearance="outline" class="form-field">
                  <mat-label>Fecha de visita</mat-label>
                  <input matInput formControlName="fecha" [value]="fechaHoy" readonly>
                  <mat-icon matPrefix>calendar_today</mat-icon>
                </mat-form-field>
              </div>

              <div class="form-row">
                <mat-form-field appearance="outline" class="form-field">
                  <mat-label>Horario desde</mat-label>
                  <input matInput formControlName="horarioDesde" placeholder="09:00" type="time">
                  <mat-icon matPrefix>schedule</mat-icon>
                  @if (visitaForm.get('horarioDesde')?.hasError('required') && visitaForm.get('horarioDesde')?.touched) {
                    <mat-error>El horario desde es requerido</mat-error>
                  }
                </mat-form-field>

                <mat-form-field appearance="outline" class="form-field">
                  <mat-label>Horario hasta</mat-label>
                  <input matInput formControlName="horarioHasta" placeholder="10:00" type="time">
                  <mat-icon matPrefix>schedule</mat-icon>
                  @if (visitaForm.get('horarioHasta')?.hasError('required') && visitaForm.get('horarioHasta')?.touched) {
                    <mat-error>El horario hasta es requerido</mat-error>
                  }
                </mat-form-field>
              </div>
            </div>

            <!-- Botones de acción -->
            <div class="form-actions">
              <button
                mat-raised-button
                type="button"
                (click)="volver()"
                class="cancel-btn"
              >
                <mat-icon>close</mat-icon>
                Cancelar
              </button>

              <button
                mat-raised-button
                color="primary"
                type="submit"
                [disabled]="visitaForm.invalid || isLoading()"
                class="submit-btn"
              >
                @if (isLoading()) {
                  <mat-spinner diameter="20"></mat-spinner>
                  Registrando...
                } @else {
                  <ng-container>
                    <mat-icon>check</mat-icon>
                    Registrar Visita
                  </ng-container>
                }
              </button>
            </div>

            <!-- Mensaje de éxito/error -->
            @if (successMessage()) {
              <div class="success-message">
                <mat-icon>check_circle</mat-icon>
                {{ successMessage() }}
              </div>
            }
            @if (errorMessage()) {
              <div class="error-message">
                <mat-icon>error</mat-icon>
                {{ errorMessage() }}
              </div>
            }
          </form>
        </div>
      </main>
    </div>
  `,
  styles: [`
    .visita-inesperada-container {
      @apply min-h-screen flex flex-col bg-gradient-to-br from-orange-50 to-gray-100;
    }

    .visita-header {
      @apply bg-white shadow-md px-8 py-6 flex items-center gap-4;
    }

    .back-btn {
      @apply text-gray-600;
    }

    .header-content {
      @apply flex-1;
    }

    .header-title {
      @apply text-3xl font-bold text-gray-800;
    }

    .header-subtitle {
      @apply text-lg text-gray-600;
    }

    .visita-main {
      @apply flex-1 px-8 py-12;
    }

    .form-container {
      @apply max-w-4xl mx-auto bg-white rounded-lg shadow-md p-8;
    }

    .form-section {
      @apply mb-8;
    }

    .section-title {
      @apply text-2xl font-bold text-gray-700 mb-6 pb-3 border-b border-gray-200;
    }

    .form-row {
      @apply grid grid-cols-1 md:grid-cols-2 gap-6 mb-4;
    }

    .form-field {
      @apply w-full;
    }

    .form-actions {
      @apply flex justify-end gap-4 mt-8 pt-6 border-t border-gray-200;
    }

    .cancel-btn, .submit-btn {
      @apply flex items-center gap-2;
    }

    .success-message {
      @apply mt-4 p-4 bg-green-50 text-green-700 rounded-lg flex items-center gap-2;
    }

    .error-message {
      @apply mt-4 p-4 bg-red-50 text-red-700 rounded-lg flex items-center gap-2;
    }
  `]
})
export class VisitaInesperadaComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly visitsService = inject(VisitsService);
  private readonly authService = inject(AuthService);

  readonly isLoading = signal(false);
  readonly successMessage = signal<string | null>(null);
  readonly errorMessage = signal<string | null>(null);
  readonly fechaHoy: string;

  // Lista de personas (simulado - debe venir del backend)
  readonly personas = [
    'Juan Pérez',
    'María González',
    'Carlos Rodríguez',
    'Ana Martínez',
    'Luis Fernández',
    'Laura Sánchez'
  ];

  filteredPersonas$!: Observable<string[]>;

  // Áreas disponibles
  readonly areasDisponibles = [
    { value: 'administracion', label: 'Administración' },
    { value: 'comercial', label: 'Comercial' },
    { value: 'sistemas', label: 'Sistemas' },
    { value: 'rrhh', label: 'Recursos Humanos' },
    { value: 'finanzas', label: 'Finanzas' },
    { value: 'operaciones', label: 'Operaciones' }
  ];

  // Motivos disponibles
  readonly motivosDisponibles = [
    { value: 'reunion', label: 'Reunión' },
    { value: 'entrevista', label: 'Entrevista' },
    { value: 'proveedor', label: 'Proveedor' },
    { value: 'mantenimiento', label: 'Mantenimiento' },
    { value: 'capacitacion', label: 'Capacitación' },
    { value: 'otro', label: 'Otro' }
  ];

  readonly visitaForm: FormGroup = this.fb.group({
    nombre: ['', [Validators.required, Validators.minLength(2)]],
    apellido: ['', [Validators.required, Validators.minLength(2)]],
    dni: ['', [Validators.required, Validators.pattern(/^\d{7,8}$/)]],
    email: ['', [Validators.required, Validators.email]],
    empresa: [''],
    personaAVisitar: ['', Validators.required],
    area: ['', Validators.required],
    motivo: ['', Validators.required],
    fecha: [{ value: '', disabled: true }],
    horarioDesde: ['', Validators.required],
    horarioHasta: ['', Validators.required]
  });

  constructor() {
    // Obtener fecha de hoy en formato legible
    const today = new Date();
    const options: Intl.DateTimeFormatOptions = { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    };
    this.fechaHoy = today.toLocaleDateString('es-AR', options);
  }

  ngOnInit(): void {
    // Configurar autocomplete para persona a visitar
    this.filteredPersonas$ = this.visitaForm.get('personaAVisitar')!.valueChanges.pipe(
      startWith(''),
      map(value => this._filterPersonas(value || ''))
    );
  }

  private _filterPersonas(value: string): string[] {
    const filterValue = value.toLowerCase();
    return this.personas.filter(persona => 
      persona.toLowerCase().includes(filterValue)
    );
  }

  volver(): void {
    this.router.navigate(['/detalles']);
  }

  onSubmit(): void {
    if (this.visitaForm.invalid) {
      this.visitaForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    this.successMessage.set(null);
    this.errorMessage.set(null);

    const formValue = this.visitaForm.value;
    const currentUser = this.authService.currentUser();
    
    if (!currentUser?.id || !currentUser?.idPerfil) {
      this.errorMessage.set('Usuario no autenticado o sin perfil asignado');
      this.isLoading.set(false);
      return;
    }

    // Obtener el id_perfil del usuario
    const idPerfil = currentUser.idPerfil;
    const userId = parseInt(currentUser.id);

    // Obtener fecha y hora actual
    const now = new Date();
    const fechaStr = now.toISOString().split('T')[0];
    
    // Crear timestamps completos con fecha de hoy
    const inicio = `${fechaStr} ${formValue.horarioDesde}:00`;
    const fin = `${fechaStr} ${formValue.horarioHasta}:00`;

    const visitaData = {
      visitante: {
        dni: parseInt(formValue.dni),
        nombre: formValue.nombre,
        apellido: formValue.apellido,
        empresa: formValue.empresa || '',
        email: formValue.email
      },
      motivo: formValue.motivo,
      id_anfitrion: userId,
      inicio: inicio,
      fin: fin,
      id_usuario: null
    };

    this.visitsService.crearVisitaInesperada(visitaData, idPerfil)
      .subscribe({
        next: (response) => {
          this.isLoading.set(false);
          this.successMessage.set('Visita inesperada registrada exitosamente.');
          
          // Limpiar formulario
          this.visitaForm.reset();
          
          // Redirigir después de 2 segundos
          setTimeout(() => {
            this.volver();
          }, 2000);
        },
        error: (err) => {
          this.isLoading.set(false);
          this.errorMessage.set(
            err.error?.message || 'Error al registrar la visita inesperada'
          );
          console.error('Error:', err);
        }
      });
  }
}
