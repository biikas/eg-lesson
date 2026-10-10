import { Injectable, inject, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { ApiService } from '../../core/api.service';
import { ContentType, NodeType, TreeNode } from '../../core/models';
import { SiteService } from '../../core/site.service';

export interface FlatNode { id: number; label: string; name: string; typeCode: string; typeLabel: string; depth: number; active: boolean; icon?: string; }

/** Full catalog (including hidden categories) and lookups, shared across admin screens. */
@Injectable({ providedIn: 'root' })
export class AdminTreeService {
  private api = inject(ApiService);
  readonly tree = signal<TreeNode[]>([]);
  readonly flat = signal<FlatNode[]>([]);
  readonly contentTypes = signal<ContentType[]>([]);
  readonly nodeTypes = signal<NodeType[]>([]);

  load(): Observable<TreeNode[]> {
    return this.api.get<TreeNode[]>('/admin/catalog/tree').pipe(tap(t => {
      this.tree.set(t);
      this.flat.set(SiteService.flatten(t).map(x => ({
        id: x.node.id, label: x.label, name: x.node.name, typeCode: x.node.typeCode, typeLabel: x.node.typeLabel,
        depth: x.node.depth, active: x.node.active, icon: x.node.icon,
      })));
    }));
  }

  ensure() {
    if (!this.tree().length) this.load().subscribe();
    if (!this.contentTypes().length) this.loadTypes();
  }

  loadTypes() {
    this.api.get<ContentType[]>('/admin/catalog/content-types').subscribe(t => this.contentTypes.set(t));
    this.api.get<NodeType[]>('/admin/catalog/node-types').subscribe(t => this.nodeTypes.set(t));
  }

  label(id?: number | null): string {
    return this.flat().find(f => f.id === id)?.label ?? '';
  }
}
