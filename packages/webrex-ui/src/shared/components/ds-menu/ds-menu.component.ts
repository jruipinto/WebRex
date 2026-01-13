import {
  Component,
  computed,
  contentChildren,
  input,
  output,
  viewChild,
} from '@angular/core';
import { Menu, MenuContent, MenuItem, MenuTrigger } from '@angular/aria/menu';
import { OverlayModule } from '@angular/cdk/overlay';
import { dsButtonStylesMap } from '../../constants';

@Component({
  selector: 'ds-menu',
  templateUrl: './ds-menu.component.html',
  styleUrl: './ds-menu.component.css',
  imports: [Menu, MenuContent, MenuTrigger, OverlayModule],
})
export class DsMenuComponent {
  mainMenu = viewChild<Menu<string>>('mainMenu');

  $label = input.required<string>();

  $variant = input<keyof typeof dsButtonStylesMap>('regular');

  $variantStyles = computed(() => dsButtonStylesMap[this.$variant()]);

  $options = contentChildren(DsMenuOptionComponent);
}

@Component({
  selector: 'ds-menu-option',
  template: `
    <!-- pointerdown and keydown events are being used because ngMenuItem seems to be preventing the use of click or any other later event. This may get fixed in future -->
    <div
      ngMenuItem
      class="flex items-center cursor-pointer gap-1 hover:bg-neutral-500 hover:text-neutral-200 text-neutral-300 text-xs rounded px-2 py-1"
      [value]="value()"
      (pointerdown)="optionSelect.emit(value())"
      (keydown.enter)="optionSelect.emit(value())"
      (keydown.space)="optionSelect.emit(value())"
    >
      <span><ng-content /></span>
    </div>
  `,
  imports: [MenuItem],
})
export class DsMenuOptionComponent<T> {
  optionSelect = output<T>();
  value = input.required<T>();
}
