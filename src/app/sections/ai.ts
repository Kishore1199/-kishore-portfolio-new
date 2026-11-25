import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Explain } from '../core/explain';
import { RevealDirective } from '../core/reveal.directive';
import { AiCatalog } from './ai-catalog';

/** Everything AI on this site, in one place. The list itself loads when it comes near the screen. */
@Component({
  selector: 'app-ai',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AiCatalog, Explain, RevealDirective],
  template: `
    <section id="ai" class="section">
      <div class="container">
        <div class="section-head" appReveal>
          <p class="eyebrow">AI<app-explain section="ai" /></p>
          <h2 class="title">Every <span class="gradient-text">AI option</span> on this site</h2>
          <p class="lead">Say what you want to do and the right tools light up. They run without a backend, and most still work when the AI is resting.</p>
        </div>
        @defer (on viewport; prefetch on idle) { <app-ai-catalog /> } @placeholder { <div class="ph"></div> }
      </div>
    </section>
  `,
  styles: `.ph { min-height: 900px; }`,
})
export class AiSection {}
