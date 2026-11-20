import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnDestroy,
  signal,
  viewChild,
} from '@angular/core';
import { Icon } from '../core/icon';
import { RevealDirective } from '../core/reveal.directive';
import { SkillIcon } from '../core/skill-icon';
import { skillColor } from '../core/skill-meta';
import { TiltDirective } from '../core/tilt.directive';
import { prefersReducedMotion } from '../core/theme.service';
import { ABOUT_HIGHLIGHTS, PROFILE, PROJECTS, SKILL_CATEGORIES } from '../data/portfolio.data';

interface Line {
  kind: 'cmd' | 'out' | 'gap';
  text: string;
  tone?: 'accent' | 'ok' | 'muted' | 'key';
}

const TOTAL_SKILLS = SKILL_CATEGORIES.reduce((n, c) => n + c.skills.length, 0);

/** About as an interactive terminal (left) + editorial column (right). */
@Component({
  selector: 'app-about',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Icon, RevealDirective, SkillIcon, TiltDirective],
  template: `
    <section id="about" class="section">
      <div class="container layout">
        <!-- ============ terminal ============ -->
        <div class="term-wrap" appReveal>
          <div class="floaters" aria-hidden="true">
            @for (f of floaters; track f.name; let i = $index) {
              <span class="floater" [class]="'floater f' + i" [style.--c]="color(f.name)">
                <app-skill-icon [name]="f.name" [color]="color(f.name)" [size]="22" />
              </span>
            }
          </div>

          <div class="term" #term appTilt [tiltMax]="6">
            <div class="term-bar">
              <span class="tl r"></span><span class="tl y"></span><span class="tl g"></span>
              <div class="tabs" role="tablist" aria-label="Terminal view">
                <button type="button" role="tab" class="tab" [class.on]="tab() === 'shell'" [attr.aria-selected]="tab() === 'shell'" (click)="tab.set('shell')">
                  <app-icon name="code" [size]="12" /> kishore&#64;dev: ~
                </button>
                <button type="button" role="tab" class="tab" [class.on]="tab() === 'json'" [attr.aria-selected]="tab() === 'json'" (click)="tab.set('json')">
                  <app-icon name="file" [size]="12" /> profile.json
                </button>
              </div>
              <button type="button" class="replay" (click)="replay()" aria-label="Replay terminal">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/></svg>
              </button>
            </div>

            @if (tab() === 'shell') {
              <div class="term-body" aria-live="polite">
                @for (l of shown(); track $index) {
                  @switch (l.kind) {
                    @case ('cmd') { <p class="cmd"><span class="ps">➜</span> <span class="path">~</span> {{ l.text }}</p> }
                    @case ('gap') { <p class="gap"></p> }
                    @default { <p class="out" [class]="'out ' + (l.tone ?? '')">{{ l.text }}</p> }
                  }
                }
                @if (typing() !== null) {
                  <p class="cmd"><span class="ps">➜</span> <span class="path">~</span> {{ typing() }}<span class="caret"></span></p>
                } @else if (done()) {
                  <p class="cmd"><span class="ps">➜</span> <span class="path">~</span> <span class="caret"></span></p>
                }
              </div>
            } @else {
              <pre class="term-body json"><code>{{ '{' }}
  <span class="k">"name"</span>: <span class="s">"{{ profile.name }}"</span>,
  <span class="k">"role"</span>: <span class="s">"{{ profile.role }}"</span>,
  <span class="k">"company"</span>: <span class="s">"{{ profile.company }}"</span>,
  <span class="k">"experience"</span>: {{ '{' }} <span class="k">"total"</span>: <span class="n">3</span>, <span class="k">"professional"</span>: <span class="n">2</span>, <span class="k">"internship"</span>: <span class="n">1</span> {{ '}' }},
  <span class="k">"location"</span>: <span class="s">"Chennai, India"</span>,
  <span class="k">"projects"</span>: <span class="n">{{ projectCount }}</span>,
  <span class="k">"technologies"</span>: <span class="n">{{ skillCount }}</span>,
  <span class="k">"core"</span>: [<span class="s">"Java"</span>, <span class="s">"Spring Boot"</span>, <span class="s">"Hibernate"</span>, <span class="s">"Angular"</span>, <span class="s">"MySQL"</span>, <span class="s">"PHP"</span>],
  <span class="k">"available"</span>: <span class="b">true</span>
{{ '}' }}</code></pre>
            }
            <div class="term-status">
              <span><i></i> zsh · UTF-8</span>
              <span>{{ time() }} IST</span>
            </div>
            <div class="tilt-glare"></div>
          </div>
          <div class="term-shadow" aria-hidden="true"></div>
        </div>

        <!-- ============ editorial column ============ -->
        <div class="story" appReveal [revealDelay]="120">
          <p class="eyebrow">About me</p>
          <h2 class="title">Building software that <span class="gradient-text">just works</span>.</h2>
          <p class="lead">
            I'm a Java Full Stack Developer at <strong>{{ profile.company }}</strong> with 3 years of experience —
            shipping the 75Health cloud EHR &amp; EMR platforms with Spring Boot, Angular, Hibernate and PHP.
          </p>

          <div class="strengths">
            @for (s of strengths; track s.label) {
              <span class="strength"><span class="s-ico">{{ s.emoji }}</span>{{ s.label }}</span>
            }
          </div>

          <ol class="focus">
            @for (h of highlights; track h.title; let i = $index) {
              <li [class.open]="open() === i">
                <button type="button" (click)="open.set(open() === i ? -1 : i)" [attr.aria-expanded]="open() === i">
                  <span class="f-no">0{{ i + 1 }}</span>
                  <span class="f-title">{{ h.title }}</span>
                  <span class="f-ico"><app-icon [name]="h.icon" [size]="18" /></span>
                  <span class="f-plus" aria-hidden="true"></span>
                </button>
                <div class="f-body"><p>{{ h.desc }}</p></div>
              </li>
            }
          </ol>

          <div class="cta">
            <a class="btn btn-primary" [href]="profile.resume" download="Kishore_V_Resume.pdf">
              <app-icon name="download" [size]="15" /> Download CV
            </a>
            <a class="btn btn-ghost" href="#contact">Let's talk</a>
            <span class="socials">
              <a class="icon-btn" [href]="profile.github" target="_blank" rel="noopener noreferrer" aria-label="GitHub"><app-icon name="github" [size]="17" /></a>
              <a class="icon-btn" [href]="profile.linkedin" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn"><app-icon name="linkedin" [size]="17" /></a>
            </span>
          </div>
        </div>
      </div>
    </section>
  `,
  styles: `
    .layout { display: grid; grid-template-columns: 1.08fr 1fr; gap: 64px; align-items: center; }

    /* ---------- terminal ---------- */
    .term-wrap { position: relative; perspective: 1500px; padding: 24px 0; }
    .term {
      position: relative; border-radius: 18px; overflow: hidden;
      background: #0b0f17; border: 1px solid rgba(255,255,255,0.1);
      box-shadow: 0 40px 90px -30px rgba(0,0,0,0.65), 0 0 0 1px color-mix(in srgb, var(--accent) 18%, transparent);
      transform: rotateY(9deg) rotateX(4deg);
      font-family: 'JetBrains Mono', monospace;
    }
    .term-bar { display: flex; align-items: center; gap: 7px; padding: 10px 12px; background: #121826; border-bottom: 1px solid rgba(255,255,255,0.06); }
    .tl { width: 11px; height: 11px; border-radius: 50%; flex-shrink: 0; }
    .r { background: #ff5f56; } .y { background: #ffbd2e; } .g { background: #27c93f; }
    .tabs { display: flex; gap: 4px; margin-left: 10px; flex: 1; min-width: 0; }
    .tab {
      display: inline-flex; align-items: center; gap: 6px; padding: 5px 11px; border-radius: 8px; border: 0; cursor: pointer;
      font-family: inherit; font-size: 0.7rem; color: #7d8590; background: transparent; white-space: nowrap;
    }
    .tab.on { color: #e6edf3; background: rgba(255,255,255,0.07); }
    .tab:hover { color: #e6edf3; }
    .replay { width: 28px; height: 28px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.08); background: transparent; color: #7d8590; display: grid; place-items: center; cursor: pointer; flex-shrink: 0; }
    .replay:hover { color: #fff; border-color: var(--accent); }

    .term-body { margin: 0; padding: 20px 22px; height: 392px; overflow: hidden; font-size: 0.82rem; line-height: 1.75; color: #c9d1d9; }
    .term-body p { margin: 0; white-space: pre-wrap; }
    .cmd { color: #e6edf3; }
    .ps { color: #3fb950; }
    .path { color: #79c0ff; }
    .gap { height: 8px; }
    .out { color: #c9d1d9; padding-left: 2px; }
    .out.accent { color: #ffa657; font-weight: 700; }
    .out.ok { color: #3fb950; }
    .out.muted { color: #7d8590; }
    .out.key { color: #d2a8ff; }
    .caret { display: inline-block; width: 8px; height: 1.05em; margin-left: 2px; vertical-align: text-bottom; background: var(--accent); animation: blink 1s step-end infinite; }
    .json { white-space: pre; overflow-x: auto; }
    .json .k { color: #79c0ff; } .json .s { color: #a5d6ff; } .json .n { color: #ffa657; } .json .b { color: #ff7b72; }
    .term-status { display: flex; justify-content: space-between; padding: 7px 14px; font-size: 0.66rem; color: #7d8590; background: #121826; border-top: 1px solid rgba(255,255,255,0.05); }
    .term-status i { display: inline-block; width: 7px; height: 7px; border-radius: 50%; background: #3fb950; margin-right: 6px; }
    .term-shadow { position: absolute; left: 12%; right: 12%; bottom: -10px; height: 60px; background: radial-gradient(closest-side, var(--glow), transparent); filter: blur(22px); z-index: -1; }

    .floaters { position: absolute; inset: 0; pointer-events: none; z-index: 2; }
    .floater {
      position: absolute; width: 50px; height: 50px; border-radius: 15px; display: grid; place-items: center;
      background: var(--surface-solid); border: 1px solid color-mix(in srgb, var(--c) 45%, transparent);
      box-shadow: 0 16px 30px -14px color-mix(in srgb, var(--c) 80%, transparent);
      animation: float 6s ease-in-out infinite; will-change: transform;
    }
    /* perched on the title bar and status bar, so they never cover terminal output */
    .f0 { top: -2px; left: 52%; animation-delay: -1s; }
    .f1 { top: -12px; right: 9%; animation-delay: -3s; }
    .f2 { bottom: -4px; left: 30%; animation-delay: -2s; }
    .f3 { bottom: -12px; right: 30%; animation-delay: -4.5s; }

    /* ---------- story ---------- */
    .story .title { margin-bottom: 4px; }
    .lead strong { color: var(--text); }
    .strengths { display: flex; flex-wrap: wrap; gap: 8px; margin: 22px 0 26px; }
    .strength {
      display: inline-flex; align-items: center; gap: 8px; padding: 8px 14px 8px 8px; border-radius: 999px;
      font-size: 0.85rem; font-weight: 600; background: var(--surface); border: 1px solid var(--border);
    }
    .s-ico { width: 26px; height: 26px; border-radius: 50%; display: grid; place-items: center; background: var(--accent-soft); font-size: 0.85rem; }

    .focus { list-style: none; margin: 0 0 28px; padding: 0; border-top: 1px solid var(--border); }
    .focus li { border-bottom: 1px solid var(--border); }
    .focus button {
      width: 100%; display: flex; align-items: center; gap: 16px; padding: 16px 4px; text-align: left; cursor: pointer;
      background: none; border: 0; color: var(--text);
    }
    .f-no { font-family: 'JetBrains Mono', monospace; font-size: 0.75rem; color: var(--text-3); width: 22px; }
    .f-title { flex: 1; font-family: 'Space Grotesk', sans-serif; font-size: 1.12rem; font-weight: 600; transition: color 0.25s ease, transform 0.25s ease; }
    .focus button:hover .f-title, .open .f-title { color: var(--accent); transform: translateX(4px); }
    .f-ico { color: var(--text-3); transition: color 0.25s ease; }
    .open .f-ico { color: var(--accent); }
    .f-plus { position: relative; width: 14px; height: 14px; }
    .f-plus::before, .f-plus::after { content: ''; position: absolute; left: 0; right: 0; top: 50%; height: 2px; margin-top: -1px; border-radius: 2px; background: var(--text-2); transition: transform 0.3s ease; }
    .f-plus::after { transform: rotate(90deg); }
    .open .f-plus::after { transform: rotate(0deg); }
    .f-body { display: grid; grid-template-rows: 0fr; transition: grid-template-rows 0.35s ease; }
    .f-body p { overflow: hidden; margin: 0; padding: 0 4px 0 42px; color: var(--text-2); font-size: 0.9rem; line-height: 1.65; }
    .open .f-body { grid-template-rows: 1fr; }
    .open .f-body p { padding-bottom: 16px; }

    .cta { display: flex; flex-wrap: wrap; align-items: center; gap: 10px; }
    .cta .btn { padding: 12px 20px; font-size: 0.88rem; }
    .socials { display: inline-flex; gap: 8px; margin-left: 4px; }

    @media (max-width: 1023px) {
      .layout { grid-template-columns: 1fr; gap: 48px; }
      .story { order: -1; }
      .term { transform: none; }
    }
    @media (max-width: 600px) {
      .term-body { height: auto; min-height: 520px; font-size: 0.7rem; padding: 16px; }
      .tab { padding: 5px 8px; font-size: 0.64rem; }
      .floater { width: 40px; height: 40px; border-radius: 12px; }
      .f0 { left: 56%; } .f1 { right: 4%; }
    }
  `,
})
export class About implements AfterViewInit, OnDestroy {
  protected readonly profile = PROFILE;
  protected readonly highlights = ABOUT_HIGHLIGHTS;
  protected readonly projectCount = PROJECTS.length;
  protected readonly skillCount = TOTAL_SKILLS;
  protected readonly floaters = [{ name: 'Java' }, { name: 'Spring Boot' }, { name: 'Angular' }, { name: 'PHP' }];
  protected readonly strengths = [
    { emoji: '🧩', label: 'Problem solving' },
    { emoji: '⚡', label: 'Quick learner' },
    { emoji: '🔄', label: 'Adaptable' },
    { emoji: '💬', label: 'Clear communicator' },
  ];

