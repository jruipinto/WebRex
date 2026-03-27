import { Component, computed, input } from '@angular/core';

@Component({
  selector: 'ds-toast',
  templateUrl: './ds-toast.component.html',
  styleUrl: './ds-toast.component.css',
})
export class DsToastComponent {
  $message = input.required<string>();
  $variant = input.required<keyof typeof variantStylesMap>();
  $variantStyles = computed(() => variantStylesMap[this.$variant()]);
}

const variantStylesMap = {
  success:
    'flex justify-start align-center gap-2 px-2 py-2 bg-teal-800 text-teal-50 border border-teal-700 text-xs font-medium transition min-w-[24em] opacity-75',
  failure:
    'flex justify-start align-center gap-2 px-2 py-2 bg-rose-800 text-rose-50 border border-rose-700 text-xs font-medium transition min-w-[24em] opacity-75',
} as const;
