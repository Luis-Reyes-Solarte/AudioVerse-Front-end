// src/app/app.routes.ts
import { Routes } from '@angular/router';
import { UploadChooseComponent } from './features/audio-converter/pages/upload-choose/upload-choose';

export const routes: Routes = [
  {
    path: '',
    component: UploadChooseComponent,
  },
  {
    path: '**',
    redirectTo: '',
  },
];
