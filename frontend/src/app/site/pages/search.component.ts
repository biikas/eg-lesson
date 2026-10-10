import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ApiService } from '../../core/api.service';
import { ContentType, SearchResult } from '../../core/models';
import { EmptyStateComponent } from '../../shared/empty-state.component';
import { IconComponent } from '../../shared/icon.component';
import { PagerComponent } from '../../shared/pager.component';
import { PostCardComponent } from '../../shared/post-card.component';

@Component({
  selector: 'app-search',
  standalone: true,
  imports: [FormsModule, RouterLink, IconComponent, PostCardComponent, PagerComponent, EmptyStateComponent],
  template: `
    <div class="container-xl pt-4">
      <form class="sbox" (submit)="$event.preventDefault(); submit()">
        <i class="bi bi-search"></i>
        <input [(ngModel)]="q" name="q" placeholder="Search notes, subjects, chapters…" autofocus>
        @if (q) { <button type="button" class="clear" (click)="q = ''" aria-label="Clear"><i class="bi bi-x-circle-fill"></i></button> }
        <button class="btn btn-grad">Search</button>
      </form>

      <div class="chip-row my-3">
        <button class="chip" [class.active]="!type" (click)="setType('')">All types</button>
        @for (t of types(); track t.id) { <button class="chip" [class.active]="type === t.code" (click)="setType(t.code)"><app-icon [name]="t.icon" /> {{ t.name }}</button> }
      </div>

      @if (res(); as r) {
        @if (r.categories.length) {
          <h6 class="label">Categories</h6>
          <div class="cats">
            @for (c of r.categories; track c.slug) {
              <a class="cat eg-card eg-hover" [routerLink]="['/explore', c.slug]" [style.--c]="c.color || '#6C3BFF'">
                <span class="ico"><app-icon [name]="c.icon" /></span>
                <span class="min-w-0"><strong>{{ c.title }}</strong><small>{{ c.subtitle }}</small></span>
              </a>
            }
          </div>
        }
        <div class="d-flex justify-content-between align-items-center mt-4 mb-3">
          <h6 class="label m-0">{{ r.posts.total }} {{ r.posts.total === 1 ? 'result' : 'results' }} for “{{ term }}”</h6>
          <select class="form-select form-select-sm w-auto" [(ngModel)]="sort" (change)="run(0)">
            <option value="relevance">Best match</option><option value="latest">Newest</option><option value="popular">Most read</option>
          </select>
        </div>
        @if (r.posts.items.length) {
          <div class="row g-3">@for (p of r.posts.items; track p.id) { <div class="col-sm-6 col-lg-4"><app-post-card [post]="p" /></div> }</div>
          <app-pager [page]="r.posts.page" [totalPages]="r.posts.totalPages" (pageChange)="run($event)" />
        } @else if (!r.categories.length) {
          <app-empty emoji="🕵️" title="No notes found — yet" text="Try fewer or different words, or ask our team to write it. We read every request.">
            <a routerLink="/me" [queryParams]="{ tab: 'requests', topic: term }" class="btn btn-grad">Request “{{ term }}”</a>
          </app-empty>
        }
      } @else if (loading()) {
        <div class="row g-3">@for (i of [1,2,3]; track i) { <div class="col-md-4"><div class="skeleton" style="height:240px"></div></div> }</div>
      } @else {
        <app-empty emoji="🔎" title="What do you want to learn?" text="Type a chapter, topic, subject or exam — e.g. “photosynthesis”, “BE Computer sem 4”, “SEE 2080 maths”." />
      }
    </div>
  `,
  styles: [`
    .sbox { display: flex; align-items: center; gap: 10px; padding: 8px 8px 8px 18px; border-radius: 20px; background: var(--eg-surface); border: 1px solid var(--eg-border); box-shadow: var(--eg-shadow);
      i { font-size: 1.2rem; color: var(--eg-violet); } input { flex: 1; border: 0; outline: 0; background: none; font-size: 1.1rem; font-weight: 600; color: var(--eg-text); min-width: 0; }
      .clear { border: 0; background: none; color: var(--eg-muted); } .btn { border-radius: 14px; } }
    .label { font-size: .75rem; font-weight: 800; text-transform: uppercase; letter-spacing: .1em; color: var(--eg-muted); margin: 18px 0 10px; }
    .cats { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 12px; }
    .cat { display: flex; gap: 12px; align-items: center; padding: 12px 14px; color: var(--eg-text); }
    .cat .ico { width: 42px; height: 42px; border-radius: 13px; display: grid; place-items: center; font-size: 22px; background: color-mix(in srgb, var(--c) 15%, transparent); flex: none; }
    .cat strong { display: block; } .cat small { color: var(--eg-muted); font-weight: 600; display: block; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .min-w-0 { min-width: 0; }
  `],
})
export class SearchComponent implements OnInit {
  private api = inject(ApiService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  res = signal<SearchResult | null>(null);
  types = signal<ContentType[]>([]);
  loading = signal(false);
  q = '';
  term = '';
  type = '';
  sort = 'relevance';

  ngOnInit() {
    this.api.get<ContentType[]>('/public/catalog/content-types').subscribe(t => this.types.set(t));
    this.route.queryParamMap.subscribe(qp => {
      this.q = this.term = qp.get('q') || '';
      this.type = qp.get('type') || '';
      if (this.term) this.run(0); else this.res.set(null);
    });
  }

  submit() {
    this.router.navigate([], { queryParams: { q: this.q.trim() || null, type: this.type || null } });
  }

  setType(t: string) {
    this.type = t;
    this.submit();
  }

  run(page: number) {
    this.loading.set(true);
    this.res.set(null);
    this.api.get<SearchResult>('/public/search', { q: this.term, type: this.type, sort: this.sort, page, size: 12 }).subscribe({
      next: r => { this.res.set(r); this.loading.set(false); window.scrollTo({ top: 0, behavior: 'smooth' }); },
      error: () => this.loading.set(false),
    });
  }
}
