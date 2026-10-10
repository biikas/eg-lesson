import { AfterViewChecked, Component, ElementRef, EventEmitter, Input, OnChanges, Output, ViewChild } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import katex from 'katex';

export interface TocItem { id: string; text: string; level: number; }

/**
 * Shows note HTML (already sanitised by the server), renders KaTeX formulas, gives headings anchors and reports a
 * table of contents to the reader page.
 */
@Component({
  selector: 'app-rich-content',
  standalone: true,
  template: `<div #host class="prose" [class.np]="lang === 'NE'" [innerHTML]="safe"></div>`,
})
export class RichContentComponent implements OnChanges, AfterViewChecked {
  @Input() html = '';
  @Input() lang = 'EN';
  @Output() toc = new EventEmitter<TocItem[]>();
  @ViewChild('host', { static: true }) host!: ElementRef<HTMLElement>;
  safe: SafeHtml = '';
  private dirty = false;

  constructor(private sanitizer: DomSanitizer) {}

  ngOnChanges() {
    // The server cleans the HTML with an allow-list (jsoup); trusting it here keeps iframes and formula markup.
    this.safe = this.sanitizer.bypassSecurityTrustHtml(this.html || '');
    this.dirty = true;
  }

  ngAfterViewChecked() {
    if (!this.dirty) return;
    this.dirty = false;
    const root = this.host.nativeElement;
    root.querySelectorAll<HTMLElement>('.ql-formula[data-value]').forEach(el => {
      try { katex.render(el.getAttribute('data-value') || '', el, { throwOnError: false }); } catch { /* leave raw */ }
    });
    root.querySelectorAll('a[href^="http"]').forEach(a => { a.setAttribute('target', '_blank'); a.setAttribute('rel', 'noopener noreferrer'); });
    // Wide tables scroll sideways on phones instead of stretching the page.
    root.querySelectorAll('table').forEach(t => {
      if (t.parentElement?.classList.contains('table-wrap')) return;
      const wrap = document.createElement('div');
      wrap.className = 'table-wrap';
      t.replaceWith(wrap);
      wrap.appendChild(t);
    });
    root.querySelectorAll('img').forEach(img => img.setAttribute('loading', 'lazy'));
    const items: TocItem[] = [];
    const used = new Set<string>();
    root.querySelectorAll<HTMLElement>('h2, h3').forEach(h => {
      let id = (h.textContent || 'section').toLowerCase().trim().replace(/[^\p{L}\p{N}]+/gu, '-').replace(/(^-|-$)/g, '') || 'section';
      while (used.has(id)) id += '-x';
      used.add(id);
      h.id = id;
      items.push({ id, text: h.textContent || '', level: h.tagName === 'H2' ? 2 : 3 });
    });
    setTimeout(() => this.toc.emit(items));
  }
}
