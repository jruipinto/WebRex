import { Overlay } from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';
import { Injectable, inject } from '@angular/core';
import { DsToastComponent } from './ds-toast.component';

@Injectable({ providedIn: 'root' })
export class ToastService {
  private overlay = inject(Overlay);

  private show(
    message: string,
    options: { type: 'success' | 'failure' }
  ): void {
    const positionStrategy = this.overlay
      .position()
      .global()
      .top('10px')
      .right('10px');

    const overlayRef = this.overlay.create({ positionStrategy });
    const portal = new ComponentPortal(DsToastComponent);
    const componentRef = overlayRef.attach(portal);

    componentRef.setInput('$message', message);
    componentRef.setInput('$variant', options.type);
    setTimeout(() => overlayRef.dispose(), 500);
  }

  informSuccess(message: string): void {
    return this.show(message, { type: 'success' });
  }

  informFailure(message: string): void {
    return this.show(message, { type: 'failure' });
  }
}
