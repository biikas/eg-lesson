import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { StudentAuthService } from '../../core/student-auth.service';
import { CoursePickerComponent } from '../../shared/course-picker.component';

@Component({
  selector: 'app-auth',
  standalone: true,
  imports: [FormsModule, RouterLink, CoursePickerComponent],
  template: `
    <div class="container-xl pt-4">
      <div class="wrap">
        <div class="art d-none d-lg-flex">
          <div class="emojis"><span>📐</span><span>🧪</span><span>📖</span><span>⚙️</span><span>🩺</span><span>💻</span></div>
          <h2>Study smarter, not longer.</h2>
          <ul>
            <li><i class="bi bi-bookmark-heart-fill"></i> Save notes for revision night</li>
            <li><i class="bi bi-fire"></i> Daily streaks keep you consistent</li>
            <li><i class="bi bi-graph-up-arrow"></i> Track quiz scores over time</li>
            <li><i class="bi bi-send-fill"></i> Request any chapter you need</li>
          </ul>
        </div>
        <div class="eg-card form-card">
          <div class="tabs">
            <a routerLink="/login" [class.on]="mode === 'login'" queryParamsHandling="preserve">Sign in</a>
            <a routerLink="/register" [class.on]="mode === 'register'" queryParamsHandling="preserve">Create account</a>
          </div>
          @if (mode === 'login') {
            <form (submit)="$event.preventDefault(); login()">
              <h1>Welcome back 👋</h1>
              <div class="mb-3"><label class="form-label">Email or mobile number</label><input class="form-control" [(ngModel)]="loginId" name="login" autocomplete="username" placeholder="98XXXXXXXX or you@email.com" required></div>
              <div class="mb-3"><label class="form-label">Password</label><input class="form-control" type="password" [(ngModel)]="password" name="password" autocomplete="current-password" required></div>
              <button class="btn btn-grad btn-lg w-100" [disabled]="busy()">{{ busy() ? 'Signing in…' : 'Sign in' }}</button>
              <p class="small text-muted mt-3 mb-0">Forgot your password? Message us from the contact in the footer and we'll reset it.</p>
            </form>
          } @else {
            <form (submit)="$event.preventDefault(); register()">
              <h1>Join for free ✨</h1>
              <div class="mb-3"><label class="form-label">Full name</label><input class="form-control" [(ngModel)]="fullName" name="fullName" autocomplete="name" required maxlength="120"></div>
              <div class="row g-2 mb-1">
                <div class="col-sm-6"><label class="form-label">Mobile number</label><input class="form-control" [(ngModel)]="phone" name="phone" inputmode="numeric" placeholder="98XXXXXXXX" maxlength="10"></div>
                <div class="col-sm-6"><label class="form-label">or Email</label><input class="form-control" type="email" [(ngModel)]="email" name="email" placeholder="you@email.com"></div>
              </div>
              <div class="form-text mb-3">One of the two is enough — you'll sign in with it.</div>
              <div class="mb-3"><label class="form-label">Password</label><input class="form-control" type="password" [(ngModel)]="password" name="password" autocomplete="new-password" minlength="6" required placeholder="At least 6 characters"></div>
              <div class="mb-3">
                <label class="form-label">What do you study? <span class="text-muted fw-normal">(optional — personalises your home page)</span></label>
                <app-course-picker [value]="courseNodeId" (valueChange)="courseNodeId = $event" />
              </div>
              <button class="btn btn-grad btn-lg w-100" [disabled]="busy()">{{ busy() ? 'Creating…' : 'Create my account' }}</button>
            </form>
          }
        </div>
      </div>
    </div>
  `,
  styles: [`
    .wrap { display: grid; grid-template-columns: 1fr; gap: 28px; max-width: 1020px; margin: 0 auto; align-items: stretch; }
    @media (min-width: 992px) { .wrap { grid-template-columns: 1fr 1.1fr; } }
        .art { flex-direction: column; justify-content: center; padding: 40px; border-radius: 28px; color: #fff; background: var(--eg-grad); box-shadow: var(--eg-shadow-lg);
      h2 { color: #fff; font-size: 2.2rem; margin: 18px 0; } ul { list-style: none; padding: 0; margin: 0; } li { padding: 7px 0; font-weight: 600; font-size: 1.05rem; } i { margin-right: 10px; }
      .emojis { display: flex; gap: 10px; flex-wrap: wrap; span { width: 54px; height: 54px; border-radius: 18px; display: grid; place-items: center; background: rgba(255,255,255,.2); font-size: 28px; animation: eg-float 4s ease-in-out infinite; } span:nth-child(2n) { animation-delay: -2s; } } }
    .form-card { padding: 28px; h1 { font-size: 1.7rem; margin: 18px 0 18px; } }
    .tabs { display: flex; background: var(--eg-surface-2); padding: 4px; border-radius: 14px; a { flex: 1; text-align: center; padding: 9px; border-radius: 11px; font-weight: 800; color: var(--eg-text-2); } a.on { background: var(--eg-surface); color: var(--eg-text); box-shadow: var(--eg-shadow); } }
  `],
})
export class AuthComponent implements OnInit {
  private auth = inject(StudentAuthService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private toast = inject(ToastrService);
  mode: 'login' | 'register' = 'login';
  busy = signal(false);
  loginId = '';
  password = '';
  fullName = '';
  phone = '';
  email = '';
  courseNodeId: number | null = null;

  ngOnInit() {
    this.route.url.subscribe(u => (this.mode = u[0]?.path === 'register' ? 'register' : 'login'));
    if (this.auth.loggedIn()) this.done();
  }

  private done() {
    const next = this.route.snapshot.queryParamMap.get('next');
    this.router.navigateByUrl(next && next.startsWith('/') && !next.startsWith('//') ? next : '/me');
  }

  login() {
    if (!this.loginId.trim() || !this.password) return;
    this.busy.set(true);
    this.auth.login(this.loginId.trim(), this.password).subscribe({
      next: s => { this.busy.set(false); this.toast.success(`Welcome back, ${s.student.fullName.split(' ')[0]}!`); this.done(); },
      error: () => this.busy.set(false),
    });
  }

  register() {
    if (!this.fullName.trim() || !this.password) return;
    if (!this.phone.trim() && !this.email.trim()) { this.toast.warning('Enter your mobile number or email.'); return; }
    this.busy.set(true);
    this.auth.register({ fullName: this.fullName.trim(), phone: this.phone.trim() || undefined, email: this.email.trim() || undefined, password: this.password, courseNodeId: this.courseNodeId })
      .subscribe({
        next: () => { this.busy.set(false); this.toast.success('Account created. Happy learning!'); this.done(); },
        error: () => this.busy.set(false),
      });
  }
}
