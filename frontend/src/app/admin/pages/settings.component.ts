import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { ApiService } from '../../core/api.service';
import { SiteService } from '../../core/site.service';
import { PageHeaderComponent } from '../shared/page-header.component';

const GROUPS: { title: string; keys: { k: string; label: string; type?: 'textarea' | 'bool' }[] }[] = [
  { title: 'Brand', keys: [{ k: 'site.name', label: 'Site name' }, { k: 'site.tagline', label: 'Tagline' }] },
  { title: 'Home page', keys: [{ k: 'home.heroTitle', label: 'Hero headline' }, { k: 'home.heroSubtitle', label: 'Hero sub-text', type: 'textarea' }] },
  { title: 'Contact & social', keys: [{ k: 'contact.email', label: 'Email' }, { k: 'contact.phone', label: 'Phone' }, { k: 'social.facebook', label: 'Facebook URL' }, { k: 'social.youtube', label: 'YouTube URL' }, { k: 'social.tiktok', label: 'TikTok URL' }, { k: 'social.instagram', label: 'Instagram URL' }] },
  { title: 'Footer', keys: [{ k: 'footer.about', label: 'About text', type: 'textarea' }] },
  { title: 'Community', keys: [{ k: 'comments.autoApprove', label: 'Publish student comments immediately (off = moderate first)', type: 'bool' }, { k: 'signup.enabled', label: 'Allow new student sign-ups', type: 'bool' }] },
];

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [FormsModule, PageHeaderComponent],
  template: `
    <app-page-header title="Settings" subtitle="Text and switches used across the student site.">
      <button class="btn btn-grad" (click)="save()"><i class="bi bi-check-lg"></i> Save settings</button>
    </app-page-header>
    <div class="row g-3">
      @for (g of groups; track g.title) {
        <div class="col-lg-6">
          <div class="eg-card eg-card-pad h-100">
            <h6 class="fw-800 mb-3">{{ g.title }}</h6>
            @for (f of g.keys; track f.k) {
              @if (f.type === 'bool') {
                <label class="form-check form-switch mb-2"><input class="form-check-input" type="checkbox" [checked]="v[f.k] === 'true'" (change)="v[f.k] = $any($event.target).checked ? 'true' : 'false'"> <span class="small fw-bold">{{ f.label }}</span></label>
              } @else {
                <label class="form-label">{{ f.label }}</label>
                @if (f.type === 'textarea') { <textarea class="form-control mb-3" rows="3" [(ngModel)]="v[f.k]"></textarea> }
                @else { <input class="form-control mb-3" [(ngModel)]="v[f.k]"> }
              }
            }
          </div>
        </div>
      }
    </div>
  `,
})
export class SettingsComponent implements OnInit {
  private api = inject(ApiService);
  private toast = inject(ToastrService);
  private site = inject(SiteService);
  groups = GROUPS;
  v: Record<string, string> = {};
  ngOnInit() { this.api.get<Record<string, string>>('/admin/settings').subscribe(s => (this.v = { ...s })); }
  save() { this.api.put<Record<string, string>>('/admin/settings', this.v).subscribe(s => { this.v = { ...s }; this.site.settings.set(s); this.toast.success('Settings saved'); }); }
}