  protected readonly tab = signal<'shell' | 'json'>('shell');
  protected readonly open = signal(0);
  protected readonly shown = signal<Line[]>([]);
  protected readonly typing = signal<string | null>(null);
  protected readonly done = signal(false);
  protected readonly time = signal(this.formatTime());

  private term = viewChild.required<ElementRef<HTMLElement>>('term');
  private io?: IntersectionObserver;
  private clock?: ReturnType<typeof setInterval>;
  private timers: ReturnType<typeof setTimeout>[] = [];
  private started = false;

  private script(): Line[] {
    return [
      { kind: 'cmd', text: 'whoami' },
      { kind: 'out', text: `${PROFILE.name} — ${PROFILE.role}`, tone: 'accent' },
      { kind: 'gap', text: '' },
      { kind: 'cmd', text: 'cat about.txt' },
      { kind: 'out', text: 'Builds enterprise web apps with Java, Spring Boot,' },
      { kind: 'out', text: 'Hibernate, Angular, MySQL — and PHP / OpenEMR.' },
      { kind: 'out', text: 'Problem solver · quick learner · quality-focused.', tone: 'muted' },
      { kind: 'gap', text: '' },
      { kind: 'cmd', text: 'experience --summary' },
      { kind: 'out', text: '✔ 2 yrs  Software Developer · Kaaspro Enterprises', tone: 'ok' },
      { kind: 'out', text: '✔ 1 yr   Full Stack Intern · Techietact Solutions', tone: 'ok' },
      { kind: 'gap', text: '' },
      { kind: 'cmd', text: 'ls ./focus' },
      { kind: 'out', text: 'full-stack/  databases/  devops/  ai-assisted/', tone: 'key' },
      { kind: 'gap', text: '' },
      { kind: 'cmd', text: 'date' },
      { kind: 'out', text: `${this.formatTime()} IST · Chennai, India`, tone: 'muted' },
    ];
  }

