import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ApiService } from '../../core/api.service';
import { NoticeView, Page } from '../../core/models';
import { EmptyStateComponent } from '../../shared/empty-state.component';
import { PagerComponent } from '../../shared/pager.component';
import { TimeAgoPipe } from '../../shared/pipes';
import { RichContentComponent } from '../../shared/rich-content.component';

const CATS: Record<string, { label: string; emoji: string; color: string }> = {
  EXAM: { label: 'Exams', emoji: '📝', color: '#6C3BFF' },
  RESULT: { label: 'Results', emoji: '🏅', color: '#00B8A9' },
  ADMISSION: { label: 'Admissions', emoji: '🎓', color: '#2F80ED' },
  SCHOLARSHIP: { label: 'Scholarships', emoji: '💸', color: '#FF8A00' },
  GENERAL: { label: 'General', emoji: '📣', color: '#FF3D7F' },
};

@Component({
  selector: 'app-notices',
  standalone: true,
  imports: [RouterLink, TimeAgoPipe, PagerComponent, EmptyStateComponent],
  template: `
    <div class="container-xl pt-4" style="max-width: 920px">
      <div class="kicker">Stay updated</div>
      <h1 class="mb-3">Notices</h1>
      <div class="chip-row mb-4">
        <button class="chip" [class.active]="!cat" (click)="setCat('')">All</button>
        @for (c of cats; track c[0]) { <button class="chip" [class.active]="cat === c[0]" (click)="setCat(c[0])">{{ c[1].emoji }} {{ c[1].label }}</button> }
      </div>
      @for (n of page()?.items || []; track n.id) {
        <a class="n eg-card eg-hover" [routerLink]="['/notices', n.slug]" [style.--c]="meta(n.category).color">
          <span class="date"><b>{{ day(n.publishAt) }}</b>{{ month(n.publishAt) }}</span>
          <div class="flex-grow-1 min-w-0">
            <div class="d-flex gap-2 align-items-center mb-1">
              <span class="tag" [style.background]="meta(n.category).color + '1f'" [style.color]="meta(n.category).color">{{ meta(n.category).emoji }} {{ meta(n.category).label }}</span>
              @if (n.important) { <span class="tag imp">Important</span> }
              @if (n.attachmentUrl) { <i class="bi bi-paperclip text-muted"></i> }
            </div>
            <h3>{{ n.title }}</h3>
            <small class="text-muted">{{ n.publishAt | timeAgo }} · {{ n.viewCount }} views</small>
          </div>
          <i class="bi bi-chevron-right text-muted"></i>
        </a>
      } @empty {
        @if (page()) { <app-empty emoji="📭" title="No notices here" text="Check back soon." /> }
        @else { @for (i of [1,2,3]; track i) { <div class="skeleton mb-3" style="height:96px"></div> } }
      }
      @if (page(); as p) { <app-pager [page]="p.page" [totalPages]="p.totalPages" (pageChange)="load($event)" /> }
    </div>
  `,
  styles: [`
    .kicker { font-size: .75rem; font-weight: 800; text-transform: uppercase; letter-spacing: .12em; color: var(--eg-pink); }
    .n { display: flex; gap: 16px; align-items: center; padding: 16px 18px; margin-bottom: 12px; color: var(--eg-text); }
    .date { width: 58px; height: 62px; border-radius: 16px; flex: none; display: flex; flex-direction: column; align-items: center; justify-content: center; font-size: .7rem; font-weight: 800; text-transform: uppercase; color: var(--c); background: color-mix(in srgb, var(--c) 12%, transparent); b { font-size: 1.4rem; line-height: 1; } }
    h3 { font-size: 1.05rem; margin: 0 0 2px; }
    .imp { background: rgba(255,61,127,.14); color: #e1245f; }
    .min-w-0 { min-width: 0; }
  `],
})
export class NoticesComponent implements OnInit {
  private api = inject(ApiService);
  page = signal<Page<NoticeView> | null>(null);
  cats = Object.entries(CATS);
  cat = '';

  ngOnInit() { this.load(0); }
  setCat(c: string) { this.cat = c; this.load(0); }
  load(p: number) {
    this.page.set(null);
    this.api.get<Page<NoticeView>>('/public/notices', { category: this.cat, page: p, size: 10 }).subscribe(r => this.page.set(r));
  }
  meta(c: string) { return CATS[c] || CATS['GENERAL']; }
  day(d: string) { return new Date(d).getDate(); }
  month(d: string) { return new Date(d).toLocaleString('en', { month: 'short' }); }
}

@Component({
  selector: 'app-notice-detail',
  standalone: true,
  imports: [RouterLink, TimeAgoPipe, RichContentComponent, EmptyStateComponent],
  template: `
    <div class="container-xl pt-4" style="max-width: 820px">
      <a routerLink="/notices" class="fw-bold small"><i class="bi bi-arrow-left"></i> All notices</a>
      @if (n(); as n) {
        <div class="d-flex gap-2 mt-3 mb-2">
          <span class="tag badge-soft">{{ n.category }}</span>
          @if (n.important) { <span class="tag" style="background:rgba(255,61,127,.14);color:#e1245f">Important</span> }
        </div>
        <h1>{{ n.title }}</h1>
        <p class="text-muted fw-semibold">{{ n.publishAt | timeAgo }} · {{ n.viewCount }} views</p>
        <div class="eg-card eg-card-pad mt-3"><app-rich-content [html]="n.body || ''" /></div>
        @if (n.attachmentUrl) {
          <a class="btn btn-grad btn-lg mt-3" [href]="n.attachmentUrl" target="_blank" rel="noopener"><i class="bi bi-download me-1"></i> {{ n.attachmentName || 'Download attachment' }}</a>
        }
      } @else if (missing()) {
        <app-empty emoji="📭" title="Notice not found" />
      } @else { <div class="skeleton mt-4" style="height:300px"></div> }
    </div>
  `,
})
export class NoticeDetailComponent implements OnInit {
  private api = inject(ApiService);
  private route = inject(ActivatedRoute);
  n = signal<NoticeView | null>(null);
  missing = signal(false);
  ngOnInit() {
    this.route.paramMap.subscribe(pm => this.api.get<NoticeView>(`/public/notices/${pm.get('slug')}`).subscribe({ next: n => this.n.set(n), error: () => this.missing.set(true) }));
  }
}
