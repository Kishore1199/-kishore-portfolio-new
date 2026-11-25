import { Explain } from '../core/explain';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnDestroy,
  computed,
  inject,
  signal,
  viewChild,
  viewChildren,
} from '@angular/core';
import { AssistantBus } from '../core/assistant.bus';
import { Icon } from '../core/icon';
import { RevealDirective } from '../core/reveal.directive';
import { prefersReducedMotion } from '../core/theme.service';
import { STUDY_GUIDES, StudyGuide, StudyTopic } from '../data/study.data';

const AREA_ICONS: Record<string, string> = {
  'Core Java': 'coffee', 'Engineering Practice': 'wrench', 'Java Web & Database': 'globe', 'Spring & APIs': 'leaf',
  'Persistence': 'database', 'Distributed Systems': 'network', 'Frontend': 'layout', 'DevOps & Monitoring': 'cloud',
  'PHP & Healthcare': 'heart-pulse', 'Revision': 'refresh', 'DSA patterns': 'tree', 'Java & Spring coding': 'code',
  'Frontend coding': 'braces', 'SQL & NoSQL': 'database', 'PHP coding': 'terminal', 'Checklist': 'list-check',
};
const PALETTE = ['#F97316', '#3B82F6', '#10B981', '#8B5CF6', '#EC4899', '#06B6D4', '#F59E0B', '#EF4444', '#14B8A6', '#84CC16',
  '#A855F7', '#0EA5E9', '#22C55E', '#E11D48', '#6366F1', '#D97706'];

interface Card {
  i: number;
  topic: StudyTopic;
  guide: StudyGuide;
  area: string;
  color: string;
  icon: string;
}
interface AreaMark {
  name: string;
  color: string;
  icon: string;
  first: number; // index of its first card
  guide: StudyGuide;
}

