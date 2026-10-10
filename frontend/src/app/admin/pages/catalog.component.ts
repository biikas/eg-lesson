import { Component, OnInit, inject, signal } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { ApiService } from '../../core/api.service';
import { ConfirmService } from '../../core/confirm.service';
import { TreeNode } from '../../core/models';
import { IconComponent } from '../../shared/icon.component';
import { AdminTreeService } from '../shared/admin-tree.service';
import { MediaPickerComponent } from '../shared/media-picker.component';
import { NodeSelectComponent } from '../shared/node-select.component';
import { PageHeaderComponent } from '../shared/page-header.component';

interface NodeForm { id?: number; parentId: number | null; typeId: number | null; name: string; shortName: string; slug: string; description: string; icon: string; color: string; coverImage: string; sortOrder: number; active: boolean; featured: boolean; }

/**
 * The browse tree students navigate: streams → programs/classes → semesters/years → subjects → chapters.
 * Every level, name, icon, colour and order is configured here.
 */
@Component({
  selector: 'app-catalog',
  standalone: true,
  imports: [FormsModule, NgTemplateOutlet, RouterLink, PageHeaderComponent, IconComponent, NodeSelectComponent, MediaPickerComponent],
  template: `
    <app-page-header title="Categories" subtitle="Streams, classes, semesters, subjects — the structure students browse. Changes go live instantly.">
      <a routerLink="/admin/types" class="btn btn-ghost"><i class="bi bi-tags"></i> Level types</a>
      <button class="btn btn-grad" (click)="newNode(null)"><i class="bi bi-plus-lg"></i> New stream</button>
    </app-page-header>

    <div class="layout">
      <div class="eg-card tree-card">
        <div class="tools">
          <input class="form-control form-control-sm" [ngModel]="filter()" (ngModelChange)="filter.set($event)" placeholder="Filter…">
          <button class="btn btn-ghost btn-sm" (click)="expandAll(true)">Expand all</button>
          <button class="btn btn-ghost btn-sm" (click)="expandAll(false)">Collapse</button>
        </div>
        <div class="tree">
          <ng-template #branch let-nodes let-siblings="siblings">
            @for (n of nodes; track n.id; let i = $index; let first = $first; let last = $last) {
              @if (visible(n)) {
                <div class="row-n" [class.sel]="form()?.id === n.id" [class.off]="!n.active" [style.padding-left.px]="8 + n.depth * 20">
                  <button class="tg" (click)="toggle(n.id)" [style.visibility]="n.children.length ? 'visible' : 'hidden'"><i class="bi" [class.bi-chevron-right]="!isOpen(n.id)" [class.bi-chevron-down]="isOpen(n.id)"></i></button>
                  <span class="ic"><app-icon [name]="n.icon" fallback="📂" /></span>
                  <button class="nm" (click)="edit(n)">{{ n.name }} <small>{{ n.typeLabel }}</small></button>
                  <span class="cnt" title="Published posts">{{ n.postCount }}</span>
                  @if (!n.active) { <span class="badge text-bg-secondary">hidden</span> }
                  @if (n.featured) { <i class="bi bi-star-fill text-warning small" title="Featured on home"></i> }
                  <span class="acts">
                    <button (click)="move(siblings, i, -1)" [disabled]="first" title="Move up"><i class="bi bi-arrow-up"></i></button>
                    <button (click)="move(siblings, i, 1)" [disabled]="last" title="Move down"><i class="bi bi-arrow-down"></i></button>
                    <button (click)="newNode(n)" title="Add inside"><i class="bi bi-plus-lg"></i></button>
                  </span>
                </div>
                @if (isOpen(n.id) || filter()) { <ng-container *ngTemplateOutlet="branch; context: { $implicit: n.children, siblings: n.children }" /> }
              }
            }
          </ng-template>
          <ng-container *ngTemplateOutlet="branch; context: { $implicit: tree.tree(), siblings: tree.tree() }" />
        </div>
      </div>

      <div class="eg-card eg-card-pad form-card">
        @if (form(); as f) {
          <h5 class="fw-800">{{ f.id ? 'Edit category' : 'New category' }}</h5>
          <label class="form-label mt-2">Inside (parent)</label>
          <app-node-select [value]="f.parentId" (valueChange)="f.parentId = $event" [allowNone]="true" placeholder="— top level (stream) —" />
          <div class="row g-2 mt-1">
            <div class="col-7"><label class="form-label">Name *</label><input class="form-control" [(ngModel)]="f.name" maxlength="150" placeholder="e.g. Semester III"></div>
            <div class="col-5"><label class="form-label">Level type *</label>
              <select class="form-select" [(ngModel)]="f.typeId">@for (t of tree.nodeTypes(); track t.id) { <option [ngValue]="t.id">{{ t.label }}</option> }</select></div>
          </div>
          <div class="row g-2 mt-1">
            <div class="col-6"><label class="form-label">Short name</label><input class="form-control" [(ngModel)]="f.shortName" maxlength="60" placeholder="e.g. Sem III"></div>
            <div class="col-6"><label class="form-label">URL slug</label><input class="form-control" [(ngModel)]="f.slug" placeholder="auto"></div>
          </div>
          <label class="form-label mt-2">Description</label>
          <textarea class="form-control" rows="2" [(ngModel)]="f.description" maxlength="1000"></textarea>
          <div class="row g-2 mt-1">
            <div class="col-6"><label class="form-label">Icon (emoji or bi-*)</label>
              <div class="input-group"><span class="input-group-text"><app-icon [name]="f.icon" fallback="📂" /></span><input class="form-control" [(ngModel)]="f.icon" placeholder="📐 or bi-book"></div>
              <div class="emojis">@for (e of emojis; track e) { <button type="button" (click)="f.icon = e">{{ e }}</button> }</div>
            </div>
            <div class="col-6"><label class="form-label">Colour</label>
              <div class="d-flex gap-2"><input type="color" class="form-control form-control-color" [(ngModel)]="f.color"><input class="form-control" [(ngModel)]="f.color" placeholder="#6C3BFF"></div>
              <div class="swatches">@for (c of colors; track c) { <button type="button" [style.background]="c" (click)="f.color = c" [attr.aria-label]="c"></button> }</div>
            </div>
          </div>
          <label class="form-label mt-2">Cover image</label>
          <div class="d-flex gap-2 align-items-center">@if (f.coverImage) { <img [src]="f.coverImage" alt="" class="thumb"> } <app-media-picker (picked)="f.coverImage = $event.url" /></div>
          <div class="d-flex gap-4 mt-3">
            <label class="form-check form-switch"><input class="form-check-input" type="checkbox" [(ngModel)]="f.active"> <span class="small fw-bold">Visible to students</span></label>
            <label class="form-check form-switch"><input class="form-check-input" type="checkbox" [(ngModel)]="f.featured"> <span class="small fw-bold">Quick link on home</span></label>
          </div>
          <div class="d-flex gap-2 mt-3">
            <button class="btn btn-primary" (click)="save()">{{ f.id ? 'Save changes' : 'Create' }}</button>
            @if (f.id) {
              <button class="btn btn-ghost" (click)="newNode({ id: f.id, typeId: f.typeId, color: f.color })">Add sub-category</button>
              <a class="btn btn-ghost" [href]="'/explore/' + f.slug" target="_blank"><i class="bi bi-box-arrow-up-right"></i></a>
              <button class="btn btn-ghost text-danger ms-auto" (click)="remove(f)"><i class="bi bi-trash"></i></button>
            }
          </div>
        } @else {
          <div class="text-center text-muted py-5"><div style="font-size:42px">🗂️</div><p>Select a category to edit,<br>or click <b>+</b> on a row to add inside it.</p></div>
        }
      </div>
    </div>
  `,
  styles: [`
    .layout { display: grid; grid-template-columns: minmax(0, 1fr) 420px; gap: 18px; align-items: start; }
    @media (max-width: 1199px) { .layout { grid-template-columns: 1fr; } }
    .tree-card { overflow: hidden; } .tools { display: flex; gap: 8px; padding: 10px; border-bottom: 1px solid var(--eg-border); input { max-width: 260px; } }
    .tree { max-height: calc(100vh - 230px); overflow: auto; padding: 6px; }
    .row-n { display: flex; align-items: center; gap: 6px; padding: 4px 8px; border-radius: 10px; }
    .row-n:hover { background: var(--eg-surface-2); } .row-n.sel { background: rgba(108,59,255,.1); } .row-n.off .nm { opacity: .55; }
    .tg { border: 0; background: none; width: 22px; color: var(--eg-muted); padding: 0; }
    .ic { width: 26px; text-align: center; font-size: 17px; }
    .nm { border: 0; background: none; text-align: left; font-weight: 700; color: var(--eg-text); padding: 2px 0; flex: 1; min-width: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; small { color: var(--eg-muted); font-weight: 500; font-size: .7rem; margin-left: 4px; } }
    .cnt { font-size: .7rem; font-weight: 800; padding: 1px 7px; border-radius: 99px; background: var(--eg-surface-2); color: var(--eg-text-2); }
    .acts { display: flex; gap: 2px; opacity: 0; } .row-n:hover .acts, .row-n.sel .acts { opacity: 1; }
    .acts button { border: 0; background: var(--eg-surface); width: 26px; height: 26px; border-radius: 8px; color: var(--eg-text-2); font-size: .8rem; } .acts button:disabled { opacity: .3; }
    .form-card { position: sticky; top: 76px; }
    .emojis, .swatches { display: flex; flex-wrap: wrap; gap: 3px; margin-top: 6px; }
    .emojis button { border: 0; background: var(--eg-surface-2); border-radius: 7px; width: 28px; height: 28px; font-size: 15px; padding: 0; }
    .swatches button { width: 22px; height: 22px; border-radius: 7px; border: 2px solid var(--eg-surface); box-shadow: 0 0 0 1px var(--eg-border); }
    .thumb { width: 64px; height: 40px; object-fit: cover; border-radius: 8px; }
  `],
})
export class CatalogComponent implements OnInit {
  private api = inject(ApiService);
  private toast = inject(ToastrService);
  private confirm = inject(ConfirmService);
  tree = inject(AdminTreeService);
  form = signal<NodeForm | null>(null);
  filter = signal('');
  private open = signal(new Set<number>());
  emojis = ['📘', '📐', '🔬', '🧪', '🧲', '⚗️', '🧬', '📖', 'अ', '🌏', '💻', '⚙️', '🔌', '🩺', '💼', '🧾', '💰', '🎯', '🏛️', '🎒', '🏆', '📊', '🧠', '📰'];
  colors = ['#6C3BFF', '#FF3D7F', '#FF8A00', '#00B8A9', '#2F80ED', '#9B51E0', '#27AE60', '#EB5757', '#B7791F', '#0EA5E9'];

