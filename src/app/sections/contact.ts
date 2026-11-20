import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Explain } from '../core/explain';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Icon } from '../core/icon';
import { RevealDirective } from '../core/reveal.directive';
import { TiltDirective } from '../core/tilt.directive';
import { EMAILJS, PROFILE } from '../data/portfolio.data';

type FieldName = 'name' | 'email' | 'subject' | 'message';

@Component({
  selector: 'app-contact',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Explain, ReactiveFormsModule, Icon, RevealDirective, TiltDirective],
  template: `
    <section id="contact" class="section">
      <div class="container">
        <div class="layout">
          <div class="info" appReveal>
            <p class="eyebrow">Contact<app-explain section="contact" /></p>
            <h2 class="title">Let's build something <span class="gradient-text">great together</span>.</h2>
            <p class="lead">
              I'm open to new opportunities, freelance projects and interesting collaborations.
              Drop me a message and I'll get back to you shortly.
            </p>

            <div class="cards">
              @for (c of contacts; track c.label) {
                @if (c.href) {
                  <a class="c glass" [href]="c.href" [attr.target]="c.external ? '_blank' : null"
                     [attr.rel]="c.external ? 'noopener noreferrer' : null" appTilt [tiltMax]="10">
                    <span class="c-icon pop-sm"><app-icon [name]="c.icon" [size]="18" /></span>
                    <span class="c-text"><small>{{ c.label }}</small>{{ c.value }}</span>
                    <app-icon class="c-arrow" name="arrow-right" [size]="16" />
                  </a>
                } @else {
                  <div class="c glass" appTilt [tiltMax]="10">
                    <span class="c-icon pop-sm"><app-icon [name]="c.icon" [size]="18" /></span>
                    <span class="c-text"><small>{{ c.label }}</small>{{ c.value }}</span>
                  </div>
                }
              }
            </div>
          </div>

          <form class="form glass" [formGroup]="form" (ngSubmit)="submit()" appReveal [revealDelay]="120" novalidate>
            <h3>Send a message</h3>
            <div class="row">
              <label class="field">
                <span>Name</span>
                <input formControlName="name" type="text" placeholder="Your full name" autocomplete="name" />
                @if (error('name'); as e) { <em>{{ e }}</em> }
              </label>
              <label class="field">
                <span>Email</span>
                <input formControlName="email" type="email" placeholder="you@example.com" autocomplete="email" />
                @if (error('email'); as e) { <em>{{ e }}</em> }
              </label>
            </div>
            <label class="field">
              <span>Subject</span>
              <input formControlName="subject" type="text" placeholder="What is this about?" />
              @if (error('subject'); as e) { <em>{{ e }}</em> }
            </label>
            <label class="field">
              <span>Message</span>
              <textarea formControlName="message" rows="5" placeholder="Tell me about your project or opportunity…"></textarea>
              @if (error('message'); as e) { <em>{{ e }}</em> }
            </label>
            <button class="btn btn-primary send" type="submit" [disabled]="sending()">
              @if (sending()) {
                <span class="spinner"></span> Sending…
              } @else {
                Send message <app-icon name="send" [size]="16" />
              }
            </button>
            @if (status(); as s) {
              <p class="status" [class.ok]="s.ok" role="status">{{ s.text }}</p>
            }
          </form>
        </div>
      </div>
    </section>
  `,
  styles: `
    .layout { display: grid; grid-template-columns: 1fr 1.1fr; gap: 56px; align-items: start; }
    .cards { display: flex; flex-direction: column; gap: 12px; margin-top: 34px; }
    .c { display: flex; align-items: center; gap: 16px; padding: 14px 18px; border-radius: 16px; text-decoration: none; box-shadow: none; }
    .c-icon { width: 42px; height: 42px; border-radius: 12px; display: grid; place-items: center; color: var(--accent); background: var(--accent-soft); flex-shrink: 0; }
    .c-text { display: flex; flex-direction: column; font-weight: 600; font-size: 0.93rem; min-width: 0; overflow-wrap: anywhere; }
    .c-text small { font-family: 'JetBrains Mono', monospace; font-size: 0.68rem; font-weight: 500; letter-spacing: 0.1em; text-transform: uppercase; color: var(--text-3); }
    .c-arrow { margin-left: auto; color: var(--text-3); transition: transform 0.25s ease, color 0.25s ease; }
    a.c:hover .c-arrow { transform: translateX(4px); color: var(--accent); }

    .form { padding: 34px; border-radius: 24px; display: flex; flex-direction: column; gap: 18px; }
    .form h3 { font-size: 1.35rem; margin-bottom: 4px; }
    .row { display: grid; grid-template-columns: 1fr 1fr; gap: 18px; }
    .field { display: flex; flex-direction: column; gap: 8px; }
    .field span { font-size: 0.82rem; font-weight: 600; color: var(--text-2); }
    .field input, .field textarea {
      width: 100%; padding: 13px 15px; border-radius: 12px; font: inherit; font-size: 0.93rem; color: var(--text);
      background: var(--surface-2); border: 1px solid var(--border); outline: none; resize: vertical;
      transition: border-color 0.2s ease, box-shadow 0.2s ease, background 0.2s ease;
    }
    .field input::placeholder, .field textarea::placeholder { color: var(--text-3); }
    .field input:focus, .field textarea:focus { border-color: var(--accent); box-shadow: 0 0 0 4px var(--accent-soft); }
    .field em { font-style: normal; font-size: 0.76rem; color: #f87171; }
    .send { margin-top: 6px; width: 100%; padding: 15px; }
    .spinner { width: 16px; height: 16px; border-radius: 50%; border: 2px solid rgba(255,255,255,0.35); border-top-color: #fff; animation: spin 0.8s linear infinite; }
    .status { padding: 12px 14px; border-radius: 12px; font-size: 0.88rem; font-weight: 500; color: #f87171; background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.25); }
    .status.ok { color: #34d399; background: rgba(16,185,129,0.1); border-color: rgba(16,185,129,0.25); }

    @media (max-width: 1023px) { .layout { grid-template-columns: 1fr; gap: 40px; } }
    @media (max-width: 600px) { .row { grid-template-columns: 1fr; } .form { padding: 22px; } }
  `,
})
export class Contact {
  private fb = inject(FormBuilder);

