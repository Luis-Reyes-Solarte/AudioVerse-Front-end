import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from 'docx';
import { AudioApiService } from '../../../../core/services/audio-api.service';
import { StepIndicatorComponent } from '../../../../shared/components/step-indicator/step-indicator';

@Component({
  selector: 'app-transcript-result',
  standalone: true,
  imports: [StepIndicatorComponent],
  templateUrl: './transcript-result.html',
  styleUrl: './transcript-result.scss',
})
export class TranscriptResultComponent implements OnInit {
  private readonly audioApi = inject(AudioApiService);
  private readonly router = inject(Router);

  readonly result = this.audioApi.transcriptionResult;
  readonly copied = signal<boolean>(false);

  readonly metaSummary = computed(() => {
    const res = this.result();
    if (!res) return '';

    const parts: string[] = [res.transcript.language];
    if (res.original.duration_formatted) {
      parts.push(res.original.duration_formatted);
    }
    const speakers = res.transcript.speakers_count || 1;
    parts.push(speakers === 1 ? '1 speaker' : `${speakers} speakers`);

    return parts.join(' · ');
  });

  ngOnInit(): void {
    if (!this.result()) {
      this.router.navigate(['/']);
    }
  }

  async copyToClipboard(): Promise<void> {
    const text = this.result()?.transcript.full_text;
    if (!text) return;

    await navigator.clipboard.writeText(text);
    this.copied.set(true);
    setTimeout(() => this.copied.set(false), 2200);
  }

  downloadTxt(): void {
    const res = this.result();
    if (!res) return;

    const baseName = this.getBaseFilename(res.original.name);
    const content = res.transcript.segments
      .map((seg) => `[${seg.timestamp}] ${seg.text}`)
      .join('\n\n');

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    this.triggerBlobDownload(blob, `${baseName}-transcript.txt`);
  }

  async downloadDocx(): Promise<void> {
    const res = this.result();
    if (!res) return;

    const baseName = this.getBaseFilename(res.original.name);

    const doc = new Document({
      sections: [
        {
          children: [
            new Paragraph({
              text: `Transcript: ${res.original.name}`,
              heading: HeadingLevel.HEADING_1,
            }),
            new Paragraph({
              children: [
                new TextRun({
                  text: this.metaSummary(),
                  italics: true,
                  color: '666666',
                }),
              ],
              spacing: { after: 300 },
            }),
            ...res.transcript.segments.map(
              (seg) =>
                new Paragraph({
                  children: [
                    new TextRun({
                      text: `[${seg.timestamp}] `,
                      bold: true,
                      color: '7860ED',
                    }),
                    new TextRun({ text: seg.text }),
                  ],
                  spacing: { after: 200 },
                }),
            ),
          ],
        },
      ],
    });

    const blob = await Packer.toBlob(doc);
    this.triggerBlobDownload(blob, `${baseName}-transcript.docx`);
  }

  uploadNewAudio(): void {
    this.audioApi.currentFile.set(null);
    this.audioApi.transcriptionResult.set(null);
    this.audioApi.conversionError.set(null);
    this.router.navigate(['/']);
  }

  private getBaseFilename(name: string): string {
    return name.replace(/\.[^/.]+$/, '') || 'audio';
  }

  private triggerBlobDownload(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}
