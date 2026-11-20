import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { Icon } from '../core/icon';
import { RevealDirective } from '../core/reveal.directive';
import { SkillIcon } from '../core/skill-icon';
import { baseSkillName, skillColor } from '../core/skill-meta';
import { PROJECTS, Project } from '../data/portfolio.data';

/**
 * Projects as a 3D cover-flow: the active project faces the viewer, neighbours angle away in an arc.
 * Navigate with arrows, keyboard, swipe/drag, clicking a side card, or the numbered rail.
 */
@Component({
  selector: 'app-projects',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Icon, RevealDirective, SkillIcon],
  template: `
    <section id="projects" class="section">
      <div class="container">
        <div class="head" appReveal>
          <div class="section-head">
            <p class="eyebrow">Selected work</p>
            <h2 class="title">Featured <span class="gradient-text">projects</span></h2>
            <p class="lead">Production healthcare software, company websites and full-stack internship builds.</p>
          </div>
          <div class="counter" aria-live="polite">
            <span class="now">{{ pad(active() + 1) }}</span>
            <span class="of">/ {{ pad(projects.length) }}</span>
          </div>
        </div>
      </div>

      <!-- 3D stage -->
      <div class="stage" appReveal
           tabindex="0" role="region" aria-roledescription="carousel" aria-label="Projects"
           (keydown.arrowleft)="prev()" (keydown.arrowright)="next()"
           (pointerdown)="dragStart($event)" (pointerup)="dragEnd($event)" (pointercancel)="dragX = null">
        @for (p of projects; track p.title; let i = $index) {
          <div class="slide" [class.active]="i === active()" [style]="slideStyle(i)"
               [style.--a1]="p.accent" [style.--a2]="p.accent2"
               (click)="i !== active() && go(i)"
               [attr.aria-hidden]="i !== active()">
            @if (p.image) {
              <div class="frame">
                <div class="bar"><span></span><span></span><span></span><em>{{ host(p) || p.org }}</em></div>
                <img [src]="p.image" [alt]="p.title + ' screenshot'" loading="lazy" draggable="false"
                     [style.object-position]="p.imagePosition ?? null" />
              </div>
            } @else {
              <div class="poster">
                <span class="poster-glow"></span>
                <span class="poster-badge">{{ p.badge }}</span>
                <h3>{{ p.title }}</h3>
                <p>{{ p.org }}</p>
                <div class="poster-icons">
                  @for (t of p.tech.slice(0, 5); track t) {
                    <span class="pi"><app-skill-icon [name]="base(t)" color="#fff" [size]="20" /></span>
                  }
                </div>
              </div>
            }
            <div class="reflection" aria-hidden="true"></div>
          </div>
        }

        <button class="nav prev" type="button" (click)="prev()" aria-label="Previous project"><app-icon name="arrow-right" [size]="18" /></button>
        <button class="nav next" type="button" (click)="next()" aria-label="Next project"><app-icon name="arrow-right" [size]="18" /></button>
      </div>

      <!-- numbered rail -->
      <div class="container">
        <div class="rail" role="tablist" aria-label="Choose a project">
          @for (p of projects; track p.title; let i = $index) {
            <button type="button" role="tab" class="rail-item" [class.on]="i === active()" [attr.aria-selected]="i === active()"
                    [style.--a1]="p.accent" (click)="go(i)">
              <span class="rail-no">{{ pad(i + 1) }}</span>
              <span class="rail-name">{{ p.title }}</span>
              <span class="rail-line"></span>
            </button>
          }
        </div>

        <!-- details for the active project -->
        @for (p of [current()]; track p.title) {
          <article class="detail glass" [style.--a1]="p.accent" [style.--a2]="p.accent2">
            <div class="d-main">
              <div class="meta">
                <span class="chip" [class.chip-live]="p.link">{{ p.badge }}</span>
                @if (p.period !== p.badge) { <span class="period">{{ p.period }}</span> }
              </div>
              <h3>{{ p.title }}</h3>
              <p class="org">{{ p.org }}</p>
              <ul class="check-list">
                @for (f of p.features; track f) {
                  <li><app-icon name="check" [size]="15" />{{ f }}</li>
                }
              </ul>
            </div>
            <aside class="d-side">
              <h4>Tech stack</h4>
              <div class="stack">
                @for (t of p.tech; track t) {
                  <span class="tech" [style.--c]="color(t)"><app-skill-icon [name]="base(t)" [color]="color(t)" [size]="15" />{{ t }}</span>
                }
              </div>
              @if (p.link) {
                <a class="btn btn-primary visit" [href]="p.link" target="_blank" rel="noopener noreferrer">
                  Visit {{ host(p) }} <app-icon name="external" [size]="15" />
                </a>
              } @else {
                <p class="private"><app-icon name="file" [size]="14" /> Internship project — source not public</p>
              }
            </aside>
          </article>
        }
      </div>
    </section>
  `,
  styles: `
    .head { display: flex; align-items: flex-end; justify-content: space-between; gap: 24px; }
    .head .section-head { margin-bottom: 40px; }
    .counter { margin-bottom: 44px; font-family: 'Space Grotesk', sans-serif; white-space: nowrap; }
    .now { font-size: 3.4rem; font-weight: 700; letter-spacing: -0.05em; color: var(--accent); }
    .of { font-size: 1.1rem; color: var(--text-3); margin-left: 6px; }

    /* ---------- stage ---------- */
    .stage {
      position: relative; height: clamp(300px, 36vw, 470px); margin: 0 auto 26px; max-width: 1400px;
      perspective: 1600px; perspective-origin: 50% 40%;
      touch-action: pan-y; user-select: none; outline: none;
    }
    .stage:focus-visible { outline: 1.5px dashed color-mix(in srgb, var(--accent) 45%, transparent); outline-offset: -2px; border-radius: 20px; }
    .slide {
      position: absolute; left: 50%; top: 4%; width: min(720px, 76vw); aspect-ratio: 16 / 10;
      margin-left: calc(min(720px, 76vw) / -2);
      transform-style: preserve-3d; cursor: pointer;
      transition: transform 0.75s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.6s ease, filter 0.6s ease;
      will-change: transform;
    }
    .slide.active { cursor: default; }
    .slide:not(.active) { filter: saturate(0.75) brightness(0.92); }
    .slide:not(.active):hover { filter: none; }

    .frame, .poster {
      position: relative; width: 100%; height: 100%; border-radius: 18px; overflow: hidden;
      border: 1px solid var(--border-strong); background: var(--surface-solid);
      box-shadow: 0 40px 80px -30px rgba(0,0,0,0.55), 0 0 0 1px color-mix(in srgb, var(--a1) 20%, transparent);
    }
    .slide.active .frame, .slide.active .poster { box-shadow: 0 50px 100px -30px color-mix(in srgb, var(--a1) 55%, rgba(0,0,0,0.6)), 0 0 0 1px color-mix(in srgb, var(--a1) 45%, transparent); }
    .frame { display: flex; flex-direction: column; }
    .bar { display: flex; align-items: center; gap: 6px; padding: 9px 12px; background: var(--surface-2); border-bottom: 1px solid var(--border); flex-shrink: 0; }
    .bar span { width: 9px; height: 9px; border-radius: 50%; }
    .bar span:nth-child(1) { background: #ff5f56; } .bar span:nth-child(2) { background: #ffbd2e; } .bar span:nth-child(3) { background: #27c93f; }
    .bar em { flex: 1; margin: 0 26px 0 12px; padding: 3px 10px; border-radius: 6px; font-style: normal; text-align: center; font-family: 'JetBrains Mono', monospace; font-size: 0.68rem; color: var(--text-3); background: var(--surface); }
    .frame img { flex: 1; min-height: 0; width: 100%; object-fit: cover; object-position: center top; display: block; pointer-events: none; }

    .poster {
      display: flex; flex-direction: column; justify-content: flex-end; padding: 36px; color: #fff;
      background: linear-gradient(135deg, var(--a1), var(--a2));
    }
    .poster::before {
      content: ''; position: absolute; inset: 0; opacity: 0.25;
      background:
        linear-gradient(rgba(255,255,255,0.35) 1px, transparent 1px) 0 0 / 34px 34px,
        linear-gradient(90deg, rgba(255,255,255,0.35) 1px, transparent 1px) 0 0 / 34px 34px;
      -webkit-mask-image: linear-gradient(200deg, #000, transparent 70%);
      mask-image: linear-gradient(200deg, #000, transparent 70%);
    }
    .poster-glow { position: absolute; right: -80px; top: -80px; width: 300px; height: 300px; border-radius: 50%; background: radial-gradient(circle, rgba(255,255,255,0.35), transparent 65%); }
    .poster-badge { position: absolute; top: 24px; left: 28px; padding: 5px 12px; border-radius: 999px; font-size: 0.75rem; font-weight: 600; background: rgba(255,255,255,0.2); border: 1px solid rgba(255,255,255,0.35); }
    .poster h3 { position: relative; font-size: clamp(1.5rem, 3.2vw, 2.6rem); letter-spacing: -0.03em; }
    .poster p { position: relative; opacity: 0.85; margin-top: 4px; }
    .poster-icons { position: relative; display: flex; gap: 10px; margin-top: 22px; }
    .pi { width: 44px; height: 44px; border-radius: 12px; display: grid; place-items: center; background: rgba(255,255,255,0.18); border: 1px solid rgba(255,255,255,0.3); }

    .reflection {
      position: absolute; left: 4%; right: 4%; top: 100%; height: 40%; margin-top: 10px; border-radius: 18px;
      background: linear-gradient(color-mix(in srgb, var(--a1) 22%, transparent), transparent 70%);
      filter: blur(14px); opacity: 0; transition: opacity 0.6s ease; pointer-events: none;
    }
    .slide.active .reflection { opacity: 0.8; }

    .nav {
      position: absolute; top: 44%; z-index: 50; width: 50px; height: 50px; border-radius: 50%; display: grid; place-items: center; cursor: pointer;
      color: var(--text); background: var(--surface-solid); border: 1px solid var(--border-strong); box-shadow: var(--shadow);
      transition: transform 0.25s ease, color 0.25s ease, border-color 0.25s ease;
    }
    .nav:hover { color: var(--accent); border-color: var(--accent); transform: scale(1.08); }
    .prev { left: max(16px, calc(50% - 520px)); }
    .prev app-icon { transform: rotate(180deg); }
    .next { right: max(16px, calc(50% - 520px)); }

    /* ---------- rail ---------- */
    .rail { display: grid; grid-template-columns: repeat(6, 1fr); gap: 10px; margin-bottom: 26px; }
    .rail-item {
      position: relative; display: flex; flex-direction: column; align-items: flex-start; gap: 2px; padding: 10px 4px 12px; text-align: left; cursor: pointer;
      background: none; border: 0; color: var(--text-3); transition: color 0.25s ease;
    }
    .rail-item:hover, .rail-item.on { color: var(--text); }
    .rail-no { font-family: 'JetBrains Mono', monospace; font-size: 0.72rem; }
    .rail-item.on .rail-no { color: var(--a1); }
    .rail-name { font-size: 0.84rem; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 100%; }
    .rail-line { position: absolute; left: 0; right: 0; bottom: 0; height: 3px; border-radius: 99px; background: var(--border); overflow: hidden; }
    .rail-line::after { content: ''; position: absolute; inset: 0; background: linear-gradient(90deg, var(--a1), var(--accent)); transform: scaleX(0); transform-origin: left; transition: transform 0.5s cubic-bezier(0.22, 1, 0.36, 1); }
    .rail-item.on .rail-line::after { transform: scaleX(1); }

    /* ---------- detail ---------- */
    .detail {
      display: grid; grid-template-columns: 1.35fr 1fr; gap: 34px; padding: 32px; border-radius: 24px; overflow: hidden;
      animation: detail-in 0.55s cubic-bezier(0.22, 1, 0.36, 1) both;
    }
    .detail::before { content: ''; position: absolute; left: 0; top: 0; bottom: 0; width: 4px; background: linear-gradient(var(--a1), var(--a2)); }
    @keyframes detail-in { from { opacity: 0; transform: perspective(1000px) rotateX(10deg) translateY(18px); } to { opacity: 1; transform: none; } }
    .meta { display: flex; align-items: center; gap: 12px; margin-bottom: 10px; }
    .chip-live { color: #34d399; background: rgba(16,185,129,0.1); border-color: rgba(16,185,129,0.25); }
    .chip-live::before { content: ''; width: 6px; height: 6px; border-radius: 50%; background: #10b981; animation: pulse-ring 1.8s ease-out infinite; }
    .period { font-family: 'JetBrains Mono', monospace; font-size: 0.78rem; color: var(--text-3); }
    .detail h3 { font-size: 1.8rem; letter-spacing: -0.03em; }
    .org { color: var(--a1); font-weight: 600; font-size: 0.9rem; margin: 2px 0 18px; }
    .d-side { padding-left: 30px; border-left: 1px dashed var(--border-strong); display: flex; flex-direction: column; }
    h4 { font-family: 'JetBrains Mono', monospace; font-size: 0.72rem; font-weight: 500; letter-spacing: 0.12em; text-transform: uppercase; color: var(--text-3); margin-bottom: 12px; }
    .stack { display: flex; flex-wrap: wrap; gap: 8px; }
    .tech {
      display: inline-flex; align-items: center; gap: 7px; padding: 5px 11px 5px 7px; border-radius: 10px;
      font-size: 0.8rem; font-weight: 500; color: var(--text); background: var(--surface-2); border: 1px solid var(--border);
      transition: border-color 0.2s ease, transform 0.2s ease;
    }
    .tech:hover { border-color: color-mix(in srgb, var(--c) 55%, transparent); transform: translateY(-2px); }
    .visit { margin-top: auto; align-self: flex-start; padding: 11px 18px; font-size: 0.86rem; }
    .d-side .visit { margin-top: 26px; }
    .private { margin-top: 26px; display: flex; align-items: center; gap: 8px; font-size: 0.82rem; color: var(--text-3); }

    @media (max-width: 1023px) {
      .rail { grid-template-columns: repeat(3, 1fr); }
      .detail { grid-template-columns: 1fr; }
      .d-side { padding-left: 0; border-left: 0; padding-top: 22px; border-top: 1px dashed var(--border-strong); }
    }
    @media (max-width: 680px) {
      .counter { display: none; }
      .stage { height: 62vw; min-height: 230px; }
      .nav { width: 40px; height: 40px; top: 38%; }
      .rail { grid-template-columns: repeat(2, 1fr); }
      .detail { padding: 22px; }
      .detail h3 { font-size: 1.4rem; }
      .poster { padding: 20px; justify-content: center; }
      .poster-badge { position: relative; top: auto; left: auto; align-self: flex-start; margin-bottom: 10px; font-size: 0.68rem; }
      .pi { width: 34px; height: 34px; }
    }
  `,
})
export class Projects {
  protected readonly projects = PROJECTS;
  protected readonly active = signal(0);
  protected readonly current = computed(() => this.projects[this.active()]);
  protected dragX: number | null = null;

