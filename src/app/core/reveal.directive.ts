import { Directive, ElementRef, OnDestroy, OnInit, inject, input } from '@angular/core';

/** Fades/lifts an element into view (with a slight 3D tilt) the first time it scrolls on screen. */
@Directive({
  selector: '[appReveal]',
  host: { class: 'reveal' },
})
export class RevealDirective implements OnInit, OnDestroy {
  readonly revealDelay = input(0);
  private el = inject<ElementRef<HTMLElement>>(ElementRef);
  private observer?: IntersectionObserver;

  ngOnInit() {
    const node = this.el.nativeElement;
    node.style.transitionDelay = `${this.revealDelay()}ms`;
    if (typeof IntersectionObserver === 'undefined') {
      node.classList.add('revealed');
      return;
    }
    this.observer = new IntersectionObserver(
      entries => {
        for (const e of entries) {
          if (e.isIntersecting) {
            node.classList.add('revealed');
            this.observer?.disconnect();
          }
        }
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' },
    );
    this.observer.observe(node);
  }

  ngOnDestroy() {
    this.observer?.disconnect();
  }
}
