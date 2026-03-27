import { Component, input, output } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-path-input',
  templateUrl: './path-input.component.html',
  styleUrl: './path-input.component.css',
  imports: [ReactiveFormsModule],
})
export class PathInputComponent {
  title = input.required<string>();
  placeholder = input('/path...');
  value = input(null, { transform: (v: string | undefined) => v ?? '' });
  valueChange = output<string>();
  formControlRef = input(new FormControl());
  readOnly = input<boolean>();
}
