import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { ApiService } from '../../core/api.service';
import { ConfirmService } from '../../core/confirm.service';
import { ContentType, NodeType } from '../../core/models';
import { IconComponent } from '../../shared/icon.component';
import { AdminTreeService } from '../shared/admin-tree.service';
import { PageHeaderComponent } from '../shared/page-header.component';

/** Configurable vocabularies: level types (Stream, Class, Semester…) and content types (Notes, Old Questions…). */
@Component({
  selector: 'app-types',
  standalone: true,
  imports: [FormsModule, PageHeaderComponent, IconComponent],
  template: `
    <app-page-header title="Types & levels" subtitle="Name the levels of your catalog and the kinds of material you publish." />
    <div class="row g-4">
      <div class="col-xl-6">
        <div class="eg-card eg-card-pad">
          <h5 class="fw-800">Content types</h5>
          <p class="small text-muted">Students filter by these on every subject page (Notes, Solutions, Old Questions…).</p>
          <table class="table align-middle">
            <thead><tr><th></th><th>Name</th><th>Code</th><th>Order</th><th>On</th><th></th></tr></thead>
            <tbody>
              @for (t of ctypes; track t.id) {
                <tr>
                  <td><span class="sw" [style.background]="t.color"><app-icon [name]="t.icon" /></span></td>
                  <td><input class="form-control form-control-sm" [(ngModel)]="t.name"></td>
                  <td><input class="form-control form-control-sm mono" [(ngModel)]="t.code" style="width:130px"></td>
                  <td><input class="form-control form-control-sm" type="number" [(ngModel)]="t.sortOrder" style="width:70px"></td>
                  <td><input class="form-check-input" type="checkbox" [(ngModel)]="t.active"></td>
                  <td class="text-nowrap">
                    <input type="color" class="form-control form-control-color d-inline-block" [(ngModel)]="t.color" style="width:34px;height:32px;padding:2px">
                    <input class="form-control form-control-sm d-inline-block" [(ngModel)]="t.icon" style="width:110px" placeholder="bi-journal">
                    <button class="btn btn-soft btn-sm" (click)="saveCt(t)"><i class="bi bi-check-lg"></i></button>
                    <button class="btn btn-ghost btn-sm text-danger" (click)="delCt(t)"><i class="bi bi-trash"></i></button>
                  </td>
                </tr>
              }
            </tbody>
          </table>
          <div class="d-flex gap-2"><input class="form-control" [(ngModel)]="newCt" placeholder="New type, e.g. Practical Notes"><button class="btn btn-primary" (click)="addCt()">Add</button></div>
        </div>
      </div>
      <div class="col-xl-6">
        <div class="eg-card eg-card-pad">
          <h5 class="fw-800">Level types</h5>
          <p class="small text-muted">What each level of the tree is called. Order decides which type is suggested for a new sub-category.</p>
          <table class="table align-middle">
            <thead><tr><th>Label</th><th>Code</th><th>Icon</th><th>Order</th><th></th></tr></thead>
            <tbody>
              @for (t of ntypes; track t.id) {
                <tr>
                  <td><input class="form-control form-control-sm" [(ngModel)]="t.label"></td>
                  <td><input class="form-control form-control-sm mono" [(ngModel)]="t.code" style="width:120px"></td>
                  <td><input class="form-control form-control-sm" [(ngModel)]="t.icon" style="width:120px"></td>
                  <td><input class="form-control form-control-sm" type="number" [(ngModel)]="t.sortOrder" style="width:70px"></td>
                  <td class="text-nowrap"><button class="btn btn-soft btn-sm" (click)="saveNt(t)"><i class="bi bi-check-lg"></i></button> <button class="btn btn-ghost btn-sm text-danger" (click)="delNt(t)"><i class="bi bi-trash"></i></button></td>
                </tr>
              }
            </tbody>
          </table>
          <div class="d-flex gap-2"><input class="form-control" [(ngModel)]="newNt" placeholder="New level, e.g. Unit"><button class="btn btn-primary" (click)="addNt()">Add</button></div>
        </div>
      </div>
    </div>
  `,
  styles: [`.sw { width: 30px; height: 30px; border-radius: 9px; display: inline-grid; place-items: center; color: #fff; }`],
})
export class TypesComponent implements OnInit {
  private api = inject(ApiService);
  private toast = inject(ToastrService);
  private confirm = inject(ConfirmService);
  private tree = inject(AdminTreeService);
  ctypes: ContentType[] = [];
  ntypes: NodeType[] = [];
  newCt = '';
  newNt = '';

  ngOnInit() { this.load(); }

  load() {
    this.api.get<ContentType[]>('/admin/catalog/content-types').subscribe(t => (this.ctypes = t));
    this.api.get<NodeType[]>('/admin/catalog/node-types').subscribe(t => (this.ntypes = t));
    this.tree.loadTypes();
  }

  saveCt(t: ContentType) { this.api.put(`/admin/catalog/content-types/${t.id}`, t).subscribe(() => { this.toast.success('Saved'); this.load(); }); }
  addCt() {
    if (!this.newCt.trim()) return;
    this.api.post('/admin/catalog/content-types', { name: this.newCt, code: this.newCt.toUpperCase().replace(/[^A-Z0-9]+/g, '_'), icon: 'bi-journal', color: '#6C3BFF', sortOrder: this.ctypes.length, active: true })
      .subscribe(() => { this.newCt = ''; this.load(); });
  }
  async delCt(t: ContentType) {
    if (await this.confirm.ask('Delete content type?', `“${t.name}” can only be deleted if no posts use it.`, { danger: true, confirmText: 'Delete' }))
      this.api.delete(`/admin/catalog/content-types/${t.id}`).subscribe(() => this.load());
  }
  saveNt(t: NodeType) { this.api.put(`/admin/catalog/node-types/${t.id}`, t).subscribe(() => { this.toast.success('Saved'); this.load(); }); }
  addNt() {
    if (!this.newNt.trim()) return;
    this.api.post('/admin/catalog/node-types', { label: this.newNt, code: this.newNt.toUpperCase().replace(/[^A-Z0-9]+/g, '_'), sortOrder: this.ntypes.length }).subscribe(() => { this.newNt = ''; this.load(); });
  }
  async delNt(t: NodeType) {
    if (await this.confirm.ask('Delete level type?', `“${t.label}” can only be deleted if no category uses it.`, { danger: true, confirmText: 'Delete' }))
      this.api.delete(`/admin/catalog/node-types/${t.id}`).subscribe(() => this.load());
  }
}
