import { Directive, ElementRef, Renderer2, Input } from '@angular/core';

@Directive({
  selector: '[showSpinner]',
  standalone: true,
})
export class LoadingDirective {
  @Input() showSpinner = false;
  private overlay?: HTMLElement;

  constructor(
    private el: ElementRef,
    private renderer: Renderer2
  ) {}

  ngOnChanges() {
    if (this.showSpinner) {
      this.showOverlay();
    } else {
      this.hideOverlay();
    }
  }

  private showOverlay(): void {
    this.renderer.setStyle(this.el.nativeElement, 'position', 'relative');
    this.renderer.setStyle(this.el.nativeElement, 'overflow', 'hidden');
    this.renderer.setAttribute(this.el.nativeElement, 'disabled', 'true');
    this.overlay = this.renderer.createElement('div');
    this.renderer.addClass(this.overlay, 'loading-overlay');
    this.renderer.setStyle(this.overlay, 'position', 'absolute');
    this.renderer.setStyle(this.overlay, 'top', '0');
    this.renderer.setStyle(this.overlay, 'left', '0');
    this.renderer.setStyle(this.overlay, 'right', '0');
    this.renderer.setStyle(this.overlay, 'bottom', '0');
    this.renderer.setStyle(
      this.overlay,
      'background',
      'rgba(255, 255, 255, 0.05)'
    );
    this.renderer.setStyle(this.overlay, 'display', 'flex');
    this.renderer.setStyle(this.overlay, 'align-items', 'center');
    this.renderer.setStyle(this.overlay, 'justify-content', 'center');
    this.renderer.setStyle(this.overlay, 'z-index', '999');

    const spinner = this.renderer.createElement('div');
    this.renderer.addClass(spinner, 'spinner-border');
    this.renderer.setAttribute(spinner, 'role', 'status');

    this.renderer.appendChild(this.overlay, spinner);
    this.renderer.appendChild(this.el.nativeElement, this.overlay);
  }

  private async hideOverlay(): Promise<void> {
    if (this.overlay) {
      await new Promise((resolve) => setTimeout(resolve, 300)); // delay to make UX smooth
      this.renderer.removeChild(this.el.nativeElement, this.overlay);
      this.renderer.setStyle(this.el.nativeElement, 'position', 'revert');
      this.renderer.setStyle(this.el.nativeElement, 'overflow', 'revert');
      this.renderer.removeAttribute(this.el.nativeElement, 'disabled');

      this.overlay = undefined;
    }
  }
}
