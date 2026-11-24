import { Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { HttpEventType } from '@angular/common/http';
import { ProgressBarModule } from '@openng/optimus-ui/progressbar';
import { AudioApiService } from '../../../../core/services/audio-api.service';
import { StepIndicatorComponent } from '../../../../shared/components/step-indicator/step-indicator';

export type StageStatus = 'complete' | 'in-progress' | 'up-next';

@Component({
  selector: 'app-processing',
  standalone: true,
  imports: [ProgressBarModule, StepIndicatorComponent],
  templateUrl: './processing.html',
  styleUrl: './processing.scss',
})
export class ProcessingComponent implements OnInit, OnDestroy {
  private readonly audioApi = inject(AudioApiService);
  private readonly router = inject(Router);

  readonly file = this.audioApi.currentFile;
  readonly targetFormat = this.audioApi.targetFormat;

  readonly progress = signal<number>(0);
  readonly durationLabel = signal<string>('');
  private progressTimer: ReturnType<typeof setInterval> | null = null;
  private redirectTimeout: ReturnType<typeof setTimeout> | null = null;

  readonly sourceFormatLabel = computed(() => {
    const name = this.file()?.name ?? '';
    const ext = name.split('.').pop()?.toUpperCase();
    return ext && ext !== name.toUpperCase() ? ext : 'AUDIO';
  });

  readonly targetFormatLabel = computed(() => this.targetFormat().toUpperCase());

  readonly formattedSize = computed(() => {
    const bytes = this.file()?.size ?? 0;
    if (bytes < 1024) return `${bytes} B`;
    const kb = bytes / 1024;
    if (kb < 1024) return `${kb.toFixed(1)} KB`;
    return `${(kb / 1024).toFixed(1)} MB`;
  });

  // Estados de las 3 etapas inferiores
  readonly uploadStageStatus = computed<StageStatus>(() =>
    this.progress() >= 40 ? 'complete' : 'in-progress',
  );

  readonly convertStageStatus = computed<StageStatus>(() => {
    const p = this.progress();
    if (p < 40) return 'up-next';
    if (p < 95) return 'in-progress';
    return 'complete';
  });

  readonly prepareStageStatus = computed<StageStatus>(() => {
    const p = this.progress();
    if (p < 95) return 'up-next';
    if (p < 100) return 'in-progress';
    return 'complete';
  });

  // Añadir en ProcessingComponent (processing.ts)
  readonly mode = this.audioApi.operationMode;
  readonly isTranscribe = computed(() => this.mode() === 'transcribe');

  // En ngOnInit():
  ngOnInit(): void {
    const currentFile = this.file();
    const format = this.targetFormat();

    if (!currentFile || (!this.isTranscribe() && !format)) {
      this.router.navigate(['/']);
      return;
    }

    this.extractLocalDuration(currentFile);
    if (this.isTranscribe()) {
      this.startTranscription(currentFile);
    } else {
      this.startConversion(currentFile, format);
    }
  }

  private startTranscription(file: File): void {
    this.progressTimer = setInterval(() => {
      const uploadPct = this.audioApi.uploadProgress();
      const mappedUpload = Math.round(uploadPct * 0.4);

      this.progress.update((current) => {
        if (current < mappedUpload) return mappedUpload;
        if (uploadPct >= 100 && current < 92) {
          const step = current < 70 ? 3 : 1;
          return Math.min(92, current + step);
        }
        return current;
      });
    }, 300);

    this.audioApi.transcribeAudio(file).subscribe({
      next: (event) => {
        if (event.type === HttpEventType.Response) {
          if (this.progressTimer) clearInterval(this.progressTimer);
          this.progress.set(100);

          this.redirectTimeout = setTimeout(() => {
            this.router.navigate(['/transcript']);
          }, 650);
        }
      },
      error: (err) => {
        if (this.progressTimer) clearInterval(this.progressTimer);
        const detail =
          err?.error?.detail || err?.error?.file?.[0] || 'No se pudo transcribir el audio con IA.';
        this.audioApi.conversionError.set(detail);
        this.router.navigate(['/']);
      },
    });
  }

  ngOnDestroy(): void {
    if (this.progressTimer) clearInterval(this.progressTimer);
    if (this.redirectTimeout) clearTimeout(this.redirectTimeout);
  }

  private extractLocalDuration(file: File): void {
    const objectUrl = URL.createObjectURL(file);
    const audioEl = new Audio(objectUrl);

    audioEl.addEventListener('loadedmetadata', () => {
      if (isFinite(audioEl.duration) && audioEl.duration > 0) {
        const mins = Math.floor(audioEl.duration / 60);
        const secs = Math.floor(audioEl.duration % 60);
        this.durationLabel.set(
          `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')} duration`,
        );
      }
      URL.revokeObjectURL(objectUrl);
    });

    audioEl.addEventListener('error', () => URL.revokeObjectURL(objectUrl));
  }

  private startConversion(file: File, format: string): void {
    // Avance gradual mientras el servidor procesa con ffmpeg
    this.progressTimer = setInterval(() => {
      const uploadPct = this.audioApi.uploadProgress();
      const mappedUpload = Math.round(uploadPct * 0.4); // 0% a 40% corresponde a subida

      this.progress.update((current) => {
        if (current < mappedUpload) return mappedUpload;
        if (uploadPct >= 100 && current < 92) {
          // Incremento desacelerado hasta esperar la respuesta final del back-end
          const step = current < 70 ? 4 : 1;
          return Math.min(92, current + step);
        }
        return current;
      });
    }, 250);

    this.audioApi.convertAudio({ file, format }).subscribe({
      next: (event) => {
        if (event.type === HttpEventType.Response) {
          if (this.progressTimer) clearInterval(this.progressTimer);
          this.progress.set(100);

          this.redirectTimeout = setTimeout(() => {
            this.router.navigate(['/result']);
          }, 650);
        }
      },
      error: (err) => {
        if (this.progressTimer) clearInterval(this.progressTimer);
        const detail =
          err?.error?.detail ||
          err?.error?.file?.[0] ||
          'No se pudo convertir el archivo de audio. Intenta con otro archivo.';
        this.audioApi.conversionError.set(detail);
        this.router.navigate(['/']);
      },
    });
  }
}
