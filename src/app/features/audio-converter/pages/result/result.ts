// src/app/features/audio-converter/pages/result/result.ts
import { Component, OnInit, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AudioApiService } from '../../../../core/services/audio-api.service';
import { StepIndicatorComponent } from '../../../../shared/components/step-indicator/step-indicator';

@Component({
  selector: 'app-result',
  standalone: true,
  imports: [StepIndicatorComponent],
  templateUrl: './result.html',
  styleUrl: './result.scss',
})
export class ResultComponent implements OnInit {
  private readonly audioApi = inject(AudioApiService);
  private readonly router = inject(Router);

  readonly result = this.audioApi.conversionResult;

  readonly original = computed(() => this.result()?.original ?? null);
  readonly converted = computed(() => this.result()?.converted ?? null);

  readonly originalFormatLabel = computed(() => (this.original()?.format || 'AUDIO').toUpperCase());

  readonly convertedFormatLabel = computed(() =>
    (this.converted()?.format || 'AUDIO').toUpperCase(),
  );

  // Cálculo de ahorro de peso entre el archivo original y el convertido
  readonly sizeComparison = computed(() => {
    const orig = this.original();
    const conv = this.converted();
    if (!orig || !conv || orig.size <= 0) return null;

    const diffBytes = orig.size - conv.size;
    const pct = Math.round((Math.abs(diffBytes) / orig.size) * 100);
    const diffFormatted = this.formatBytes(Math.abs(diffBytes));

    if (diffBytes > 0) {
      return {
        isSmaller: true,
        headline: `${pct}% smaller`,
        detail: `${diffFormatted} saved`,
      };
    }

    if (diffBytes < 0) {
      return {
        isSmaller: false,
        headline: `${pct}% larger`,
        detail: `+${diffFormatted} lossless/uncompressed`,
      };
    }

    return {
      isSmaller: true,
      headline: 'Same size',
      detail: '0 B difference',
    };
  });

  // Resumen técnico: ej. "MP3 · 192 kbps · Stereo"
  readonly technicalSpecsLabel = computed(() => {
    const conv = this.converted();
    if (!conv) return '';

    const parts: string[] = [this.convertedFormatLabel()];

    if (conv.bitrate) {
      const kbps = Math.round(conv.bitrate / 1000);
      parts.push(`${kbps} kbps`);
    }

    if (conv.channels) {
      const channelLabel =
        conv.channels === 1 ? 'Mono' : conv.channels === 2 ? 'Stereo' : `${conv.channels} ch`;
      parts.push(channelLabel);
    }

    return parts.join(' · ');
  });

  ngOnInit(): void {
    if (!this.result()) {
      this.router.navigate(['/']);
    }
  }

  downloadConvertedFile(): void {
    const conv = this.converted();
    if (!conv?.data_uri) return;

    const link = document.createElement('a');
    link.href = conv.data_uri;
    link.download = conv.name || `converted.${conv.format || 'mp3'}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  convertAnother(): void {
    this.audioApi.currentFile.set(null);
    this.audioApi.targetFormat.set('');
    this.audioApi.conversionResult.set(null);
    this.audioApi.conversionError.set(null);
    this.router.navigate(['/']);
  }

  private formatBytes(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    const kb = bytes / 1024;
    if (kb < 1024) return `${kb.toFixed(1)} KB`;
    return `${(kb / 1024).toFixed(1)} MB`;
  }
}
