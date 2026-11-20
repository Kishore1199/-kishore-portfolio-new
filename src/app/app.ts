import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { Navbar } from './layout/navbar';
import { Footer } from './layout/footer';
import { ResumeModal } from './layout/resume-modal';
import { Starfield } from './layout/starfield';
import { Hero } from './sections/hero/hero';
import { About } from './sections/about';
import { Skills } from './sections/skills';
import { Projects } from './sections/projects';
import { Experience } from './sections/experience';
import { Education } from './sections/education';
import { Contact } from './sections/contact';
import { Prep } from './sections/prep';

@Component({
  selector: 'app-root',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Navbar, Footer, ResumeModal, Starfield, Hero, About, Skills, Projects, Experience, Education, Prep, Contact],
  template: `
    <div class="ambient" aria-hidden="true"></div>
    <app-starfield />

    <a class="skip" href="#about">Skip to content</a>
    <app-navbar (openResume)="resumeOpen.set(true)" />

    <main>
      <app-hero />
      <app-about />
      <app-skills />
      <app-projects />
      <app-experience />
      <app-education />
      <app-prep />
      <app-contact />
    </main>

    <app-footer />

    @if (resumeOpen()) {
      <app-resume-modal (close)="resumeOpen.set(false)" />
    }
  `,
  styles: `
    :host { display: block; position: relative; }
    main, app-footer { position: relative; z-index: 1; display: block; }
    /* Static, GPU-cheap backdrop (no blur filters or animation, so scrolling stays smooth). */
    .ambient {
      position: fixed; inset: 0; z-index: 0; pointer-events: none;
      background:
        radial-gradient(45vmax 45vmax at 0% 0%, color-mix(in srgb, var(--accent) 13%, transparent), transparent 70%),
        radial-gradient(50vmax 50vmax at 100% 100%, color-mix(in srgb, var(--violet) 12%, transparent), transparent 70%),
        radial-gradient(30vmax 30vmax at 60% 45%, color-mix(in srgb, var(--cyan) 5%, transparent), transparent 70%);
    }
    .skip { position: fixed; left: 16px; top: -60px; z-index: 200; padding: 10px 16px; border-radius: 10px; background: var(--accent); color: #fff; text-decoration: none; font-weight: 600; transition: top 0.2s; }
    .skip:focus { top: 16px; }
  `,
})
export class App {
  protected readonly resumeOpen = signal(false);
}
