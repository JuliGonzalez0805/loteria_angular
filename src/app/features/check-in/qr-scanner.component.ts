import { Component, output, signal, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ZXingScannerComponent, ZXingScannerModule } from '@zxing/ngx-scanner';
import { BarcodeFormat } from '@zxing/library';
import { MatIconModule } from '@angular/material/icon';

/**
 * Componente de escaneo de QR usando ZXing
 */
@Component({
  selector: 'app-qr-scanner',
  imports: [CommonModule, ZXingScannerModule, MatIconModule],
  template: `
    <div class="qr-scanner-container">
      @if (isScanning()) {
        <zxing-scanner
          #scanner
          [device]="currentDevice()"
          (scanSuccess)="onCodeScanned($event)"
          (scanError)="onScanError($event)"
          [formats]="formats"
          class="w-full h-96"
        ></zxing-scanner>
        
        <p class="text-center mt-4 text-gray-600">
          Enfoca el código QR dentro del recuadro
        </p>
      } @else {
        <div class="flex items-center justify-center h-96 bg-gray-100 rounded-lg">
          <p class="text-gray-500">Cámara detenida</p>
        </div>
      }

      @if (error()) {
        <div class="mt-4 p-4 bg-red-50 text-red-700 rounded-lg">
          <mat-icon class="inline-block mr-2">warning</mat-icon>
          {{ error() }}
        </div>
      }
    </div>
  `,
  styles: [`
    .qr-scanner-container {
      @apply w-full max-w-2xl mx-auto;
    }
  `]
})
export class QrScannerComponent implements AfterViewInit {
  @ViewChild('scanner') scanner!: ZXingScannerComponent;

  // Signals
  readonly isScanning = signal(true);
  readonly currentDevice = signal<MediaDeviceInfo | undefined>(undefined);
  readonly error = signal<string | null>(null);

  // Formatos de código de barras a escanear
  readonly formats = [BarcodeFormat.QR_CODE];

  // Output
  readonly qrScanned = output<string>();

  ngAfterViewInit(): void {
    // Seleccionar primera cámara disponible
    this.scanner.camerasFound.subscribe((devices: MediaDeviceInfo[]) => {
      if (devices.length > 0) {
        // Preferir cámara trasera en móviles
        const backCamera = devices.find(device => 
          device.label.toLowerCase().includes('back')
        );
        this.currentDevice.set(backCamera || devices[0]);
      }
    });
  }

  protected onCodeScanned(code: string): void {
    this.error.set(null);
    this.qrScanned.emit(code);
    // Detener escaneo temporalmente para evitar múltiples lecturas
    this.isScanning.set(false);
    setTimeout(() => this.isScanning.set(true), 2000);
  }

  protected onScanError(error: any): void {
    console.error('Error de escaneo:', error);
    this.error.set('Error al acceder a la cámara. Verifica los permisos.');
  }
}
