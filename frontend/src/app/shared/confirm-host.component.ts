import { Component, HostListener, inject } from '@angular/core';
import { ConfirmService } from '../core/confirm.service';

@Component({
  selector: 'app-confirm-host',
  standalone: true,
  template: `
    @if (c.current(); as req) {
      <div class="eg-backdrop" (click)="c.close(false)">
        <div class="eg-modal p-4" role="alertdialog" aria-modal="true" (click)="$event.stopPropagation()">
          <div class="d-flex gap-3 align-items-start">
            <div class="ico" [class.danger]="req.danger"><i class="bi" [class.bi-exclamation-triangle-fill]="req.danger" [class.bi-question-circle-fill]="!req.danger"></i></div>
            <div>
              <h5 class="mb-1 fw-800">{{ req.title }}</h5>
              <p class="text-2 mb-0">{{ req.message }}</p>
            </div>
          </div>
          <div class="d-flex justify-content-end gap-2 mt-4">
            <button class="btn btn-ghost" (click)="c.close(false)">Cancel</button>
            <button class="btn" [class.btn-danger]="req.danger" [class.btn-primary]="!req.danger" (click)="c.close(true)">{{ req.confirmText || 'Confirm' }}</button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`.ico { width: 44px; height: 44px; border-radius: 14px; display: grid; place-items: center; background: rgba(108,59,255,.12); color: #6c3bff; font-size: 20px; flex: none; } .ico.danger { background: rgba(229,57,90,.12); color: #e5395a; }`],
})
export class ConfirmHostComponent {
  c = inject(ConfirmService);
  @HostListener('document:keydown.escape') esc() { if (this.c.current()) this.c.close(false); }
}
