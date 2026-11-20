import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Explain } from '../core/explain';
import { Icon } from '../core/icon';
import { RevealDirective } from '../core/reveal.directive';
import { TiltDirective } from '../core/tilt.directive';
import { EDUCATION } from '../data/portfolio.data';

/** Circumference of the score ring (r = 30). */
const RING = 2 * Math.PI * 30;

@Component({
  selector: 'app-education',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Explain, Icon, RevealDirective, TiltDirective],
  template: `
    <section id="education" class="section">
      <div class="container">
        <div class="section-head" appReveal>
          <p class="eyebrow">Academic background<app-explain section="education" /></p>
          <h2 class="title">My learning <span class="gradient-text">journey</span></h2>
          <p class="lead">From school to engineering — the foundation behind my move into software.</p>
        </div>

        <ol class="journey">
          @for (e of education; track e.short; let i = $index) {
            <li class="step" appReveal [revealDelay]="i * 140"
                [style.--a1]="e.accent" [style.--a2]="e.accent2">

              <!-- milestone on the path -->
              <div class="milestone" aria-hidden="true">
                <span class="node"><span class="node-core"></span></span>
                <span class="node-year">{{ e.year }}</span>
              </div>

              <article class="card glass" appTilt [tiltMax]="8">
                <header class="banner">
                  <span class="pattern" aria-hidden="true"></span>
                  <span class="banner-year pop" aria-hidden="true">{{ e.year }}</span>
                  <span class="badge pop-sm"><app-icon name="grad" [size]="15" /> {{ e.short }}</span>
                  <span class="step-no">Step 0{{ i + 1 }}</span>
                </header>

                <!-- score ring -->
                <div class="ring pop" role="img" [attr.aria-label]="'Score ' + e.grade">
                  <svg viewBox="0 0 72 72" width="76" height="76">
                    <defs>
                      <linearGradient [attr.id]="'edu-g' + i" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" [attr.stop-color]="e.accent" />
                        <stop offset="100%" [attr.stop-color]="e.accent2" />
                      </linearGradient>
                    </defs>
                    <circle class="ring-bg" cx="36" cy="36" r="30" />
                    <circle class="ring-fg" cx="36" cy="36" r="30"
                            [attr.stroke]="'url(#edu-g' + i + ')'"
                            [style.--len]="ring"
                            [style.--off]="ring * (1 - e.score / 100)" />
                  </svg>
                  <span class="ring-text">{{ e.grade }}</span>
                </div>

                <div class="body">
                  <h3>{{ e.degree }}</h3>
                  <p class="meta"><app-icon name="pin" [size]="14" /> {{ e.institution }}</p>
                  <p class="meta"><app-icon name="calendar" [size]="14" /> {{ e.period }}</p>
                  <p class="desc">{{ e.description }}</p>
                </div>
                <div class="tilt-glare"></div>
              </article>
            </li>
          }
        </ol>
      </div>
    </section>
  `,
  styles: `
    .journey {
      list-style: none; margin: 0; padding: 0;
      display: grid; grid-template-columns: repeat(3, 1fr); gap: 26px;
      position: relative;
    }
    /* the path connecting the milestones */
    .journey::before {
      content: ''; position: absolute; left: 16%; right: 16%; top: 21px; height: 3px; border-radius: 99px;
      background: linear-gradient(90deg, #f59e0b, #14b8a6 50%, #ec4899);
      opacity: 0.55;
    }
    /* a light that travels along the path (transform only, so it never repaints) */
    .journey::after {
      content: ''; position: absolute; left: 16%; width: 12%; top: 19px; height: 7px; border-radius: 99px;
      background: radial-gradient(closest-side, rgba(255,255,255,0.95), rgba(255,255,255,0));
      animation: travel 4.5s cubic-bezier(0.45, 0, 0.55, 1) infinite;
      will-change: transform, opacity;
    }
    /* track = 68% of the row = 5.67 × this element's width */
    @keyframes travel {
      0% { transform: translateX(0); opacity: 0; }
      12% { opacity: 1; }
      88% { opacity: 1; }
      100% { transform: translateX(467%); opacity: 0; }
    }

    .step { display: flex; flex-direction: column; align-items: stretch; gap: 22px; }
    .milestone { position: relative; display: flex; flex-direction: column; align-items: center; gap: 8px; z-index: 1; }
    .node {
      width: 44px; height: 44px; border-radius: 50%; display: grid; place-items: center;
      background: var(--surface-solid); border: 2px solid var(--a1);
      box-shadow: 0 0 0 6px color-mix(in srgb, var(--a1) 14%, transparent), 0 8px 22px -6px color-mix(in srgb, var(--a1) 70%, transparent);
      transition: transform 0.4s cubic-bezier(0.22, 1, 0.36, 1), box-shadow 0.4s ease;
    }
    .node-core { width: 16px; height: 16px; border-radius: 50%; background: linear-gradient(135deg, var(--a1), var(--a2)); }
    .node-year { font-family: 'JetBrains Mono', monospace; font-size: 0.8rem; font-weight: 700; color: var(--a1); padding: 2px 6px; border-radius: 6px; background: var(--bg); }
    .step:hover .node { transform: scale(1.15); box-shadow: 0 0 0 10px color-mix(in srgb, var(--a1) 18%, transparent), 0 10px 30px -6px color-mix(in srgb, var(--a1) 90%, transparent); }

    .card { position: relative; border-radius: 24px; overflow: hidden; display: flex; flex-direction: column; flex: 1; }
    .banner {
      position: relative; height: 132px; padding: 18px 20px; overflow: hidden;
      background: linear-gradient(135deg, var(--a1), var(--a2));
      color: #fff; display: flex; align-items: flex-start; justify-content: space-between;
    }
    .pattern {
      position: absolute; inset: 0; opacity: 0.22;
      background:
        radial-gradient(circle at 85% 20%, rgba(255,255,255,0.7) 0 2px, transparent 3px) 0 0 / 22px 22px,
        repeating-linear-gradient(135deg, rgba(255,255,255,0.35) 0 1px, transparent 1px 14px);
      -webkit-mask-image: linear-gradient(110deg, transparent 20%, #000 90%);
      mask-image: linear-gradient(110deg, transparent 20%, #000 90%);
    }
    .banner-year {
      position: absolute; left: 14px; bottom: -22px;
      font-family: 'Space Grotesk', sans-serif; font-size: 5.4rem; font-weight: 700; letter-spacing: -0.06em; line-height: 1;
      color: rgba(255,255,255,0.22);
    }
    .badge {
      position: relative; display: inline-flex; align-items: center; gap: 7px; padding: 6px 12px; border-radius: 999px;
      font-family: 'JetBrains Mono', monospace; font-size: 0.8rem; font-weight: 700;
      background: rgba(255,255,255,0.22); border: 1px solid rgba(255,255,255,0.4);
    }
    .step-no { position: relative; font-size: 0.72rem; font-weight: 600; letter-spacing: 0.12em; text-transform: uppercase; opacity: 0.9; }

    .ring { position: absolute; right: 18px; top: 94px; width: 76px; height: 76px; border-radius: 50%; background: var(--surface-solid); box-shadow: 0 10px 26px -10px color-mix(in srgb, var(--a2) 80%, transparent); display: grid; place-items: center; z-index: 2; }
    .ring svg { position: absolute; inset: 0; transform: rotate(-90deg); }
    .ring-bg { fill: none; stroke: var(--border); stroke-width: 6; }
    .ring-fg {
      fill: none; stroke-width: 6; stroke-linecap: round;
      stroke-dasharray: var(--len); stroke-dashoffset: var(--len);
      transition: stroke-dashoffset 1.4s cubic-bezier(0.22, 1, 0.36, 1) 0.3s;
    }
    .step.revealed .ring-fg { stroke-dashoffset: var(--off); }
    .ring-text { position: relative; font-family: 'Space Grotesk', sans-serif; font-weight: 700; font-size: 1.05rem; color: var(--text); }

    .body { padding: 24px 22px 24px; display: flex; flex-direction: column; gap: 8px; }
    .body h3 { font-size: 1.12rem; line-height: 1.3; padding-right: 64px; margin-bottom: 4px; }
    .meta { display: flex; align-items: flex-start; gap: 8px; font-size: 0.84rem; color: var(--text-2); }
    .meta app-icon { color: var(--a1); margin-top: 2px; }
    .desc { margin-top: 8px; padding-top: 14px; border-top: 1px dashed var(--border-strong); font-size: 0.88rem; color: var(--text-2); line-height: 1.65; }

    @media (max-width: 900px) {
      .journey { grid-template-columns: 1fr; gap: 28px; padding-left: 64px; }
      .journey::before { left: 21px; right: auto; top: 22px; bottom: 22px; width: 3px; height: auto; background: linear-gradient(180deg, #f59e0b, #14b8a6 50%, #ec4899); }
      .journey::after { display: none; }
      .step { position: relative; }
      .milestone { position: absolute; left: -64px; top: 0; }
    }
  `,
})
export class Education {
  protected readonly education = EDUCATION;
  protected readonly ring = RING;
}
