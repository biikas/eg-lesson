import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { ApiService } from '../../core/api.service';
import { ConfirmService } from '../../core/confirm.service';
import { Page, StudentRow } from '../../core/models';
import { TimeAgoPipe } from '../../shared/pipes';
import { DataTableComponent } from '../shared/data-table.component';
import { PageHeaderComponent } from '../shared/page-header.component';

@Component({
  selector: 'app-students',
  standalone: true,
  imports: [FormsModule, PageHeaderComponent, DataTableComponent, TimeAgoPipe],
  template: `
    <app-page-header title="Students" [subtitle]="(page()?.total ?? '…') + ' registered learners'" />
    <input class="form-control mb-3" style="max-width:320px" [(ngModel)]="q" (keyup.enter)="load(0)" placeholder="Search name, email or phone (Enter)">
    <app-data-table [columns]="cols" [rows]="page()?.items || []" [loading]="!page()" [page]="page()?.page || 0" [totalPages]="page()?.totalPages || 0" [total]="page()?.total" (pageChange)="load($event)">
      <ng-template #cell let-row let-col="col">
        @if (col === 'fullName') { <b>{{ row.fullName }}</b><small class="d-block text-muted">{{ row.phone || '' }} {{ row.email || '' }}</small> }
        @if (col === 'lastLoginAt') { <small class="text-muted">{{ row.lastLoginAt | timeAgo }}</small> }
        @if (col === 'state') { <span class="st" [class.off]="!row.active">{{ row.active ? 'Active' : 'Blocked' }}</span> }
      </ng-template>
      <ng-template #actions let-row>
        <button class="btn btn-ghost btn-sm" (click)="reset(row)" title="Set a temporary password"><i class="bi bi-key"></i></button>
        <button class="btn btn-sm" [class.btn-ghost]="row.active" [class.btn-soft]="!row.active" (click)="toggle(row)">{{ row.active ? 'Block' : 'Unblock' }}</button>
      </ng-template>
    </app-data-table>
  `,
  styles: [`.st { font-size: .7rem; font-weight: 800; padding: 3px 8px; border-radius: 99px; background: rgba(18,163,122,.14); color: #0e8a66; } .st.off { background: rgba(229,57,90,.12); color: #e5395a; }`],
})
export class StudentsComponent implements OnInit {
  private api = inject(ApiService);
  private toast = inject(ToastrService);
  private confirm = inject(ConfirmService);
  page = signal<Page<StudentRow> | null>(null);
  q = '';
  cols = [
    { key: 'fullName', label: 'Student', type: 'custom' as const },
    { key: 'courseName', label: 'Course', hideSm: true },
    { key: 'district', label: 'District', hideSm: true },
    { key: 'createdAt', label: 'Joined', type: 'date' as const, hideSm: true },
    { key: 'lastLoginAt', label: 'Last sign-in', type: 'custom' as const },
    { key: 'state', label: 'Status', type: 'custom' as const },
  ];
  ngOnInit() { this.load(0); }
  load(p: number) { this.page.set(null); this.api.get<Page<StudentRow>>('/admin/students', { q: this.q, page: p }).subscribe(r => this.page.set(r)); }
  async reset(s: StudentRow) {
    const pw = Math.random().toString(36).slice(2, 6) + Math.random().toString(36).slice(2, 6).toUpperCase();
    if (!(await this.confirm.ask('Reset password?', `${s.fullName}'s password will become: ${pw} — share it with them privately and ask them to change it in Profile.`, { confirmText: 'Reset' }))) return;
    this.api.post(`/admin/students/${s.id}/password`, { password: pw }).subscribe(() => this.toast.success('Password reset to ' + pw, '', { timeOut: 15000 }));
  }

  async toggle(s: StudentRow) {
    if (s.active && !(await this.confirm.ask('Block student?', `${s.fullName} won't be able to sign in, comment or save notes.`, { danger: true, confirmText: 'Block' }))) return;
    this.api.patch(`/admin/students/${s.id}`, { active: !s.active }).subscribe(() => { this.toast.success(s.active ? 'Blocked' : 'Unblocked'); this.load(this.page()?.page || 0); });
  }
}
