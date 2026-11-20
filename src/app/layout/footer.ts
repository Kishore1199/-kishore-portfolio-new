import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Icon } from '../core/icon';
import { NAV_LINKS, PROFILE } from '../data/portfolio.data';

@Component({
  selector: 'app-footer',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Icon],
  template: `
    <footer>
      <div class="container">
        <div class="cta glass">
          <div>
            <h2>Have a project or role in mind?</h2>
            <p>Let's talk about how I can help your team ship.</p>
          </div>
          <a class="btn btn-primary" [href]="'mailto:' + profile.email">
            <app-icon name="mail" [size]="16" /> Say hello
          </a>
        </div>

        <div class="bottom">
          <a href="#home" class="logo">
            <img src="assets/favicon.svg" alt="" width="28" height="28" /><span class="word">kishore<span>.dev</span></span>
          </a>
          <nav class="links" aria-label="Footer">
            @for (l of links; track l.id) { <a [href]="'#' + l.id">{{ l.label }}</a> }
          </nav>
          <div class="socials">
            <a class="icon-btn" [href]="profile.github" target="_blank" rel="noopener noreferrer" aria-label="GitHub"><app-icon name="github" [size]="16" /></a>
            <a class="icon-btn" [href]="profile.linkedin" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn"><app-icon name="linkedin" [size]="16" /></a>
            <a class="icon-btn" [href]="'mailto:' + profile.email" aria-label="Email"><app-icon name="mail" [size]="16" /></a>
          </div>
        </div>
        <p class="copy">&copy; {{ year }} {{ profile.name }} · Built with Angular 22 &amp; three.js</p>
      </div>
    </footer>
  `,
  styles: `
    footer { padding: 40px 0 36px; }
    .cta {
      display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 22px;
      padding: 36px 40px; border-radius: 24px; margin-bottom: 56px; overflow: hidden;
      background:
        radial-gradient(60% 120% at 0% 0%, var(--accent-soft), transparent 60%),
        radial-gradient(50% 120% at 100% 100%, color-mix(in srgb, var(--violet) 14%, transparent), transparent 60%),
        var(--surface);
    }
    .cta h2 { font-size: clamp(1.4rem, 3vw, 2rem); }
    .cta p { color: var(--text-2); margin-top: 6px; }
    .bottom { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 20px; padding-top: 28px; border-top: 1px solid var(--border); }
    .logo { display: inline-flex; align-items: center; gap: 10px; text-decoration: none; font-family: 'JetBrains Mono', monospace; font-weight: 700; }
    .logo img { border-radius: 8px; }
    .logo .word span { color: var(--accent); }
    .links { display: flex; flex-wrap: wrap; gap: 6px 20px; }
    .links a { font-size: 0.85rem; color: var(--text-2); text-decoration: none; }
    .links a:hover { color: var(--accent); }
    .socials { display: flex; gap: 8px; }
    .copy { margin-top: 26px; text-align: center; font-size: 0.8rem; color: var(--text-3); }
    @media (max-width: 600px) { .cta { padding: 26px 22px; } .bottom { flex-direction: column; text-align: center; } .links { justify-content: center; } }
  `,
})
export class Footer {
  protected readonly profile = PROFILE;
  protected readonly links = NAV_LINKS;
  protected readonly year = new Date().getFullYear();
}
