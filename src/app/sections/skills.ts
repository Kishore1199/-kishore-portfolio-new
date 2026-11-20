import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnDestroy,
  computed,
  effect,
  inject,
  signal,
  viewChild,
  viewChildren,
} from '@angular/core';
import { RevealDirective } from '../core/reveal.directive';
import { SkillIcon } from '../core/skill-icon';
import { ThemeService, prefersReducedMotion } from '../core/theme.service';
import { SKILL_CATEGORIES } from '../data/portfolio.data';

interface Tag {
  name: string;
  color: string;
  category: string;
  x: number;
  y: number;
  z: number;
}

/**
 * Geodesic sphere (icosahedron subdivided once): 42 vertices joined by 120 edges.
 * Drawn as a glowing wireframe network inside the skills globe.
 */
const GEODESIC = (() => {
  const t = (1 + Math.sqrt(5)) / 2;
  const verts: number[][] = [
    [-1, t, 0], [1, t, 0], [-1, -t, 0], [1, -t, 0],
    [0, -1, t], [0, 1, t], [0, -1, -t], [0, 1, -t],
    [t, 0, -1], [t, 0, 1], [-t, 0, -1], [-t, 0, 1],
  ].map(([x, y, z]) => {
    const l = Math.hypot(x, y, z);
    return [x / l, y / l, z / l];
  });
  let faces = [
    [0, 11, 5], [0, 5, 1], [0, 1, 7], [0, 7, 10], [0, 10, 11],
    [1, 5, 9], [5, 11, 4], [11, 10, 2], [10, 7, 6], [7, 1, 8],
    [3, 9, 4], [3, 4, 2], [3, 2, 6], [3, 6, 8], [3, 8, 9],
    [4, 9, 5], [2, 4, 11], [6, 2, 10], [8, 6, 7], [9, 8, 1],
  ];
  // one subdivision: split every triangle into four, pushing midpoints onto the sphere
  const mids = new Map<string, number>();
  const mid = (a: number, b: number) => {
    const key = a < b ? `${a}_${b}` : `${b}_${a}`;
    const hit = mids.get(key);
    if (hit !== undefined) return hit;
    const [x, y, z] = [0, 1, 2].map(k => (verts[a][k] + verts[b][k]) / 2);
    const l = Math.hypot(x, y, z);
    verts.push([x / l, y / l, z / l]);
    mids.set(key, verts.length - 1);
    return verts.length - 1;
  };
  faces = faces.flatMap(([a, b, c]) => {
    const ab = mid(a, b), bc = mid(b, c), ca = mid(c, a);
    return [[a, ab, ca], [b, bc, ab], [c, ca, bc], [ab, bc, ca]];
  });
  const edgeSet = new Set<string>();
  const edges: number[] = [];
  for (const [a, b, c] of faces) {
    for (const [p, q] of [[a, b], [b, c], [c, a]]) {
      const key = p < q ? `${p}_${q}` : `${q}_${p}`;
      if (!edgeSet.has(key)) {
        edgeSet.add(key);
        edges.push(p, q);
      }
    }
  }
  return { verts: new Float32Array(verts.flat()), edges: new Uint16Array(edges), count: verts.length };
})();

const TAU = Math.PI * 2;
/** Shift `target` by whole turns so it is the closest equivalent angle to `current`. */
const nearestAngle = (current: number, target: number) =>
  target + Math.round((current - target) / TAU) * TAU;