/** Study notes as a curved 3D wall of chapter cards: drag / scroll along it, jump by area, search, scrub. */
@Component({
  selector: 'app-prep',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Explain, Icon, RevealDirective],
  host: { '(window:resize)': 'measure()' },
  template: `
    <section id="prep" class="section">
      <div class="container">
        <div class="section-head" appReveal>
          <p class="eyebrow">Study notes<app-explain section="prep" /></p>
          <h2 class="title">The <span class="gradient-text">chapter wall</span></h2>
          <p class="lead">All {{ cards.length }} chapters of my two interview-prep guides on one curved wall. Drag or swipe along it, jump to an area, or search — every card opens its chapter.</p>
        </div>

        <div class="topbar" appReveal>
          <label class="search">
            <app-icon name="search" [size]="15" />
            <input type="search" placeholder="Jump to a topic — Kafka, JWT, DP…" [value]="query()" (input)="onSearch($any($event.target).value)"
                   (keydown.enter)="nextMatch()" aria-label="Jump to a topic" />
            @if (query()) {
              <span class="hits">{{ matchIdx().length ? (matchCursor() + 1) + ' / ' + matchIdx().length : '0' }}</span>
              @if (matchIdx().length > 1) { <button type="button" class="mini" (click)="nextMatch()" aria-label="Next match"><app-icon name="arrow-right" [size]="13" /></button> }
            }
          </label>
          <div class="guides">
            @for (g of guides; track g.key) {
              <button type="button" class="g" [style.--c]="g.accent" (click)="goToCard(firstOfGuide(g))">
                <app-icon [name]="g.icon" [size]="14" /> {{ g.short }}
              </button>
            }
            <button type="button" class="g" style="--c: var(--accent)" (click)="bus.openInterview()"><app-icon name="mic" [size]="14" /> Mock interview</button>
          </div>
        </div>

        <div class="chips" appReveal>
          @for (a of areas; track a.name + a.guide.key) {
            <button type="button" class="chip-a" [style.--c]="a.color" [class.on]="currentArea() === a.name" (click)="goToCard(a.first)">
              <app-icon [name]="a.icon" [size]="12" /> {{ a.name }}
            </button>
          }
        </div>

        <!-- the wall -->
        <div class="stage" #stage appReveal tabindex="0" aria-label="Chapter wall. Use left and right arrow keys to move."
             (pointerdown)="down($event)" (pointermove)="move($event)" (pointerup)="up()" (pointercancel)="up()"
             (wheel)="wheel($event)" (keydown)="key($event)">
          <div class="beam" aria-hidden="true"></div>
          <div class="wall">
            @for (c of cards; track c.i) {
              <a #card class="card" [href]="c.guide.file + '#' + c.topic.id" target="_blank" rel="noopener" draggable="false"
                 [style.--c]="c.color" [style.width.px]="cardW()" [style.height.px]="cardH()"
                 [class.hit]="isHit(c)" [class.dim]="query() && !isHit(c)"
                 [attr.aria-label]="c.topic.title + ', ' + c.topic.questions + ' questions'">
                <span class="c-top">
                  <span class="c-ico"><app-icon [name]="c.icon" [size]="13" /></span>
                  <span class="c-area">{{ c.area }}</span>
                  @if (c.topic.isNew) { <span class="c-new">new</span> }
                </span>
                <span class="c-title">{{ c.topic.title }}</span>
                <span class="c-foot">
                  <span class="c-q"><b>{{ c.topic.questions }}</b> Q</span>
                  <span class="c-guide">{{ c.guide.key === 'java' ? 'Java' : 'DSA' }}</span>
                </span>
              </a>
            }
          </div>
          <button type="button" class="nav prev" (click)="step(-3)" aria-label="Move left"><app-icon name="arrow-right" [size]="18" /></button>
          <button type="button" class="nav next" (click)="step(3)" aria-label="Move right"><app-icon name="arrow-right" [size]="18" /></button>
        </div>

        <!-- scrubber -->
        <div class="scrub" appReveal>
          <span class="s-area" [style.color]="currentColor()"><app-icon [name]="currentIcon()" [size]="14" /> {{ currentArea() }}</span>
          <div class="s-track">
            <div class="s-marks" aria-hidden="true">
              @for (a of areas; track a.name + a.guide.key) {
                <i [style.left.%]="pct(a.first)" [style.background]="a.color"></i>
              }
            </div>
            <input type="range" min="0" [max]="cols() - 1" step="0.01" [value]="posView()" (input)="scrubTo(+$any($event.target).value)" aria-label="Scroll the wall" />
          </div>
          <span class="s-count">{{ centerCol() + 1 }} / {{ cols() }}</span>
        </div>
      </div>
    </section>
  `,
  styles: `
    .topbar { display: flex; flex-wrap: wrap; gap: 12px; justify-content: space-between; align-items: center; margin-bottom: 12px; }
    .search { display: flex; align-items: center; gap: 8px; height: 44px; padding: 0 8px 0 14px; flex: 1; max-width: 460px; border-radius: 12px; border: 1px solid var(--border); background: var(--surface); color: var(--text-3); }
    .search:focus-within { border-color: var(--accent); box-shadow: 0 0 0 4px var(--accent-soft); }
    .search input { flex: 1; min-width: 0; border: 0; outline: none; background: none; color: var(--text); font: inherit; font-size: 0.9rem; }
    .hits { font: 600 0.72rem 'JetBrains Mono', monospace; color: var(--accent); white-space: nowrap; }
    .mini { width: 28px; height: 28px; border-radius: 8px; border: 1px solid var(--border); background: var(--surface-2); color: var(--accent); display: grid; place-items: center; cursor: pointer; }
    .guides { display: flex; gap: 8px; }
    .g { display: inline-flex; align-items: center; gap: 6px; padding: 9px 14px; border-radius: 11px; border: 1px solid var(--border); background: var(--surface); color: var(--text); font-weight: 600; font-size: 0.82rem; cursor: pointer; }
    .g app-icon { color: var(--c); }
    .g:hover { border-color: var(--c); }

    .chips { display: flex; gap: 6px; overflow-x: auto; padding-bottom: 6px; margin-bottom: 14px; scrollbar-width: none; }
    .chip-a { flex-shrink: 0; display: inline-flex; align-items: center; gap: 6px; padding: 6px 11px; border-radius: 999px; cursor: pointer; font-size: 0.75rem; font-weight: 600;
      color: var(--text-2); background: var(--surface); border: 1px solid color-mix(in srgb, var(--c) 30%, var(--border)); transition: all 0.2s ease; }
    .chip-a app-icon { color: var(--c); }
    .chip-a.on { color: #fff; background: var(--c); border-color: var(--c); }
    .chip-a.on app-icon { color: #fff; }

    .stage {
      position: relative; height: 560px; overflow: hidden; border-radius: 26px; outline: none; touch-action: pan-y; user-select: none; cursor: grab;
      perspective: 1100px; perspective-origin: 50% 50%;
      background:
        radial-gradient(50% 60% at 50% 50%, color-mix(in srgb, var(--accent) 10%, transparent), transparent 70%),
        color-mix(in srgb, var(--surface-solid) 60%, transparent);
      border: 1px solid var(--border);
      -webkit-mask-image: linear-gradient(90deg, transparent, #000 7%, #000 93%, transparent);
      mask-image: linear-gradient(90deg, transparent, #000 7%, #000 93%, transparent);
    }
    .stage:active { cursor: grabbing; }
    .stage:focus-visible { box-shadow: inset 0 0 0 2px var(--accent); }
    .beam { position: absolute; left: 50%; top: 6%; bottom: 6%; width: 230px; margin-left: -115px; border-radius: 30px; pointer-events: none;
      background: radial-gradient(closest-side, color-mix(in srgb, var(--accent) 14%, transparent), transparent); }
    .wall { position: absolute; left: 50%; top: 50%; width: 0; height: 0; transform-style: preserve-3d; }
    .card {
      position: absolute; left: 0; top: 0; display: flex; flex-direction: column; gap: 6px; padding: 12px 13px; border-radius: 16px; text-decoration: none; color: var(--text);
      background: linear-gradient(160deg, color-mix(in srgb, var(--c) 16%, var(--surface-solid)), var(--surface-solid) 70%);
      border: 1px solid color-mix(in srgb, var(--c) 40%, transparent);
      box-shadow: 0 18px 34px -22px rgba(0,0,0,0.6);
      backface-visibility: hidden; will-change: transform, opacity; -webkit-user-drag: none;
      transition: box-shadow 0.2s ease, border-color 0.2s ease, filter 0.25s ease;
    }
    .card::before { content: ''; position: absolute; left: 12px; right: 12px; top: 0; height: 3px; border-radius: 0 0 3px 3px; background: var(--c); }
    .card:hover, .card:focus-visible { border-color: var(--c); box-shadow: 0 0 0 2px var(--c), 0 24px 40px -20px var(--c); outline: none; }
    .card.center { border-color: color-mix(in srgb, var(--c) 75%, transparent); box-shadow: 0 0 0 1px var(--c), 0 26px 46px -24px var(--c); }
    .card.hit { box-shadow: 0 0 0 2px var(--c), 0 0 26px -2px var(--c); }
    .card.dim { filter: grayscale(0.8) brightness(0.6); }
    .c-top { display: flex; align-items: center; gap: 6px; min-width: 0; }
    .c-ico { width: 22px; height: 22px; border-radius: 7px; display: grid; place-items: center; flex-shrink: 0; color: #fff; background: var(--c); }
    .c-area { flex: 1; min-width: 0; font: 600 0.62rem 'JetBrains Mono', monospace; letter-spacing: 0.04em; text-transform: uppercase; color: var(--c); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .c-new { font: 700 0.58rem 'JetBrains Mono', monospace; text-transform: uppercase; color: #10b981; padding: 1px 6px; border-radius: 999px; background: rgba(16,185,129,0.14); }
    .c-title { flex: 1; font: 700 0.98rem/1.25 'Space Grotesk', sans-serif; letter-spacing: -0.01em; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }
    .c-foot { display: flex; justify-content: space-between; align-items: baseline; }
    .c-q { font-size: 0.72rem; color: var(--text-3); }
    .c-q b { font: 700 1.05rem 'Space Grotesk', sans-serif; color: var(--text); }
    .c-guide { font: 600 0.62rem 'JetBrains Mono', monospace; color: var(--text-3); padding: 2px 7px; border-radius: 6px; border: 1px solid var(--border); }

    .nav { position: absolute; top: 50%; margin-top: -24px; z-index: 5; width: 48px; height: 48px; border-radius: 50%; display: grid; place-items: center; cursor: pointer;
      color: var(--text); background: var(--surface-solid); border: 1px solid var(--border-strong); box-shadow: var(--shadow); transition: transform 0.2s ease, color 0.2s ease, border-color 0.2s ease; }
    .nav:hover { color: var(--accent); border-color: var(--accent); transform: scale(1.08); }
    .prev { left: 18px; } .prev app-icon { transform: rotate(180deg); }
    .next { right: 18px; }

    .scrub { display: flex; align-items: center; gap: 16px; margin-top: 16px; }
    .s-area { display: inline-flex; align-items: center; gap: 6px; min-width: 190px; font: 700 0.82rem 'Space Grotesk', sans-serif; white-space: nowrap; }
    .s-track { position: relative; flex: 1; height: 28px; display: flex; align-items: center; }
    .s-marks { position: absolute; left: 8px; right: 8px; top: 50%; height: 6px; margin-top: -3px; border-radius: 99px; background: var(--border); }
    .s-marks i { position: absolute; top: -3px; width: 3px; height: 12px; border-radius: 2px; transform: translateX(-50%); }
    .s-track input { position: relative; width: 100%; margin: 0; background: transparent; -webkit-appearance: none; appearance: none; cursor: pointer; }
    .s-track input::-webkit-slider-runnable-track { height: 6px; background: transparent; }
    .s-track input::-moz-range-track { height: 6px; background: transparent; }
    .s-track input::-webkit-slider-thumb { -webkit-appearance: none; width: 20px; height: 20px; margin-top: -7px; border-radius: 50%; background: var(--accent); border: 3px solid var(--surface-solid); box-shadow: 0 0 0 2px var(--accent), 0 4px 12px var(--glow); }
    .s-track input::-moz-range-thumb { width: 16px; height: 16px; border-radius: 50%; background: var(--accent); border: 3px solid var(--surface-solid); box-shadow: 0 0 0 2px var(--accent); }
    .s-count { font: 600 0.75rem 'JetBrains Mono', monospace; color: var(--text-3); min-width: 60px; text-align: right; }

    @media (max-width: 700px) {
      .stage { height: 380px; }
      .nav { width: 40px; height: 40px; margin-top: -20px; }
      .prev { left: 10px; } .next { right: 10px; }
      .c-title { font-size: 0.86rem; }
      .scrub { gap: 10px; }
      .s-area { min-width: 0; max-width: 40%; overflow: hidden; text-overflow: ellipsis; }
    }
  `,
})
export class Prep implements AfterViewInit, OnDestroy {
  protected readonly bus = inject(AssistantBus);
  protected readonly guides = STUDY_GUIDES;
  protected readonly gap = 14;

