import { Directive, ElementRef, inject, input } from '@angular/core';
import { prefersReducedMotion } from './theme.service';

/**
 * Mouse-driven 3D tilt with a moving glare highlight.
 * Exposes --glare-x / --glare-y CSS variables for the `.tilt-glare` overlay.
 */
@Directive({
  selector: '[appTilt]',
  host: {
    class: 'tilt',
    '(pointermove)': 'onMove($event)',
    '(pointerleave)': 'reset()',
  },
})
export class TiltDirective {
  /** Maximum rotation in degrees. */
  readonly tiltMax = input(10);
  private el = inject<ElementRef<HTMLElement>>(ElementRef);
  private reduced = prefersReducedMotion();
  private frame = 0;

  onMove(e: PointerEvent) {
    if (this.reduced || e.pointerType !== 'mouse') return;
    const node = this.el.nativeElement;
    const r = node.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width;
    const py = (e.clientY - r.top) / r.height;
    const max = this.tiltMax();
    cancelAnimationFrame(this.frame);
    this.frame = requestAnimationFrame(() => {
      node.style.transform =
        `perspective(1100px) rotateX(${(0.5 - py) * max}deg) rotateY(${(px - 0.5) * max}deg) translateZ(0)`;
      node.style.setProperty('--glare-x', `${px * 100}%`);
      node.style.setProperty('--glare-y', `${py * 100}%`);
      node.classList.add('tilting');
    });
  }

  reset() {
    cancelAnimationFrame(this.frame);
    const node = this.el.nativeElement;
    node.style.transform = '';
    node.classList.remove('tilting');
  }
}
