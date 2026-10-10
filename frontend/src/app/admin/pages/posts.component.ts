import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { AdminAuthService } from '../../core/admin-auth.service';
import { ApiService } from '../../core/api.service';
import { ConfirmService } from '../../core/confirm.service';
import { Page, PostCard } from '../../core/models';
import { CompactNumberPipe, TimeAgoPipe } from '../../shared/pipes';
import { AdminTreeService } from '../shared/admin-tree.service';
import { NodeSelectComponent } from '../shared/node-select.component';
import { PageHeaderComponent } from '../shared/page-header.component';
import { PagerComponent } from '../../shared/pager.component';

@Component({
  selector: 'app-posts',
  standalone: true,
  imports: [FormsModule, RouterLink, PageHeaderComponent, NodeSelectComponent, PagerComponent, TimeAgoPipe, CompactNumberPipe],
  template: `
    <app-page-header title="Posts" subtitle="Notes, solutions, old questions and every other material students read.">
      <a routerLink="/admin/posts/new" class="btn btn-grad"><i class="bi bi-plus-lg"></i> New post</a>
    </app-page-header>

    <div class="status-tabs">
      @for (s of statuses; track s.v) { <button [class.on]="status === s.v" (click)="status = s.v; load(0)">{{ s.l }}</button> }
    </div>

    <div class="filters eg-card">
      <div class="f-search"><i class="bi bi-search"></i><input class="form-control" [(ngModel)]="q" (keyup.enter)="load(0)" placeholder="Search title or content…"></div>
      <app-node-select class="f-node" [value]="nodeId" (valueChange)="nodeId = $event; load(0)" placeholder="All categories" [allowNone]="true" />
      <select class="form-select f-type" [(ngModel)]="contentTypeId" (change)="load(0)">
        <option [ngValue]="null">All types</option>
        @for (t of tree.contentTypes(); track t.id) { <option [ngValue]="t.id">{{ t.name }}</option> }
      </select>
      <label class="form-check form-switch m-0 d-flex align-items-center gap-2"><input class="form-check-input" type="checkbox" [(ngModel)]="mine" (change)="load(0)"><span class="small fw-bold">Only mine</span></label>
    </div>

    <div class="eg-card overflow-hidden">
      <div class="table-responsive">
        <table class="table table-hover m-0">
          <thead><tr><th>Title</th><th class="d-none d-md-table-cell">Category</th><th>Status</th><th class="d-none d-lg-table-cell">Reads</th><th class="d-none d-lg-table-cell">Updated</th><th class="text-end">Actions</th></tr></thead>
          <tbody>
            @for (p of page()?.items || []; track p.id) {
              <tr>
                <td style="max-width:380px">
                  <a [routerLink]="['/admin/posts', p.id]" class="fw-bold d-block text-truncate text-reset">{{ p.title }}</a>
                  <small class="text-muted"><span [style.color]="p.contentType.color">●</span> {{ p.contentType.name }}{{ p.authorName ? ' · ' + p.authorName : '' }}{{ p.featured ? ' · ⭐ featured' : '' }}</small>
                </td>
                <td class="d-none d-md-table-cell small text-2">{{ p.node?.pathLabel }}</td>
                <td><span class="st st-{{ p.status }}">{{ p.status }}</span>@if (p.status === 'SCHEDULED') { <small class="d-block text-muted">{{ p.publishedAt | timeAgo }}</small> }</td>
                <td class="d-none d-lg-table-cell">{{ p.viewCount | compact }} <small class="text-muted">· ❤ {{ p.likeCount }} · 💬 {{ p.commentCount }}</small></td>
                <td class="d-none d-lg-table-cell small text-muted">{{ p.updatedAt | timeAgo }}</td>
                <td class="text-end text-nowrap">
                  <a [href]="'/read/' + p.slug" target="_blank" class="btn btn-ghost btn-sm" title="Preview"><i class="bi bi-eye"></i></a>
                  <a [routerLink]="['/admin/posts', p.id]" class="btn btn-ghost btn-sm" title="Edit"><i class="bi bi-pencil"></i></a>
                  @if (auth.can('CONTENT_PUBLISH')) {
                    @if (p.status === 'REVIEW' || p.status === 'DRAFT') { <button class="btn btn-soft btn-sm" (click)="setStatus(p, 'PUBLISHED')" title="Publish now"><i class="bi bi-send-check"></i></button> }
                    @if (p.status === 'PUBLISHED') { <button class="btn btn-ghost btn-sm" (click)="setStatus(p, 'ARCHIVED')" title="Unpublish"><i class="bi bi-archive"></i></button> }
                    <button class="btn btn-ghost btn-sm text-danger" (click)="remove(p)" title="Delete"><i class="bi bi-trash"></i></button>
                  }
                </td>
              </tr>
            } @empty {
              <tr><td colspan="6" class="text-center text-muted py-5">{{ page() ? 'No posts match.' : 'Loading…' }}</td></tr>
            }
          </tbody>
        </table>
      </div>
    </div>
    @if (page(); as pg) { <app-pager [page]="pg.page" [totalPages]="pg.totalPages" [total]="pg.total" (pageChange)="load($event)" /> }
  `,
  styles: [`
    .status-tabs { display: flex; gap: 4px; margin-bottom: 12px; overflow-x: auto; button { border: 0; background: none; padding: 8px 14px; border-radius: 10px; font-weight: 700; color: var(--eg-text-2); white-space: nowrap; } button.on { background: var(--eg-text); color: var(--eg-surface); } }
    .filters { display: flex; gap: 10px; flex-wrap: wrap; align-items: center; padding: 12px; margin-bottom: 14px; }
    .f-search { position: relative; flex: 1 1 240px; i { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: var(--eg-muted); } input { padding-left: 34px; } }
    .f-node { flex: 1 1 260px; } .f-type { flex: 0 1 180px; }
    .st { font-size: .68rem; font-weight: 800; padding: 3px 9px; border-radius: 99px; background: var(--eg-surface-2); }
    .st-PUBLISHED { background: rgba(18,163,122,.14); color: #0e8a66; } .st-REVIEW, .st-SCHEDULED { background: rgba(240,140,0,.15); color: #c06f00; } .st-ARCHIVED { background: rgba(229,57,90,.12); color: #e5395a; }
  `],
})
export class PostsComponent implements OnInit {
  private api = inject(ApiService);
  private toast = inject(ToastrService);
  private confirm = inject(ConfirmService);
  private route = inject(ActivatedRoute);
  auth = inject(AdminAuthService);
  tree = inject(AdminTreeService);
  page = signal<Page<PostCard> | null>(null);
  statuses = [{ v: '', l: 'All' }, { v: 'PUBLISHED', l: 'Published' }, { v: 'SCHEDULED', l: 'Scheduled' }, { v: 'REVIEW', l: 'In review' }, { v: 'DRAFT', l: 'Drafts' }, { v: 'ARCHIVED', l: 'Archived' }];
  status = '';
  q = '';
  nodeId: number | null = null;
  contentTypeId: number | null = null;
  mine = false;

  ngOnInit() {
    this.tree.ensure();
    this.status = this.route.snapshot.queryParamMap.get('status') || '';
    this.load(0);
  }

  load(p: number) {
    this.page.set(null);
    this.api.get<Page<PostCard>>('/admin/posts', { q: this.q, status: this.status, nodeId: this.nodeId, contentTypeId: this.contentTypeId, authorId: this.mine ? this.auth.me()?.id : null, page: p, size: 20 })
      .subscribe(r => this.page.set(r));
  }

  setStatus(p: PostCard, status: string) {
    this.api.patch(`/admin/posts/${p.id}/status`, { status }).subscribe(() => { this.toast.success(status === 'PUBLISHED' ? 'Published 🎉' : 'Unpublished'); this.load(this.page()?.page || 0); });
  }

  async remove(p: PostCard) {
    if (!(await this.confirm.ask('Delete this post?', `“${p.title}” and its comments will be permanently deleted.`, { danger: true, confirmText: 'Delete' }))) return;
    this.api.delete(`/admin/posts/${p.id}`).subscribe(() => { this.toast.success('Deleted'); this.load(this.page()?.page || 0); });
  }
}
