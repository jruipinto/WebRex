import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  EditorComponent,
  DsButtonComponent,
  PathInputComponent,
} from 'src/shared';
import { ReactiveFormsModule } from '@angular/forms';
import { InterceptorListComponent } from './components';
import { InterceptorsService } from './interceptors.service';

@Component({
  selector: 'app-interceptors',
  templateUrl: './interceptors.component.html',
  styleUrl: './interceptors.component.css',
  imports: [
    CommonModule,
    EditorComponent,
    InterceptorListComponent,
    ReactiveFormsModule,
    DsButtonComponent,
    PathInputComponent,
  ],
})
export class InterceptorsComponent {
  private readonly service = inject(InterceptorsService);
  form = this.service.form;

  $isToggling = signal(false);
  $isDeleting = signal(false);
  $isSaving = signal(false);

  async toggleInterceptor(
    i: Parameters<InterceptorsService['toggleInterceptor']>[0]
  ): Promise<void> {
    this.$isToggling.set(true);

    i.value.enabled = !i.value.enabled;
    await this.service.toggleInterceptor(i);

    this.$isToggling.set(false);
  }

  async delete(i: Parameters<InterceptorsService['delete']>[0]): Promise<void> {
    this.$isDeleting.set(true);
    await this.service.delete(i);
    this.$isDeleting.set(false);
  }

  async save(i: Parameters<InterceptorsService['save']>[0]): Promise<void> {
    this.$isSaving.set(true);
    await this.service.save(i);
    this.$isSaving.set(false);
  }
}
