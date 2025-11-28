import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../core/services/auth.service';
import { VisitsService } from '../../core/services/visits.service';
import { UserRole } from '../../core/models/visitor.model';

interface VisitaDetalle {
  id: string;
  idVisitante: string;
  nombreCompleto: string;
  dni: string;
  motivo: string;
  horario: string;
  estado: 'PREAUTORIZADA' | 'PREAUTORIZADA_EN_INSTALACIONES' | 'INESPERADA_EN_INSTALACIONES' | 'APROBADA' | 'RECHAZADA' | 'SALIDA';
  tipoIngreso: 'PREAUTORIZADA' | 'INESPERADA';
}

/**
 * Componente de Detalles de Visita
 * Vista principal después del login - Muestra todas las visitas preautorizadas e inesperadas
 */
@Component({
  selector: 'app-detalles-visita',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatTooltipModule,
    MatProgressSpinnerModule
  ],
  template: `
    <div class="detalles-container">
      <!-- Header -->
      <header class="detalles-header">
        <div class="header-left">
          <h1 class="header-title">Control de Visitas</h1>
          <p class="header-subtitle">{{ getCurrentDate() }}</p>
        </div>
        <div class="header-right">
          <div class="user-info">
            <mat-icon>person</mat-icon>
            <span class="user-name">{{ currentUser()?.fullName }}</span>
            <span class="user-role">({{ getRoleLabel() }})</span>
          </div>
          <button mat-icon-button (click)="refreshData()" matTooltip="Actualizar">
            <mat-icon>refresh</mat-icon>
          </button>
          <button mat-icon-button (click)="logout()" matTooltip="Cerrar Sesión">
            <mat-icon>logout</mat-icon>
          </button>
        </div>
      </header>

      <!-- Contenido principal -->
      <main class="detalles-main">
        @if (isRecepcionista()) {
          <div class="toolbar-container">
            <button mat-raised-button color="accent" (click)="abrirFormularioInesperada()" class="btn-inesperada">
              <mat-icon>person_add</mat-icon>
              Visita Inesperada
            </button>
          </div>
        }
        @if (isAutorizante()) {
          <div class="toolbar-container">
            <button mat-raised-button color="accent" (click)="abrirFormularioPreautorizacion()" class="btn-preautorizacion">
              <mat-icon>event_available</mat-icon>
              Preautorizar Visita
            </button>
          </div>
        }

        @if (isLoading()) {
          <div class="loading-container">
            <mat-spinner diameter="50"></mat-spinner>
            <p class="loading-text">Cargando visitas...</p>
          </div>
        } @else if (visitas().length === 0) {
          <div class="empty-state">
            <mat-icon class="empty-icon">event_busy</mat-icon>
            <h2 class="empty-title">No hay visitas registradas</h2>
            <p class="empty-text">No se encontraron visitas para el día de hoy</p>
          </div>
        } @else {
          <div class="table-container">
            <table mat-table [dataSource]="visitas()" class="visitas-table">
              
              <!-- Columna Nombre y Apellido -->
              <ng-container matColumnDef="nombreCompleto">
                <th mat-header-cell *matHeaderCellDef>Nombre y Apellido</th>
                <td mat-cell *matCellDef="let visita">
                  <div class="visitor-info">
                    <span class="visitor-name">{{ visita.nombreCompleto }}</span>
                    <span class="visitor-dni">DNI: {{ visita.dni }}</span>
                  </div>
                </td>
              </ng-container>

              <!-- Columna Motivo -->
              <ng-container matColumnDef="motivo">
                <th mat-header-cell *matHeaderCellDef>Motivo</th>
                <td mat-cell *matCellDef="let visita">{{ visita.motivo }}</td>
              </ng-container>

              <!-- Columna Horario -->
              <ng-container matColumnDef="horario">
                <th mat-header-cell *matHeaderCellDef>Horario</th>
                <td mat-cell *matCellDef="let visita">{{ visita.horario }}</td>
              </ng-container>

              <!-- Columna Estado -->
              <ng-container matColumnDef="estado">
                <th mat-header-cell *matHeaderCellDef>Estado</th>
                <td mat-cell *matCellDef="let visita">
                  <div class="estado-container">
                    <mat-chip [class]="getEstadoClass(visita.estado)">
                      {{ getEstadoLabel(visita.estado) }}
                    </mat-chip>
                  </div>
                </td>
              </ng-container>

              <!-- Columna Acciones -->
              <ng-container matColumnDef="acciones">
                <th mat-header-cell *matHeaderCellDef>Acciones</th>
                <td mat-cell *matCellDef="let visita">
                  <div class="actions-container">
                    <!-- Botones para RECEPCIONISTA -->
                    @if (isRecepcionista()) {
                      <button 
                        mat-mini-fab 
                        color="primary"
                        (click)="marcarIngreso(visita)"
                        matTooltip="Marcar Ingreso"
                        class="action-btn"
                        [disabled]="visita.estado !== 'PREAUTORIZADA'"
                      >
                        <mat-icon>home</mat-icon>
                      </button>
                      <button 
                        mat-mini-fab 
                        color="warn"
                        (click)="marcarSalida(visita)"
                        matTooltip="Marcar Salida"
                        class="action-btn"
                        style="margin-left: 0.5rem"
                        [disabled]="visita.estado === 'PREAUTORIZADA' || visita.estado === 'SALIDA'"
                      >
                        <mat-icon>arrow_back</mat-icon>
                      </button>
                    }
                    @if (isAutorizante()) {
                      @if (visita.estado === 'PREAUTORIZADA_EN_INSTALACIONES' || visita.estado === 'INESPERADA_EN_INSTALACIONES') {
                        <button 
                          mat-mini-fab 
                          color="primary"
                          (click)="aprobarVisita(visita)"
                          matTooltip="Aprobar Visita"
                          class="action-btn"
                        >
                          <mat-icon>check</mat-icon>
                        </button>
                        <button 
                          mat-mini-fab 
                          color="warn"
                          (click)="rechazarVisita(visita)"
                          matTooltip="Rechazar Visita"
                          class="action-btn"
                          style="margin-left: 0.5rem"
                        >
                          <mat-icon>close</mat-icon>
                        </button>
                      } @else {
                        <span class="no-actions">Sin acciones</span>
                      }
                    }
                  </div>
                </td>
              </ng-container>

              <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
              <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
            </table>
          </div>
        }
      </main>
    </div>
  `,
  styles: [`
    .detalles-container {
      @apply min-h-screen flex flex-col bg-gray-50;
    }

    .detalles-header {
      @apply bg-white shadow-md px-8 py-6 flex items-center justify-between;
    }

    .header-left {
      @apply flex-1;
    }

    .header-title {
      @apply text-3xl font-bold text-gray-800;
    }

    .header-subtitle {
      @apply text-lg text-gray-600 mt-1;
    }

    .header-right {
      @apply flex items-center gap-4;
    }

    .user-info {
      @apply flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg;
      
      mat-icon {
        @apply text-gray-600;
      }
    }

    .user-name {
      @apply font-semibold text-gray-800;
    }

    .user-role {
      @apply text-sm text-gray-600;
    }

    .toolbar-container {
      @apply flex justify-end mb-4;
    }

    .detalles-main {
      @apply flex-1 px-8 py-8;
    }

    .loading-container {
      @apply flex flex-col items-center justify-center py-20;
    }

    .loading-text {
      @apply mt-4 text-lg text-gray-600;
    }

    .empty-state {
      @apply flex flex-col items-center justify-center py-20;
    }

    .empty-icon {
      @apply text-8xl text-gray-300 mb-4;
    }

    .empty-title {
      @apply text-2xl font-bold text-gray-700 mb-2;
    }

    .empty-text {
      @apply text-lg text-gray-500;
    }

    .table-container {
      @apply bg-white rounded-lg shadow-md overflow-hidden;
    }

    .visitas-table {
      @apply w-full;
    }

    .visitor-info {
      @apply flex flex-col;
    }

    .visitor-name {
      @apply font-semibold text-gray-800;
    }

    .visitor-dni {
      @apply text-sm text-gray-600;
    }

    .actions-container {
      @apply flex items-center gap-2;
    }

    .action-btn {
      @apply transform transition-transform hover:scale-110;
    }

    .no-actions {
      @apply text-sm text-gray-400 italic;
    }

    .estado-container {
      @apply flex flex-col gap-1;
    }

    .tipo-chip {
      @apply text-xs;
    }

    /* Chips de estado */
    mat-chip {
      @apply font-semibold;
    }

    mat-chip.estado-preautorizada {
      @apply bg-blue-100 text-blue-800;
    }

    mat-chip.estado-preautorizada-en-instalaciones {
      @apply bg-indigo-100 text-indigo-800;
    }

    mat-chip.estado-inesperada-en-instalaciones {
      @apply bg-orange-100 text-orange-800;
    }

    mat-chip.estado-aprobada {
      @apply bg-green-100 text-green-800;
    }

    mat-chip.estado-rechazada {
      @apply bg-red-100 text-red-800;
    }

    mat-chip.estado-salida {
      @apply bg-gray-100 text-gray-800;
    }

    /* Chips de tipo de ingreso */
    mat-chip.tipo-preautorizada {
      @apply bg-blue-50 text-blue-700 border border-blue-300;
    }

    mat-chip.tipo-inesperada {
      @apply bg-yellow-50 text-yellow-700 border border-yellow-300;
    }

    /* Estilos de tabla Material */
    ::ng-deep .mat-mdc-header-cell {
      @apply font-bold text-gray-700 bg-gray-100;
    }

    ::ng-deep .mat-mdc-row:hover {
      @apply bg-gray-50 cursor-pointer;
    }
  `]
})
export class DetallesVisitaComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly visitsService = inject(VisitsService);

  readonly isLoading = signal(false);
  readonly visitas = signal<VisitaDetalle[]>([]);
  readonly currentUser = computed(() => this.authService.currentUser());
  readonly displayedColumns = ['nombreCompleto', 'motivo', 'horario', 'estado', 'acciones'];

  // Computed para verificar roles
  readonly isRecepcionista = computed(() => 
    this.currentUser()?.role === UserRole.RECEPCIONISTA
  );

  readonly isAutorizante = computed(() => 
    this.currentUser()?.role === UserRole.AUTORIZANTE
  );

  ngOnInit(): void {
    this.loadVisitas();
  }

  /**
   * Cargar visitas desde el backend
   */
  loadVisitas(): void {
    const currentUser = this.currentUser();
    
    if (!currentUser?.id) {
      console.error('Usuario no autenticado');
      return;
    }

    this.isLoading.set(true);
    const userId = parseInt(currentUser.id);

    this.visitsService.obtenerVisitasAnfitrion(userId)
      .subscribe({
        next: (response) => {
          if (response.success && response.data) {
            // Mapear los datos del backend al formato del componente
            const visitasMapeadas: VisitaDetalle[] = response.data.map((visita: any) => ({
              id: visita.id?.toString() || '',
              idVisitante: visita.id_visitante?.toString() || '',
              nombreCompleto: `${visita.visitante_nombre || ''} ${visita.visitante_apellido || ''}`.trim(),
              dni: visita.visitante_dni?.toString() || '',
              motivo: visita.motivo || '',
              horario: this.formatearHorario(visita.inicio, visita.fin),
              estado: this.mapearEstado(visita.estado, visita.check_in, visita.check_out),
              tipoIngreso: 'PREAUTORIZADA' // Por ahora todas son preautorizadas, ajustar si el backend envía este dato
            }));
            
            this.visitas.set(visitasMapeadas);
          } else {
            this.visitas.set([]);
          }
          this.isLoading.set(false);
        },
        error: (err) => {
          console.error('Error al cargar visitas:', err);
          this.visitas.set([]);
          this.isLoading.set(false);
        }
      });
  }

  /**
   * Formatear horario desde timestamps del backend
   */
  private formatearHorario(inicio: string, fin: string): string {
    try {
      const inicioDate = new Date(inicio);
      const finDate = new Date(fin);
      const horaInicio = inicioDate.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
      const horaFin = finDate.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
      return `${horaInicio} - ${horaFin}`;
    } catch (error) {
      return 'N/A';
    }
  }

  /**
   * Mapear estado del backend al formato del componente
   */
  private mapearEstado(estado: string, checkIn: string | null, checkOut: string | null): VisitaDetalle['estado'] {
    // Si tiene check_out, está en SALIDA
    if (checkOut) {
      return 'SALIDA';
    }
    
    // Si tiene check_in pero no check_out, está en instalaciones
    if (checkIn) {
      return 'PREAUTORIZADA_EN_INSTALACIONES';
    }
    
    // Mapear según el estado del backend
    const estadoNormalizado = estado?.toLowerCase();
    
    if (estadoNormalizado === 'preautorizado' || estadoNormalizado === 'preautorizada') {
      return 'PREAUTORIZADA';
    }
    if (estadoNormalizado === 'aprobada' || estadoNormalizado === 'aprobado') {
      return 'APROBADA';
    }
    if (estadoNormalizado === 'rechazada' || estadoNormalizado === 'rechazado') {
      return 'RECHAZADA';
    }
    
    return 'PREAUTORIZADA';
  }

  refreshData(): void {
    this.loadVisitas();
  }

  getCurrentDate(): string {
    const today = new Date();
    const options: Intl.DateTimeFormatOptions = { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    };
    return today.toLocaleDateString('es-AR', options);
  }

  getRoleLabel(): string {
    const role = this.currentUser()?.role;
    switch (role) {
      case UserRole.RECEPCIONISTA:
        return 'Recepcionista';
      case UserRole.AUTORIZANTE:
        return 'Autorizante';
      case UserRole.ADMIN:
        return 'Administrador';
      default:
        return 'Usuario';
    }
  }

  getEstadoLabel(estado: VisitaDetalle['estado']): string {
    const labels = {
      PREAUTORIZADA: 'Preautorizada',
      PREAUTORIZADA_EN_INSTALACIONES: 'Preautorizada en Instalaciones',
      INESPERADA_EN_INSTALACIONES: 'Inesperada en Instalaciones',
      APROBADA: 'Aprobada',
      RECHAZADA: 'Rechazada',
      SALIDA: 'Salida'
    };
    return labels[estado];
  }

  getEstadoClass(estado: VisitaDetalle['estado']): string {
    const classes = {
      PREAUTORIZADA: 'estado-preautorizada',
      PREAUTORIZADA_EN_INSTALACIONES: 'estado-preautorizada-en-instalaciones',
      INESPERADA_EN_INSTALACIONES: 'estado-inesperada-en-instalaciones',
      APROBADA: 'estado-aprobada',
      RECHAZADA: 'estado-rechazada',
      SALIDA: 'estado-salida'
    };
    return classes[estado];
  }

  getTipoIngresoLabel(tipo: VisitaDetalle['tipoIngreso']): string {
    const labels = {
      PREAUTORIZADA: 'Preautorizada',
      INESPERADA: 'Inesperada'
    };
    return labels[tipo];
  }

  getTipoIngresoClass(tipo: VisitaDetalle['tipoIngreso']): string {
    const classes = {
      PREAUTORIZADA: 'tipo-preautorizada',
      INESPERADA: 'tipo-inesperada'
    };
    return classes[tipo];
  }

  // Acciones para RECEPCIONISTA
  marcarIngreso(visita: VisitaDetalle): void {
    console.log('Marcar ingreso:', visita);
    
    const idVisitante = parseInt(visita.idVisitante);
    
    this.visitsService.marcarCheckIn(idVisitante)
      .subscribe({
        next: (response) => {
          if (response.success) {
            // Actualizar la lista de visitas
            this.loadVisitas();
          }
        },
        error: (err) => {
          console.error('Error al marcar ingreso:', err);
          alert('Error al marcar ingreso de la visita');
        }
      });
  }

  marcarSalida(visita: VisitaDetalle): void {
    console.log('Marcar salida:', visita);
    
    const idVisitante = parseInt(visita.idVisitante);
    
    this.visitsService.marcarCheckOut(idVisitante)
      .subscribe({
        next: (response) => {
          if (response.success) {
            // Actualizar la lista de visitas
            this.loadVisitas();
          }
        },
        error: (err) => {
          console.error('Error al marcar salida:', err);
          alert('Error al marcar salida de la visita');
        }
      });
  }

  // Acciones para AUTORIZANTE
  aprobarVisita(visita: VisitaDetalle): void {
    console.log('Aprobar visita:', visita);
    
    const idVisitante = parseInt(visita.idVisitante);
    
    this.visitsService.aprobarVisita(idVisitante)
      .subscribe({
        next: (response) => {
          if (response.success) {
            // Actualizar la lista de visitas
            this.loadVisitas();
          }
        },
        error: (err) => {
          console.error('Error al aprobar visita:', err);
          alert('Error al aprobar la visita');
        }
      });
  }

  rechazarVisita(visita: VisitaDetalle): void {
    console.log('Rechazar visita:', visita);
    
    const idVisitante = parseInt(visita.idVisitante);
    
    this.visitsService.rechazarVisita(idVisitante)
      .subscribe({
        next: (response) => {
          if (response.success) {
            // Actualizar la lista de visitas
            this.loadVisitas();
          }
        },
        error: (err) => {
          console.error('Error al rechazar visita:', err);
          alert('Error al rechazar la visita');
        }
      });
  }

  goBack(): void {
    this.router.navigate(['/']);
  }

  abrirFormularioInesperada(): void {
    this.router.navigate(['/visita-inesperada']);
  }

  abrirFormularioPreautorizacion(): void {
    this.router.navigate(['/anfitrion/preautorizacion']);
  }

  logout(): void {
    this.authService.logout();
  }
}
