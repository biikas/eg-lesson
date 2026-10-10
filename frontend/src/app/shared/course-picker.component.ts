import { Component, EventEmitter, Input, OnChanges, Output, inject } from '@angular/core';
import { SiteService } from '../core/site.service';
import { TreeNode } from '../core/models';
import { IconComponent } from './icon.component';

/**
 * Pick the class/semester/year you study, level by level ("Engineering › BE Computer › Semester III").
 * Emits the deepest chosen node id; stops before subjects.
 */
@Component({
  selector: 'app-course-picker',
  standalone: true,
  imports: [IconComponent],
  template: `
    <div class="levels">
      @for (level of levels; track level; let i = $index) {
        <div class="level">
          @for (n of level; track n.id) {
            <button type="button" class="opt" [class.on]="path.length > i && path[i].id === n.id" (click)="pick(i, n)">
              <app-icon [name]="n.icon" fallback="📂" /> {{ n.shortName || n.name }}
            </button>
          }
        </div>
      }
    </div>
  `,
  styles: [`.levels { display: grid; gap: 10px; } .level { display: flex; flex-wrap: wrap; gap: 6px; padding-top: 10px; } .level + .level { border-top: 1px dashed var(--eg-border); }
    .opt { border: 1px solid var(--eg-border); background: var(--eg-surface); border-radius: 12px; padding: 7px 12px; font-weight: 700; font-size: .85rem; color: var(--eg-text-2); display: inline-flex; gap: 6px; align-items: center; }
    .opt:hover { border-color: #6c3bff; } .opt.on { background: #6c3bff; color: #fff; border-color: #6c3bff; }`],
})
export class CoursePickerComponent implements OnChanges {
  @Input() value?: number | null;
  @Output() valueChange = new EventEmitter<number | null>();
  site = inject(SiteService);
  path: TreeNode[] = [];
  levels: TreeNode[][] = [];

  constructor() { this.site.loadTree(); }

  ngOnChanges() { this.rebuild(); }

  ngDoCheck() {
    if (!this.levels.length && this.site.tree()) this.rebuild();
  }

  private rebuild() {
    const tree = this.site.tree();
    if (!tree) return;
    this.path = [];
    if (this.value) {
      const find = (nodes: TreeNode[], trail: TreeNode[]): TreeNode[] | null => {
        for (const n of nodes) {
          if (n.id === this.value) return [...trail, n];
          const r = find(n.children, [...trail, n]);
          if (r) return r;
        }
        return null;
      };
      this.path = find(tree, []) || [];
    }
    this.computeLevels();
  }

  private selectable(nodes: TreeNode[]) {
    return nodes.filter(n => n.typeCode !== 'SUBJECT' && n.typeCode !== 'CHAPTER');
  }

  private computeLevels() {
    const tree = this.site.tree() || [];
    this.levels = [this.selectable(tree)];
    for (const n of this.path) {
      const kids = this.selectable(n.children);
      if (kids.length) this.levels.push(kids);
    }
  }

  pick(level: number, n: TreeNode) {
    this.path = [...this.path.slice(0, level), n];
    this.computeLevels();
    this.valueChange.emit(n.id);
  }
}
