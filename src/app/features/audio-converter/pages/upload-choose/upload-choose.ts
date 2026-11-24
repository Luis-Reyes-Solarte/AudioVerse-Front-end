// src/app/features/audio-converter/pages/upload-choose/upload-choose.ts
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpEventType } from '@angular/common/http';
import { FileUploadModule, FileSelectEvent } from '@openng/optimus-ui/fileupload';
import { SelectModule } from '@openng/optimus-ui/select';
import { AudioApiService } from '../../../../core/services/audio-api.service';
import { AudioFormatOption } from '../../../../core/models/audio.models';
import { StepIndicatorComponent } from '../../../../shared/components/step-indicator/step-indicator';

export type OperationMode = 'convert' | 'transcribe';

@Component({
  selector: 'app-upload-choose',
  standalone: true,
  imports: [FormsModule, FileUploadModule, SelectModule, StepIndicatorComponent],
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
  readonly selectedFormat = signal<string | null>(null);
  readonly isSubmitting = signal<boolean>(false);
  readonly errorMessage = signal<string | null>(null);

  // Validación computada para habilitar el botón "Process Audio"
  readonly canProcess = computed(() => {
    const hasFile = this.selectedFile() !== null;
    if (!hasFile || this.isSubmitting()) return false;

    if (this.selectedOperation() === 'transcribe') {
      return true;
    }

    const format = this.selectedFormat();
    return !!format && format.trim().length > 0;
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
    const previousError = this.audioApi.conversionError();
    if (previousError) {
      this.errorMessage.set(previousError);
    }
  }

  private loadSupportedFormats(): void {
    this.audioApi.getSupportedFormats().subscribe({
      next: (formats) => this.availableFormats.set(formats),
      error: () => {
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

  onFileSelect(event: FileSelectEvent): void {
    this.errorMessage.set(null);
    const file = event.currentFiles?.[0] ?? event.files?.[0];

    if (!file) return;

    if (file.size === 0) {
      this.errorMessage.set('El archivo seleccionado está vacío.');
      this.selectedFile.set(null);
      return;
    }

    if (file.size > this.maxFileSizeBytes) {
      this.errorMessage.set(`El archivo supera el límite permitido de ${this.maxFileSizeLabel}.`);
      this.selectedFile.set(null);
      return;
    }

    this.selectedFile.set(file);
  }

  onFileClear(clearCallback?: () => void): void {
    if (clearCallback) {
      clearCallback();
    }
    this.selectedFile.set(null);
    this.errorMessage.set(null);
  }

  selectOperation(mode: OperationMode): void {
    this.selectedOperation.set(mode);
  }

  formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    const kb = bytes / 1024;
    if (kb < 1024) return `${kb.toFixed(1)} KB`;
    return `${(kb / 1024).toFixed(1)} MB`;
  }

  processAudio(): void {
    const file = this.selectedFile();
    if (!file || this.isSubmitting()) return;

    if (this.selectedOperation() === 'transcribe') {
      this.audioApi.prepareTranscription(file);
      this.router.navigate(['/processing']);
      return;
    }

    const format = this.selectedFormat();
    if (!format) return;

    this.audioApi.prepareConversion(file, format);
    this.router.navigate(['/processing']);
  }
}