@Component({
  selector: 'app-skills',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RevealDirective, SkillIcon],
  template: `
    <section id="skills" class="section">
      <div class="container">
        <div class="section-head center" appReveal>
          <p class="eyebrow">Technical expertise</p>
          <h2 class="title">Skills &amp; <span class="gradient-text">technologies</span></h2>
          <p class="lead">{{ categories.length }} categories · {{ tags.length }}+ technologies. Drag the globe to spin it, or pick a category.</p>
        </div>

        <div class="layout">
          <!-- 3D globe -->
          <div class="sphere-wrap" appReveal>
            <canvas #globe class="globe" aria-hidden="true"></canvas>
            <div class="sphere" #sphere
                 (pointerdown)="onDown($event)"
                 (pointerenter)="hovering = true"
                 (pointerleave)="hovering = false"
                 role="img" [attr.aria-label]="'Rotating globe of ' + tags.length + ' skills'">
              @for (t of tags; track t.name) {
                <span #tag class="tag"
                      [class.hit]="active() !== 'All' && t.category === active()"
                      [style.--c]="t.color">
                  <app-skill-icon [name]="t.name" [color]="t.color" [size]="15" />{{ t.name }}
                </span>
              }
            </div>
          </div>

          <!-- category panel -->
          <div class="panel" appReveal [revealDelay]="120">
            <div class="tabs" role="tablist" aria-label="Skill categories">
              @for (c of tabNames; track c) {
                <button type="button" role="tab" class="tab"
                        [class.on]="active() === c" [attr.aria-selected]="active() === c"
                        (click)="select(c)">{{ c }}</button>
              }
            </div>

            <div class="cards">
              @for (c of visibleCategories(); track c.name) {
                <div class="cat glass">
                  <div class="cat-head">
                    <h3>{{ c.name }}</h3>
                    <span>{{ c.skills.length }}</span>
                  </div>
                  <div class="chips">
                    @for (s of c.skills; track s.name) {
                      <span class="chip skill-chip" [style.--c]="s.color">
                        <app-skill-icon [name]="s.name" [color]="s.color" [size]="15" />{{ s.name }}
                      </span>
                    }
                  </div>
                </div>
              }
            </div>
          </div>
        </div>
      </div>
    </section>
  `,
  styles: `
    #skills { background: linear-gradient(180deg, transparent, color-mix(in srgb, var(--bg-2) 55%, transparent) 30%, color-mix(in srgb, var(--bg-2) 55%, transparent) 70%, transparent); }
    .layout { display: grid; grid-template-columns: 1.1fr 1fr; gap: 48px; align-items: start; }

    .sphere-wrap { position: sticky; top: 110px; aspect-ratio: 1; max-width: 580px; width: 100%; margin: 0 auto; }
    .globe { position: absolute; inset: 0; width: 100%; height: 100%; pointer-events: none; }

    .sphere { position: absolute; inset: 0; cursor: grab; touch-action: pan-y; user-select: none; border-radius: 50%; }
    .sphere:active { cursor: grabbing; }
    .tag {
      position: absolute; left: 50%; top: 50%;
      display: inline-flex; align-items: center; gap: 7px;
      padding: 5px 11px 5px 8px; border-radius: 999px; white-space: nowrap;
      font-family: 'JetBrains Mono', monospace; font-size: 0.74rem; font-weight: 500;
      color: var(--text);
      background: color-mix(in srgb, var(--c) 10%, var(--surface-solid));
      border: 1px solid color-mix(in srgb, var(--c) 40%, transparent);
      box-shadow: 0 6px 16px -8px color-mix(in srgb, var(--c) 70%, transparent);
      will-change: transform, opacity;
    }
    /* Selected-category skills: solid, bright and outlined so they read clearly */
    .tag.hit {
      font-weight: 700;
      background: color-mix(in srgb, var(--c) 22%, var(--surface-solid));
      border-color: var(--c);
      box-shadow: 0 0 0 3px color-mix(in srgb, var(--c) 22%, transparent), 0 10px 24px -8px color-mix(in srgb, var(--c) 90%, transparent);
    }

    .tabs { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 20px; }
    .tab {
      padding: 8px 14px; border-radius: 10px; border: 1px solid var(--border); background: var(--surface);
      font-size: 0.82rem; font-weight: 500; color: var(--text-2); cursor: pointer; transition: all 0.2s ease;
    }
    .tab:hover { color: var(--text); border-color: var(--border-strong); }
    .tab.on { color: #fff; background: linear-gradient(135deg, var(--accent-2), var(--accent)); border-color: transparent; box-shadow: 0 8px 22px -10px var(--glow); }

    .cards { display: flex; flex-direction: column; gap: 14px; }
    .cat { padding: 18px 20px; border-radius: 16px; box-shadow: none; animation: card-in 0.45s cubic-bezier(0.22, 1, 0.36, 1) both; }
    .cat-head { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 12px; }
    .cat-head h3 { font-size: 0.98rem; }
    .cat-head span { font-family: 'JetBrains Mono', monospace; font-size: 0.75rem; color: var(--accent); }
    .chips { display: flex; flex-wrap: wrap; gap: 8px; }
    .skill-chip { padding: 5px 11px 5px 8px; color: var(--text); transition: border-color 0.2s ease, transform 0.2s ease; }
    .skill-chip:hover { border-color: color-mix(in srgb, var(--c) 55%, transparent); transform: translateY(-2px); }
    @keyframes card-in { from { opacity: 0; transform: perspective(800px) rotateX(-12deg) translateY(12px); } to { opacity: 1; transform: none; } }

    @media (max-width: 1023px) {
      .layout { grid-template-columns: 1fr; }
      .sphere-wrap { max-width: 440px; position: relative; top: 0; }
    }
    @media (max-width: 600px) {
      .tag { font-size: 0.66rem; padding: 4px 8px 4px 6px; gap: 5px; }
    }
  `,
})
export class Skills implements AfterViewInit, OnDestroy {
  private theme = inject(ThemeService);

