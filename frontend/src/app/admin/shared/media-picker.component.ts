import { Component, EventEmitter, Input, Output, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/api.service';
import { Media, Page } from '../../core/models';
import { FileSizePipe } from '../../shared/pipes';

/** Upload a file or pick one from the library. Emits the chosen Media. */
@Component({
  selector: 'app-media-picker',
  standalone: true,
  imports: [FormsModule, FileSizePipe],
  template: `
    <div class="d-inline-flex gap-2">
      <label class="btn btn-soft btn-sm mb-0" [class.disabled]="busy()">
        <i class="bi bi-cloud-arrow-up"></i> {{ busy() ? 'Uploading…' : label }}
        <input type="file" hidden [accept]="accept" (change)="upload($event)">
      </label>
      <button type="button" class="btn btn-ghost btn-sm" (click)="openLib()"><i class="bi bi-images"></i> Library</button>
    </div>
    @if (lib()) {
      <div class="eg-backdrop" (click)="lib.set(false)">
        <div class="eg-modal p-3" style="width:min(820px,100%)" (click)="$event.stopPropagation()">
          <div class="d-flex gap-2 mb-3"><input class="form-control" placeholder="Search files" [(ngModel)]="q" (keyup.enter)="load()"><button class="btn btn-ghost" (click)="lib.set(false)">Close</button></div>
          <div class="grid">
            @for (m of items(); track m.id) {
              <button type="button" class="tile" (click)="pick(m)">
                @if (m.contentType.startsWith('image/')) { <img [src]="m.url" alt=""> } @else { <i class="bi bi-file-earmark-pdf-fill"></i> }
                <small>{{ m.originalName }}</small><small class="text-muted">{{ m.sizeBytes | fileSize }}</small>
              </button>
            } @empty { <p class="text-muted">No files yet.</p> }
          </div>
        </div>
      </div>
    }
  `,
  styles: [`.grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 10px; max-height: 60vh; overflow: auto; }
    .tile { border: 1px solid var(--eg-border); background: var(--eg-surface-2); border-radius: 12px; padding: 8px; display: flex; flex-direction: column; gap: 4px; text-align: left; color: var(--eg-text); }
    .tile:hover { border-color: #6c3bff; } .tile img { width: 100%; height: 90px; object-fit: cover; border-radius: 8px; } .tile i { font-size: 48px; color: #e5395a; text-align: center; }
    .tile small { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-size: .72rem; }`],
})
export class MediaPickerComponent {
  @Input() accept = 'image/*';
  @Input() label = 'Upload';
  @Output() picked = new EventEmitter<Media>();
  private api = inject(ApiService);
  busy = signal(false);
  lib = signal(false);
  items = signal<Media[]>([]);
  q = '';

  upload(e: Event) {
    const input = e.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    this.busy.set(true);
    this.api.upload<Media>('/admin/media', file).subscribe({
      next: m => { this.busy.set(false); this.picked.emit(m); input.value = ''; },
      error: () => { this.busy.set(false); input.value = ''; },
    });
  }

  openLib() { this.lib.set(true); this.load(); }

  load() {
    const type = this.accept.startsWith('image') ? 'image/' : this.accept.includes('pdf') && !this.accept.includes('image') ? 'application/pdf' : '';
    this.api.get<Page<Media>>('/admin/media', { type, q: this.q, size: 60 }).subscribe(p => this.items.set(p.items));
  }

  pick(m: Media) { this.picked.emit(m); this.lib.set(false); }
}
