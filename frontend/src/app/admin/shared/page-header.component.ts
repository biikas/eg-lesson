import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-page-header',
  standalone: true,
  template: `
    <div class="ph">
      <div>
        <h1>{{ title }}</h1>
        @if (subtitle) { <p>{{ subtitle }}</p> }
      </div>
      <div class="actions"><ng-content /></div>
    </div>
  `,
  styles: [`.ph { display: flex; justify-content: space-between; align-items: end; gap: 16px; flex-wrap: wrap; margin-bottom: 22px; } h1 { font-size: 1.6rem; margin: 0; } p { color: var(--eg-muted); margin: 4px 0 0; font-weight: 500; } .actions { display: flex; gap: 8px; flex-wrap: wrap; }`],
})
export class PageHeaderComponent {
  @Input() title = '';
  @Input() subtitle?: string;
}