  protected readonly categories = SKILL_CATEGORIES;
  protected readonly tabNames = ['All', ...SKILL_CATEGORIES.map(c => c.name)];
  protected readonly active = signal('All');
  protected readonly visibleCategories = computed(() =>
    this.active() === 'All' ? this.categories : this.categories.filter(c => c.name === this.active()),
  );
  protected hovering = false;

  /** Points spread evenly on a unit sphere (Fibonacci lattice). */
  protected readonly tags: Tag[] = (() => {
    const flat = SKILL_CATEGORIES.flatMap(c => c.skills.map(s => ({ ...s, category: c.name })));
    const n = flat.length;
    const golden = Math.PI * (3 - Math.sqrt(5));
    return flat.map((s, i) => {
      const y = 1 - (i / (n - 1)) * 2;
      const r = Math.sqrt(1 - y * y);
      const theta = golden * i;
      return { ...s, x: Math.cos(theta) * r, y, z: Math.sin(theta) * r };
    });
  })();

  private sphere = viewChild.required<ElementRef<HTMLElement>>('sphere');
  private globe = viewChild.required<ElementRef<HTMLCanvasElement>>('globe');
  private tagEls = viewChildren<ElementRef<HTMLElement>>('tag');

  private rotX = 0.3;
  private rotY = 0;
  private velX = 0.0015;
  private velY = 0.004;
  /** When a category is picked, the globe eases to face it. */
  private target: { x: number; y: number } | null = null;
  private dragging = false;
  private last = { x: 0, y: 0 };
  private raf = 0;
  private visible = false;
  private io?: IntersectionObserver;
  private ro?: ResizeObserver;
  private size = 400;
  private radius = 168;
  private dpr = 1;
  private ctx: CanvasRenderingContext2D | null = null;
  private dotColor = '#f97316';
  private reduced = prefersReducedMotion();
  private zCache: number[] = [];

  constructor() {
    // Theme switch → re-read the accent color for the globe dots (after the attribute is applied).
    effect(() => {
      this.theme.isDark();
      requestAnimationFrame(() => {
        this.dotColor = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || this.dotColor;
        this.render();
      });
    });
  }