  protected readonly cards: Card[] = (() => {
    const colorOf = new Map<string, string>();
    return STUDY_GUIDES.flatMap(guide => guide.topics.map(topic => ({ topic, guide }))).map((t, i) => {
      const key = t.guide.key + t.topic.group;
      if (!colorOf.has(key)) colorOf.set(key, PALETTE[colorOf.size % PALETTE.length]);
      return { i, topic: t.topic, guide: t.guide, area: t.topic.group, color: colorOf.get(key)!, icon: AREA_ICONS[t.topic.group] ?? 'book-open' };
    });
  })();
  protected readonly areas: AreaMark[] = this.cards.reduce<AreaMark[]>((out, c) => {
    if (!out.some(a => a.name === c.area && a.guide === c.guide)) out.push({ name: c.area, color: c.color, icon: c.icon, first: c.i, guide: c.guide });
    return out;
  }, []);

  protected readonly rows = signal(3);
  protected readonly cardW = signal(196);
  protected readonly cardH = signal(150);
  protected readonly cols = computed(() => Math.ceil(this.cards.length / this.rows()));
  protected readonly query = signal('');
  protected readonly matchCursor = signal(0);
  protected readonly posView = signal(0);
  protected readonly centerCol = computed(() => Math.max(0, Math.min(this.cols() - 1, Math.round(this.posView()))));
  private readonly centerCard = computed(() => this.cards[Math.min(this.cards.length - 1, this.centerCol() * this.rows())]);
  protected readonly currentArea = computed(() => this.centerCard().area);
  protected readonly currentColor = computed(() => this.centerCard().color);
  protected readonly currentIcon = computed(() => this.centerCard().icon);
  protected readonly matchIdx = computed(() => {
    const q = this.query().trim().toLowerCase();
    if (!q) return [] as number[];
    return this.cards.filter(c => c.topic.title.toLowerCase().includes(q) || c.area.toLowerCase().includes(q) || c.topic.quiz.some(x => x.toLowerCase().includes(q))).map(c => c.i);
  });

