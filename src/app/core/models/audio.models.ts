// src/app/core/models/audio.models.ts
export interface AudioFormatOption {
  value: string;
  label: string;
  mime: string;
  lossy: boolean;
}

export interface AudioFileMetadata {
  name: string;
  size: number;
  size_human: string;
  format: string | null;
  duration?: number;
  duration_formatted?: string | null;
  bitrate?: number;
  sample_rate?: number;
  channels?: number;
  mime?: string;
  data_uri?: string;
}

export interface AudioConversionResponse {
  original: AudioFileMetadata;
  converted: AudioFileMetadata;
}

export interface TranscriptSegment {
  timestamp: string;
  text: string;
}

export interface AudioTranscriptionResponse {
  original: AudioFileMetadata;
  transcript: {
    language: string;
    speakers_count: number;
    segments: TranscriptSegment[];
    full_text: string;
  };
}

export interface ConversionRequestPayload {
  file: File;
  format: string;
  bitrate?: string;
  filename?: string;
}
