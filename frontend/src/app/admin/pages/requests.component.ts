import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { ApiService } from '../../core/api.service';
import { Page, PostCard, RequestView } from '../../core/models';
import { PagerComponent } from '../../shared/pager.component';
import { TimeAgoPipe } from '../../shared/pipes';
import { PageHeaderComponent } from '../shared/page-header.component';

@Component({
  selector: 'app-requests',
  standalone: true,
  imports: [FormsModule, RouterLink, PageHeaderComponent, PagerComponent, TimeAgoPipe],
  template: `
    <app-page-header title="Note requests" subtitle="What students asked for. Write it, link the post, mark it done — the student sees it in their dashboard." />
    <div class="tabs mb-3">@for (s of statuses; track s.v) { <button [class.on]="status === s.v" (click)="status = s.v; load(0)">{{ s.l }}</button> }</div>
    @for (r of page()?.items || []; track r.id) {
      <div class="eg-card r">
        <div class="d-flex justify-content-between gap-2 flex-wrap">
          <div><b class="fs-6">{{ r.topic }}</b><div class="small text-muted">{{ r.nodePath || 'No subject chosen' }} · by {{ r.studentName }} · {{ r.createdAt | timeAgo }}</div></div>
          <span class="st st-{{ r.status }}">{{ r.status.replace('_', ' ') }}</span>
        </div>
        @if (r.details) { <p class="mt-2 mb-2 text-2">{{ r.details }}</p> }
        @if (editing() === r.id) {
          <div class="row g-2 mt-1">
            <div class="col-md-3"><select class="form-select form-select-sm" [(ngModel)]="form.status">@for (s of statuses.slice(1); track s.v) { <option [value]="s.v">{{ s.l }}</option> }</select></div>
            <div class="col-md-4"><input class="form-control form-control-sm" [(ngModel)]="postQuery" (keyup.enter)="findPosts()" placeholder="Find post to link (Enter)"></div>
            <div class="col-md-5"><select class="form-select form-select-sm" [(ngModel)]="form.postId"><option [ngValue]="null">— no linked post —</option>@for (p of postOptions; track p.id) { <option [ngValue]="p.id">{{ p.title }}</option> }</select></div>
            <div class="col-12"><input class="form-control form-control-sm" [(ngModel)]="form.adminNote" placeholder="Note to the student (optional)"></div>
            <div class="col-12 d-flex gap-2"><button class="btn btn-primary btn-sm" (click)="save(r)">Save</button><button class="btn btn-ghost btn-sm" (click)="editing.set(null)">Cancel</button>
              <a class="btn btn-soft btn-sm ms-auto" routerLink="/admin/posts/new" [queryParams]="{ node: r.nodeId }"><i class="bi bi-pencil"></i> Write it now</a></div>
          </div>
        } @else {
          @if (r.adminNote) { <div class="small"><i class="bi bi-chat-quote"></i> {{ r.adminNote }}</div> }
          @if (r.postSlug) { <a class="small fw-bold" [href]="'/read/' + r.postSlug" target="_blank">→ {{ r.postTitle }}</a> }
          <div class="mt-2"><button class="btn btn-ghost btn-sm" (click)="edit(r)"><i class="bi bi-pencil-square"></i> Update</button></div>
        }
      </div>
    } @empty { <p class="text-muted text-center py-5">{{ page() ? 'No requests 🎉' : 'Loading…' }}</p> }
    @if (page(); as p) { <app-pager [page]="p.page" [totalPages]="p.totalPages" [total]="p.total" (pageChange)="load($event)" /> }
  `,
  styles: [`.tabs { display: flex; gap: 4px; flex-wrap: wrap; button { border: 0; background: none; padding: 7px 14px; border-radius: 10px; font-weight: 700; color: var(--eg-text-2); } button.on { background: var(--eg-text); color: var(--eg-surface); } }
    .r { padding: 14px 16px; margin-bottom: 10px; }
    .st { font-size: .66rem; font-weight: 800; padding: 3px 8px; border-radius: 99px; background: var(--eg-surface-2); height: fit-content; } .st-DONE { background: rgba(18,163,122,.14); color: #0e8a66; } .st-IN_PROGRESS { background: rgba(108,59,255,.12); color: #6c3bff; } .st-REJECTED { background: rgba(229,57,90,.12); color: #e5395a; }`],
})
export class RequestsComponent implements OnInit {
  private api = inject(ApiService);
  private toast = inject(ToastrService);
  page = signal<Page<RequestView> | null>(null);
  editing = signal<number | null>(null);
  statuses = [{ v: '', l: 'All' }, { v: 'OPEN', l: 'Open' }, { v: 'IN_PROGRESS', l: 'In progress' }, { v: 'DONE', l: 'Done' }, { v: 'REJECTED', l: 'Rejected' }];
  status = 'OPEN';
  form = { status: 'OPEN', adminNote: '', postId: null as number | null };
  postQuery = '';
  postOptions: { id: number; title: string }[] = [];

  ngOnInit() { this.load(0); }
  load(p: number) { this.page.set(null); this.api.get<Page<RequestView>>('/admin/requests', { status: this.status, page: p }).subscribe(r => this.page.set(r)); }
  edit(r: RequestView) {
    this.editing.set(r.id);
    this.form = { status: r.status === 'OPEN' ? 'IN_PROGRESS' : r.status, adminNote: r.adminNote || '', postId: null };
    this.postQuery = r.topic;
    this.findPosts();
  }
  findPosts() {
    this.api.get<Page<PostCard>>('/admin/posts', { q: this.postQuery, size: 15 }).subscribe(p => (this.postOptions = p.items.map(x => ({ id: x.id, title: x.title }))));
  }
  save(r: RequestView) {
    if (this.form.postId && this.form.status !== 'DONE') this.form.status = 'DONE';
    this.api.put(`/admin/requests/${r.id}`, this.form).subscribe(() => { this.toast.success('Updated'); this.editing.set(null); this.load(this.page()?.page || 0); });
  }
}
