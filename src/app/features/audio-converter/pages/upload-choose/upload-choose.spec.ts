import { ComponentFixture, TestBed } from '@angular/core/testing';
import { UploadChoose } from './upload-choose';

describe('UploadChoose', () => {
  let component: UploadChoose;
  let fixture: ComponentFixture<UploadChoose>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UploadChoose],
    }).compileComponents();

    fixture = TestBed.createComponent(UploadChoose);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
