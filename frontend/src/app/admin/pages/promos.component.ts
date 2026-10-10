import { Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { ApiService } from '../../core/api.service';
import { ConfirmService } from '../../core/confirm.service';
import { PromoView } from '../../core/models';
import { MediaPickerComponent } from '../shared/media-picker.component';
import { NodeSelectComponent } from '../shared/node-select.component';
import { PageHeaderComponent } from '../shared/page-header.component';

type PromoForm = Omit<PromoView, 'id' | 'impressions' | 'clicks' | 'startAt' | 'endAt' | 'nodeId'> & { id?: number; startAt: string; endAt: string; nodeId: number | null };

const PLACEMENTS: Record<string, string> = {
  HOME_HERO: 'Home — top slider', HOME_STRIP: 'Home — wide strip', NODE_TOP: 'Category pages — top', SIDEBAR: 'Reader — sidebar',
  POST_INLINE: 'Reader — after the note', POPUP: 'Popup (once a day)',
};
const GRADIENTS = [
  'linear-gradient(120deg,#6C3BFF 0%,#FF3D7F 100%)', 'linear-gradient(120deg,#FF3D7F 0%,#FF8A00 100%)', 'linear-gradient(120deg,#00B8A9 0%,#2F80ED 100%)',
  'linear-gradient(120deg,#0F172A 0%,#334155 100%)', 'linear-gradient(120deg,#27AE60 0%,#00B8A9 100%)', 'linear-gradient(120deg,#9B51E0 0%,#2F80ED 100%)',
];

@Component({
  selector: 'app-promos',
  standalone: true,
  imports: [FormsModule, DatePipe, PageHeaderComponent, MediaPickerComponent, NodeSelectComponent],
  template: `
    <app-page-header title="Banners & ads" subtitle="Your own campaigns (banners) and sponsored placements (ads), with impressions and clicks.">
      <button class="btn btn-ghost" (click)="open('AD')"><i class="bi bi-badge-ad"></i> New ad</button>
      <button class="btn btn-grad" (click)="open('BANNER')"><i class="bi bi-plus-lg"></i> New banner</button>
    </app-page-header>

    @for (pl of placementKeys; track pl) {
      @if (byPlacement(pl).length) {
        <h6 class="fw-800 mt-4 mb-2 text-2">{{ placements[pl] }}</h6>
        <div class="grid">
          @for (p of byPlacement(pl); track p.id) {
            <div class="eg-card card-p" [class.off]="!p.active">
              <div class="pv" [style.background]="p.bgColor || 'var(--eg-grad)'">
                @if (p.imageUrl) { <img [src]="p.imageUrl" alt=""> }
                <div class="pv-t">@if (p.kind === 'AD') { <span class="ad">Sponsored</span> }<b>{{ p.title }}</b><small>{{ p.subtitle }}</small></div>
              </div>
              <div class="p-3">
                <div class="d-flex justify-content-between small">
                  <span><i class="bi bi-eye"></i> {{ p.impressions }} · <i class="bi bi-hand-index"></i> {{ p.clicks }} · CTR {{ ctr(p) }}</span>
                  <span class="badge" [class.text-bg-success]="p.active" [class.text-bg-secondary]="!p.active">{{ p.active ? 'On' : 'Off' }}</span>
                </div>
                <small class="text-muted d-block">{{ p.startAt ? (p.startAt | date: 'd MMM') : 'Now' }} → {{ p.endAt ? (p.endAt | date: 'd MMM y') : 'no end' }}{{ p.nodeId ? ' · targeted' : '' }}</small>
                <div class="d-flex gap-1 mt-2"><button class="btn btn-ghost btn-sm" (click)="edit(p)"><i class="bi bi-pencil"></i> Edit</button><button class="btn btn-ghost btn-sm text-danger ms-auto" (click)="remove(p)"><i class="bi bi-trash"></i></button></div>
              </div>
            </div>
          }
        </div>
      }
    }
    @if (!items().length) { <p class="text-muted text-center py-5">No banners or ads yet.</p> }

    @if (form(); as f) {
      <div class="eg-backdrop" (click)="form.set(null)">
        <div class="eg-modal p-4" style="width:min(820px,100%)" (click)="$event.stopPropagation()">
          <h5 class="fw-800 mb-3">{{ f.id ? 'Edit' : 'New' }} {{ f.kind === 'AD' ? 'advertisement' : 'banner' }}</h5>
          <div class="pv big mb-3" [style.background]="f.bgColor || 'var(--eg-grad)'">
            @if (f.imageUrl) { <img [src]="f.imageUrl" alt=""> }
            <div class="pv-t">@if (f.kind === 'AD') { <span class="ad">Sponsored</span> }<b>{{ f.title || 'Headline' }}</b><small>{{ f.subtitle }}</small>@if (f.ctaText) { <span class="cta">{{ f.ctaText }}</span> }</div>
          </div>
          <div class="row g-2">
            <div class="col-md-4"><label class="form-label">Type</label><select class="form-select" [(ngModel)]="f.kind"><option value="BANNER">Banner</option><option value="AD">Advertisement</option></select></div>
            <div class="col-md-8"><label class="form-label">Placement</label><select class="form-select" [(ngModel)]="f.placement">@for (k of placementKeys; track k) { <option [value]="k">{{ placements[k] }}</option> }</select></div>
            <div class="col-12"><label class="form-label">Headline *</label><input class="form-control" [(ngModel)]="f.title" maxlength="200"></div>
            <div class="col-12"><label class="form-label">Subtitle</label><input class="form-control" [(ngModel)]="f.subtitle" maxlength="500"></div>
            <div class="col-md-8"><label class="form-label">Link</label><input class="form-control" [(ngModel)]="f.linkUrl" placeholder="/explore/see or https://…"></div>
            <div class="col-md-4"><label class="form-label">Button text</label><input class="form-control" [(ngModel)]="f.ctaText" maxlength="60"></div>
            <div class="col-md-6"><label class="form-label">Image <span class="text-muted fw-normal">(optional)</span></label>
              <div class="d-flex gap-2"><app-media-picker (picked)="f.imageUrl = $event.url" />@if (f.imageUrl) { <button class="btn btn-ghost btn-sm" (click)="f.imageUrl = ''">Remove</button> }</div></div>
            <div class="col-md-6"><label class="form-label">Background</label>
              <div class="d-flex gap-1 flex-wrap">@for (g of gradients; track g) { <button type="button" class="gsw" [style.background]="g" (click)="f.bgColor = g"></button> }<input type="color" class="form-control form-control-color" (input)="f.bgColor = $any($event.target).value"></div></div>
            <div class="col-md-4"><label class="form-label">Start</label><input class="form-control" type="datetime-local" [(ngModel)]="f.startAt"></div>
            <div class="col-md-4"><label class="form-label">End</label><input class="form-control" type="datetime-local" [(ngModel)]="f.endAt"></div>
            <div class="col-md-4"><label class="form-label">Order</label><input class="form-control" type="number" [(ngModel)]="f.sortOrder"></div>
            <div class="col-md-8"><label class="form-label">Show only inside <span class="text-muted fw-normal">(targeting)</span></label><app-node-select [value]="f.nodeId" (valueChange)="f.nodeId = $event" [allowNone]="true" placeholder="Everywhere" /></div>
            <div class="col-md-4 d-flex align-items-end"><label class="form-check form-switch"><input class="form-check-input" type="checkbox" [(ngModel)]="f.active"> <span class="small fw-bold">Active</span></label></div>
          </div>
          <div class="d-flex justify-content-end gap-2 mt-4"><button class="btn btn-ghost" (click)="form.set(null)">Cancel</button><button class="btn btn-primary" (click)="save()">Save</button></div>
        </div>
      </div>
    }
  `,
  styles: [`
    .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(290px, 1fr)); gap: 14px; }
    .card-p { overflow: hidden; } .card-p.off { opacity: .6; }
    .pv { position: relative; min-height: 110px; color: #fff; display: flex; align-items: center; padding: 16px; overflow: hidden; border-radius: 0; }
    .pv.big { min-height: 150px; border-radius: 18px; padding: 22px; }
    .pv img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; opacity: .55; }
    .pv-t { position: relative; display: flex; flex-direction: column; gap: 4px; b { font-size: 1.1rem; } small { opacity: .9; } }
    .ad { align-self: flex-start; font-size: .6rem; font-weight: 800; letter-spacing: .1em; text-transform: uppercase; background: rgba(255,255,255,.22); padding: 2px 7px; border-radius: 5px; }
    .cta { align-self: flex-start; background: #fff; color: #17142b; font-weight: 800; padding: 5px 12px; border-radius: 99px; font-size: .8rem; margin-top: 4px; }
    .gsw { width: 30px; height: 30px; border-radius: 9px; border: 2px solid var(--eg-surface); box-shadow: 0 0 0 1px var(--eg-border); }
  `],
})
export class PromosComponent implements OnInit {
  private api = inject(ApiService);
  private toast = inject(ToastrService);
  private confirm = inject(ConfirmService);
  items = signal<PromoView[]>([]);
  form = signal<PromoForm | null>(null);
  placements = PLACEMENTS;
  placementKeys = Object.keys(PLACEMENTS);
  gradients = GRADIENTS;

  ngOnInit() { this.load(); }
  load() { this.api.get<PromoView[]>('/admin/promos').subscribe(r => this.items.set(r)); }
  byPlacement(pl: string) { return this.items().filter(p => p.placement === pl); }
  ctr(p: PromoView) { return p.impressions ? ((p.clicks / p.impressions) * 100).toFixed(1) + '%' : '—'; }
  private local(iso?: string) { if (!iso) return ''; const d = new Date(iso); return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16); }
  open(kind: 'BANNER' | 'AD') {
    this.form.set({ kind, title: '', subtitle: '', imageUrl: '', linkUrl: '', ctaText: kind === 'AD' ? 'Learn more' : 'Explore', placement: kind === 'AD' ? 'SIDEBAR' : 'HOME_HERO',
      bgColor: GRADIENTS[kind === 'AD' ? 3 : 0], nodeId: null, startAt: '', endAt: '', sortOrder: 0, active: true });
  }
  edit(p: PromoView) { this.form.set({ ...p, nodeId: p.nodeId ?? null, startAt: this.local(p.startAt), endAt: this.local(p.endAt) }); }
  save() {
    const f = this.form()!;
    if (!f.title.trim()) { this.toast.warning('Headline is required'); return; }
    const body = { ...f, startAt: f.startAt ? new Date(f.startAt).toISOString() : null, endAt: f.endAt ? new Date(f.endAt).toISOString() : null };
    (f.id ? this.api.put(`/admin/promos/${f.id}`, body) : this.api.post('/admin/promos', body)).subscribe(() => { this.toast.success('Saved'); this.form.set(null); this.load(); });
  }
  async remove(p: PromoView) {
    if (await this.confirm.ask('Delete?', `“${p.title}” and its statistics will be removed.`, { danger: true, confirmText: 'Delete' })) this.api.delete(`/admin/promos/${p.id}`).subscribe(() => this.load());
  }
}
