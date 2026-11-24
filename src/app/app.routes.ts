import { Routes } from '@angular/router';
import { UploadChooseComponent } from './features/audio-converter/pages/upload-choose/upload-choose';
import { ProcessingComponent } from './features/audio-converter/pages/processing/processing';
import { ResultComponent } from './features/audio-converter/pages/result/result';
import { TranscriptResultComponent } from './features/audio-converter/pages/transcript-result/transcript-result';

export const routes: Routes = [
  { path: '', component: UploadChooseComponent },
  { path: 'processing', component: ProcessingComponent },
  { path: 'result', component: ResultComponent },
  { path: 'transcript', component: TranscriptResultComponent },
  { path: '**', redirectTo: '' },
];
