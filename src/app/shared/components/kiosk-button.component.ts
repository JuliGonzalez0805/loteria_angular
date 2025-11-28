import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

/**
 * Botón estilo kiosco con tamaño grande y diseño accesible
 */
@Component({
  selector: 'app-kiosk-button',
  imports: [CommonModule, MatIconModule],
  template: `
    <button
      [class]="buttonClass()"
      [disabled]="disabled()"
      (click)="handleClick()"
      type="button"
    >
      @if (icon()) {
        <mat-icon class="text-6xl">{{ icon() }}</mat-icon>
      }
      <span class="text-2xl font-bold">{{ label() }}</span>
    </button>
  `,
  styles: [`
    button {
      @apply min-h-[200px] w-full rounded-2xl shadow-lg 
             transition-all duration-300 hover:scale-105 
             active:scale-95 flex flex-col items-center 
             justify-center gap-4 p-8;
    }
  `]
})
export class KioskButtonComponent {
  // Inputs como signals
  readonly label = input.required<string>();
  readonly icon = input<string>();
  readonly variant = input<'primary' | 'secondary' | 'success'>('primary');
  readonly disabled = input<boolean>(false);

  // Output como signal
  readonly clicked = output<void>();

  // Computed para clases dinámicas
  protected buttonClass = (): string => {
    const baseClasses = 'min-h-[200px] w-full rounded-2xl shadow-lg';
    const variants = {
      primary: 'bg-blue-600 text-white hover:bg-blue-700',
      secondary: 'bg-gray-600 text-white hover:bg-gray-700',
      success: 'bg-green-600 text-white hover:bg-green-700'
    };
    const disabledClass = this.disabled() ? 'opacity-50 cursor-not-allowed' : '';
    
    return `${baseClasses} ${variants[this.variant()]} ${disabledClass}`;
  };

  protected handleClick(): void {
    if (!this.disabled()) {
      this.clicked.emit();
    }
  }
}
