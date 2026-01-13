import { Component, computed, input } from '@angular/core';
import { LoadingDirective } from '../../directives';
import { dsButtonStylesMap } from '../../constants';

@Component({
  selector: 'ds-button',
  templateUrl: './ds-button.component.html',
  styleUrl: './ds-button.component.css',
  imports: [LoadingDirective],
})
export class DsButtonComponent {
  $isLoading = input(false);
  $variant = input<keyof typeof dsButtonStylesMap>('regular');

  $variantStyles = computed(() => dsButtonStylesMap[this.$variant()]);
}
