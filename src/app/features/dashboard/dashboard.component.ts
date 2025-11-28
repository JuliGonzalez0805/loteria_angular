import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { StatusTagComponent } from '../../shared/components/status-tag.component';
import { VisitsService } from '../../core/services/visits.service';
import { AuthService } from '../../core/services/auth.service';
import { Visit, VisitStatus } from '../../core/models/visitor.model';
import { format } from 'date-fns';

/**
 * Dashboard administrativo con tabla de visitas
 */
@Component({
  selector: 'app-dashboard',
  imports: [
    CommonModule,
    FormsModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatPaginatorModule,
    MatSortModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    StatusTagComponent
  ],
  template: `
    <div class="dashboard-container">
      <header class="header">
        <div class="flex justify-between items-center">
          <div>
            <h1 class="text-3xl font-bold text-gray-800">Dashboard de Visitas</h1>
            <p class="text-gray-600 mt-1">
              Bienvenido, {{ authService.currentUser()?.fullName }}
            </p>
          </div>
          <div class="flex gap-3">
            <button
              mat-raised-button
              color="accent"
              (click)="goToKiosco()"
            >
              <mat-icon>storefront</mat-icon>
              Ver Kiosco
            </button>
            <button
              mat-raised-button
              color="warn"
              (click)="authService.logout()"
            >
              <mat-icon>logout</mat-icon>
              Cerrar Sesión
            </button>
          </div>
        </div>
      </header>

      <div class="content">
        <!-- Filtros -->
        <div class="filters">
          <mat-form-field appearance="outline" class="filter-item">
            <mat-label>Buscar</mat-label>
            <input
              matInput
              type="text"
              [(ngModel)]="searchText"
              (input)="onFilterChange()"
              placeholder="DNI, nombre, empresa..."
            />
            <mat-icon matPrefix>search</mat-icon>
          </mat-form-field>

          <mat-form-field appearance="outline" class="filter-item">
            <mat-label>Estado</mat-label>
            <mat-select
              [(ngModel)]="selectedStatus"
              (selectionChange)="onFilterChange()"
            >
              <mat-option [value]="null">Todos</mat-option>
              @for (option of statusOptions; track option.value) {
                <mat-option [value]="option.value">{{ option.label }}</mat-option>
              }
            </mat-select>
          </mat-form-field>

          <mat-form-field appearance="outline" class="filter-item">
            <mat-label>Fecha Desde</mat-label>
            <input
              matInput
              [matDatepicker]="pickerStart"
              [(ngModel)]="startDate"
              (dateChange)="onFilterChange()"
            />
            <mat-datepicker-toggle matSuffix [for]="pickerStart"></mat-datepicker-toggle>
            <mat-datepicker #pickerStart></mat-datepicker>
          </mat-form-field>

          <mat-form-field appearance="outline" class="filter-item">
            <mat-label>Fecha Hasta</mat-label>
            <input
              matInput
              [matDatepicker]="pickerEnd"
              [(ngModel)]="endDate"
              (dateChange)="onFilterChange()"
            />
            <mat-datepicker-toggle matSuffix [for]="pickerEnd"></mat-datepicker-toggle>
            <mat-datepicker #pickerEnd></mat-datepicker>
          </mat-form-field>

          <div class="filter-actions">
            <button
              mat-raised-button
              color="primary"
              (click)="loadVisits()"
              [disabled]="isLoading()"
            >
              <mat-icon>search</mat-icon>
              Buscar
            </button>
            <button
              mat-raised-button
              (click)="clearFilters()"
            >
              <mat-icon>clear</mat-icon>
              Limpiar
            </button>
          </div>
        </div>

        <!-- Tabla -->
        @if (isLoading()) {
          <div class="flex justify-center items-center py-8">
            <mat-spinner diameter="50"></mat-spinner>
          </div>
        } @else {
          <div class="table-container">
            <table mat-table [dataSource]="visits()" class="w-full">
              
              <!-- Fecha/Hora Column -->
              <ng-container matColumnDef="checkInTime">
                <th mat-header-cell *matHeaderCellDef>Fecha/Hora</th>
                <td mat-cell *matCellDef="let visit">{{ formatDate(visit.checkInTime) }}</td>
              </ng-container>

              <!-- DNI Column -->
              <ng-container matColumnDef="dni">
                <th mat-header-cell *matHeaderCellDef>DNI</th>
                <td mat-cell *matCellDef="let visit">{{ visit.visitor?.dni }}</td>
              </ng-container>

              <!-- Visitante Column -->
              <ng-container matColumnDef="visitor">
                <th mat-header-cell *matHeaderCellDef>Visitante</th>
                <td mat-cell *matCellDef="let visit">
                  <div class="font-semibold">
                    {{ visit.visitor?.lastName }}, {{ visit.visitor?.firstName }}
                  </div>
                </td>
              </ng-container>

              <!-- Empresa Column -->
              <ng-container matColumnDef="company">
                <th mat-header-cell *matHeaderCellDef>Empresa</th>
                <td mat-cell *matCellDef="let visit">{{ visit.visitor?.company || '-' }}</td>
              </ng-container>

              <!-- Motivo Column -->
              <ng-container matColumnDef="purpose">
                <th mat-header-cell *matHeaderCellDef>Motivo</th>
                <td mat-cell *matCellDef="let visit">{{ visit.purpose }}</td>
              </ng-container>

              <!-- Anfitrión Column -->
              <ng-container matColumnDef="hostName">
                <th mat-header-cell *matHeaderCellDef>Anfitrión</th>
                <td mat-cell *matCellDef="let visit">{{ visit.hostName }}</td>
              </ng-container>

              <!-- Área Column -->
              <ng-container matColumnDef="hostArea">
                <th mat-header-cell *matHeaderCellDef>Área</th>
                <td mat-cell *matCellDef="let visit">{{ visit.hostArea }}</td>
              </ng-container>

              <!-- Estado Column -->
              <ng-container matColumnDef="status">
                <th mat-header-cell *matHeaderCellDef>Estado</th>
                <td mat-cell *matCellDef="let visit">
                  <app-status-tag [status]="visit.status" />
                </td>
              </ng-container>

              <!-- Acciones Column -->
              <ng-container matColumnDef="actions">
                <th mat-header-cell *matHeaderCellDef>Acciones</th>
                <td mat-cell *matCellDef="let visit">
                  <div class="flex gap-2">
                    @if (visit.status === VisitStatus.CHECKED_IN) {
                      <button
                        mat-icon-button
                        color="primary"
                        matTooltip="Registrar Salida"
                        (click)="checkOut(visit.id!)"
                      >
                        <mat-icon>exit_to_app</mat-icon>
                      </button>
                    }
                    <button
                      mat-icon-button
                      color="accent"
                      matTooltip="Ver Detalles"
                      (click)="viewDetails(visit)"
                    >
                      <mat-icon>visibility</mat-icon>
                    </button>
                  </div>
                </td>
              </ng-container>

              <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
              <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>

              <!-- Empty state -->
              <tr class="mat-row" *matNoDataRow>
                <td class="mat-cell" [attr.colspan]="displayedColumns.length">
                  <div class="text-center py-8 text-gray-500">
                    No se encontraron visitas
                  </div>
                </td>
              </tr>
            </table>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .dashboard-container {
      @apply min-h-screen bg-gray-50 p-6;
    }

    .header {
      @apply bg-white p-6 rounded-lg shadow mb-6;
    }

    .content {
      @apply bg-white p-6 rounded-lg shadow;
    }

    .filters {
      @apply grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6;
    }

    .filter-item {
      @apply w-full;
    }

    .filter-actions {
      @apply flex gap-2 items-end;
    }

    .table-container {
      @apply overflow-x-auto;
    }

    table {
      width: 100%;
    }
  `]
})
export class DashboardComponent implements OnInit {
  readonly authService = inject(AuthService);
  private readonly visitsService = inject(VisitsService);
  private readonly router = inject(Router);

