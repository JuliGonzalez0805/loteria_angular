import { Component, output, signal, inject, ElementRef, viewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatButtonModule } from '@angular/material/button';
import { InnovationService } from '../../core/services/innovation.service';

/**
 * Componente para captura y OCR de DNI
 */
@Component({
  selector: 'app-scan-dni',
  imports: [CommonModule, MatIconModule, MatProgressSpinnerModule, MatButtonModule],
  template: `
    <div class="scan-dni-container">
      <div class="camera-preview">
        @if (!capturedImage() && !showCamera()) {
          <input
            #fileInput
            type="file"
            accept="image/*"
            (change)="onFileSelected($event)"
            class="hidden"
          />
          <div class="button-group">
            <button
              (click)="startCamera()"
              class="capture-button camera-btn"
              type="button"
              mat-raised-button
              color="primary"
            >
              <mat-icon class="text-5xl">videocam</mat-icon>
              <span class="text-lg">Usar Cámara</span>
            </button>
            
            <button
              (click)="fileInput.click()"
              class="capture-button file-btn"
              type="button"
              mat-raised-button
              color="accent"
            >
              <mat-icon class="text-5xl">photo</mat-icon>
              <span class="text-lg">Subir Foto</span>
            </button>
          </div>
        }

        @if (showCamera() && !capturedImage()) {
          <div class="camera-container">
            <video
              #videoElement
              autoplay
              playsinline
              class="camera-video"
            ></video>
            
            <div class="camera-overlay">
              <div class="camera-frame"></div>
              <p class="camera-hint">Coloca el DNI dentro del marco</p>
            </div>
            
            <div class="camera-controls">
              <button
                (click)="capturePhoto()"
                [disabled]="isProcessing()"
                mat-fab
                color="primary"
                type="button"
              >
                <mat-icon>camera</mat-icon>
              </button>
              
              <button
                (click)="stopCamera()"
                mat-mini-fab
                color="warn"
                type="button"
              >
                <mat-icon>close</mat-icon>
              </button>
            </div>
          </div>
        }

        @if (capturedImage()) {
          <img [src]="capturedImage()" alt="DNI capturado" class="captured-image" />
          <div class="actions mt-4">
            <button
              (click)="processImage()"
              [disabled]="isProcessing()"
              class="btn-primary"
              type="button"
              mat-raised-button
              color="primary"
            >
              @if (isProcessing()) {
                <ng-container>
                  <mat-spinner diameter="20" class="inline-block"></mat-spinner>
                  <span>Procesando...</span>
                </ng-container>
              } @else {
                <ng-container>
                  <mat-icon>check</mat-icon>
                  <span>Procesar</span>
                </ng-container>
              }
            </button>
            <button
              (click)="resetCapture()"
              class="btn-secondary"
              type="button"
              mat-raised-button
            >
              <mat-icon>close</mat-icon>
              <span>Cancelar</span>
            </button>
          </div>
        }
      </div>

      @if (error()) {
        <div class="error-message">
          <mat-icon>warning</mat-icon>
          {{ error() }}
        </div>
      }

      @if (debugOcrText()) {
        <div class="debug-info">
          <h4 class="font-semibold mb-2">🔍 Texto OCR capturado:</h4>
          <pre class="text-xs bg-gray-800 text-green-400 p-3 rounded overflow-auto max-h-48">{{ debugOcrText() }}</pre>
          <p class="text-xs text-gray-500 mt-2">Este texto se analiza para extraer DNI, nombre y fecha de nacimiento</p>
        </div>
      }
    </div>
  `,
  styles: [`
    .scan-dni-container {
      @apply w-full max-w-2xl mx-auto;
    }

    .camera-preview {
      @apply bg-gray-100 rounded-lg p-8 flex flex-col items-center justify-center min-h-[400px];
    }

    .button-group {
      @apply flex flex-col md:flex-row gap-4 items-center justify-center w-full;
    }

    .capture-button {
      @apply px-8 py-6 rounded-lg flex flex-col items-center gap-3 
             transition-all min-w-[200px];
    }

    .camera-btn {
      @apply text-white;
    }

    .file-btn {
      @apply text-white;
    }

    .camera-container {
      @apply relative w-full max-w-2xl;
    }

    .camera-video {
      @apply w-full h-auto rounded-lg shadow-lg;
    }

    .camera-overlay {
      @apply absolute inset-0 flex flex-col items-center justify-center pointer-events-none;
    }

    .camera-frame {
      @apply border-4 border-white border-dashed rounded-lg;
      width: 85%;
      aspect-ratio: 1.586;
      box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.5);
    }

    .camera-hint {
      @apply text-white text-lg font-semibold mt-4 bg-black bg-opacity-50 px-4 py-2 rounded;
    }

    .camera-controls {
      @apply absolute bottom-4 left-0 right-0 flex items-center justify-center gap-4;
    }

    .captured-image {
      @apply max-w-full h-auto rounded-lg shadow-lg;
    }

    .actions {
      @apply flex gap-4;
    }

    .btn-primary {
      @apply bg-green-600 text-white px-6 py-3 rounded-lg 
             hover:bg-green-700 disabled:opacity-50 flex items-center gap-2;
    }

    .btn-secondary {
      @apply bg-gray-600 text-white px-6 py-3 rounded-lg 
             hover:bg-gray-700 flex items-center gap-2;
    }

    .error-message {
      @apply mt-4 p-4 bg-red-50 text-red-700 rounded-lg flex items-center gap-2;
    }

    .debug-info {
      @apply mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg;
    }

    .hidden {
      @apply sr-only;
    }
  `]
})
export class ScanDniComponent {
  private readonly innovationService = inject(InnovationService);

