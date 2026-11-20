import { Injectable, signal } from '@angular/core';

export type SectionId = 'home' | 'about' | 'skills' | 'projects' | 'experience' | 'education' | 'prep' | 'contact';
export const SECTIONS: SectionId[] = ['home', 'about', 'skills', 'projects', 'experience', 'education', 'prep', 'contact'];

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

  notify(msg: string) {
    this.toast.set(msg);
    clearTimeout(this.toastT);
    this.toastT = setTimeout(() => this.toast.set(''), 2400);
  }

  async copy(text: string, what: string) {
    try { await navigator.clipboard.writeText(text); this.notify(`${what} copied to clipboard`); this.react('party', 2000); }
    catch { this.notify(text); }
  }
}
