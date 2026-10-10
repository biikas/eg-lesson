import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { AdminAuthService } from '../../core/admin-auth.service';

@Component({
  selector: 'app-admin-password',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="eg-card eg-card-pad" style="max-width:480px">
      <h1 class="h3 fw-800">Change password</h1>
      @if (auth.me()?.mustChangePassword) { <div class="alert alert-info">For security, set your own password before using the portal.</div> }
      <label class="form-label">Current password</label>
      <input class="form-control mb-3" type="password" [(ngModel)]="current" autocomplete="current-password">
      <label class="form-label">New password</label>
      <input class="form-control mb-1" type="password" [(ngModel)]="next" autocomplete="new-password">
      <div class="form-text mb-3">At least 8 characters. Use a mix of letters, numbers and symbols.</div>
      <label class="form-label">Repeat new password</label>
      <input class="form-control mb-4" type="password" [(ngModel)]="repeat" autocomplete="new-password">
      <div class="d-flex gap-2">
        <button class="btn btn-primary" (click)="save()">Update password</button>
        <button class="btn btn-ghost" (click)="auth.logout()">Sign out</button>
      </div>
    </div>
  `,
})
export class AdminPasswordComponent {
  auth = inject(AdminAuthService);
  private toast = inject(ToastrService);
  private router = inject(Router);
  current = '';
  next = '';
  repeat = '';

  save() {
    if (this.next.length < 8) { this.toast.warning('New password must be at least 8 characters.'); return; }
    if (this.next !== this.repeat) { this.toast.warning('The new passwords do not match.'); return; }
    this.auth.changePassword(this.current, this.next).subscribe(me => {
      this.toast.success('Password updated');
      this.router.navigateByUrl(me.permissions.includes('DASHBOARD') ? '/admin' : '/admin/posts');
    });
  }
}
