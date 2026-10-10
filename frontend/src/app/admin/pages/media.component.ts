import { Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { AdminAuthService } from '../../core/admin-auth.service';
import { ApiService } from '../../core/api.service';
import { ConfirmService } from '../../core/confirm.service';
import { Media, Page } from '../../core/models';
import { FileSizePipe } from '../../shared/pipes';
import { PagerComponent } from '../../shared/pager.component';
import { MediaPickerComponent } from '../shared/media-picker.component';
import { PageHeaderComponent } from '../shared/page-header.component';

@Component({
  selector: 'app-media',
  standalone: true,
  imports: [FormsModule, DatePipe, PageHeaderComponent, MediaPickerComponent, PagerComponent, FileSizePipe],
  template: `
    <app-page-header title="Media library" subtitle="Images and PDFs used in posts, notices and banners.">
      <app-media-picker accept="image/*,application/pdf" label="Upload file" (picked)="load(0)" />
    </app-page-header>
    <div class="d-flex gap-2 mb-3">
      <input class="form-control" style="max-width:300px" [(ngModel)]="q" (keyup.enter)="load(0)" placeholder="Search by file name">
      <select class="form-select" style="max-width:160px" [(ngModel)]="type" (change)="load(0)"><option value="">All</option><option value="image/">Images</option><option value="application/pdf">PDFs</option></select>
    </div>
    <div class="grid">
      @for (m of page()?.items || []; track m.id) {
        <div class="tile eg-card">
          <a [href]="m.url" target="_blank" class="pv">@if (m.contentType.startsWith('image/')) { <img [src]="m.url" alt="" loading="lazy"> } @else { <i class="bi bi-file-earmark-pdf-fill"></i> }</a>
          <div class="p-2">
            <div class="small fw-bold text-truncate" [title]="m.originalName">{{ m.originalName }}</div>
            <small class="text-muted">{{ m.sizeBytes | fileSize }} · {{ m.createdAt | date: 'd MMM' }}</small>
            <div class="d-flex gap-1 mt-1">
              <button class="btn btn-ghost btn-sm flex-grow-1" (click)="copy(m)"><i class="bi bi-link-45deg"></i> Copy URL</button>
              @if (auth.can('CONTENT_PUBLISH')) { <button class="btn btn-ghost btn-sm text-danger" (click)="remove(m)"><i class="bi bi-trash"></i></button> }
            </div>
          </div>
        </div>
      }
    </div>
    @if (page(); as p) { <app-pager [page]="p.page" [totalPages]="p.totalPages" [total]="p.total" (pageChange)="load($event)" /> }
  `,
  styles: [`.grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(190px, 1fr)); gap: 12px; } .tile { overflow: hidden; } .pv { display: grid; place-items: center; height: 130px; background: var(--eg-surface-2); img { width: 100%; height: 100%; object-fit: cover; } i { font-size: 54px; color: #e5395a; } }`],
})
export class MediaComponent implements OnInit {
  private api = inject(ApiService);
  private toast = inject(ToastrService);
  private confirm = inject(ConfirmService);
  auth = inject(AdminAuthService);
  page = signal<Page<Media> | null>(null);
  q = '';
  type = '';
  ngOnInit() { this.load(0); }
  load(p: number) { this.api.get<Page<Media>>('/admin/media', { q: this.q, type: this.type, page: p, size: 30 }).subscribe(r => this.page.set(r)); }
  copy(m: Media) { navigator.clipboard?.writeText(location.origin + m.url).then(() => this.toast.success('URL copied')); }
  async remove(m: Media) {
    if (await this.confirm.ask('Delete file?', 'Posts that use this file will show a broken image or link.', { danger: true, confirmText: 'Delete' }))
      this.api.delete(`/admin/media/${m.id}`).subscribe(() => this.load(this.page()?.page || 0));
  }
}