  protected go(i: number) {
    const n = this.projects.length;
    this.active.set(((i % n) + n) % n);
  }
  protected next() { this.go(this.active() + 1); }
  protected prev() { this.go(this.active() - 1); }

  protected dragStart(e: PointerEvent) {
    this.dragX = e.clientX;
  }
  protected dragEnd(e: PointerEvent) {
    if (this.dragX === null) return;
    const dx = e.clientX - this.dragX;
    this.dragX = null;
    if (Math.abs(dx) > 50) dx < 0 ? this.next() : this.prev();
  }

  /** Cover-flow placement: shortest circular distance from the active slide. */
  protected slideStyle(i: number) {
    const n = this.projects.length;
    let o = i - this.active();
    if (o > n / 2) o -= n;
    if (o < -n / 2) o += n;
    const a = Math.abs(o);
    const x = o * 58;          // % of slide width
    const z = -a * 260;        // px
    const ry = -Math.sign(o) * Math.min(a, 2) * 28; // deg
    const scale = a === 0 ? 1 : 0.86;
    return {
      transform: `translateX(${x}%) translateZ(${z}px) rotateY(${ry}deg) scale(${scale})`,
      opacity: a > 2 ? '0' : a === 2 ? '0.45' : '1',
      zIndex: String(20 - a),
      pointerEvents: a > 2 ? 'none' : 'auto',
    };
  }

  protected host(p: Project) {
    return p.link ? new URL(p.link).host : '';
  }
  protected pad(n: number) {
    return String(n).padStart(2, '0');
  }
  protected base(t: string) {
    return baseSkillName(t);
  }
  protected color(t: string) {
    return skillColor(t);
  }
}