  // Signals
  readonly visits = signal<Visit[]>([]);
  readonly isLoading = signal(false);

  // Columnas de la tabla
  readonly displayedColumns = ['checkInTime', 'dni', 'visitor', 'company', 'purpose', 'hostName', 'hostArea', 'status', 'actions'];

  // Filtros
  searchText = '';
  selectedStatus: VisitStatus | null = null;
  startDate: Date | null = null;
  endDate: Date | null = null;

  readonly VisitStatus = VisitStatus;

  readonly statusOptions = [
    { label: 'Pendiente', value: VisitStatus.PENDING },
    { label: 'Ingresado', value: VisitStatus.CHECKED_IN },
    { label: 'Salida', value: VisitStatus.CHECKED_OUT },
    { label: 'Cancelado', value: VisitStatus.CANCELLED }
  ];

  // Navegación
  goToKiosco(): void {
    this.router.navigate(['/kiosco']);
  }

  ngOnInit(): void {
    this.loadVisits();
  }

  protected loadVisits(): void {
    this.isLoading.set(true);
    
    const filters: any = {};
    if (this.selectedStatus) filters.status = this.selectedStatus;
    if (this.startDate) filters.startDate = this.startDate;
    if (this.endDate) filters.endDate = this.endDate;
    if (this.searchText) filters.search = this.searchText;

    this.visitsService.getVisits(filters).subscribe({
      next: (data) => {
        this.visits.set(data);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error al cargar visitas:', err);
        this.isLoading.set(false);
      }
    });
  }

  protected onFilterChange(): void {
    // Implementar debounce si es necesario
  }

  protected clearFilters(): void {
    this.searchText = '';
    this.selectedStatus = null;
    this.startDate = null;
    this.endDate = null;
    this.loadVisits();
  }

  protected checkOut(visitId: string): void {
    if (confirm('¿Confirmar salida del visitante?')) {
      this.visitsService.checkOut(visitId).subscribe({
        next: () => {
          this.loadVisits();
        },
        error: (err) => {
          console.error('Error al registrar salida:', err);
          alert('Error al registrar salida');
        }
      });
    }
  }

  protected viewDetails(visit: Visit): void {
    // Implementar modal o navegación a detalle
    console.log('Ver detalles:', visit);
  }

  protected formatDate(date: Date): string {
    return format(new Date(date), 'dd/MM/yyyy HH:mm');
  }
}
