import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnDestroy,
  effect,
  inject,
  viewChildren,
} from '@angular/core';
import { ScrollService } from '../core/scroll.service';
import { ThemeService, prefersReducedMotion } from '../core/theme.service';

/** One star tile; each layer repeats its tile as a background image. */
const TILE = 1024;

interface Layer {
  cls: string;
  size: number;      // px — stars are size×size squares
  count: number;     // stars per tile
  colorVar: string;  // CSS custom property for the colour
  drift: number;     // seconds for one full rotation
  parallax: number;  // degrees of extra rotation per 1000px scrolled
  ccw?: boolean;     // spin counter-clockwise
  seed: number;
}

/** Deterministic PRNG so the sky is identical on every load. */
const rng = (seed: number) => () => {
  seed = (seed * 16807) % 2147483647;
  return (seed - 1) / 2147483646;
};

/**
 * Site-wide galaxy background.
 * Each layer's stars are drawn ONCE into a small canvas tile and used as a repeating background image,
 * so moving the layers (drift animation + scroll parallax) is pure GPU compositing — no re-rasterising.
 */
@Component({
  selector: 'app-starfield',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { 'aria-hidden': 'true' },
  template: `
    @for (l of layers; track l.cls) {
      <div class="par" #par>
        <div #sky [class]="'sky ' + l.cls + (l.ccw ? ' ccw' : '')" [style.animation-duration.s]="l.drift"></div>
      </div>
    }
  `,
  styles: `
    /* idle: stars rest dim. While the page scrolls they flare up, then ease back down shortly after scrolling stops. */
    :host { position: fixed; inset: 0; z-index: 0; pointer-events: none; overflow: hidden; contain: strict;
      opacity: 0.32; transition: opacity 0.9s ease; will-change: opacity; }
    :host(.scrolling), :host(.speaking) { opacity: 1; transition: opacity 0.18s ease-out; }
    /* each layer is a square larger than the viewport diagonal, centred, so it can rotate without exposing edges */
    .par { position: absolute; left: 50%; top: 50%; width: 160vmax; height: 160vmax; margin: -80vmax 0 0 -80vmax; will-change: transform; }
    .sky {
      position: absolute; inset: 0; background-repeat: repeat; background-size: ${TILE}px ${TILE}px;
      animation: star-spin linear infinite; will-change: transform;
    }
    .sky.ccw { animation-direction: reverse; }
    @keyframes star-spin { to { transform: rotate(360deg); } }
  `,
})
export class Starfield implements AfterViewInit, OnDestroy {
  private scroll = inject(ScrollService);
  private theme = inject(ThemeService);
  private pars = viewChildren<ElementRef<HTMLElement>>('par');
  private skies = viewChildren<ElementRef<HTMLElement>>('sky');
  private off?: () => void;
  private host = inject<ElementRef<HTMLElement>>(ElementRef);
  private idleTimer?: ReturnType<typeof setTimeout>;
  private ready = false;

  protected readonly layers: Layer[] = [
    // dense field like the hero: many tiny dots, fewer bigger/brighter ones (counts are per 1024×1024 tile)
    // drift = seconds per full rotation; parallax = degrees of extra spin per 1000px scrolled
    { cls: 'far', size: 1, count: 520, colorVar: '--star-far', drift: 420, parallax: 2, seed: 11 },
    { cls: 'mid', size: 2, count: 210, colorVar: '--star-mid', drift: 300, parallax: 4, seed: 23, ccw: true },
    { cls: 'near', size: 2, count: 70, colorVar: '--star-near', drift: 220, parallax: 7, seed: 37 },
    { cls: 'glow', size: 3, count: 26, colorVar: '--star-glow', drift: 170, parallax: 10, seed: 53, ccw: true },
  ];

  constructor() {
    // Re-draw the tiles in the new colours when the theme changes (after the attribute is applied).
    effect(() => {
      this.theme.isDark();
      if (this.ready) requestAnimationFrame(() => this.paint());
    });
  }

  ngAfterViewInit() {
    this.ready = true;
    this.paint();

    const pars = this.pars().map(p => p.nativeElement);
    if (prefersReducedMotion()) {
      this.skies().forEach(s => (s.nativeElement.style.animation = 'none'));
    } else {
      // brightest layer twinkles (opacity only — composited)
      pars[pars.length - 1].style.animation = 'star-twinkle 4.5s ease-in-out infinite';
    }

    // scrolling turns each layer a little extra (nearer layers turn more) — a swirl like the hero, never an edge
    const apply = (y: number) => {
      pars.forEach((el, i) => {
        const l = this.layers[i];
        const deg = (y / 1000) * l.parallax * (l.ccw ? -1 : 1);
        el.style.transform = `rotate(${deg.toFixed(2)}deg)`;
      });
    };
    apply(this.scroll.y);
    const hostEl = this.host.nativeElement;
    this.off = this.scroll.onFrame(y => {
      apply(y);
      // brighten while scrolling; dim again ~350ms after the last scroll event
      if (!hostEl.classList.contains('scrolling')) hostEl.classList.add('scrolling');
      clearTimeout(this.idleTimer);
      this.idleTimer = setTimeout(() => hostEl.classList.remove('scrolling'), 350);
    });
  }

  ngOnDestroy() {
    clearTimeout(this.idleTimer);
    this.off?.();
  }

  /** Draw each layer's tile once and apply it as a repeating background image. */
  private paint() {
    const css = getComputedStyle(document.documentElement);
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const skies = this.skies();
    this.layers.forEach((l, i) => {
      const canvas = document.createElement('canvas');
      canvas.width = canvas.height = TILE * dpr;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.scale(dpr, dpr);
      ctx.fillStyle = css.getPropertyValue(l.colorVar).trim() || '#fff';
      const r = rng(l.seed);
      for (let s = 0; s < l.count; s++) {
        ctx.fillRect(Math.round(r() * TILE), Math.round(r() * TILE), l.size, l.size);
      }
      const el = skies[i]?.nativeElement;
      if (el) el.style.backgroundImage = `url(${canvas.toDataURL('image/png')})`;
    });
  }
}
