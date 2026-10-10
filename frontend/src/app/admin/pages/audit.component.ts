import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/api.service';
import { AdminUserView, AuditLog, Page } from '../../core/models';
import { DataTableComponent } from '../shared/data-table.component';
import { PageHeaderComponent } from '../shared/page-header.component';

@Component({
  selector: 'app-audit',
  standalone: true,
  imports: [FormsModule, PageHeaderComponent, DataTableComponent],
  template: `
    <app-page-header title="Audit log" subtitle="Every change made in the portal: who, what and when." />
    <div class="d-flex gap-2 mb-3 flex-wrap">
      <select class="form-select" style="max-width:220px" [(ngModel)]="adminId" (change)="load(0)"><option [ngValue]="null">All admins</option>@for (u of users(); track u.id) { <option [ngValue]="u.id">{{ u.fullName }}</option> }</select>
      <select class="form-select" style="max-width:200px" [(ngModel)]="entity" (change)="load(0)"><option value="">Everything</option>@for (e of entities; track e) { <option [value]="e">{{ e }}</option> }</select>
    </div>
    <app-data-table [columns]="cols" [rows]="page()?.items || []" [loading]="!page()" [page]="page()?.page || 0" [totalPages]="page()?.totalPages || 0" (pageChange)="load($event)" />
  `,
})
export class AuditComponent implements OnInit {
  private api = inject(ApiService);
  page = signal<Page<AuditLog> | null>(null);
  users = signal<AdminUserView[]>([]);
  adminId: number | null = null;
  entity = '';
  entities = ['POST', 'CATEGORY', 'CONTENT_TYPE', 'LEVEL_TYPE', 'QUIZ', 'NOTICE', 'BANNER', 'AD', 'COMMENT', 'REQUEST', 'STUDENT', 'MEDIA', 'ADMIN_USER', 'ROLE', 'SETTINGS'];
  cols = [
    { key: 'createdAt', label: 'When', type: 'date' as const, width: '180px' },
    { key: 'adminName', label: 'Who' },
    { key: 'action', label: 'Action', type: 'badge' as const },
    { key: 'entity', label: 'What' },
    { key: 'summary', label: 'Details' },
  ];
  ngOnInit() {
    this.load(0);
    this.api.get<AdminUserView[]>('/admin/users').subscribe({ next: u => this.users.set(u), error: () => {} });
  }
  load(p: number) { this.page.set(null); this.api.get<Page<AuditLog>>('/admin/audit', { adminId: this.adminId, entity: this.entity, page: p }).subscribe(r => this.page.set(r)); }
}