  // ViewChild para acceso al video element
  readonly videoElement = viewChild<ElementRef<HTMLVideoElement>>('videoElement');

  // Signals
  readonly capturedImage = signal<string | null>(null);
  readonly isProcessing = signal(false);
  readonly error = signal<string | null>(null);
  readonly showCamera = signal(false);
  private capturedFile = signal<File | null>(null);
  private mediaStream = signal<MediaStream | null>(null);
  readonly debugOcrText = signal<string | null>(null); // Para ver el texto capturado

  // Output
  readonly dniDataExtracted = output<{
    dni?: string;
    firstName?: string;
    lastName?: string;
    birthDate?: string;
    sex?: string;
  }>();

  /**
   * Inicia la cámara del dispositivo
   */
  protected async startCamera(): Promise<void> {
    this.error.set(null);
    
    try {
      // Solicitar acceso a la cámara con preferencia por la cámara trasera
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment', // Cámara trasera en móviles
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        },
        audio: false
      });

      this.mediaStream.set(stream);
      this.showCamera.set(true);

      // Esperar a que el elemento de video esté disponible
      setTimeout(() => {
        const video = this.videoElement()?.nativeElement;
        if (video) {
          video.srcObject = stream;
        }
      }, 100);
    } catch (err) {
      console.error('Error al acceder a la cámara:', err);
      this.error.set('No se pudo acceder a la cámara. Verifica los permisos.');
    }
  }

  /**
   * Captura una foto de la cámara
   */
  protected capturePhoto(): void {
    const video = this.videoElement()?.nativeElement;
    if (!video) return;

    // Crear un canvas para capturar el frame actual
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Dibujar el frame actual del video en el canvas
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Convertir el canvas a blob y luego a file
    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], 'dni-capture.jpg', { type: 'image/jpeg' });
        this.capturedFile.set(file);
        
        // Convertir a data URL para preview
        const reader = new FileReader();
        reader.onload = (e) => {
          this.capturedImage.set(e.target?.result as string);
        };
        reader.readAsDataURL(file);
      }
    }, 'image/jpeg', 0.95);

    // Detener la cámara
    this.stopCamera();
  }

  /**
   * Detiene la cámara y libera los recursos
   */
  protected stopCamera(): void {
    const stream = this.mediaStream();
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      this.mediaStream.set(null);
    }
    this.showCamera.set(false);
  }

  protected onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (file) {
      this.capturedFile.set(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        this.capturedImage.set(e.target?.result as string);
        this.error.set(null);
      };
      reader.readAsDataURL(file);
    }
  }

  protected async processImage(): Promise<void> {
    const file = this.capturedFile();
    if (!file) return;

    this.isProcessing.set(true);
    this.error.set(null);
    this.debugOcrText.set(null);

    try {
      const ocrText = await this.innovationService
        .extractTextFromImage(file)
        .toPromise();

      // Mostrar el texto capturado para debug
      this.debugOcrText.set(ocrText || 'No se capturó texto');

      if (ocrText) {
        const dniData = this.innovationService.parseDniInfo(ocrText);
        
        // Validar que al menos tengamos DNI o nombre
        if (!dniData.dni && !dniData.firstName) {
          this.error.set('No se pudo detectar información del DNI. Intenta con mejor iluminación o enfoque.');
          return;
        }
        
        this.dniDataExtracted.emit(dniData);
        
        // Esperar 2 segundos para que el usuario vea el debug antes de resetear
        setTimeout(() => this.resetCapture(), 2000);
      } else {
        this.error.set('No se pudo extraer información del DNI');
      }
    } catch (err) {
      this.error.set('Error al procesar la imagen. Intenta nuevamente.');
      console.error('Error OCR:', err);
    } finally {
      this.isProcessing.set(false);
    }
  }

  protected resetCapture(): void {
    this.capturedImage.set(null);
    this.capturedFile.set(null);
    this.error.set(null);
    this.debugOcrText.set(null);
    this.stopCamera();
  }

  /**
   * Limpia recursos al destruir el componente
   */
  ngOnDestroy(): void {
    this.stopCamera();
  }
}
