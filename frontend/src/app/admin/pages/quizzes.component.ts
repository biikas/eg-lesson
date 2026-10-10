import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { ApiService } from '../../core/api.service';
import { ConfirmService } from '../../core/confirm.service';
import { Page, QuizCard } from '../../core/models';
import { TimeAgoPipe } from '../../shared/pipes';
import { DataTableComponent } from '../shared/data-table.component';
import { NodeSelectComponent } from '../shared/node-select.component';
import { PageHeaderComponent } from '../shared/page-header.component';

@Component({
  selector: 'app-admin-quizzes',
  standalone: true,
  imports: [FormsModule, RouterLink, PageHeaderComponent, DataTableComponent, NodeSelectComponent, TimeAgoPipe],
  template: `
    <app-page-header title="Quizzes" subtitle="MCQ practice sets attached to subjects.">
      <a routerLink="/admin/quizzes/new" class="btn btn-grad"><i class="bi bi-plus-lg"></i> New quiz</a>
    </app-page-header>
    <div class="d-flex gap-2 mb-3 flex-wrap">
      <input class="form-control" style="max-width:280px" [(ngModel)]="q" (keyup.enter)="load(0)" placeholder="Search quizzes…">
      <app-node-select style="min-width:280px" [value]="nodeId" (valueChange)="nodeId = $event; load(0)" [allowNone]="true" placeholder="All categories" />
    </div>
    <app-data-table [columns]="cols" [rows]="page()?.items || []" [loading]="!page()" [page]="page()?.page || 0" [totalPages]="page()?.totalPages || 0" (pageChange)="load($event)">
      <ng-template #cell let-row let-col="col">
        @if (col === 'title') { <a [routerLink]="['/admin/quizzes', row.id]" class="fw-bold">{{ row.title }}</a><small class="d-block text-muted">{{ row.node?.pathLabel }}</small> }
        @if (col === 'updatedAt') { <small class="text-muted">{{ row.updatedAt | timeAgo }}</small> }
      </ng-template>
      <ng-template #actions let-row>
        <a [href]="'/quiz/' + row.slug" target="_blank" class="btn btn-ghost btn-sm"><i class="bi bi-eye"></i></a>
        <a [routerLink]="['/admin/quizzes', row.id]" class="btn btn-ghost btn-sm"><i class="bi bi-pencil"></i></a>
        <button class="btn btn-ghost btn-sm text-danger" (click)="remove(row)"><i class="bi bi-trash"></i></button>
      </ng-template>
    </app-data-table>
  `,
})
export class AdminQuizzesComponent implements OnInit {
  private api = inject(ApiService);
  private toast = inject(ToastrService);
  private confirm = inject(ConfirmService);
  page = signal<Page<QuizCard> | null>(null);
  q = '';
  nodeId: number | null = null;
  cols = [
    { key: 'title', label: 'Quiz', type: 'custom' as const },
    { key: 'questionCount', label: 'Questions' },
    { key: 'attemptCount', label: 'Attempts', hideSm: true },
    { key: 'status', label: 'Status', type: 'badge' as const },
    { key: 'updatedAt', label: 'Updated', type: 'custom' as const, hideSm: true },
  ];
  ngOnInit() { this.load(0); }
  load(p: number) { this.page.set(null); this.api.get<Page<QuizCard>>('/admin/quizzes', { q: this.q, nodeId: this.nodeId, page: p }).subscribe(r => this.page.set(r)); }
  async remove(row: QuizCard) {
    if (await this.confirm.ask('Delete quiz?', `“${row.title}” and its attempts will be deleted.`, { danger: true, confirmText: 'Delete' }))
      this.api.delete(`/admin/quizzes/${row.id}`).subscribe(() => { this.toast.success('Deleted'); this.load(0); });
  }
}
