import { Injectable, inject, signal } from '@angular/core';
import { ApiService } from './api.service';
import { TreeNode } from './models';
import { store } from './storage';

/** Site settings, the catalog tree (cached for the session) and the light/dark theme. */
@Injectable({ providedIn: 'root' })
export class SiteService {
  private api = inject(ApiService);
  readonly settings = signal<Record<string, string>>({ 'site.name': 'eglesson' });
  readonly tree = signal<TreeNode[] | null>(null);
  readonly theme = signal<'light' | 'dark' | null>((store.get('eg.theme') as 'light' | 'dark' | null) ?? null);
  private treeLoading = false;

  load() {
    this.api.get<Record<string, string>>('/public/settings').subscribe({ next: s => this.settings.set(s), error: () => {} });
  }

  loadTree(force = false) {
    if ((this.tree() && !force) || this.treeLoading) return;
    this.treeLoading = true;
    this.api.get<TreeNode[]>('/public/catalog/tree').subscribe({
      next: t => { this.tree.set(t); this.treeLoading = false; },
      error: () => (this.treeLoading = false),
    });
  }

  s(key: string): string {
    return this.settings()[key] ?? '';
  }

  isDark(): boolean {
    const t = this.theme();
    if (t) return t === 'dark';
    return typeof matchMedia !== 'undefined' && matchMedia('(prefers-color-scheme: dark)').matches;
  }

  toggleTheme() {
    const next = this.isDark() ? 'light' : 'dark';
    this.theme.set(next);
    store.set('eg.theme', next);
    document.documentElement.setAttribute('data-theme', next);
  }

  /** Flattened list for pickers: "Engineering (IOE) › BE Computer › Semester III". */
  static flatten(nodes: TreeNode[], trail: string[] = [], out: { node: TreeNode; label: string; trail: string[] }[] = []) {
    for (const n of nodes) {
      const t = [...trail, n.shortName || n.name];
      out.push({ node: n, label: t.join(' › '), trail: t });
      SiteService.flatten(n.children, t, out);
    }
    return out;
  }
}
