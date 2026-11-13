import { TestBed } from '@angular/core/testing';
import { AudioApiService } from './audio-api.service';

describe('AudioApiService', () => {
  let service: AudioApiService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AudioApiService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
