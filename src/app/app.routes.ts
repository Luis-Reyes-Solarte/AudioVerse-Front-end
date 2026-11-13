// src/app/app.routes.ts
import { Routes } from '@angular/router';
import { UploadChooseComponent } from './features/audio-converter/pages/upload-choose/upload-choose';
import { ProcessingComponent } from './features/audio-converter/pages/processing/processing';
import { ResultComponent } from './features/audio-converter/pages/result/result';

export const routes: Routes = [
  {
    path: '',
    component: UploadChooseComponent,
  },
  {
    path: 'processing',
    component: ProcessingComponent,
  },
  {
    path: 'result',
    component: ResultComponent,
  },
  {
    path: '**',
    redirectTo: '',
  },
];
