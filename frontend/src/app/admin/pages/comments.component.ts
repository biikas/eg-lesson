import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { ApiService } from '../../core/api.service';
import { CommentRow, Page } from '../../core/models';
import { PagerComponent } from '../../shared/pager.component';
import { TimeAgoPipe } from '../../shared/pipes';
import { PageHeaderComponent } from '../shared/page-header.component';

@Component({
  selector: 'app-admin-comments',
  standalone: true,
  imports: [FormsModule, PageHeaderComponent, PagerComponent, TimeAgoPipe],
  template: `
    <app-page-header title="Comments & doubts" subtitle="Answer students' questions as the team, hide spam, approve pending comments." />
    <div class="tabs mb-3">@for (s of statuses; track s.v) { <button [class.on]="status === s.v" (click)="status = s.v; load(0)">{{ s.l }}</button> }</div>
    @for (c of page()?.items || []; track c.id) {
      <div class="eg-card c" [class.team]="c.team">
        <div class="d-flex justify-content-between gap-2 flex-wrap">
          <div><b>{{ c.authorName }}</b> @if (c.team) { <span class="badge text-bg-primary">Team</span> } <span class="text-muted small">on</span>
            <a [href]="'/read/' + c.postSlug" target="_blank" class="small fw-bold">{{ c.postTitle }}</a> <small class="text-muted">· {{ c.createdAt | timeAgo }}</small></div>
          <span class="st st-{{ c.status }}">{{ c.status }}</span>
        </div>
        <p class="body">{{ c.body }}</p>
        <div class="d-flex gap-2 flex-wrap">
          @if (c.status !== 'VISIBLE') { <button class="btn btn-soft btn-sm" (click)="set(c, 'VISIBLE')"><i class="bi bi-check2"></i> Approve</button> }
          @if (c.status !== 'HIDDEN') { <button class="btn btn-ghost btn-sm" (click)="set(c, 'HIDDEN')"><i class="bi bi-eye-slash"></i> Hide</button> }
          @if (!c.team) { <button class="btn btn-ghost btn-sm" (click)="replyTo.set(replyTo() === c.id ? null : c.id)"><i class="bi bi-reply"></i> Reply as team</button> }
          <button class="btn btn-ghost btn-sm text-danger" (click)="del(c)"><i class="bi bi-trash"></i></button>
        </div>
        @if (replyTo() === c.id) {
          <div class="d-flex gap-2 mt-2"><textarea class="form-control" rows="2" [(ngModel)]="reply" placeholder="Your answer (shown with a Team badge)"></textarea><button class="btn btn-primary" (click)="send(c)">Send</button></div>
        }
      </div>
    } @empty { <p class="text-muted text-center py-5">{{ page() ? 'Nothing here 🎉' : 'Loading…' }}</p> }
    @if (page(); as p) { <app-pager [page]="p.page" [totalPages]="p.totalPages" [total]="p.total" (pageChange)="load($event)" /> }
  `,
  styles: [`.tabs { display: flex; gap: 4px; button { border: 0; background: none; padding: 7px 14px; border-radius: 10px; font-weight: 700; color: var(--eg-text-2); } button.on { background: var(--eg-text); color: var(--eg-surface); } }
    .c { padding: 14px 16px; margin-bottom: 10px; } .c.team { border-left: 4px solid #6c3bff; } .body { margin: 8px 0; white-space: pre-wrap; }
    .st { font-size: .66rem; font-weight: 800; padding: 3px 8px; border-radius: 99px; background: var(--eg-surface-2); } .st-VISIBLE { background: rgba(18,163,122,.14); color: #0e8a66; } .st-PENDING { background: rgba(240,140,0,.15); color: #c06f00; } .st-HIDDEN { background: rgba(229,57,90,.12); color: #e5395a; }`],
})
export class AdminCommentsComponent implements OnInit {
  private api = inject(ApiService);
  private toast = inject(ToastrService);
  private route = inject(ActivatedRoute);
  page = signal<Page<CommentRow> | null>(null);
  replyTo = signal<number | null>(null);
  reply = '';
  statuses = [{ v: '', l: 'All' }, { v: 'PENDING', l: 'Pending' }, { v: 'VISIBLE', l: 'Visible' }, { v: 'HIDDEN', l: 'Hidden' }];
  status = '';
  ngOnInit() { this.status = this.route.snapshot.queryParamMap.get('status') || ''; this.load(0); }
  load(p: number) { this.page.set(null); this.api.get<Page<CommentRow>>('/admin/comments', { status: this.status, page: p }).subscribe(r => this.page.set(r)); }
  set(c: CommentRow, status: string) { this.api.patch(`/admin/comments/${c.id}`, { status }).subscribe(() => this.load(this.page()?.page || 0)); }
  del(c: CommentRow) { this.api.delete(`/admin/comments/${c.id}`).subscribe(() => this.load(this.page()?.page || 0)); }
  send(c: CommentRow) {
    if (!this.reply.trim()) return;
    this.api.post(`/admin/comments/${c.id}/reply`, { body: this.reply.trim() }).subscribe(() => { this.toast.success('Reply posted'); this.reply = ''; this.replyTo.set(null); this.load(this.page()?.page || 0); });
  }
}
