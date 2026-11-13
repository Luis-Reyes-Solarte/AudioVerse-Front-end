import { Component, input } from '@angular/core';

@Component({
  selector: 'app-step-indicator',
  standalone: true,
  template: `
    <nav class="stepper" aria-label="Progreso del proceso">
      <div class="step" [class.active]="currentStep() === 1" [class.completed]="currentStep() > 1">
        <span class="step-badge">{{ currentStep() > 1 ? '✓' : '1' }}</span>
        <span class="step-label">Upload &amp; choose</span>
      </div>

      <span class="step-divider"></span>

      <div class="step" [class.active]="currentStep() === 2" [class.completed]="currentStep() > 2">
        <span class="step-badge">{{ currentStep() > 2 ? '✓' : '2' }}</span>
        <span class="step-label">Processing</span>
      </div>

      <span class="step-divider"></span>

      <div class="step" [class.active]="currentStep() === 3">
        <span class="step-badge">3</span>
        <span class="step-label">Your result</span>
      </div>
    </nav>
  `,
  styleUrl: './step-indicator.scss',
})
export class StepIndicatorComponent {
  currentStep = input.required<1 | 2 | 3>();
}
