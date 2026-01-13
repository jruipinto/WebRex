import { Component, computed, inject, model } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { EditorSidebarComponent } from 'src/shared';
import { InterceptorItemComponent } from '../interceptor-item';
import { InterceptorsService } from '../../interceptors.service';

@Component({
  selector: 'app-interceptor-list',
  templateUrl: './interceptor-list.component.html',
  styleUrl: './interceptor-list.component.css',
  imports: [EditorSidebarComponent, InterceptorItemComponent],
})
export class InterceptorListComponent {
  readonly service = inject(InterceptorsService);

  $interceptors = toSignal(this.service.interceptors$);

  $interceptorsMapped = computed(() =>
    (this.$interceptors() ?? [])
      .filter((i) => i.value.context?.match(this.$searchValue()))
      .map((node) => ({
        name: node.value.context as `/${string}`,
        value: node,
      }))
  );

  $searchValue = model('');
}
