import { Component, Input, OnChanges, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { ApiService } from '../../core/api.service';
import { CommentView } from '../../core/models';
import { ConfirmService } from '../../core/confirm.service';
import { StudentAuthService } from '../../core/student-auth.service';
import { TimeAgoPipe } from '../../shared/pipes';

/** "Ask a doubt" thread under a note. One level of replies; the team's answers are highlighted. */
@Component({
  selector: 'app-comments',
  standalone: true,
  imports: [FormsModule, TimeAgoPipe],
  template: `
    <section class="cm">
      <h3 class="fw-800 mb-1">💬 Doubts &amp; discussion <span class="n">{{ count() }}</span></h3>
      <p class="text-muted small mb-3">Stuck on a step? Ask here — our team and other students answer.</p>
      @if (allow) {
        <div class="composer eg-card">
          <span class="av" [style.background]="auth.me()?.avatarColor || '#c9c3e6'">{{ initials(auth.me()?.fullName) }}</span>
          <div class="flex-grow-1">
            <textarea class="form-control" rows="2" [(ngModel)]="body" maxlength="2000" (focus)="auth.require('Sign in to ask a doubt or join the discussion.')"
                      placeholder="Ask a doubt or share a tip…"></textarea>
            @if (body.trim()) {
              <div class="d-flex justify-content-end mt-2"><button class="btn btn-primary btn-sm" [disabled]="busy()" (click)="send()">Post</button></div>
            }
          </div>
        </div>
      } @else { <p class="text-muted">Comments are closed for this note.</p> }

      @for (c of items(); track c.id) {
        <div class="c">
          <span class="av" [class.team]="c.team" [style.background]="c.team ? null : (c.authorColor || '#8a85a3')">@if (c.team) { <i class="bi bi-patch-check-fill"></i> } @else { {{ initials(c.authorName) }} }</span>
          <div class="flex-grow-1 min-w-0">
            <div class="who">{{ c.authorName }} @if (c.team) { <span class="badge-team">Team</span> } <small>{{ c.createdAt | timeAgo }}</small></div>
            <p class="txt">{{ c.body }}</p>
            <div class="acts">
              @if (allow) { <button (click)="replyTo.set(replyTo() === c.id ? null : c.id)"><i class="bi bi-reply"></i> Reply</button> }
              @if (c.mine) { <button (click)="remove(c)"><i class="bi bi-trash"></i> Delete</button> }
            </div>
            @for (r of c.replies; track r.id) {
              <div class="c reply">
                <span class="av sm" [class.team]="r.team" [style.background]="r.team ? null : (r.authorColor || '#8a85a3')">@if (r.team) { <i class="bi bi-patch-check-fill"></i> } @else { {{ initials(r.authorName) }} }</span>
                <div class="flex-grow-1 min-w-0">
                  <div class="who">{{ r.authorName }} @if (r.team) { <span class="badge-team">Team</span> } <small>{{ r.createdAt | timeAgo }}</small></div>
                  <p class="txt">{{ r.body }}</p>
                  @if (r.mine) { <div class="acts"><button (click)="remove(r)"><i class="bi bi-trash"></i> Delete</button></div> }
                </div>
              </div>
            }
            @if (replyTo() === c.id) {
              <div class="d-flex gap-2 mt-2">
                <input class="form-control form-control-sm" [(ngModel)]="replyBody" placeholder="Write a reply…" (keydown.enter)="send(c.id)" maxlength="2000">
                <button class="btn btn-primary btn-sm" [disabled]="busy() || !replyBody.trim()" (click)="send(c.id)">Reply</button>
              </div>
            }
          </div>
        </div>
      } @empty {
        <p class="text-muted small mt-3">No questions yet. Be the first to ask!</p>
      }
    </section>
  `,
  styles: [`
    .cm { margin-top: 40px; }
    .n { font-size: .8rem; background: var(--eg-surface-2); border: 1px solid var(--eg-border); border-radius: 99px; padding: 2px 9px; vertical-align: middle; }
    .composer { display: flex; gap: 12px; padding: 14px; margin-bottom: 18px; }
    .av { width: 38px; height: 38px; border-radius: 13px; display: grid; place-items: center; color: #fff; font-weight: 800; font-size: .8rem; flex: none; }
    .av.sm { width: 30px; height: 30px; border-radius: 10px; font-size: .7rem; }
    .av.team { background: var(--eg-grad); }
    .c { display: flex; gap: 12px; padding: 14px 0; border-bottom: 1px solid var(--eg-border); }
    .c.reply { border-bottom: 0; padding: 10px 0 0; margin-top: 6px; padding-left: 12px; border-left: 2px solid var(--eg-border); }
    .who { font-weight: 800; font-size: .9rem; small { color: var(--eg-muted); font-weight: 600; margin-left: 6px; } }
    .badge-team { font-size: .65rem; background: var(--eg-grad); color: #fff; padding: 2px 7px; border-radius: 6px; margin-left: 4px; }
    .txt { margin: 4px 0 6px; white-space: pre-wrap; color: var(--eg-text); }
    .acts button { border: 0; background: none; color: var(--eg-muted); font-weight: 700; font-size: .8rem; padding: 0; margin-right: 14px; &:hover { color: var(--eg-violet); } }
    .min-w-0 { min-width: 0; }
  `],
})
export class CommentsComponent implements OnChanges {
  @Input({ required: true }) postId!: number;
  @Input() allow = true;
  private api = inject(ApiService);
  private toast = inject(ToastrService);
  private confirm = inject(ConfirmService);
  auth = inject(StudentAuthService);
  items = signal<CommentView[]>([]);
  replyTo = signal<number | null>(null);
  busy = signal(false);
  body = '';
  replyBody = '';

  count() {
    return this.items().reduce((n, c) => n + 1 + c.replies.length, 0);
  }

  ngOnChanges() {
    this.load();
  }

  load() {
    this.api.get<CommentView[]>(`/public/posts/${this.postId}/comments`).subscribe({ next: c => this.items.set(c), error: () => {} });
  }

  send(parentId?: number) {
    if (!this.auth.require('Sign in to ask a doubt or join the discussion.')) return;
    const body = (parentId ? this.replyBody : this.body).trim();
    if (!body) return;
    this.busy.set(true);
    this.api.postFull<CommentView>(`/public/posts/${this.postId}/comments`, { body, parentId }).subscribe({
      next: r => {
        this.busy.set(false);
        this.toast.success(r.message || 'Posted');
        this.body = '';
        this.replyBody = '';
        this.replyTo.set(null);
        this.load();
      },
      error: () => this.busy.set(false),
    });
  }

  async remove(c: CommentView) {
    if (!(await this.confirm.ask('Delete comment?', 'This cannot be undone.', { danger: true, confirmText: 'Delete' }))) return;
    this.api.delete(`/student/comments/${c.id}`).subscribe(() => this.load());
  }

  initials(name?: string) {
    return (name || '?').split(/\s+/).map(w => w[0]).slice(0, 2).join('').toUpperCase();
  }
}
