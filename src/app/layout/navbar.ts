import { ChangeDetectionStrategy, Component, DestroyRef, afterNextRender, inject, output, signal } from '@angular/core';
import { Icon } from '../core/icon';
import { AssistantService } from '../core/assistant.service';
import { ThemeService } from '../core/theme.service';
import { ScrollService } from '../core/scroll.service';
import { NAV_LINKS } from '../data/portfolio.data';

@Component({
  selector: 'app-navbar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Icon],
  host: {
    '(window:resize)': 'scheduleUpdate()',
    '(document:keydown.escape)': 'menuOpen.set(false)',
  },
  template: `
    <div class="progress" [style.transform]="'scaleX(' + progress() + ')'"></div>
    <header class="nav-wrap" [class.scrolled]="scrolled()">
      <nav class="nav" aria-label="Primary">
        <a href="#home" class="logo" (click)="go($event, 'home')" aria-label="Kishore V — home">
          <img src="assets/favicon.svg" alt="" width="30" height="30" />
          <span>kishore<span class="logo-dot">.dev</span></span>
        </a>

        <ul class="links">
          @for (l of links; track l.id) {
            <li>
              <a [href]="'#' + l.id" (click)="go($event, l.id)"
                 [class.active]="active() === l.id"
                 [attr.aria-current]="active() === l.id ? 'page' : null">{{ l.label }}</a>
            </li>
          }
        </ul>

        <div class="actions">
          @if (assistant.voice.canListen) {
            <button class="icon-btn" [class.wake]="assistant.voice.wakeOn()" type="button" (click)="assistant.toggleWake()" [attr.aria-pressed]="assistant.voice.wakeOn()"
                    [attr.aria-label]="assistant.voice.wakeOn() ? 'Turn off the Alpha wake word' : 'Turn on the Alpha wake word'" [title]="assistant.voice.wakeOn() ? 'Listening for “Alpha”' : 'Say “Alpha” to wake the assistant'">
              <app-icon name="mic" [size]="16" />
            </button>
          }
          <button class="icon-btn" type="button" (click)="assistant.voice.toggle()" [attr.aria-label]="assistant.voice.enabled() ? 'Mute ALPHA' : 'Unmute ALPHA'">
            <app-icon [name]="assistant.voice.enabled() ? 'volume' : 'volume-x'" [size]="16" />
          </button>
          <button class="icon-btn" type="button" (click)="theme.toggle()"
                  [attr.aria-label]="theme.isDark() ? 'Switch to light theme' : 'Switch to dark theme'">
            <app-icon [name]="theme.isDark() ? 'sun' : 'moon'" [size]="17" />
          </button>
          <button class="btn btn-primary resume-btn" type="button" (click)="openResume.emit()">
            <app-icon name="file" [size]="15" /> Resume
          </button>
          <button class="icon-btn menu-btn" type="button" (click)="menuOpen.set(!menuOpen())"
                  [attr.aria-expanded]="menuOpen()" aria-label="Toggle menu">
            <app-icon [name]="menuOpen() ? 'close' : 'menu'" [size]="18" />
          </button>
        </div>
      </nav>

      @if (menuOpen()) {
        <div class="mobile glass">
          @for (l of links; track l.id; let i = $index) {
            <a [href]="'#' + l.id" (click)="go($event, l.id)" [class.active]="active() === l.id"
               [style.animation-delay]="i * 35 + 'ms'">
              <span class="num">0{{ i + 1 }}</span>{{ l.label }}
            </a>
          }
          <button class="btn btn-primary" type="button" (click)="menuOpen.set(false); openResume.emit()">
            <app-icon name="file" [size]="15" /> View Resume
          </button>
        </div>
      }
    </header>
  `,
  styleUrl: './navbar.scss',
})
export class Navbar {
  protected readonly assistant = inject(AssistantService);
  protected readonly theme = inject(ThemeService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly scroll = inject(ScrollService);
  protected readonly links = NAV_LINKS;
  readonly openResume = output<void>();

  protected readonly scrolled = signal(false);
  protected readonly active = signal('home');
  protected readonly progress = signal(0);
  protected readonly menuOpen = signal(false);

  private frame = 0;
  /** Section tops (document coordinates) and max scroll, measured only when layout changes. */
  private tops: number[] = [];
  private maxScroll = 0;

  constructor() {
    afterNextRender(() => {
      this.measure();
      // Page height changes (images loading, cards expanding, resize) → re-measure, never on scroll.
      const ro = new ResizeObserver(() => {
        this.measure();
        this.scheduleUpdate();
      });
      ro.observe(document.body);
      const off = this.scroll.onFrame(() => this.onScroll());
      this.destroyRef.onDestroy(() => {
        ro.disconnect();
        off();
      });
      this.onScroll();
    });
  }

  private measure() {
    const y = window.scrollY;
    this.tops = this.links.map(l => {
      const el = document.getElementById(l.id);
      return el ? el.getBoundingClientRect().top + y : Number.POSITIVE_INFINITY;
    });
    this.maxScroll = document.documentElement.scrollHeight - window.innerHeight;
  }

  /** Scroll fires many times per frame; do the layout reads at most once per frame. */
  scheduleUpdate() {
    if (this.frame) return;
    this.frame = requestAnimationFrame(() => {
      this.frame = 0;
      this.onScroll();
    });
  }

  onScroll() {
    const y = this.scroll.y;
    const max = this.maxScroll;
    this.scrolled.set(y > 24);
    this.progress.set(max > 0 ? Math.min(y / max, 1) : 0);

    if (max > 0 && y >= max - 2) {
      this.active.set(this.links[this.links.length - 1].id);
      return;
    }
    let current = this.links[0].id;
    this.links.forEach((l, i) => {
      if (this.tops[i] - 140 <= y) current = l.id;
    });
    this.active.set(current);
  }

  go(e: Event, id: string) {
    e.preventDefault();
    this.menuOpen.set(false);
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    history.replaceState(null, '', '#' + id);
  }
}
