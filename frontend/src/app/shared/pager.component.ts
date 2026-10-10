import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-pager',
  standalone: true,
  template: `
    @if (totalPages > 1) {
      <nav class="pager">
        <button class="btn btn-ghost btn-sm" [disabled]="page === 0" (click)="go(page - 1)"><i class="bi bi-chevron-left"></i></button>
        @for (p of pages(); track $index) {
          @if (p < 0) { <span class="gap">…</span> }
          @else { <button class="btn btn-sm" [class.btn-primary]="p === page" [class.btn-ghost]="p !== page" (click)="go(p)">{{ p + 1 }}</button> }
        }
        <button class="btn btn-ghost btn-sm" [disabled]="page >= totalPages - 1" (click)="go(page + 1)"><i class="bi bi-chevron-right"></i></button>
        @if (total != null) { <span class="info">{{ total }} total</span> }
      </nav>
    }
  `,
  styles: [`.pager { display: flex; gap: 6px; align-items: center; justify-content: center; flex-wrap: wrap; margin: 24px 0 8px; } .gap { color: var(--eg-muted); padding: 0 4px; } .info { color: var(--eg-muted); font-size: .8rem; margin-left: 8px; font-weight: 600; } .btn-sm { min-width: 36px; }`],
})
export class PagerComponent {
  @Input() page = 0;
  @Input() totalPages = 0;
  @Input() total?: number;
  @Output() pageChange = new EventEmitter<number>();

  go(p: number) {
    if (p >= 0 && p < this.totalPages && p !== this.page) this.pageChange.emit(p);
  }

  pages(): number[] {
    const n = this.totalPages, c = this.page, out: number[] = [];
    for (let i = 0; i < n; i++) {
      if (i === 0 || i === n - 1 || Math.abs(i - c) <= 1) out.push(i);
      else if (out[out.length - 1] !== -1) out.push(-1);
    }
    return out;
  }
}