  ngAfterViewInit() {
    this.clock = setInterval(() => this.time.set(this.formatTime()), 15000);
    this.io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !this.started) {
        this.started = true;
        this.run();
      }
    }, { threshold: 0.35 });
    this.io.observe(this.term().nativeElement);
  }

  ngOnDestroy() {
    clearInterval(this.clock);
    this.clearTimers();
    this.io?.disconnect();
  }

  protected replay() {
    this.tab.set('shell');
    this.run();
  }

  protected color(name: string) {
    return skillColor(name);
  }

  /** Types each command character by character, then prints its output. */
  private run() {
    this.clearTimers();
    const lines = this.script();
    this.shown.set([]);
    this.typing.set(null);
    this.done.set(false);

    if (prefersReducedMotion()) {
      this.shown.set(lines);
      this.done.set(true);
      return;
    }

    let t = 300;
    for (const line of lines) {
      if (line.kind === 'cmd') {
        for (let c = 1; c <= line.text.length; c++) {
          const partial = line.text.slice(0, c);
          this.at(t, () => this.typing.set(partial));
          t += 55;
        }
        t += 220;
        this.at(t, () => {
          this.typing.set(null);
          this.shown.update(s => [...s, line]);
        });
        t += 160;
      } else {
        this.at(t, () => this.shown.update(s => [...s, line]));
        t += line.kind === 'gap' ? 60 : 110;
      }
    }
    this.at(t, () => this.done.set(true));
  }

  private at(ms: number, fn: () => void) {
    this.timers.push(setTimeout(fn, ms));
  }

  private clearTimers() {
    this.timers.forEach(clearTimeout);
    this.timers = [];
  }

  private formatTime() {
    try {
      return new Intl.DateTimeFormat('en-IN', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', hour12: true }).format(new Date()).toUpperCase();
    } catch {
      return '';
    }
  }
}