  protected select(name: string) {
    this.active.set(name);
    if (name === 'All') {
      this.target = null;
    } else {
      // Rotate so the centroid of this category's skills faces the viewer.
      let cx = 0, cy = 0, cz = 0;
      for (const t of this.tags) if (t.category === name) { cx += t.x; cy += t.y; cz += t.z; }
      const ry = Math.atan2(-cx, cz);
      const z1 = Math.hypot(cx, cz);
      const rx = Math.atan2(cy, z1);
      this.target = { x: nearestAngle(this.rotX, rx), y: nearestAngle(this.rotY, ry) };
      this.velX = this.velY = 0;
      if (this.reduced) {
        this.rotX = this.target.x;
        this.rotY = this.target.y;
      }
    }
    this.render();
    if (this.visible) this.loop();
  }

  ngAfterViewInit() {
    const box = this.sphere().nativeElement;
    const canvas = this.globe().nativeElement;
    this.ctx = canvas.getContext('2d');
    const measure = () => {
      this.size = box.clientWidth || 400;
      this.radius = this.size * 0.42;
      this.dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(this.size * this.dpr);
      canvas.height = Math.round(this.size * this.dpr);
      this.render();
    };
    // Measure only on resize, never inside the animation loop.
    this.ro = new ResizeObserver(measure);
    this.ro.observe(box);
    measure();

    this.io = new IntersectionObserver(([e]) => {
      this.visible = e.isIntersecting;
      if (this.visible) this.loop();
      else cancelAnimationFrame(this.raf);
    });
    this.io.observe(box);
    window.addEventListener('pointermove', this.onMove, { passive: true });
    window.addEventListener('pointerup', this.onUp);
    window.addEventListener('pointercancel', this.onUp);
  }

  ngOnDestroy() {
    cancelAnimationFrame(this.raf);
    this.io?.disconnect();
    this.ro?.disconnect();
    window.removeEventListener('pointermove', this.onMove);
    window.removeEventListener('pointerup', this.onUp);
    window.removeEventListener('pointercancel', this.onUp);
  }

  protected onDown(e: PointerEvent) {
    this.dragging = true;
    this.target = null; // user takes over
    this.last = { x: e.clientX, y: e.clientY };
    if (this.visible) this.loop();
  }

  private onMove = (e: PointerEvent) => {
    if (!this.dragging) return;
    const dx = e.clientX - this.last.x;
    const dy = e.clientY - this.last.y;
    this.last = { x: e.clientX, y: e.clientY };
    this.velY = dx * 0.0012;
    this.velX = -dy * 0.0012;
  };

  private onUp = () => {
    this.dragging = false;
  };

  private loop = () => {
    cancelAnimationFrame(this.raf);
    const step = () => {
      if (this.target && !this.dragging) {
        // ease toward the selected category, then hold still
        this.rotX += (this.target.x - this.rotX) * 0.09;
        this.rotY += (this.target.y - this.rotY) * 0.09;
      } else {
        const idle = !this.dragging && !this.hovering;
        if (this.reduced && idle) {
          this.velX *= 0.9;
          this.velY *= 0.9;
        } else if (idle && this.active() === 'All') {
          // calm auto-rotation
          this.velY += (0.0035 - this.velY) * 0.02;
          this.velX += (0.0012 - this.velX) * 0.02;
        } else if (!this.dragging) {
          this.velX *= 0.94;
          this.velY *= 0.94;
        }
        this.rotX += this.velX;
        this.rotY += this.velY;
      }
      this.render();
      this.raf = requestAnimationFrame(step);
    };
    this.raf = requestAnimationFrame(step);
  };

