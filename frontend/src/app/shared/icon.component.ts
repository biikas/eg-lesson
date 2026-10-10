import { Component, Input } from '@angular/core';

/** Renders a Bootstrap icon ("bi-book") or an emoji/text icon ("📐", "अ") the admin chose. */
@Component({
  selector: 'app-icon',
  standalone: true,
  template: `@if (isBi) { <i class="bi {{ name }}"></i> } @else { <span class="emoji">{{ name || fallback }}</span> }`,
  styles: [`:host { display: inline-grid; place-items: center; line-height: 1; } .emoji { font-family: 'Apple Color Emoji','Segoe UI Emoji','Noto Color Emoji', var(--eg-font-np); }`],
})
export class IconComponent {
  @Input() name?: string | null;
  @Input() fallback = '📘';
  get isBi() { return !!this.name && this.name.startsWith('bi-'); }
}
