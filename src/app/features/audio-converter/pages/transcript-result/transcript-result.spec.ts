import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranscriptResult } from './transcript-result';

describe('TranscriptResult', () => {
  let component: TranscriptResult;
  let fixture: ComponentFixture<TranscriptResult>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TranscriptResult],
    }).compileComponents();

    fixture = TestBed.createComponent(TranscriptResult);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