  protected readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    subject: ['', [Validators.required, Validators.minLength(3)]],
    message: ['', [Validators.required, Validators.minLength(10)]],
  });

  protected readonly sending = signal(false);
  protected readonly status = signal<{ ok: boolean; text: string } | null>(null);
  /** bumped on blur/submit so error messages re-evaluate under OnPush + zoneless */
  private readonly touchedTick = signal(0);
  private statusTimer: ReturnType<typeof setTimeout> | undefined;

  protected readonly contacts = [
    { icon: 'mail', label: 'Email', value: PROFILE.email, href: 'mailto:' + PROFILE.email, external: false },
    { icon: 'phone', label: 'Phone', value: PROFILE.phone, href: PROFILE.phoneHref, external: false },
    { icon: 'linkedin', label: 'LinkedIn', value: PROFILE.linkedinUser, href: PROFILE.linkedin, external: true },
    { icon: 'github', label: 'GitHub', value: PROFILE.githubUser, href: PROFILE.github, external: true },
    { icon: 'pin', label: 'Location', value: PROFILE.location, href: null, external: false },
  ];

  constructor() {
    this.form.events.subscribe(() => this.touchedTick.update(n => n + 1));
  }

  protected error(field: FieldName): string {
    this.touchedTick();
    const c = this.form.controls[field];
    if (!c.touched || !c.errors) return '';
    const label = field.charAt(0).toUpperCase() + field.slice(1);
    if (c.errors['required']) return `${label} is required`;
    if (c.errors['email']) return 'Please enter a valid email';
    if (c.errors['minlength']) return `Minimum ${c.errors['minlength'].requiredLength} characters`;
    return '';
  }

  protected async submit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.touchedTick.update(n => n + 1);
      return;
    }
    this.sending.set(true);
    try {
      const { default: emailjs } = await import('@emailjs/browser');
      const v = this.form.getRawValue();
      await emailjs.send(
        EMAILJS.serviceId,
        EMAILJS.templateId,
        { from_name: v.name, from_email: v.email, subject: v.subject, message: v.message },
        { publicKey: EMAILJS.publicKey },
      );
      this.showStatus(true, "Thanks! Your message was sent — I'll reply soon.");
      this.form.reset();
    } catch {
      this.showStatus(false, 'Sorry, the message could not be sent. Please email me directly.');
    } finally {
      this.sending.set(false);
    }
  }

  private showStatus(ok: boolean, text: string) {
    this.status.set({ ok, text });
    clearTimeout(this.statusTimer);
    this.statusTimer = setTimeout(() => this.status.set(null), 6000);
  }
}
