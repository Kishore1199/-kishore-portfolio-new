import { AfterViewInit, ChangeDetectionStrategy, Component, ElementRef, OnDestroy, inject, output, viewChild } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { Icon } from '../core/icon';
import { PROFILE } from '../data/portfolio.data';

@Component({
  selector: 'app-resume-modal',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Icon],
  host: { '(document:keydown.escape)': 'close.emit()' },
  template: `
    <div class="backdrop" (click)="close.emit()"></div>
    <div class="dialog glass" role="dialog" aria-modal="true" aria-labelledby="resume-title" #dialog tabindex="-1">
      <header>
        <h2 id="resume-title">Resume — {{ profile.name }}</h2>
        <div class="actions">
          <a class="btn btn-primary" [href]="profile.resume" download="Kishore_V_Resume.pdf">
            <app-icon name="download" [size]="15" /> Download
          </a>
          <button class="icon-btn" type="button" (click)="close.emit()" aria-label="Close resume">
            <app-icon name="close" [size]="17" />
          </button>
        </div>
      </header>
      <iframe [src]="pdfUrl" title="Kishore V resume PDF"></iframe>
    </div>
  `,
  styles: `
    :host { position: fixed; inset: 0; z-index: 100; display: grid; place-items: center; padding: 16px; }
    .backdrop { position: absolute; inset: 0; background: rgba(5, 5, 10, 0.7); backdrop-filter: blur(8px); animation: fade 0.3s ease both; }
    .dialog {
      position: relative; width: 100%; max-width: 920px; height: min(90vh, 1100px); display: flex; flex-direction: column;
      border-radius: 22px; overflow: hidden; background: var(--surface-solid); outline: none;
      animation: pop-in 0.5s cubic-bezier(0.22, 1, 0.36, 1) both;
    }
    header { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 14px 16px 14px 22px; border-bottom: 1px solid var(--border); }
    h2 { font-size: 1.05rem; }
    .actions { display: flex; gap: 8px; align-items: center; }
    .actions .btn { padding: 9px 16px; font-size: 0.84rem; }
    iframe { flex: 1; width: 100%; border: 0; background: #fff; }
    @keyframes fade { from { opacity: 0; } }
    @keyframes pop-in { from { opacity: 0; transform: perspective(1200px) rotateX(14deg) translateY(40px) scale(0.94); } }
  `,
})
export class ResumeModal implements AfterViewInit, OnDestroy {
  readonly close = output<void>();
  protected readonly profile = PROFILE;
  /** Constant, same-origin asset path — safe to mark as a trusted resource URL. */
  protected readonly pdfUrl = inject(DomSanitizer).bypassSecurityTrustResourceUrl(PROFILE.resume);
  private dialog = viewChild.required<ElementRef<HTMLElement>>('dialog');
  private previousFocus: Element | null = null;

  ngAfterViewInit() {
    this.previousFocus = document.activeElement;
    document.body.style.overflow = 'hidden';
    this.dialog().nativeElement.focus();
  }

  ngOnDestroy() {
    document.body.style.overflow = '';
    (this.previousFocus as HTMLElement | null)?.focus?.();
  }
}
