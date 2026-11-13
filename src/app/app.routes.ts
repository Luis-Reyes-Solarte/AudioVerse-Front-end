import { Routes } from '@angular/router';
import { UploadChooseComponent } from './features/audio-converter/pages/upload-choose/upload-choose';
import { ProcessingComponent } from './features/audio-converter/pages/processing/processing';

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
    path: '**',
    redirectTo: '',
  },
];
