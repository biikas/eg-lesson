import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-empty',
  standalone: true,
  template: `
    <div class="empty">
      <div class="emo">{{ emoji }}</div>
      <h3>{{ title }}</h3>
      @if (text) { <p>{{ text }}</p> }
      <ng-content />
    </div>
  `,
  styles: [`.empty { text-align: center; padding: 48px 16px; } .emo { font-size: 54px; margin-bottom: 10px; animation: eg-float 4s ease-in-out infinite; } h3 { font-size: 1.2rem; } p { color: var(--eg-text-2); max-width: 440px; margin: 6px auto 16px; }`],
})
export class EmptyStateComponent {
  @Input() emoji = '🔍';
  @Input() title = 'Nothing here yet';
  @Input() text?: string;
}