  private render() {
    const cx = Math.cos(this.rotX), sx = Math.sin(this.rotX);
    const cy = Math.cos(this.rotY), sy = Math.sin(this.rotY);
    this.drawGlobe(cx, sx, cy, sy);

    const els = this.tagEls();
    if (!els.length) return;
    const radius = this.radius;
    const active = this.active();
    const filtering = active !== 'All';

    for (let i = 0; i < els.length; i++) {
      const t = this.tags[i];
      // rotate around Y, then X
      const x1 = t.x * cy + t.z * sy;
      const z1 = -t.x * sy + t.z * cy;
      const y2 = t.y * cx - z1 * sx;
      const z2 = t.y * sx + z1 * cx;

      const depth = (z2 + 1) / 2; // 0 (back) … 1 (front)
      let scale = 0.5 + depth * 0.5;
      let opacity = 0.15 + depth * 0.85;
      let z = Math.round(depth * 20);
      if (filtering) {
        if (t.category === active) {
          // selected skills always read clearly, wherever they are on the globe
          scale = Math.max(scale, 0.88) * 1.08;
          opacity = 1;
          z += 40;
        } else {
          scale *= 0.9;
          opacity = 0.06 + depth * 0.16;
        }
      }
      const el = els[i].nativeElement;
      el.style.transform =
        `translate(-50%, -50%) translate3d(${(x1 * radius).toFixed(1)}px, ${(y2 * radius).toFixed(1)}px, 0) scale(${scale.toFixed(3)})`;
      el.style.opacity = opacity.toFixed(2);
      // z-index changes force re-layering, so only write it when the bucket changes
      if (this.zCache[i] !== z) {
        this.zCache[i] = z;
        el.style.zIndex = String(z);
      }
    }
  }

  /** Geodesic wireframe network on a 2D canvas, rotated with the same angles as the tags. */
  private projected = new Float32Array(GEODESIC.count * 3);

  private drawGlobe(cx: number, sx: number, cy: number, sy: number) {
    const ctx = this.ctx;
    if (!ctx) return;
    const s = this.size * this.dpr;
    const r = this.radius * 0.93 * this.dpr;
    const mid = s / 2;
    const dim = this.active() !== 'All' ? 0.55 : 1;
    ctx.clearRect(0, 0, s, s);

    // project every vertex once per frame
    const v = GEODESIC.verts;
    const pr = this.projected;
    for (let i = 0; i < GEODESIC.count; i++) {
      const x = v[i * 3], y = v[i * 3 + 1], z = v[i * 3 + 2];
      const x1 = x * cy + z * sy;
      const z1 = -x * sy + z * cy;
      pr[i * 3] = mid + x1 * r;
      pr[i * 3 + 1] = mid + (y * cx - z1 * sx) * r;
      pr[i * 3 + 2] = (y * sx + z1 * cx + 1) / 2; // depth 0 (back) … 1 (front)
    }

    // soft rim
    ctx.strokeStyle = this.dotColor;
    ctx.lineWidth = 10 * this.dpr;
    ctx.globalAlpha = 0.05 * dim;
    ctx.beginPath();
    ctx.arc(mid, mid, r, 0, Math.PI * 2);
    ctx.stroke();

    // edges: back ones faint and thin, front ones brighter
    const e = GEODESIC.edges;
    ctx.lineCap = 'round';
    for (let i = 0; i < e.length; i += 2) {
      const a = e[i] * 3, b = e[i + 1] * 3;
      const depth = (pr[a + 2] + pr[b + 2]) / 2;
      ctx.globalAlpha = (depth < 0.5 ? 0.05 + depth * 0.1 : 0.1 + (depth - 0.5) * 0.7) * dim;
      ctx.lineWidth = (0.6 + depth * 0.9) * this.dpr;
      ctx.beginPath();
      ctx.moveTo(pr[a], pr[a + 1]);
      ctx.lineTo(pr[b], pr[b + 1]);
      ctx.stroke();
    }

    // nodes at the vertices (front half only gets the glow)
    ctx.fillStyle = this.dotColor;
    for (let i = 0; i < GEODESIC.count; i++) {
      const depth = pr[i * 3 + 2];
      const rad = (0.8 + depth * 2) * this.dpr;
      ctx.globalAlpha = (0.1 + depth * 0.8) * dim;
      ctx.beginPath();
      ctx.arc(pr[i * 3], pr[i * 3 + 1], rad, 0, Math.PI * 2);
      ctx.fill();
      if (depth > 0.75) {
        ctx.globalAlpha = (depth - 0.75) * 0.5 * dim;
        ctx.beginPath();
        ctx.arc(pr[i * 3], pr[i * 3 + 1], rad * 3, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.globalAlpha = 1;
  }
}
