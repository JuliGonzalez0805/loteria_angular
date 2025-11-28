import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatSelectModule } from '@angular/material/select';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators';
import { VisitsService } from '../../core/services/visits.service';
import { AuthService } from '../../core/services/auth.service';

/**
 * Componente de Preautorización de Visita
 * Permite al anfitrión registrar una visita anticipada
 */
@Component({
  selector: 'app-preautorizacion-visita',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatSelectModule,
    MatAutocompleteModule,
    MatProgressSpinnerModule
  ],
  template: `
    <div class="preautorizacion-container">
      <!-- Header -->
      <header class="preautorizacion-header">
        <button mat-icon-button (click)="goBack()" class="back-btn">
          <mat-icon>arrow_back</mat-icon>
        </button>
        <h1 class="header-title">Preautorización de Visita</h1>
      </header>

      <!-- Formulario -->
      <main class="preautorizacion-main">
        <div class="form-container">
          <form [formGroup]="preautorizacionForm" (ngSubmit)="onSubmit()">
            
            <!-- Datos del Visitante -->
            <div class="form-section">
              <h2 class="section-title">Datos del Visitante</h2>
              
              <div class="form-row">
                <mat-form-field appearance="outline" class="form-field">
                  <mat-label>Nombre</mat-label>
                  <input matInput formControlName="nombre" placeholder="Ingrese el nombre">
                  <mat-icon matPrefix>person</mat-icon>
                  @if (preautorizacionForm.get('nombre')?.hasError('required') && preautorizacionForm.get('nombre')?.touched) {
                    <mat-error>El nombre es requerido</mat-error>
                  }
                </mat-form-field>

                <mat-form-field appearance="outline" class="form-field">
                  <mat-label>Apellido</mat-label>
                  <input matInput formControlName="apellido" placeholder="Ingrese el apellido">
                  <mat-icon matPrefix>person</mat-icon>
                  @if (preautorizacionForm.get('apellido')?.hasError('required') && preautorizacionForm.get('apellido')?.touched) {
                    <mat-error>El apellido es requerido</mat-error>
                  }
                </mat-form-field>
              </div>

              <div class="form-row">
                <mat-form-field appearance="outline" class="form-field">
                  <mat-label>DNI</mat-label>
                  <input matInput formControlName="dni" placeholder="12345678" type="number">
                  <mat-icon matPrefix>badge</mat-icon>
                  @if (preautorizacionForm.get('dni')?.hasError('required') && preautorizacionForm.get('dni')?.touched) {
                    <mat-error>El DNI es requerido</mat-error>
                  }
                  @if (preautorizacionForm.get('dni')?.hasError('pattern')) {
                    <mat-error>DNI inválido (7-8 dígitos)</mat-error>
                  }
                </mat-form-field>

                <mat-form-field appearance="outline" class="form-field">
                  <mat-label>Email</mat-label>
                  <input matInput formControlName="email" placeholder="email@ejemplo.com" type="email">
                  <mat-icon matPrefix>email</mat-icon>
                  @if (preautorizacionForm.get('email')?.hasError('required') && preautorizacionForm.get('email')?.touched) {
                    <mat-error>El email es requerido</mat-error>
                  }
                  @if (preautorizacionForm.get('email')?.hasError('email')) {
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
                  @if (preautorizacionForm.get('personaAVisitar')?.hasError('required') && preautorizacionForm.get('personaAVisitar')?.touched) {
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
                  @if (preautorizacionForm.get('area')?.hasError('required') && preautorizacionForm.get('area')?.touched) {
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
                  @if (preautorizacionForm.get('motivo')?.hasError('required') && preautorizacionForm.get('motivo')?.touched) {
                    <mat-error>El motivo es requerido</mat-error>
                  }
                </mat-form-field>
              </div>

              <div class="form-row">
                <mat-form-field appearance="outline" class="form-field">
                  <mat-label>Fecha de la visita</mat-label>
                  <input matInput [matDatepicker]="picker" formControlName="fecha" placeholder="Seleccione la fecha">
                  <mat-datepicker-toggle matSuffix [for]="picker"></mat-datepicker-toggle>
                  <mat-datepicker #picker></mat-datepicker>
                  @if (preautorizacionForm.get('fecha')?.hasError('required') && preautorizacionForm.get('fecha')?.touched) {
                    <mat-error>La fecha es requerida</mat-error>
                  }
                </mat-form-field>

                <mat-form-field appearance="outline" class="form-field">
                  <mat-label>Horario</mat-label>
                  <mat-select formControlName="horario" placeholder="Seleccione el horario">
                    @for (horario of horariosDisponibles; track horario.value) {
                      <mat-option [value]="horario.value">{{ horario.label }}</mat-option>
                    }
                  </mat-select>
                  <mat-icon matPrefix>schedule</mat-icon>
                  @if (preautorizacionForm.get('horario')?.hasError('required') && preautorizacionForm.get('horario')?.touched) {
                    <mat-error>El horario es requerido</mat-error>
                  }
                </mat-form-field>
              </div>
            </div>

            <!-- Botones de acción -->
            <div class="form-actions">
              <button
                mat-raised-button
                type="button"
                (click)="goBack()"
                class="cancel-btn"
              >
                <mat-icon>close</mat-icon>
                Cancelar
              </button>

              <button
                mat-raised-button
                color="primary"
                type="submit"
                [disabled]="preautorizacionForm.invalid || isLoading()"
                class="submit-btn"
              >
                @if (isLoading()) {
                  <mat-spinner diameter="20"></mat-spinner>
                  Guardando...
                } @else {
                  <ng-container>
                    <mat-icon>check</mat-icon>
                    Preautorizar Visita
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
    .preautorizacion-container {
      @apply min-h-screen flex flex-col bg-gray-50;
    }

    .preautorizacion-header {
      @apply bg-white shadow-md px-8 py-6 flex items-center gap-4;
    }

    .back-btn {
      @apply text-gray-600;
    }

    .header-title {
      @apply text-3xl font-bold text-gray-800;
    }

    .preautorizacion-main {
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

    .full-width {
      @apply col-span-1 md:col-span-2;
    }

    .form-actions {
      @apply flex justify-end gap-4 mt-8 pt-6 border-t border-gray-200;
    }

    .cancel-btn {
      @apply flex items-center gap-2;
    }

    .submit-btn {
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
export class PreautorizacionVisitaComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly visitsService = inject(VisitsService);
  private readonly authService = inject(AuthService);

  readonly isLoading = signal(false);
  readonly successMessage = signal<string | null>(null);
  readonly errorMessage = signal<string | null>(null);

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

  // Horarios disponibles (intervalos de 1 hora)
  readonly horariosDisponibles = [
    { value: '08:00-09:00', label: '08:00 - 09:00' },
    { value: '09:00-10:00', label: '09:00 - 10:00' },
    { value: '10:00-11:00', label: '10:00 - 11:00' },
    { value: '11:00-12:00', label: '11:00 - 12:00' },
    { value: '12:00-13:00', label: '12:00 - 13:00' },
    { value: '13:00-14:00', label: '13:00 - 14:00' },
    { value: '14:00-15:00', label: '14:00 - 15:00' },
    { value: '15:00-16:00', label: '15:00 - 16:00' },
    { value: '16:00-17:00', label: '16:00 - 17:00' },
    { value: '17:00-18:00', label: '17:00 - 18:00' }
  ];

  readonly preautorizacionForm: FormGroup = this.fb.group({
    nombre: ['', [Validators.required, Validators.minLength(2)]],
    apellido: ['', [Validators.required, Validators.minLength(2)]],
    dni: ['', [Validators.required, Validators.pattern(/^\d{7,8}$/)]],
    email: ['', [Validators.required, Validators.email]],
    empresa: [''],
    personaAVisitar: ['', Validators.required],
    area: ['', Validators.required],
    motivo: ['', Validators.required],
    fecha: ['', Validators.required],
    horario: ['', Validators.required]
  });

  ngOnInit(): void {
    // Configurar autocomplete para persona a visitar
    this.filteredPersonas$ = this.preautorizacionForm.get('personaAVisitar')!.valueChanges.pipe(
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

  goBack(): void {
    // this.router.navigate(['/anfitrion/dashboard']);
    this.router.navigate(['/detalles']);
  }

  onSubmit(): void {
    if (this.preautorizacionForm.invalid) {
      this.preautorizacionForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    this.successMessage.set(null);
    this.errorMessage.set(null);

    const formValue = this.preautorizacionForm.value;
    const currentUser = this.authService.currentUser();
    
    if (!currentUser?.id || !currentUser?.idPerfil) {
      this.errorMessage.set('Usuario no autenticado o sin perfil asignado');
      this.isLoading.set(false);
      return;
    }

    // Obtener el id_perfil del usuario
    const idPerfil = currentUser.idPerfil;
    const userId = parseInt(currentUser.id);

    // Parsear horario
    const [horaInicio, horaFin] = formValue.horario.split('-');
    const fecha = new Date(formValue.fecha);
    const fechaStr = fecha.toISOString().split('T')[0];

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
      inicio: `${fechaStr} ${horaInicio}:00`,
      fin: `${fechaStr} ${horaFin}:00`,
      id_usuario: null
    };

    this.visitsService.crearVisitaPreautorizada(visitaData, idPerfil)
      .subscribe({
        next: (response) => {
          this.isLoading.set(false);
          this.successMessage.set('Visita preautorizada exitosamente');
          
          // Limpiar formulario
          this.preautorizacionForm.reset();
          
          // Redirigir después de 2 segundos
          setTimeout(() => {
            this.goBack();
          }, 2000);
        },
        error: (err) => {
          this.isLoading.set(false);
          this.errorMessage.set(
            err.error?.message || 'Error al crear la visita preautorizada'
          );
          console.error('Error:', err);
        }
      });
  }
}
