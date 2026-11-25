import { Injectable, signal } from '@angular/core';
import type { LabId } from '../lab/lab-ids';

export type SectionId = 'home' | 'about' | 'skills' | 'projects' | 'experience' | 'education' | 'prep' | 'ai' | 'contact';
export const SECTIONS: SectionId[] = ['home', 'about', 'skills', 'projects', 'experience', 'education', 'prep', 'ai', 'contact'];

/**
 * The 3D site's version of Kishore.OS's OsService, trimmed to what ALPHA needs:
 * scroll-to-section (instead of opening windows), a highlight for the narrated section,
 * toasts, clipboard and the robot's emote channel.
 */
@Injectable({ providedIn: 'root' })
export class AssistantBus {
  /** ask ALPHA to pull a face: { mood, ms, n } — n changes on every call so repeats still fire */
  readonly emote = signal<{ mood: string; ms: number; n: number } | null>(null);
  /** section ALPHA is talking about (gets a soft highlight ring) */
  readonly focus = signal<SectionId | null>(null);
  /** project the carousel should bring to the front — n changes on every call so repeats still fire */
  readonly project = signal<{ title: string; n: number } | null>(null);
  /** the job matcher is open, starting with this text */
  readonly matcher = signal<{ text: string } | null>(null);
  /** the mock interview is open */
  readonly interview = signal(false);
  /** group of chapters the interview should start with */
  readonly interviewGroup = signal('');
  /** the AI Lab tool that is open */
  readonly lab = signal<{ id: LabId; seed: Record<string, string> } | null>(null);
  /** a drafted message for the contact form — n changes on every call so repeats still fire */
  readonly draft = signal<{ subject: string; message: string; n: number } | null>(null);
  /** bumps when the visitor wants to start a draft */
  readonly draftStart = signal(0);
  /** project at the front of the carousel */
  readonly front = signal('');
  /** for the project slideshow — n changes on every call so repeats still fire */
  readonly slides = signal<{ cmd: 'next' | 'prev' | 'pause' | 'play'; n: number } | null>(null);
  readonly toast = signal('');
  private n = 0;
  private toastT?: ReturnType<typeof setTimeout>;
  private focusT?: ReturnType<typeof setTimeout>;

  react(mood: string, ms = 1800) {
    this.emote.set({ mood, ms, n: ++this.n });
  }

  /** Smooth-scroll to a section and highlight it. Resolves once the scroll has roughly settled. */
  go(id: SectionId): Promise<void> {
    const el = document.getElementById(id);
    if (!el) return Promise.resolve();
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    el.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
    this.focus.set(id);
    clearTimeout(this.focusT);
    this.focusT = setTimeout(() => this.focus() === id && this.focus.set(null), 9000);
    return new Promise(r => setTimeout(r, reduced ? 50 : 750));
  }

  /** Bring a project to the front of the carousel. */
  showProject(title: string) {
    this.project.set({ title, n: ++this.n });
  }

  openMatcher(text = '') {
    this.matcher.set({ text });
  }

  openLab(id: LabId, seed: Record<string, string> = {}) {
    this.lab.set({ id, seed });
  }

  openInterview(group = '') {
    this.interviewGroup.set(group);
    this.interview.set(true);
  }

  /** Go to the contact form and focus the "tell ALPHA" box. */
  startDraft() {
    void this.go('contact').then(() => this.draftStart.update(n => n + 1));
  }

  /** Put a draft in the contact form. It is never sent from here. */
  fillDraft(subject: string, message: string) {
    this.draft.set({ subject, message, n: ++this.n });
    void this.go('contact');
  }

  slide(cmd: 'next' | 'prev' | 'pause' | 'play') {
    this.slides.set({ cmd, n: ++this.n });
  }

  /** The robot plays a list of moods, one after the other. */
  perform(moods: readonly string[], ms: number) {
    clearTimeout(this.showT);
    const step = (i: number) => {
      if (i >= moods.length) return;
      this.react(moods[i], ms + 100);
      this.showT = setTimeout(() => step(i + 1), ms);
    };
    step(0);
  }
  private showT?: ReturnType<typeof setTimeout>;

  notify(msg: string) {
    this.toast.set(msg);
    clearTimeout(this.toastT);
    this.toastT = setTimeout(() => this.toast.set(''), 2400);
  }

  /** Resolves to whether the browser really allowed the copy. */
  async copy(text: string, what: string): Promise<boolean> {
    try { await navigator.clipboard.writeText(text); this.notify(`${what} copied to clipboard`); this.react('party', 2000); return true; }
    catch { this.notify(text); return false; }
  }
}
