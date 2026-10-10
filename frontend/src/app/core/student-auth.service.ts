import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { ApiService } from './api.service';
import { StudentMe, StudentSession } from './models';
import { store } from './storage';

@Injectable({ providedIn: 'root' })
export class StudentAuthService {
  private api = inject(ApiService);
  private router = inject(Router);
  private readonly tokenKey = 'eg.student.token';
  private readonly meKey = 'eg.student.me';

  readonly me = signal<StudentMe | null>(store.json<StudentMe | null>(this.meKey, null));
  readonly loggedIn = computed(() => this.me() !== null && !!this.token());
  /** Opens the sign-in sheet from anywhere (e.g. tapping "like" as a guest). */
  readonly promptOpen = signal(false);
  promptReason = '';

  token(): string | null {
    return store.get(this.tokenKey);
  }

  private save(s: StudentSession) {
    store.set(this.tokenKey, s.token);
    this.setMe(s.student);
  }

  setMe(me: StudentMe) {
    store.set(this.meKey, JSON.stringify(me));
    this.me.set(me);
  }

  login(login: string, password: string): Observable<StudentSession> {
    return this.api.post<StudentSession>('/auth/student/login', { login, password }).pipe(tap(s => this.save(s)));
  }

  register(body: { fullName: string; email?: string; phone?: string; password: string; courseNodeId?: number | null }): Observable<StudentSession> {
    return this.api.post<StudentSession>('/auth/student/register', body).pipe(tap(s => this.save(s)));
  }

  refresh() {
    if (!this.token()) return;
    this.api.get<StudentMe>('/student/me').subscribe({ next: me => this.setMe(me), error: () => {} });
  }

  logout(redirect = true) {
    store.remove(this.tokenKey);
    store.remove(this.meKey);
    this.me.set(null);
    if (redirect) this.router.navigateByUrl('/');
  }

  /** Returns true when signed in; otherwise opens the sign-in prompt. */
  require(reason: string): boolean {
    if (this.loggedIn()) return true;
    this.promptReason = reason;
    this.promptOpen.set(true);
    return false;
  }
}
