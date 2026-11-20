import { ChangeDetectionStrategy, Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { HeroScene } from './hero-scene';
import { Icon } from '../../core/icon';
import { ThemeService, prefersReducedMotion } from '../../core/theme.service';
import { PROFILE, STATS } from '../../data/portfolio.data';

@Component({
  selector: 'app-hero',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HeroScene, Icon],
  templateUrl: './hero.html',
  styleUrl: './hero.scss',
})
export class Hero implements OnInit, OnDestroy {
  protected readonly theme = inject(ThemeService);
  protected readonly profile = PROFILE;
  protected readonly stats = STATS;
  protected readonly typed = signal('');

  private roleIndex = 0;
  private charIndex = 0;
  private deleting = false;
  private timer: ReturnType<typeof setTimeout> | undefined;

  ngOnInit() {
    if (prefersReducedMotion()) {
      this.typed.set(PROFILE.roles[0]);
      return;
    }
    this.type();
  }

  ngOnDestroy() {
    clearTimeout(this.timer);
  }

  private type() {
    const word = PROFILE.roles[this.roleIndex];
    let delay = this.deleting ? 38 : 75;
    if (!this.deleting) {
      this.charIndex++;
      if (this.charIndex === word.length) {
        this.deleting = true;
        delay = 1700;
      }
    } else {
      this.charIndex--;
      if (this.charIndex === 0) {
        this.deleting = false;
        this.roleIndex = (this.roleIndex + 1) % PROFILE.roles.length;
        delay = 300;
      }
    }
    this.typed.set(word.slice(0, this.charIndex));
    this.timer = setTimeout(() => this.type(), delay);
  }
}
