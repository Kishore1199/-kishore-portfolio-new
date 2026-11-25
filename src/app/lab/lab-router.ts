import { Injectable, effect, inject, untracked } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { AssistantBus } from '../core/assistant.bus';
import { labId } from './lab-ids';

/** Gives every tool an address: /lab/compare, /lab/match, /lab/interview. Back closes it. */
@Injectable({ providedIn: 'root' })
export class LabRouter {
  private router = inject(Router);
  private bus = inject(AssistantBus);

  constructor() {
    this.router.events.subscribe(e => { if (e instanceof NavigationEnd) this.open(e.urlAfterRedirects); });
    effect(() => {
      const at = this.bus.lab()?.id ?? (this.bus.matcher() ? 'match' : this.bus.interview() ? 'interview' : '');
      untracked(() => {
        const now = this.current();
        if (at && at !== now) void this.router.navigateByUrl(`/lab/${at}`);
        else if (!at && now && this.ready) void this.router.navigateByUrl('/', { replaceUrl: true });
      });
    });
  }

  /** the first address has been read, so an empty state means "closed" */
  private ready = false;
  private current = () => this.router.url.match(/^\/lab\/([\w-]+)/)?.[1] ?? '';

  private open(url: string) {
    this.ready = true;
    const at = url.match(/^\/lab\/([\w-]+)/)?.[1];
    const id = labId(at);
    if (id ? this.bus.lab()?.id === id : at === 'match' ? this.bus.matcher() : at === 'interview' ? this.bus.interview() : false) return;
    this.bus.lab.set(id ? { id, seed: {} } : null);
    this.bus.matcher.set(at === 'match' ? { text: '' } : null);
    this.bus.interview.set(at === 'interview');
    if (at && !id && at !== 'match' && at !== 'interview') void this.router.navigateByUrl('/', { replaceUrl: true });
  }
}
