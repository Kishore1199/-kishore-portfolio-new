import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { Icon } from '../core/icon';
import { RevealDirective } from '../core/reveal.directive';
import { SkillIcon } from '../core/skill-icon';
import { TiltDirective } from '../core/tilt.directive';
import { EXPERIENCE, PROJECTS, RESPONSIBILITIES } from '../data/portfolio.data';
import { baseSkillName, skillColor } from '../core/skill-meta';

@Component({
  selector: 'app-experience',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Icon, RevealDirective, SkillIcon, TiltDirective],
  template: `
    <section id="experience" class="section">
      <div class="container">
        <div class="section-head" appReveal>
          <p class="eyebrow">Career</p>
          <h2 class="title">Work <span class="gradient-text">experience</span></h2>
          <p class="lead">Pick a role to see what I built, the stack I used and the projects I shipped.</p>
        </div>

        <!-- stats -->
        <div class="stats">
          @for (s of stats; track s.label; let i = $index) {
            <div class="stat glass" appTilt [tiltMax]="10" appReveal [revealDelay]="i * 80">
              <span class="stat-value pop-sm">{{ s.value }}<small>{{ s.unit }}</small></span>
              <span class="stat-label">{{ s.label }}</span>
              <span class="stat-bar"><i [style.width]="s.fill"></i></span>
              <div class="tilt-glare"></div>
            </div>
          }
        </div>

        <!-- board -->
        <div class="board" appReveal>
          <div class="roles" role="tablist" aria-label="Roles">
            @for (j of jobs; track j.company; let i = $index) {
              <button type="button" role="tab" class="role"
                      [class.on]="selected() === i" [attr.aria-selected]="selected() === i"
                      (click)="selected.set(i)">
                <span class="logo">{{ j.initials }}</span>
                <span class="role-text">
                  <strong>{{ j.company }}</strong>
                  <small>{{ j.role }}</small>
                  <em>{{ j.period }}</em>
                </span>
                @if (j.current) { <span class="live" title="Current role"></span> }
              </button>
            }
          </div>

          @for (j of [job()]; track j.company) {
            <article class="panel glass" role="tabpanel">
              <header class="panel-head">
                <span class="logo big">{{ j.initials }}</span>
                <div class="who">
                  <h3>{{ j.role }}</h3>
                  <p>{{ j.company }}</p>
                </div>
                <div class="when">
                  @if (j.current) { <span class="chip chip-now">Current</span> }
                  <span class="chip"><app-icon name="calendar" [size]="13" /> {{ j.period }}</span>
                  <span class="chip chip-accent">{{ j.duration }}</span>
                </div>
              </header>

              <p class="summary">{{ j.summary }}</p>

              <h4>Tech stack</h4>
              <div class="stack">
                @for (t of j.tech; track t) {
                  <span class="tech" [style.--c]="color(t)">
                    <app-skill-icon [name]="base(t)" [color]="color(t)" [size]="16" />{{ t }}
                  </span>
                }
              </div>

              <h4>Projects in this role</h4>
              <div class="projects">
                @for (p of jobProjects(); track p.title) {
                  <a class="proj" [href]="p.link ?? '#projects'" [attr.target]="p.link ? '_blank' : null"
                     [attr.rel]="p.link ? 'noopener noreferrer' : null"
                     [style.--p1]="p.accent" [style.--p2]="p.accent2">
                    <span class="proj-bar"></span>
                    <span class="proj-text">
                      <strong>{{ p.title }}</strong>
                      <small>{{ p.badge }} · {{ p.tech.slice(0, 3).join(' · ') }}</small>
                    </span>
                    <app-icon [name]="p.link ? 'external' : 'arrow-right'" [size]="15" />
                  </a>
                }
              </div>
            </article>
          }
        </div>

        <!-- responsibilities -->
        <div class="resp-head" appReveal>
          <h3>Roles &amp; responsibilities</h3>
          <span class="chip">Agile / Scrum</span>
        </div>
        <ol class="resp">
          @for (r of responsibilities; track r; let i = $index) {
            <li class="resp-item glass" appReveal [revealDelay]="i * 70">
              <span class="num">0{{ i + 1 }}</span>
              <p>{{ r }}</p>
            </li>
          }
        </ol>
      </div>
    </section>
  `,
  styles: `
    /* ---------- stats ---------- */
    .stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 28px; }
    .stat { padding: 20px 22px; border-radius: 18px; box-shadow: none; display: flex; flex-direction: column; gap: 4px; }
    .stat-value { font-family: 'Space Grotesk', sans-serif; font-size: 2.3rem; font-weight: 700; letter-spacing: -0.04em; line-height: 1; }
    .stat-value small { font-size: 1rem; color: var(--accent); margin-left: 4px; letter-spacing: 0; }
    .stat-label { font-size: 0.82rem; color: var(--text-3); }
    .stat-bar { margin-top: 10px; height: 4px; border-radius: 99px; background: var(--surface-2); overflow: hidden; }
    .stat-bar i { display: block; height: 100%; border-radius: inherit; background: linear-gradient(90deg, var(--accent-3), var(--accent), var(--accent-hot)); }

    /* ---------- board ---------- */
    .board { display: grid; grid-template-columns: 300px 1fr; gap: 20px; align-items: start; perspective: 1400px; }
    .roles { display: flex; flex-direction: column; gap: 10px; }
    .role {
      position: relative; display: flex; align-items: center; gap: 14px; width: 100%; padding: 16px; text-align: left; cursor: pointer;
      border-radius: 16px; border: 1px solid var(--border); background: var(--surface);
      transition: border-color 0.25s ease, background 0.25s ease, transform 0.25s ease;
    }
    .role:hover { border-color: var(--border-strong); transform: translateX(3px); }
    .role.on { border-color: color-mix(in srgb, var(--accent) 55%, transparent); background: var(--accent-soft); }
    .role.on::before {
      content: ''; position: absolute; left: -1px; top: 16px; bottom: 16px; width: 3px; border-radius: 99px;
      background: linear-gradient(var(--accent-2), var(--accent-deep));
    }
    .logo {
      flex-shrink: 0; width: 44px; height: 44px; border-radius: 12px; display: grid; place-items: center;
      font-family: 'Space Grotesk', sans-serif; font-weight: 700; font-size: 0.95rem; color: #fff;
      background: linear-gradient(135deg, var(--accent-2), var(--accent-deep));
      box-shadow: 0 8px 20px -10px var(--glow);
    }
    .role:not(.on) .logo { background: var(--surface-2); color: var(--text-2); box-shadow: none; border: 1px solid var(--border); }
    .role-text { display: flex; flex-direction: column; min-width: 0; }
    .role-text strong { font-size: 0.92rem; }
    .role-text small { font-size: 0.78rem; color: var(--text-2); }
    .role-text em { font-style: normal; font-family: 'JetBrains Mono', monospace; font-size: 0.7rem; color: var(--text-3); margin-top: 2px; }
    .live { position: absolute; top: 14px; right: 14px; width: 8px; height: 8px; border-radius: 50%; background: #10b981; animation: pulse-ring 1.8s ease-out infinite; }

    .panel { padding: 28px; border-radius: 22px; transform-origin: left center; animation: panel-in 0.6s cubic-bezier(0.22, 1, 0.36, 1) both; }
    @keyframes panel-in { from { opacity: 0; transform: rotateY(-14deg) translateX(-16px); } to { opacity: 1; transform: none; } }
    .panel-head { display: flex; align-items: center; flex-wrap: wrap; gap: 16px; padding-bottom: 20px; margin-bottom: 20px; border-bottom: 1px solid var(--border); }
    .logo.big { width: 58px; height: 58px; border-radius: 16px; font-size: 1.2rem; }
    .who { flex: 1; min-width: 180px; }
    .who h3 { font-size: 1.35rem; }
    .who p { color: var(--accent); font-weight: 600; font-size: 0.92rem; margin-top: 2px; }
    .when { display: flex; flex-wrap: wrap; gap: 6px; }
    .when .chip { display: inline-flex; align-items: center; gap: 6px; }
    .chip-now { color: #34d399; background: rgba(16,185,129,0.1); border-color: rgba(16,185,129,0.25); }
    .summary { color: var(--text-2); font-size: 0.95rem; line-height: 1.75; }
    h4 { margin: 24px 0 12px; font-family: 'JetBrains Mono', monospace; font-size: 0.72rem; font-weight: 500; letter-spacing: 0.12em; text-transform: uppercase; color: var(--text-3); }

    .stack { display: flex; flex-wrap: wrap; gap: 8px; }
    .tech {
      display: inline-flex; align-items: center; gap: 8px; padding: 6px 12px 6px 8px; border-radius: 10px;
      font-size: 0.83rem; font-weight: 500; color: var(--text);
      background: var(--surface-2); border: 1px solid var(--border);
      transition: border-color 0.2s ease, transform 0.2s ease;
    }
    .tech:hover { border-color: color-mix(in srgb, var(--c) 55%, transparent); transform: translateY(-2px); }

    .projects { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 10px; }
    .proj {
      position: relative; display: flex; align-items: center; gap: 12px; padding: 14px 14px 14px 18px; border-radius: 14px; overflow: hidden;
      text-decoration: none; color: var(--text); background: var(--surface-2); border: 1px solid var(--border);
      transition: transform 0.25s ease, border-color 0.25s ease, box-shadow 0.25s ease;
    }
    .proj:hover { transform: translateY(-3px); border-color: color-mix(in srgb, var(--p1) 50%, transparent); box-shadow: 0 14px 30px -18px var(--p1); }
    .proj-bar { position: absolute; left: 0; top: 0; bottom: 0; width: 4px; background: linear-gradient(var(--p1), var(--p2)); }
    .proj-text { flex: 1; display: flex; flex-direction: column; min-width: 0; }
    .proj-text strong { font-size: 0.9rem; }
    .proj-text small { font-size: 0.74rem; color: var(--text-3); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .proj app-icon { color: var(--text-3); }
    .proj:hover app-icon { color: var(--p1); }

    /* ---------- responsibilities ---------- */
    .resp-head { display: flex; align-items: center; gap: 12px; margin: 48px 0 16px; }
    .resp-head h3 { font-size: 1.2rem; }
    .resp { list-style: none; margin: 0; padding: 0; display: grid; grid-template-columns: repeat(5, 1fr); gap: 12px; counter-reset: r; }
    .resp-item { padding: 18px; border-radius: 16px; box-shadow: none; display: flex; flex-direction: column; gap: 10px; }
    .num {
      font-family: 'Space Grotesk', sans-serif; font-weight: 700; font-size: 1.5rem; line-height: 1;
      background: linear-gradient(135deg, var(--accent-3), var(--accent));
      -webkit-background-clip: text; background-clip: text; color: transparent;
    }
    .resp-item p { font-size: 0.85rem; color: var(--text-2); line-height: 1.55; }

    @media (max-width: 1023px) {
      .stats { grid-template-columns: repeat(2, 1fr); }
      .board { grid-template-columns: 1fr; }
      .roles { flex-direction: row; overflow-x: auto; padding-bottom: 4px; scrollbar-width: none; }
      .role { min-width: 260px; }
      .role:hover { transform: none; }
      .role.on::before { left: 16px; right: 16px; top: auto; bottom: -1px; width: auto; height: 3px; }
      .resp { grid-template-columns: repeat(2, 1fr); }
    }
    @media (max-width: 600px) {
      .panel { padding: 20px; }
      .stat-value { font-size: 1.8rem; }
      .resp { grid-template-columns: 1fr; }
    }
  `,
})
export class Experience {
  protected readonly jobs = EXPERIENCE;
  protected readonly responsibilities = RESPONSIBILITIES;
  protected readonly selected = signal(0);
  protected readonly job = computed(() => this.jobs[this.selected()]);
  protected readonly jobProjects = computed(() =>
    this.job().projects.map(t => PROJECTS.find(p => p.title === t)).filter(p => !!p),
  );

  protected readonly stats = [
    { value: '3', unit: '+ yrs', label: 'Total experience', fill: '100%' },
    { value: '2', unit: 'yrs', label: 'Professional · Kaaspro', fill: '67%' },
    { value: '1', unit: 'yr', label: 'Internship · Techietact', fill: '33%' },
    { value: '6', unit: '', label: 'Projects shipped', fill: '100%' },
  ];

  protected base(t: string) {
    return baseSkillName(t);
  }

  protected color(t: string) {
    return skillColor(t);
  }
}
