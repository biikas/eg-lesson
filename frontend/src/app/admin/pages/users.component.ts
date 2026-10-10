import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { ApiService } from '../../core/api.service';
import { AdminUserView, RoleView } from '../../core/models';
import { TimeAgoPipe } from '../../shared/pipes';
import { PageHeaderComponent } from '../shared/page-header.component';

interface UserForm { id?: number; username: string; fullName: string; email: string; roleId: number | null; active: boolean; password: string; }

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [FormsModule, PageHeaderComponent, TimeAgoPipe],
  template: `
    <app-page-header title="Admin users" subtitle="People who run the portal — e.g. the content writer you hire. Their role decides what they can do.">
      <button class="btn btn-grad" (click)="open()"><i class="bi bi-person-plus"></i> Add admin</button>
    </app-page-header>
    <div class="eg-card overflow-hidden"><div class="table-responsive"><table class="table table-hover m-0">
      <thead><tr><th>Name</th><th>Role</th><th class="d-none d-md-table-cell">Last sign-in</th><th>Status</th><th></th></tr></thead>
      <tbody>
        @for (u of users(); track u.id) {
          <tr>
            <td><b>{{ u.fullName }}</b><small class="d-block text-muted">&#64;{{ u.username }} {{ u.email ? '· ' + u.email : '' }}</small></td>
            <td><span class="badge text-bg-light">{{ u.roleName }}</span></td>
            <td class="d-none d-md-table-cell small text-muted">{{ u.lastLoginAt ? (u.lastLoginAt | timeAgo) : 'never' }}</td>
            <td>@if (!u.active) { <span class="badge text-bg-secondary">Disabled</span> } @else if (u.mustChangePassword) { <span class="badge text-bg-warning">Must set password</span> } @else { <span class="badge text-bg-success">Active</span> }</td>
            <td class="text-end"><button class="btn btn-ghost btn-sm" (click)="edit(u)"><i class="bi bi-pencil"></i></button></td>
          </tr>
        }
      </tbody>
    </table></div></div>

    @if (form(); as f) {
      <div class="eg-backdrop" (click)="form.set(null)">
        <div class="eg-modal p-4" (click)="$event.stopPropagation()">
          <h5 class="fw-800 mb-3">{{ f.id ? 'Edit admin' : 'Add admin' }}</h5>
          <label class="form-label">Full name</label><input class="form-control mb-2" [(ngModel)]="f.fullName">
          <label class="form-label">Username</label><input class="form-control mb-2" [(ngModel)]="f.username" [disabled]="!!f.id">
          <label class="form-label">Email</label><input class="form-control mb-2" type="email" [(ngModel)]="f.email">
          <label class="form-label">Role</label>
          <select class="form-select mb-2" [(ngModel)]="f.roleId">@for (r of roles(); track r.id) { <option [ngValue]="r.id">{{ r.name }}</option> }</select>
          @if (roleOf(f.roleId); as r) { <div class="form-text mb-2">{{ r.description }}</div> }
          <label class="form-label">{{ f.id ? 'Reset password (optional)' : 'Temporary password' }}</label>
          <input class="form-control mb-1" type="text" [(ngModel)]="f.password" placeholder="min 8 characters" autocomplete="off">
          <div class="form-text mb-2">They'll be asked to choose their own password at first sign-in.</div>
          <label class="form-check form-switch"><input class="form-check-input" type="checkbox" [(ngModel)]="f.active"> <span class="small fw-bold">Active</span></label>
          <div class="d-flex justify-content-end gap-2 mt-3"><button class="btn btn-ghost" (click)="form.set(null)">Cancel</button><button class="btn btn-primary" (click)="save()">Save</button></div>
        </div>
      </div>
    }
  `,
})
export class UsersComponent implements OnInit {
  private api = inject(ApiService);
  private toast = inject(ToastrService);
  users = signal<AdminUserView[]>([]);
  roles = signal<RoleView[]>([]);
  form = signal<UserForm | null>(null);

  ngOnInit() {
    this.load();
    this.api.get<{ roles: RoleView[] }>('/admin/roles').subscribe(r => this.roles.set(r.roles));
  }
  load() { this.api.get<AdminUserView[]>('/admin/users').subscribe(u => this.users.set(u)); }
  roleOf(id: number | null) { return this.roles().find(r => r.id === id); }
  open() { this.form.set({ username: '', fullName: '', email: '', roleId: this.roles().find(r => r.name === 'Content Writer')?.id ?? this.roles()[0]?.id ?? null, active: true, password: '' }); }
  edit(u: AdminUserView) { this.form.set({ id: u.id, username: u.username, fullName: u.fullName, email: u.email || '', roleId: u.roleId, active: u.active, password: '' }); }
  save() {
    const f = this.form()!;
    const body = { ...f, password: f.password || null };
    (f.id ? this.api.put(`/admin/users/${f.id}`, body) : this.api.post('/admin/users', body)).subscribe(() => { this.toast.success('Saved'); this.form.set(null); this.load(); });
  }
}
