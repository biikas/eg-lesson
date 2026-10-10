import { Component, Input, OnChanges, OnDestroy, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { ApiService } from '../core/api.service';
import { PromoView } from '../core/models';

/** Banners and ads from the admin portal for one placement. Counts impressions and clicks. */
@Component({
  selector: 'app-promo-slot',
  standalone: true,
  template: `
    @if (items().length) {
      @switch (layout) {
        @case ('hero') {
          <div class="hero-wrap">
            @for (p of items(); track p.id; let i = $index) {
              <div class="hero" [class.on]="i === idx()" [style.background]="p.bgColor || 'var(--eg-grad)'" (click)="open(p)">
                @if (p.imageUrl) { <img [src]="p.imageUrl" alt="" class="hero-img"> }
                <div class="hero-text">
                  @if (p.kind === 'AD') { <span class="ad">Sponsored</span> }
                  <h3>{{ p.title }}</h3>
                  @if (p.subtitle) { <p>{{ p.subtitle }}</p> }
                  @if (p.ctaText) { <span class="cta">{{ p.ctaText }} <i class="bi bi-arrow-right"></i></span> }
                </div>
              </div>
            }
            @if (items().length > 1) {
              <div class="dots">@for (p of items(); track p.id; let i = $index) { <button [class.on]="i === idx()" (click)="idx.set(i)" [attr.aria-label]="'Banner ' + (i + 1)"></button> }</div>
            }
          </div>
        }
        @default {
          <div class="stack" [class.side]="layout === 'side'">
            @for (p of items(); track p.id) {
              <div class="strip" [style.background]="p.bgColor || 'var(--eg-grad)'" (click)="open(p)">
                @if (p.imageUrl) { <img [src]="p.imageUrl" alt="" class="strip-img"> }
                <div class="strip-text">
                  @if (p.kind === 'AD') { <span class="ad">Sponsored</span> }
                  <strong>{{ p.title }}</strong>
                  @if (p.subtitle) { <span class="sub">{{ p.subtitle }}</span> }
                </div>
                @if (p.ctaText) { <span class="cta">{{ p.ctaText }}</span> }
              </div>
            }
          </div>
        }
      }
    }
  `,
  styles: [`
    :host { display: block; }
    .hero-wrap { position: relative; border-radius: 24px; overflow: hidden; min-height: 190px; box-shadow: var(--eg-shadow-lg); }
    .hero { position: absolute; inset: 0; color: #fff; display: flex; align-items: center; padding: 28px 32px; cursor: pointer; opacity: 0; transition: opacity .6s ease; }
    .hero.on { opacity: 1; position: relative; }
    .hero-img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
    .hero-img + .hero-text { background: linear-gradient(90deg, rgba(0,0,0,.55), transparent); position: relative; padding: 16px; border-radius: 16px; }
    .hero-text { position: relative; max-width: 620px; }
    .hero h3 { color: #fff; font-size: clamp(1.3rem, 3vw, 1.9rem); margin: 6px 0 6px; }
    .hero p { margin: 0 0 12px; opacity: .92; font-weight: 500; }
    .cta { display: inline-flex; gap: 6px; align-items: center; background: rgba(255,255,255,.95); color: #17142b; font-weight: 800; padding: 8px 16px; border-radius: 999px; font-size: .9rem; }
    .ad { font-size: .66rem; font-weight: 800; letter-spacing: .1em; text-transform: uppercase; background: rgba(255,255,255,.22); padding: 3px 8px; border-radius: 6px; }
    .dots { position: absolute; bottom: 14px; right: 18px; display: flex; gap: 6px; }
    .dots button { width: 8px; height: 8px; border-radius: 99px; border: 0; background: rgba(255,255,255,.5); padding: 0; transition: width .2s; }
    .dots button.on { width: 22px; background: #fff; }
    .stack { display: grid; gap: 12px; }
    .strip { position: relative; display: flex; align-items: center; gap: 16px; padding: 18px 22px; border-radius: 20px; color: #fff; cursor: pointer; overflow: hidden; transition: transform .15s; }
    .strip:hover { transform: translateY(-2px); }
    .strip-img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; opacity: .35; }
    .strip-text { position: relative; display: flex; flex-direction: column; gap: 3px; flex: 1; }
    .strip-text .ad { align-self: flex-start; }
    .sub { opacity: .88; font-size: .9rem; }
    .strip .cta { position: relative; flex: none; }
    .side .strip { flex-direction: column; align-items: flex-start; }
  `],
})
export class PromoSlotComponent implements OnChanges, OnDestroy {
  @Input({ required: true }) placement!: string;
  @Input() node?: string;
  @Input() layout: 'hero' | 'strip' | 'side' = 'strip';
  private api = inject(ApiService);
  private router = inject(Router);
  items = signal<PromoView[]>([]);
  idx = signal(0);
  private timer?: ReturnType<typeof setInterval>;

  ngOnChanges() {
    this.api.get<PromoView[]>('/public/promos', { placement: this.placement, node: this.node }).subscribe({
      next: list => {
        this.items.set(list);
        this.idx.set(0);
        if (list.length) this.api.post('/public/promos/impressions', { ids: list.map(p => p.id) }).subscribe({ error: () => {} });
        clearInterval(this.timer);
        if (this.layout === 'hero' && list.length > 1) this.timer = setInterval(() => this.idx.set((this.idx() + 1) % list.length), 6000);
      },
      error: () => {},
    });
  }

  ngOnDestroy() {
    clearInterval(this.timer);
  }

  open(p: PromoView) {
    this.api.post(`/public/promos/${p.id}/click`).subscribe({ error: () => {} });
    if (!p.linkUrl) return;
    if (p.linkUrl.startsWith('/')) this.router.navigateByUrl(p.linkUrl);
    else window.open(p.linkUrl, '_blank', 'noopener');
  }
}
