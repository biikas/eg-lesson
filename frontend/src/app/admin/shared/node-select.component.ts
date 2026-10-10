import { Component, ElementRef, EventEmitter, HostListener, Input, Output, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IconComponent } from '../../shared/icon.component';
import { AdminTreeService } from './admin-tree.service';

/** Searchable picker over the whole catalog: type "sem 3 data" to find "BE Computer › Semester III › Data Structure…". */
@Component({
  selector: 'app-node-select',
  standalone: true,
  imports: [FormsModule, IconComponent],
  template: `
    <div class="ns">
      <button type="button" class="form-select text-start trigger" (click)="toggle()">
        @if (value) { <span class="sel">{{ tree.label(value) }}</span> } @else { <span class="text-muted">{{ placeholder }}</span> }
      </button>
      @if (open()) {
        <div class="panel">
          <input class="form-control form-control-sm mb-2" [ngModel]="q()" (ngModelChange)="q.set($event)" placeholder="Type to filter… e.g. class 10 science" autofocus>
          <div class="list">
            @if (allowNone) { <button type="button" class="it" (click)="choose(null)"><span class="text-muted">— none —</span></button> }
            @for (n of results(); track n.id) {
              <button type="button" class="it" [class.on]="n.id === value" [class.leaf]="n.typeCode === 'SUBJECT' || n.typeCode === 'CHAPTER'" (click)="choose(n.id)">
                <app-icon [name]="n.icon" fallback="📂" /> <span class="lbl">{{ n.label }}</span> <small>{{ n.typeLabel }}</small>
                @if (!n.active) { <small class="text-danger">hidden</small> }
              </button>
            }
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .ns { position: relative; }
    .trigger { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .panel { position: absolute; z-index: 50; top: calc(100% + 6px); left: 0; right: 0; min-width: 320px; background: var(--eg-surface); border: 1px solid var(--eg-border); border-radius: 14px; box-shadow: var(--eg-shadow-lg); padding: 10px; }
    .list { max-height: 320px; overflow: auto; }
    .it { display: flex; gap: 8px; align-items: center; width: 100%; border: 0; background: none; padding: 7px 8px; border-radius: 9px; text-align: left; font-size: .87rem; color: var(--eg-text-2); }
    .it.leaf { color: var(--eg-text); font-weight: 600; }
    .it:hover, .it.on { background: var(--eg-surface-2); }
    .it.on { outline: 2px solid #6c3bff; }
    .lbl { flex: 1; }
    small { color: var(--eg-muted); font-size: .7rem; }
  `],
})
export class NodeSelectComponent {
  @Input() value?: number | null;
  @Input() placeholder = 'Choose a category';
  @Input() allowNone = false;
  @Output() valueChange = new EventEmitter<number | null>();
  tree = inject(AdminTreeService);
  private el = inject(ElementRef);
  open = signal(false);
  q = signal('');

  constructor() { this.tree.ensure(); }

  results = computed(() => {
    const words = this.q().toLowerCase().split(/\s+/).filter(Boolean);
    const all = this.tree.flat();
    return (words.length ? all.filter(n => words.every(w => n.label.toLowerCase().includes(w))) : all).slice(0, 200);
  });

  toggle() { this.open.set(!this.open()); }
  choose(id: number | null) { this.valueChange.emit(id); this.open.set(false); this.q.set(''); }

  @HostListener('document:click', ['$event']) outside(e: Event) {
    if (!this.el.nativeElement.contains(e.target)) this.open.set(false);
  }
}
