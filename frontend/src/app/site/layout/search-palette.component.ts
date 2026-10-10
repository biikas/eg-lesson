import { Component, ElementRef, EventEmitter, HostListener, OnInit, Output, ViewChild, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, debounceTime, distinctUntilChanged, switchMap, of } from 'rxjs';
import { ApiService } from '../../core/api.service';
import { Suggestion } from '../../core/models';
import { store } from '../../core/storage';
import { IconComponent } from '../../shared/icon.component';

/** Ctrl/⌘+K or "/" anywhere: type a subject, chapter or question and jump straight to it. */
@Component({
  selector: 'app-search-palette',
  standalone: true,
  imports: [FormsModule, IconComponent],
  template: `
    <div class="eg-backdrop top" (click)="close.emit()">
      <div class="palette" (click)="$event.stopPropagation()">
        <div class="field">
          <i class="bi bi-search"></i>
          <input #box [(ngModel)]="q" (ngModelChange)="typed$.next($event)" (keydown)="key($event)"
                 placeholder="Search notes, subjects, chapters, old questions…" autocomplete="off" aria-label="Search">
          <kbd (click)="close.emit()">esc</kbd>
        </div>
        <div class="results">
          @if (!q.trim()) {
            @if (recent().length) {
              <div class="label">Recent</div>
              @for (r of recent(); track r) {
                <button class="row" (click)="searchFor(r)"><i class="bi bi-clock-history ico"></i><span class="t">{{ r }}</span></button>
              }
            }
            <div class="label">Try</div>
            <div class="tries">
              @for (t of tries; track t) { <button class="chip" (click)="q = t; typed$.next(t)">{{ t }}</button> }
            </div>
          } @else {
            @for (s of items(); track s.kind + s.slug; let i = $index) {
              <button class="row" [class.sel]="i === sel()" (mouseenter)="sel.set(i)" (click)="go(s)">
                <span class="ico" [style.background]="(s.color || '#6C3BFF') + '22'" [style.color]="s.color"><app-icon [name]="s.icon" /></span>
                <span class="t">{{ s.title }}<small>{{ s.kind === 'CATEGORY' ? 'Category' : '' }} {{ s.subtitle }}</small></span>
                <i class="bi bi-arrow-return-left ent"></i>
              </button>
            }
            <button class="row all" [class.sel]="sel() === items().length" (click)="searchFor(q)">
              <span class="ico"><i class="bi bi-search"></i></span><span class="t">See all results for “{{ q }}”</span>
            </button>
          }
        </div>
      </div>
    </div>
  `,
  styles: [`
    .eg-backdrop.top { align-items: start; padding-top: min(12vh, 90px); }
    .palette { width: min(680px, 100%); background: var(--eg-surface); border-radius: 22px; box-shadow: var(--eg-shadow-lg); border: 1px solid var(--eg-border); overflow: hidden; animation: eg-pop .2s ease both; }
    .field { display: flex; align-items: center; gap: 12px; padding: 16px 18px; border-bottom: 1px solid var(--eg-border); }
    .field i { font-size: 20px; color: var(--eg-violet); }
    .field input { flex: 1; border: 0; outline: 0; background: none; font-size: 1.1rem; font-weight: 600; color: var(--eg-text); min-width: 0; }
    kbd { background: var(--eg-surface-2); color: var(--eg-muted); border: 1px solid var(--eg-border); font-size: .7rem; cursor: pointer; }
    .results { max-height: min(60vh, 460px); overflow: auto; padding: 8px; }
    .label { font-size: .7rem; font-weight: 800; text-transform: uppercase; letter-spacing: .1em; color: var(--eg-muted); padding: 10px 10px 6px; }
    .tries { display: flex; flex-wrap: wrap; gap: 8px; padding: 0 8px 10px; }
    .row { display: flex; align-items: center; gap: 12px; width: 100%; border: 0; background: none; padding: 10px; border-radius: 12px; text-align: left; color: var(--eg-text); }
    .row.sel, .row:hover { background: var(--eg-surface-2); }
    .ico { width: 38px; height: 38px; border-radius: 12px; display: grid; place-items: center; flex: none; font-size: 18px; background: var(--eg-surface-2); }
    .t { flex: 1; font-weight: 700; display: flex; flex-direction: column; min-width: 0; }
    .t small { font-weight: 500; color: var(--eg-muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .ent { color: var(--eg-muted); opacity: 0; }
    .row.sel .ent { opacity: 1; }
    .all .t { color: var(--eg-violet); }
  `],
})
export class SearchPaletteComponent implements OnInit {
  @Output() close = new EventEmitter<void>();
  @ViewChild('box', { static: true }) box!: ElementRef<HTMLInputElement>;
  private api = inject(ApiService);
  private router = inject(Router);
  q = '';
  typed$ = new Subject<string>();
  items = signal<Suggestion[]>([]);
  sel = signal(0);
  recent = signal<string[]>(store.json<string[]>('eg.recentSearches', []));
  tries = ["Newton's laws", 'Sets Venn diagram', 'BE Computer', 'SEE English', 'Pointers in C', 'Class 8 Nepali', 'Grade 11 Physics'];

  ngOnInit() {
    setTimeout(() => this.box.nativeElement.focus());
    this.typed$.pipe(debounceTime(160), distinctUntilChanged(),
      switchMap(q => q.trim().length < 2 ? of([]) : this.api.get<Suggestion[]>('/public/search/suggest', { q })))
      .subscribe({ next: s => { this.items.set(s); this.sel.set(0); }, error: () => {} });
  }

  @HostListener('document:keydown.escape') esc() { this.close.emit(); }

  key(e: KeyboardEvent) {
    const max = this.items().length;
    if (e.key === 'ArrowDown') { this.sel.set(Math.min(this.sel() + 1, max)); e.preventDefault(); }
    else if (e.key === 'ArrowUp') { this.sel.set(Math.max(this.sel() - 1, 0)); e.preventDefault(); }
    else if (e.key === 'Enter') {
      const s = this.items()[this.sel()];
      if (s && this.q.trim()) this.go(s); else this.searchFor(this.q);
    }
  }

  go(s: Suggestion) {
    this.remember(this.q);
    this.router.navigate(s.kind === 'CATEGORY' ? ['/explore', s.slug] : ['/read', s.slug]);
    this.close.emit();
  }

  searchFor(q: string) {
    if (!q.trim()) return;
    this.remember(q);
    this.router.navigate(['/search'], { queryParams: { q: q.trim() } });
    this.close.emit();
  }

  private remember(q: string) {
    const t = q.trim();
    if (!t) return;
    const list = [t, ...this.recent().filter(x => x.toLowerCase() !== t.toLowerCase())].slice(0, 6);
    store.set('eg.recentSearches', JSON.stringify(list));
  }
}
