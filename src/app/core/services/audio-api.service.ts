import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpEvent, HttpEventType } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import {
  AudioConversionResponse,
  AudioFormatOption,
  ConversionRequestPayload,
} from '../models/audio.models';

@Injectable({ providedIn: 'root' })
export class AudioApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = 'http://localhost:8000/api/audio';

  readonly currentFile = signal<File | null>(null);
  readonly targetFormat = signal<string>('');
  readonly uploadProgress = signal<number>(0);
  readonly conversionResult = signal<AudioConversionResponse | null>(null);
  readonly conversionError = signal<string | null>(null);

  getSupportedFormats(): Observable<AudioFormatOption[]> {
    return this.http.get<AudioFormatOption[]>(`${this.baseUrl}/formats/`);
  }

  prepareConversion(file: File, format: string): void {
    this.currentFile.set(file);
    this.targetFormat.set(format);
    this.uploadProgress.set(0);
    this.conversionResult.set(null);
    this.conversionError.set(null);
  }

  convertAudio(payload: ConversionRequestPayload): Observable<HttpEvent<AudioConversionResponse>> {
    const formData = new FormData();
    formData.append('file', payload.file);
    formData.append('format', payload.format);

    if (payload.bitrate) {
      formData.append('bitrate', payload.bitrate);
    }
    if (payload.filename) {
      formData.append('filename', payload.filename);
    }

    return this.http
      .post<AudioConversionResponse>(`${this.baseUrl}/convert/`, formData, {
        reportProgress: true,
        observe: 'events',
      })
      .pipe(
        tap((event) => {
          if (event.type === HttpEventType.UploadProgress && event.total) {
            const percent = Math.round((100 * event.loaded) / event.total);
            this.uploadProgress.set(percent);
          } else if (event.type === HttpEventType.Response && event.body) {
            this.conversionResult.set(event.body);
          }
        }),
      );
  }
}
