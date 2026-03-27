import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-search-input',
  templateUrl: './search-input.component.html',
  styleUrl: './search-input.component.css',
})
export class SearchInputComponent {
  value = input.required({ transform: (v: string | undefined) => v ?? '' });
  valueChange = output<string>();
}
