import { Component, ContentChild, EventEmitter, Input, Output, TemplateRef } from '@angular/core';
import { DatePipe, NgTemplateOutlet } from '@angular/common';
import { PagerComponent } from '../../shared/pager.component';

export interface Column { key: string; label: string; type?: 'text' | 'date' | 'badge' | 'number' | 'bool' | 'custom'; width?: string; hideSm?: boolean; }

/**
 * Generic table (mbank "common-table" idea): column config + an optional row-actions template and custom cell template.
 *   <app-data-table [columns]="cols" [rows]="rows" (pageChange)="load($event)">
 *     <ng-template #cell let-row let-col="col">…</ng-template>
 *     <ng-template #actions let-row>…</ng-template>
 *   </app-data-table>
 */
@Component({
  selector: 'app-data-table',
  standalone: true,
  imports: [DatePipe, NgTemplateOutlet, PagerComponent],
  template: `
    <div class="eg-card overflow-hidden">
      <div class="table-responsive">
        <table class="table table-hover m-0">
          <thead><tr>
            @for (c of columns; track c.key) { <th [style.width]="c.width" [class.d-none]="c.hideSm" [class.d-md-table-cell]="c.hideSm">{{ c.label }}</th> }
            @if (actions) { <th class="text-end">Actions</th> }
          </tr></thead>
          <tbody>
            @if (loading) {
              @for (i of [1,2,3,4]; track i) { <tr><td [attr.colspan]="columns.length + (actions ? 1 : 0)"><div class="skeleton" style="height:18px"></div></td></tr> }
            } @else {
              @for (row of rows; track $index) {
                <tr>
                  @for (c of columns; track c.key) {
                    <td [class.d-none]="c.hideSm" [class.d-md-table-cell]="c.hideSm">
                      @switch (c.type) {
                        @case ('date') { <span class="text-muted small">{{ row[c.key] | date: 'd MMM y, h:mm a' }}</span> }
                        @case ('badge') { <span class="st st-{{ row[c.key] }}">{{ row[c.key] }}</span> }
                        @case ('bool') { <i class="bi" [class.bi-check-circle-fill]="row[c.key]" [class.text-success]="row[c.key]" [class.bi-dash-circle]="!row[c.key]" [class.text-muted]="!row[c.key]"></i> }
                        @case ('custom') { <ng-container *ngTemplateOutlet="cell ?? null; context: { $implicit: row, col: c.key }" /> }
                        @default { {{ row[c.key] ?? '—' }} }
                      }
                    </td>
                  }
                  @if (actions) { <td class="text-end text-nowrap"><ng-container *ngTemplateOutlet="actions ?? null; context: { $implicit: row }" /></td> }
                </tr>
              } @empty {
                <tr><td [attr.colspan]="columns.length + (actions ? 1 : 0)" class="text-center text-muted py-5">{{ emptyText }}</td></tr>
              }
            }
          </tbody>
        </table>
      </div>
    </div>
    <app-pager [page]="page" [totalPages]="totalPages" [total]="total" (pageChange)="pageChange.emit($event)" />
  `,
  styles: [`
    .st { font-size: .7rem; font-weight: 800; padding: 3px 9px; border-radius: 99px; background: var(--eg-surface-2); color: var(--eg-text-2); letter-spacing: .03em; }
    .st-PUBLISHED, .st-VISIBLE, .st-DONE, .st-ACTIVE { background: rgba(18,163,122,.14); color: #0e8a66; }
    .st-DRAFT, .st-OPEN { background: rgba(138,133,163,.16); }
    .st-REVIEW, .st-PENDING, .st-IN_PROGRESS, .st-SCHEDULED { background: rgba(240,140,0,.15); color: #c06f00; }
    .st-ARCHIVED, .st-HIDDEN, .st-REJECTED, .st-BLOCKED { background: rgba(229,57,90,.12); color: #e5395a; }
  `],
})
export class DataTableComponent {
  @Input() columns: Column[] = [];
  @Input() rows: any[] = [];
  @Input() loading = false;
  @Input() page = 0;
  @Input() totalPages = 0;
  @Input() total?: number;
  @Input() emptyText = 'Nothing to show';
  @Output() pageChange = new EventEmitter<number>();
  @ContentChild('actions') actions?: TemplateRef<unknown>;
  @ContentChild('cell') cell?: TemplateRef<unknown>;
}
