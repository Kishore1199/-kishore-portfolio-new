import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { Icon } from './icon';
import { AssistantService } from './assistant.service';
import { NARRATION } from './assistant.brain';
import { SectionId } from './assistant.bus';

/** 🔊 "Explain" pill next to a section's eyebrow — ALPHA reads that section aloud (tap again to stop). */
@Component({
  selector: 'app-explain',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Icon],
  template: `
    <button type="button" class="explain" [class.on]="playing()" (click)="toggle()" [attr.aria-label]="playing() ? 'Stop ALPHA' : 'ALPHA, explain the ' + section() + ' section'">
      <app-icon [name]="playing() ? 'stop' : 'volume'" [size]="12" /> {{ playing() ? 'Stop' : 'Explain' }}
    </button>
  `,
  styles: `
    :host { display: inline-flex; vertical-align: middle; margin-left: 10px; }
    .explain { display: inline-flex; align-items: center; gap: 5px; padding: 4px 10px; border-radius: 999px; cursor: pointer; border: 1px solid var(--border-strong);
      background: var(--surface); color: var(--text-2); font: 600 0.68rem 'JetBrains Mono', monospace; letter-spacing: 0.06em; text-transform: uppercase; transition: all 0.2s; }
    .explain:hover { color: var(--accent); border-color: var(--accent); }
    .explain.on { color: #fff; background: var(--accent); border-color: var(--accent); }
  `,
})
export class Explain {
  readonly section = input.required<SectionId>();
  private a = inject(AssistantService);
  protected readonly playing = computed(() => this.a.voice.speaking() && this.a.voice.caption() === NARRATION[this.section()]);

  protected toggle() {
    if (this.playing()) this.a.voice.stop();
    else this.a.explain(this.section());
  }
}
