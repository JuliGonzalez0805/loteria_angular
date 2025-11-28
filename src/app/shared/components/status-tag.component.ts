import { Component, input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { VisitStatus } from '../../core/models/visitor.model';

/**
 * Tag de estado visual para visitas
 */
@Component({
  selector: 'app-status-tag',
  imports: [CommonModule, MatIconModule],
  template: `
    <span [class]="tagClass()">
      <mat-icon class="text-base">{{ icon() }}</mat-icon>
      {{ label() }}
    </span>
  `,
  styles: [`
    span {
      @apply inline-flex items-center gap-2 px-3 py-1 
             rounded-full text-sm font-semibold;
    }
  `]
})
export class StatusTagComponent {
  readonly status = input.required<VisitStatus>();

  protected readonly tagClass = computed(() => {
    const classes: Record<VisitStatus, string> = {
      [VisitStatus.PENDING]: 'bg-yellow-100 text-yellow-800',
      [VisitStatus.CHECKED_IN]: 'bg-green-100 text-green-800',
      [VisitStatus.CHECKED_OUT]: 'bg-gray-100 text-gray-800',
      [VisitStatus.CANCELLED]: 'bg-red-100 text-red-800'
    };
    return classes[this.status()];
  });

  protected readonly icon = computed(() => {
    const icons: Record<VisitStatus, string> = {
      [VisitStatus.PENDING]: 'schedule',
      [VisitStatus.CHECKED_IN]: 'check_circle',
      [VisitStatus.CHECKED_OUT]: 'exit_to_app',
      [VisitStatus.CANCELLED]: 'cancel'
    };
    return icons[this.status()];
  });

  protected readonly label = computed(() => {
    const labels: Record<VisitStatus, string> = {
      [VisitStatus.PENDING]: 'Pendiente',
      [VisitStatus.CHECKED_IN]: 'Ingresado',
      [VisitStatus.CHECKED_OUT]: 'Salida',
      [VisitStatus.CANCELLED]: 'Cancelado'
    };
    return labels[this.status()];
  });
}
