import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ApiService } from '../../core/api.service';
import { NodePage, Page, PostCard, QuizCard } from '../../core/models';
import { StudentAuthService } from '../../core/student-auth.service';
import { EmptyStateComponent } from '../../shared/empty-state.component';
import { IconComponent } from '../../shared/icon.component';
import { PagerComponent } from '../../shared/pager.component';
import { PostCardComponent } from '../../shared/post-card.component';
import { PromoSlotComponent } from '../../shared/promo-slot.component';

/** A stream / class / semester / subject page: sub-categories as tiles, then the material, filterable by type. */
@Component({
  selector: 'app-node-page',
  standalone: true,
  imports: [RouterLink, IconComponent, PostCardComponent, PagerComponent, EmptyStateComponent, PromoSlotComponent],
  templateUrl: './node-page.component.html',
  styleUrl: './node-page.component.scss',
})
export class NodePageComponent implements OnInit {
  private api = inject(ApiService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  auth = inject(StudentAuthService);

  data = signal<NodePage | null>(null);
  posts = signal<Page<PostCard> | null>(null);
  quizzes = signal<QuizCard[]>([]);
  notFound = signal(false);
  slug = '';
  type = '';
  sort = 'latest';
  lang = '';
  page = 0;

  ngOnInit() {
    this.route.paramMap.subscribe(pm => {
      this.slug = pm.get('slug')!;
      const qp = this.route.snapshot.queryParamMap;
      this.type = qp.get('type') || '';
      this.sort = qp.get('sort') || 'latest';
      this.lang = qp.get('lang') || '';
      this.page = 0;
      this.data.set(null);
      this.notFound.set(false);
      this.api.get<NodePage>(`/public/catalog/nodes/${this.slug}`).subscribe({
        next: d => { this.data.set(d); window.scrollTo({ top: 0 }); },
        error: () => this.notFound.set(true),
      });
      this.api.get<Page<QuizCard>>('/public/quizzes', { node: this.slug, size: 4 }).subscribe({ next: p => this.quizzes.set(p.items), error: () => {} });
      this.loadPosts();
    });
  }

  loadPosts() {
    this.posts.set(null);
    this.api.get<Page<PostCard>>('/public/posts', { node: this.slug, type: this.type, sort: this.sort, lang: this.lang, page: this.page, size: 12 })
      .subscribe({ next: p => this.posts.set(p), error: () => this.posts.set({ items: [], page: 0, size: 12, total: 0, totalPages: 0 }) });
  }

  setType(t: string) { this.type = t; this.page = 0; this.sync(); }
  setSort(s: string) { this.sort = s; this.page = 0; this.sync(); }
  setLang(l: string) { this.lang = l; this.page = 0; this.sync(); }
  go(p: number) { this.page = p; this.loadPosts(); document.getElementById('materials')?.scrollIntoView({ behavior: 'smooth' }); }

  private sync() {
    this.router.navigate([], { queryParams: { type: this.type || null, sort: this.sort === 'latest' ? null : this.sort, lang: this.lang || null }, replaceUrl: true });
    this.loadPosts();
  }

  isMyCourse(): boolean {
    return this.auth.me()?.courseSlug === this.slug;
  }
}
