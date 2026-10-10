import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { AdminAuthService } from '../../core/admin-auth.service';

@Component({
  selector: 'app-admin-login',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="wrap">
      <form class="card-l" (submit)="$event.preventDefault(); submit()">
        <img src="assets/logo.svg" alt="" width="56" height="56">
        <h1>Admin portal</h1>
        <p class="text-muted">Sign in to manage notes, notices and the community.</p>
        <label class="form-label">Username</label>
        <input class="form-control mb-3" [(ngModel)]="username" name="u" autocomplete="username" autofocus required>
        <label class="form-label">Password</label>
        <input class="form-control mb-4" type="password" [(ngModel)]="password" name="p" autocomplete="current-password" required>
        <button class="btn btn-grad btn-lg w-100" [disabled]="busy()">{{ busy() ? 'Signing in…' : 'Sign in' }}</button>
      </form>
    </div>
  `,
  styles: [`.wrap { min-height: 100vh; display: grid; place-items: center; padding: 16px; background: radial-gradient(60% 60% at 20% 10%, rgba(108,59,255,.35), transparent), radial-gradient(50% 50% at 90% 90%, rgba(255,61,127,.3), transparent), #0c0a1a; }
    .card-l { width: min(420px, 100%); background: var(--eg-surface); border-radius: 26px; padding: 34px; box-shadow: 0 40px 80px -20px rgba(0,0,0,.6); }
    img { border-radius: 16px; } h1 { font-size: 1.6rem; margin: 16px 0 4px; }`],
})
export class AdminLoginComponent {
  private auth = inject(AdminAuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private toast = inject(ToastrService);
  username = '';
  password = '';
  busy = signal(false);

  submit() {
    if (!this.username || !this.password) return;
    this.busy.set(true);
    this.auth.login(this.username.trim(), this.password).subscribe({
      next: s => {
        this.busy.set(false);
        if (s.admin.mustChangePassword) {
          this.toast.info('Please set a new password to continue.');
          this.router.navigateByUrl('/admin/password');
        } else {
          const next = this.route.snapshot.queryParamMap.get('next');
          this.router.navigateByUrl(next?.startsWith('/admin') ? next : '/admin');
        }
      },
      error: () => this.busy.set(false),
    });
  }
}
