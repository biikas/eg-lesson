import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { ApiService } from '../../core/api.service';
import { ConfirmService } from '../../core/confirm.service';
import { PermissionView, RoleView } from '../../core/models';
import { PageHeaderComponent } from '../shared/page-header.component';

/** Roles ("profiles" in mbank): named permission sets assigned to admin users. */
@Component({
  selector: 'app-roles',
  standalone: true,
  imports: [FormsModule, PageHeaderComponent],
  template: `
    <app-page-header title="Roles & permissions" subtitle="Decide exactly what each kind of admin can do.">
      <button class="btn btn-grad" (click)="open()"><i class="bi bi-plus-lg"></i> New role</button>
    </app-page-header>
    <div class="row g-3">
      @for (r of roles(); track r.id) {
        <div class="col-md-6 col-xl-4">
          <div class="eg-card eg-card-pad h-100 d-flex flex-column">
            <div class="d-flex justify-content-between"><h5 class="fw-800 mb-1">{{ r.name }}</h5>@if (r.systemRole) { <span class="badge text-bg-dark h-100">built-in</span> }</div>
            <p class="small text-muted">{{ r.description }}</p>
            <div class="perms">@for (p of r.permissions; track p) { <span>{{ p.replace('_', ' ').toLowerCase() }}</span> }</div>
            <div class="mt-auto pt-3 d-flex justify-content-between align-items-center">
              <small class="text-muted">{{ r.userCount }} admin{{ r.userCount === 1 ? '' : 's' }}</small>
              @if (!r.systemRole) {
                <div><button class="btn btn-ghost btn-sm" (click)="edit(r)"><i class="bi bi-pencil"></i></button><button class="btn btn-ghost btn-sm text-danger" (click)="remove(r)"><i class="bi bi-trash"></i></button></div>
              }
            </div>
          </div>
        </div>
      }
    </div>

    @if (form(); as f) {
      <div class="eg-backdrop" (click)="form.set(null)">
        <div class="eg-modal p-4" style="width:min(640px,100%)" (click)="$event.stopPropagation()">
          <h5 class="fw-800 mb-3">{{ f.id ? 'Edit role' : 'New role' }}</h5>
          <label class="form-label">Name</label><input class="form-control mb-2" [(ngModel)]="f.name">
          <label class="form-label">Description</label><input class="form-control mb-3" [(ngModel)]="f.description">
          <label class="form-label">Permissions</label>
          @for (p of permissions(); track p.name) {
            <label class="perm"><input class="form-check-input" type="checkbox" [checked]="f.permissions.includes(p.name)" (change)="togglePerm(f, p.name)"><div><b>{{ p.name.replace('_', ' ') }}</b><small>{{ p.description }}</small></div></label>
          }
          <div class="d-flex justify-content-end gap-2 mt-3"><button class="btn btn-ghost" (click)="form.set(null)">Cancel</button><button class="btn btn-primary" (click)="save()">Save</button></div>
        </div>
      </div>
    }
  `,
  styles: [`.perms { display: flex; flex-wrap: wrap; gap: 5px; span { font-size: .7rem; font-weight: 700; padding: 3px 8px; border-radius: 99px; background: rgba(108,59,255,.1); color: #6c3bff; text-transform: capitalize; } }
    .perm { display: flex; gap: 12px; align-items: flex-start; padding: 8px 10px; border-radius: 10px; cursor: pointer; &:hover { background: var(--eg-surface-2); } b { display: block; font-size: .85rem; } small { color: var(--eg-muted); } input { margin-top: 4px; } }`],
})
export class RolesComponent implements OnInit {
  private api = inject(ApiService);
  private toast = inject(ToastrService);
  private confirm = inject(ConfirmService);
  roles = signal<RoleView[]>([]);
  permissions = signal<PermissionView[]>([]);
  form = signal<{ id?: number; name: string; description: string; permissions: string[] } | null>(null);

  ngOnInit() { this.load(); }
  load() { this.api.get<{ roles: RoleView[]; permissions: PermissionView[] }>('/admin/roles').subscribe(r => { this.roles.set(r.roles); this.permissions.set(r.permissions); }); }
  open() { this.form.set({ name: '', description: '', permissions: ['CONTENT_WRITE'] }); }
  edit(r: RoleView) { this.form.set({ id: r.id, name: r.name, description: r.description || '', permissions: [...r.permissions] }); }
  togglePerm(f: { permissions: string[] }, p: string) { f.permissions = f.permissions.includes(p) ? f.permissions.filter(x => x !== p) : [...f.permissions, p]; }
  save() {
    const f = this.form()!;
    (f.id ? this.api.put(`/admin/roles/${f.id}`, f) : this.api.post('/admin/roles', f)).subscribe(() => { this.toast.success('Saved'); this.form.set(null); this.load(); });
  }
  async remove(r: RoleView) {
    if (await this.confirm.ask('Delete role?', `“${r.name}” must not be assigned to anyone.`, { danger: true, confirmText: 'Delete' })) this.api.delete(`/admin/roles/${r.id}`).subscribe(() => this.load());
  }
}
