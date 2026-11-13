import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { HttpEventType } from '@angular/common/http';
import { AudioApiService } from '../../../../core/services/audio-api.service';
import { AudioFormatOption } from '../../../../core/models/audio.models';
import { StepIndicatorComponent } from '../../../../shared/components/step-indicator/step-indicator';

export type OperationMode = 'convert' | 'transcribe';

@Component({
  selector: 'app-upload-choose',
  standalone: true,
  imports: [StepIndicatorComponent],
  templateUrl: './upload-choose.html',
  styleUrl: './upload-choose.scss',
})
export class UploadChooseComponent implements OnInit {
  private readonly audioApi = inject(AudioApiService);
  private readonly router = inject(Router);

  // Límite configurado en Django settings (MAX_AUDIO_UPLOAD_SIZE = 50 MB)
  readonly maxFileSizeBytes = 50 * 1024 * 1024;
  readonly maxFileSizeLabel = '50 MB';
  readonly quickBadges = ['MP3', 'WAV', 'M4A', 'FLAC'];

  // Estado reactivo con Signals
  readonly availableFormats = signal<AudioFormatOption[]>([]);
  readonly selectedFile = signal<File | null>(null);
  readonly selectedOperation = signal<OperationMode>('convert');
  readonly selectedFormat = signal<string>('');
  readonly isDragging = signal<boolean>(false);
  readonly isSubmitting = signal<boolean>(false);
  readonly errorMessage = signal<string | null>(null);

  // Validación computada para habilitar el botón "Process Audio"
  readonly canProcess = computed(() => {
    const hasFile = this.selectedFile() !== null;
    const isConvertReady =
      this.selectedOperation() === 'convert' && this.selectedFormat().trim().length > 0;
    return hasFile && isConvertReady && !this.isSubmitting();
  });

  readonly availableFormatsSummary = computed(() => {
    const formats = this.availableFormats();
    if (!formats.length) return 'MP3, WAV, OGG, M4A';
    return formats
      .slice(0, 4)
      .map((f) => f.label)
      .join(', ');
  });

  ngOnInit(): void {
    this.loadSupportedFormats();
  }

  private loadSupportedFormats(): void {
    this.audioApi.getSupportedFormats().subscribe({
      next: (formats) => this.availableFormats.set(formats),
      error: () => {
        // Respaldo en caso de que el servidor aún no responda
        this.availableFormats.set([
          { value: 'mp3', label: 'MP3', mime: 'audio/mpeg', lossy: true },
          { value: 'wav', label: 'WAV', mime: 'audio/wav', lossy: false },
          { value: 'ogg', label: 'OGG', mime: 'audio/ogg', lossy: true },
          { value: 'm4a', label: 'M4A', mime: 'audio/mp4', lossy: true },
          { value: 'flac', label: 'FLAC', mime: 'audio/flac', lossy: false },
        ]);
      },
    });
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(true);
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(false);
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(false);

    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.handleFileSelection(files[0]);
    }
  }

  onFileInputChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.handleFileSelection(input.files[0]);
      input.value = '';
    }
  }

  private handleFileSelection(file: File): void {
    this.errorMessage.set(null);

    if (file.size === 0) {
      this.errorMessage.set('El archivo seleccionado está vacío.');
      return;
    }

    if (file.size > this.maxFileSizeBytes) {
      this.errorMessage.set(`El archivo supera el límite permitido de ${this.maxFileSizeLabel}.`);
      return;
    }

    this.selectedFile.set(file);
  }

  removeFile(event: Event): void {
    event.stopPropagation();
    this.selectedFile.set(null);
    this.errorMessage.set(null);
  }

  selectOperation(mode: OperationMode): void {
    if (mode === 'transcribe') return; // Función futura
    this.selectedOperation.set(mode);
  }

  onFormatChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    this.selectedFormat.set(select.value);
  }

  formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    const kb = bytes / 1024;
    if (kb < 1024) return `${kb.toFixed(1)} KB`;
    return `${(kb / 1024).toFixed(1)} MB`;
  }

  processAudio(): void {
    const file = this.selectedFile();
    const format = this.selectedFormat();

    if (!file || !format || this.isSubmitting()) return;

    this.isSubmitting.set(true);
    this.errorMessage.set(null);

    this.audioApi.convertAudio({ file, format }).subscribe({
      next: (event) => {
        if (event.type === HttpEventType.Response) {
          this.isSubmitting.set(false);
          this.router.navigate(['/result']);
        }
      },
      error: (err) => {
        this.isSubmitting.set(false);
        const detail =
          err?.error?.detail ||
          err?.error?.file?.[0] ||
          'Ocurrió un error al procesar el archivo de audio.';
        this.errorMessage.set(detail);
      },
    });
  }
}