  ngOnInit() {
    this.tree.loadTypes();
    this.reload();
  }

  reload() {
    this.tree.load().subscribe();
  }

  isOpen(id: number) { return this.open().has(id); }
  toggle(id: number) {
    const s = new Set(this.open());
    s.has(id) ? s.delete(id) : s.add(id);
    this.open.set(s);
  }
  expandAll(on: boolean) {
    this.open.set(on ? new Set(this.tree.flat().map(f => f.id)) : new Set());
  }

  visible(n: TreeNode): boolean {
    const f = this.filter().trim().toLowerCase();
    if (!f) return true;
    const match = (x: TreeNode): boolean => x.name.toLowerCase().includes(f) || x.children.some(match);
    return match(n);
  }

  edit(n: TreeNode) {
    this.form.set({ id: n.id, parentId: n.parentId ?? null, typeId: n.typeId, name: n.name, shortName: n.shortName || '', slug: n.slug, description: n.description || '',
      icon: n.icon || '', color: n.color || '', coverImage: n.coverImage || '', sortOrder: n.sortOrder, active: n.active, featured: n.featured });
  }

  /** New child of `parent` (or a new stream). Suggests the next level type, e.g. Program → Semester → Subject. */
  newNode(parent: { id: number; typeId: number | null; color?: string } | null) {
    const types = this.tree.nodeTypes();
    let typeId = types[0]?.id ?? null;
    if (parent) {
      const idx = types.findIndex(t => t.id === parent.typeId);
      const subject = types.find(t => t.code === 'SUBJECT');
      typeId = (idx >= 0 && types[idx + 1]?.id) || subject?.id || typeId;
      const s = new Set(this.open()); s.add(parent.id); this.open.set(s);
    }
    const siblings = parent ? this.findNode(parent.id)?.children.length ?? 0 : this.tree.tree().length;
    this.form.set({ parentId: parent?.id ?? null, typeId, name: '', shortName: '', slug: '', description: '', icon: '', color: parent?.color || '', coverImage: '', sortOrder: siblings, active: true, featured: false });
  }

