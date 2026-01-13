import { Component, inject, input, signal } from '@angular/core';
import {
  ApiResponse,
  DsButtonComponent,
  DsMenuComponent,
  DsMenuOptionComponent,
  LoadingDirective,
} from 'src/shared';
import { InterceptorDocument } from '../../models';
import { InterceptorsService } from '../../interceptors.service';

@Component({
  selector: 'app-interceptor-item',
  templateUrl: './interceptor-item.component.html',
  styleUrl: './interceptor-item.component.css',
  imports: [
    DsButtonComponent,
    DsMenuComponent,
    DsMenuOptionComponent,
    LoadingDirective,
  ],
})
export class InterceptorItemComponent {
  private readonly service = inject(InterceptorsService);

  $isToggling = signal(false);
  $isDeleting = signal(false);

  nodeInput = input.required<{
    name: string;
    value: ApiResponse<InterceptorDocument>['result'][0];
  }>();

  async toggleInterceptor(
    i: Parameters<InterceptorsService['toggleInterceptor']>[0]
  ): Promise<void> {
    this.$isToggling.set(true);

    i.value.enabled = !i.value.enabled;
    await this.service.toggleInterceptor(i);

    this.$isToggling.set(false);
  }

  open(i: Parameters<InterceptorsService['open']>[0]): void {
    this.service.open(i);
  }

  async delete(i: Parameters<InterceptorsService['delete']>[0]): Promise<void> {
    this.$isDeleting.set(true);
    await this.service.delete(i);
    this.$isDeleting.set(false);
  }
}
