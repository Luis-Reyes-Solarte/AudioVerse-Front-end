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

export interface ConversionRequestPayload {
  file: File;
  format: string;
  bitrate?: string;
  filename?: string;
}