  private findNode(id: number, nodes = this.tree.tree()): TreeNode | undefined {
    for (const n of nodes) { if (n.id === id) return n; const r = this.findNode(id, n.children); if (r) return r; }
    return undefined;
  }

  save() {
    const f = this.form()!;
    if (!f.name.trim() || !f.typeId) { this.toast.warning('Name and level type are required.'); return; }
    const body = { ...f, slug: f.id ? f.slug : (f.slug || null) };
    const req = f.id ? this.api.put<any>(`/admin/catalog/nodes/${f.id}`, body) : this.api.post<any>('/admin/catalog/nodes', body);
    req.subscribe(v => {
      this.toast.success(f.id ? 'Saved' : 'Created');
      this.tree.load().subscribe(() => { const n = this.findNode(v.id); if (n) this.edit(n); });
    });
  }

  move(siblings: TreeNode[], i: number, dir: number) {
    const list = [...siblings];
    const [item] = list.splice(i, 1);
    list.splice(i + dir, 0, item);
    this.api.post('/admin/catalog/nodes/reorder', list.map((n, idx) => ({ id: n.id, parentId: n.parentId ?? null, sortOrder: idx }))).subscribe(() => this.reload());
  }

  async remove(f: NodeForm) {
    if (!(await this.confirm.ask('Delete category?', `“${f.name}” will be removed. It must have no sub-categories, posts or quizzes. To hide it instead, switch off “Visible”.`, { danger: true, confirmText: 'Delete' }))) return;
    this.api.delete(`/admin/catalog/nodes/${f.id}`).subscribe(() => { this.toast.success('Deleted'); this.form.set(null); this.reload(); });
  }
}
