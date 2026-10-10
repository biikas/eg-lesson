import { Injectable, signal } from '@angular/core';

export interface ConfirmRequest { title: string; message: string; confirmText?: string; danger?: boolean; resolve: (ok: boolean) => void; }

/** Promise-based confirm dialog (rendered once by <app-confirm-host>) — like mbank's verify-alert. */
@Injectable({ providedIn: 'root' })
export class ConfirmService {
  readonly current = signal<ConfirmRequest | null>(null);

  ask(title: string, message: string, opts: { confirmText?: string; danger?: boolean } = {}): Promise<boolean> {
    return new Promise(resolve => this.current.set({ title, message, ...opts, resolve }));
  }

  close(ok: boolean) {
    const c = this.current();
    this.current.set(null);
    c?.resolve(ok);
  }
}