  private stage = viewChild.required<ElementRef<HTMLElement>>('stage');
  private cardEls = viewChildren<ElementRef<HTMLElement>>('card');
  private pos = 0;        // current (animated) column at the centre
  private target = 0;     // where we're easing to
  private raf = 0;
  private dragging = false;
  private dragX = 0;
  private dragMoved = 0;
  private velocity = 0;
  private lastT = 0;
  private radius = 1000;
  private reduced = prefersReducedMotion();

  private readonly onClickCapture = (e: MouseEvent) => this.guardClick(e);

  ngAfterViewInit() {
    this.measure();
    this.stage().nativeElement.addEventListener('click', this.onClickCapture, true);
  }
  ngOnDestroy() {
    cancelAnimationFrame(this.raf);
    this.stage().nativeElement.removeEventListener('click', this.onClickCapture, true);
  }

  /** Responsive geometry: fewer rows / smaller cards on narrow screens. */
  measure() {
    const w = this.stage()?.nativeElement.clientWidth ?? 1100;
    if (w < 560) { this.rows.set(2); this.cardW.set(150); this.cardH.set(150); this.radius = 640; }
    else if (w < 900) { this.rows.set(3); this.cardW.set(170); this.cardH.set(140); this.radius = 820; }
    else { this.rows.set(3); this.cardW.set(196); this.cardH.set(150); this.radius = 1050; }
    this.target = Math.min(this.target, this.cols() - 1);
    this.pos = Math.min(this.pos, this.cols() - 1);
    queueMicrotask(() => this.layout());
  }

