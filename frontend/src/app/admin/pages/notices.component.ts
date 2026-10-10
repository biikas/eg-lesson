import { Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { QuillEditorComponent } from 'ngx-quill';
import { ToastrService } from 'ngx-toastr';
import { ApiService } from '../../core/api.service';
import { ConfirmService } from '../../core/confirm.service';
import { NoticeView, Page } from '../../core/models';
import { PagerComponent } from '../../shared/pager.component';
import { MediaPickerComponent } from '../shared/media-picker.component';
import { NodeSelectComponent } from '../shared/node-select.component';
import { PageHeaderComponent } from '../shared/page-header.component';
import { setupQuill } from '../shared/quill-setup';

interface NoticeForm { id?: number; title: string; body: string; category: string; important: boolean; attachmentUrl: string; attachmentName: string; nodeId: number | null; publishAt: string; expireAt: string; active: boolean; }

@Component({
  selector: 'app-admin-notices',
  standalone: true,
  imports: [FormsModule, DatePipe, QuillEditorComponent, PageHeaderComponent, PagerComponent, MediaPickerComponent, NodeSelectComponent],
  template: `
    <app-page-header title="Notices" subtitle="Exam routines, results, admissions, scholarships. Important ones scroll in the site-wide ticker.">
      <button class="btn btn-grad" (click)="open()"><i class="bi bi-plus-lg"></i> New notice</button>
    </app-page-header>
    <input class="form-control mb-3" style="max-width:300px" [(ngModel)]="q" (keyup.enter)="load(0)" placeholder="Search notices">
    <div class="eg-card overflow-hidden"><div class="table-responsive"><table class="table table-hover m-0">
      <thead><tr><th>Title</th><th>Category</th><th class="d-none d-md-table-cell">Publish</th><th class="d-none d-md-table-cell">Views</th><th>Live</th><th></th></tr></thead>
      <tbody>
        @for (n of page()?.items || []; track n.id) {
          <tr>
            <td><b>{{ n.title }}</b> @if (n.important) { <span class="badge text-bg-danger">ticker</span> }</td>
            <td><span class="badge text-bg-light">{{ n.category }}</span></td>
            <td class="d-none d-md-table-cell small text-muted">{{ n.publishAt | date: 'd MMM y' }}@if (n.expireAt) { → {{ n.expireAt | date: 'd MMM' }} }</td>
            <td class="d-none d-md-table-cell">{{ n.viewCount }}</td>
            <td><i class="bi" [class.bi-circle-fill]="live(n)" [class.text-success]="live(n)" [class.bi-circle]="!live(n)" [class.text-muted]="!live(n)"></i></td>
            <td class="text-end text-nowrap">
              <a [href]="'/notices/' + n.slug" target="_blank" class="btn btn-ghost btn-sm"><i class="bi bi-eye"></i></a>
              <button class="btn btn-ghost btn-sm" (click)="edit(n)"><i class="bi bi-pencil"></i></button>
              <button class="btn btn-ghost btn-sm text-danger" (click)="remove(n)"><i class="bi bi-trash"></i></button>
            </td>
          </tr>
        } @empty { <tr><td colspan="6" class="text-center text-muted py-5">No notices yet.</td></tr> }
      </tbody>
    </table></div></div>
    @if (page(); as p) { <app-pager [page]="p.page" [totalPages]="p.totalPages" (pageChange)="load($event)" /> }

    @if (form(); as f) {
      <div class="eg-backdrop" (click)="form.set(null)">
        <div class="eg-modal p-4" style="width:min(860px,100%)" (click)="$event.stopPropagation()">
          <h5 class="fw-800 mb-3">{{ f.id ? 'Edit notice' : 'New notice' }}</h5>
          <input class="form-control form-control-lg mb-3 fw-bold" [(ngModel)]="f.title" placeholder="Notice title" maxlength="255">
          <div class="row g-2 mb-3">
            <div class="col-md-4"><label class="form-label">Category</label><select class="form-select" [(ngModel)]="f.category">@for (c of cats; track c) { <option [value]="c">{{ c }}</option> }</select></div>
            <div class="col-md-4"><label class="form-label">Publish at</label><input class="form-control" type="datetime-local" [(ngModel)]="f.publishAt"></div>
            <div class="col-md-4"><label class="form-label">Expires at <span class="text-muted fw-normal">(optional)</span></label><input class="form-control" type="datetime-local" [(ngModel)]="f.expireAt"></div>
          </div>
          <quill-editor class="d-block mb-3" [(ngModel)]="f.body" format="html" theme="snow" [modules]="mods" [styles]="{ 'min-height': '200px' }" placeholder="Write the notice…" />
          <div class="row g-2 align-items-end">
            <div class="col-md-6"><label class="form-label">Attachment (PDF/image)</label>
              <div class="d-flex gap-2 align-items-center"><app-media-picker accept="application/pdf,image/*" label="Upload" (picked)="f.attachmentUrl = $event.url; f.attachmentName = f.attachmentName || $event.originalName" />
              @if (f.attachmentUrl) { <a [href]="f.attachmentUrl" target="_blank" class="small text-truncate">{{ f.attachmentName }}</a><button class="btn btn-sm btn-ghost" (click)="f.attachmentUrl = ''; f.attachmentName = ''">×</button> }</div></div>
            <div class="col-md-6"><label class="form-label">Download button label</label><input class="form-control" [(ngModel)]="f.attachmentName" placeholder="e.g. Download routine (PDF)"></div>
            <div class="col-md-6"><label class="form-label">Relevant to <span class="text-muted fw-normal">(optional)</span></label><app-node-select [value]="f.nodeId" (valueChange)="f.nodeId = $event" [allowNone]="true" placeholder="Everyone" /></div>
            <div class="col-md-6 d-flex gap-3">
              <label class="form-check form-switch"><input class="form-check-input" type="checkbox" [(ngModel)]="f.important"> <span class="small fw-bold">Important (ticker)</span></label>
              <label class="form-check form-switch"><input class="form-check-input" type="checkbox" [(ngModel)]="f.active"> <span class="small fw-bold">Active</span></label>
            </div>
          </div>
          <div class="d-flex justify-content-end gap-2 mt-4"><button class="btn btn-ghost" (click)="form.set(null)">Cancel</button><button class="btn btn-primary" (click)="save()">Save notice</button></div>
        </div>
      </div>
    }
  `,
})
export class AdminNoticesComponent implements OnInit {
  private api = inject(ApiService);
  private toast = inject(ToastrService);
  private confirm = inject(ConfirmService);
  page = signal<Page<NoticeView> | null>(null);
  form = signal<NoticeForm | null>(null);
  q = '';
  cats = ['EXAM', 'RESULT', 'ADMISSION', 'SCHOLARSHIP', 'GENERAL'];
  mods = { toolbar: [['bold', 'italic', 'underline'], [{ list: 'ordered' }, { list: 'bullet' }], ['link', 'blockquote'], ['clean']] };

  constructor() { setupQuill(); }
  ngOnInit() { this.load(0); }
  load(p: number) { this.api.get<Page<NoticeView>>('/admin/notices', { q: this.q, page: p }).subscribe(r => this.page.set(r)); }
  live(n: NoticeView) { const now = Date.now(); return n.active && new Date(n.publishAt).getTime() <= now && (!n.expireAt || new Date(n.expireAt).getTime() > now); }
  private local(iso?: string) { if (!iso) return ''; const d = new Date(iso); return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16); }
  open() { this.form.set({ title: '', body: '', category: 'GENERAL', important: false, attachmentUrl: '', attachmentName: '', nodeId: null, publishAt: this.local(new Date().toISOString()), expireAt: '', active: true }); }
  edit(n: NoticeView) {
    this.api.get<NoticeView>(`/admin/notices/${n.id}`).subscribe(x => this.form.set({ id: x.id, title: x.title, body: x.body || '', category: x.category, important: x.important,
      attachmentUrl: x.attachmentUrl || '', attachmentName: x.attachmentName || '', nodeId: x.nodeId ?? null, publishAt: this.local(x.publishAt), expireAt: this.local(x.expireAt), active: x.active }));
  }
  save() {
    const f = this.form()!;
    if (!f.title.trim()) { this.toast.warning('Title is required'); return; }
    const body = { ...f, publishAt: f.publishAt ? new Date(f.publishAt).toISOString() : null, expireAt: f.expireAt ? new Date(f.expireAt).toISOString() : null };
    (f.id ? this.api.put(`/admin/notices/${f.id}`, body) : this.api.post('/admin/notices', body)).subscribe(() => { this.toast.success('Notice saved'); this.form.set(null); this.load(0); });
  }
  async remove(n: NoticeView) {
    if (await this.confirm.ask('Delete notice?', `“${n.title}” will be removed.`, { danger: true, confirmText: 'Delete' })) this.api.delete(`/admin/notices/${n.id}`).subscribe(() => this.load(0));
  }
}