  /** Place every card on the inside of a cylinder around the viewer; hide those beyond the visible arc. */
  private layout() {
    const els = this.cardEls();
    if (!els.length) return;
    const rows = this.rows(), w = this.cardW(), h = this.cardH(), R = this.radius;
    const stepA = (w + this.gap) / R;
    const maxA = 1.05;
    const totalH = rows * (h + this.gap) - this.gap;
    for (let k = 0; k < els.length; k++) {
      const el = els[k].nativeElement;
      const col = Math.floor(k / rows), row = k % rows;
      const a = (col - this.pos) * stepA;
      if (Math.abs(a) > maxA) {
        if (el.style.visibility !== 'hidden') el.style.visibility = 'hidden';
        continue;
      }
      if (el.style.visibility === 'hidden') el.style.visibility = '';
      const x = Math.sin(a) * R - w / 2;
      const z = -(1 - Math.cos(a)) * R * 0.9; // edges curve away from the viewer (cylinder seen from outside)
      const y = row * (h + this.gap) - totalH / 2;
      el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, ${z.toFixed(1)}px) rotateY(${a.toFixed(4)}rad)`;
      el.style.opacity = (1 - Math.min(Math.abs(a) / maxA, 1) * 0.75).toFixed(2);
      el.classList.toggle('center', Math.abs(col - this.pos) < 0.5);
    }
    this.posView.set(this.pos);
  }

  private animate() {
    if (this.raf) return;
    const tick = () => {
      this.raf = 0;
      if (!this.dragging) {
        const d = this.target - this.pos;
        this.pos = this.reduced || Math.abs(d) < 0.002 ? this.target : this.pos + d * 0.14;
      }
      this.layout();
      if (this.dragging || this.pos !== this.target) this.raf = requestAnimationFrame(tick);
    };
    this.raf = requestAnimationFrame(tick);
  }

  private clamp(v: number) {
    return Math.max(0, Math.min(this.cols() - 1, v));
  }
  protected step(n: number) {
    this.target = this.clamp(Math.round(this.target) + n);
    this.animate();
  }
  protected scrubTo(v: number) {
    this.target = this.clamp(v);
    this.animate();
  }
  protected goToCard(i: number) {
    this.target = this.clamp(Math.floor(i / this.rows()));
    this.animate();
  }
  protected firstOfGuide(g: StudyGuide) {
    return this.cards.find(c => c.guide === g)?.i ?? 0;
  }
  protected pct(i: number) {
    return (Math.floor(i / this.rows()) / Math.max(this.cols() - 1, 1)) * 100;
  }

  protected onSearch(v: string) {
    this.query.set(v);
    this.matchCursor.set(0);
    const m = this.matchIdx();
    if (m.length) this.goToCard(m[0]);
  }
  protected nextMatch() {
    const m = this.matchIdx();
    if (!m.length) return;
    const n = (this.matchCursor() + 1) % m.length;
    this.matchCursor.set(n);
    this.goToCard(m[n]);
  }
  protected isHit(c: Card) {
    return !!this.query() && this.matchIdx().includes(c.i);
  }

  // ---------- input ----------
  protected down(e: PointerEvent) {
    if ((e.target as HTMLElement).closest('.nav')) return;
    this.dragging = true;
    this.dragX = e.clientX;
    this.dragMoved = 0;
    this.velocity = 0;
    this.lastT = performance.now();
    this.animate();
  }
  protected move(e: PointerEvent) {
    if (!this.dragging) return;
    const dx = e.clientX - this.dragX;
    this.dragX = e.clientX;
    this.dragMoved += Math.abs(dx);
    const now = performance.now();
    const dCol = -dx / (this.cardW() + this.gap);
    this.pos = this.clamp(this.pos + dCol);
    this.velocity = dCol / Math.max(now - this.lastT, 1) * 16;
    this.lastT = now;
  }
  protected up() {
    if (!this.dragging) return;
    this.dragging = false;
    this.target = this.clamp(Math.round(this.pos + this.velocity * 8)); // a little momentum, then snap to a column
    this.animate();
  }
  /** A drag must not also trigger the link under the pointer. */
  private guardClick(e: MouseEvent) {
    if (this.dragMoved > 8) {
      e.preventDefault();
      e.stopPropagation();
      this.dragMoved = 0;
    }
  }
  /** Horizontal wheel / trackpad swipes (or Shift+wheel) move the wall; plain vertical scrolling still scrolls the page. */
  protected wheel(e: WheelEvent) {
    const dx = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.shiftKey ? e.deltaY : 0;
    if (!dx) return;
    e.preventDefault();
    this.target = this.clamp(this.target + dx / (this.cardW() + this.gap));
    this.animate();
  }
  protected key(e: KeyboardEvent) {
    if (e.key === 'ArrowRight') { e.preventDefault(); this.step(1); }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); this.step(-1); }
    else if (e.key === 'Home') { e.preventDefault(); this.scrubTo(0); }
    else if (e.key === 'End') { e.preventDefault(); this.scrubTo(this.cols() - 1); }
  }
}
