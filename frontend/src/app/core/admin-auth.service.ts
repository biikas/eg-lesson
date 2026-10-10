import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { ApiService } from './api.service';
import { AdminMe, AdminSession } from './models';
import { store } from './storage';

@Injectable({ providedIn: 'root' })
export class AdminAuthService {
  private api = inject(ApiService);
  private router = inject(Router);
  private readonly tokenKey = 'eg.admin.token';
  private readonly meKey = 'eg.admin.me';

  readonly me = signal<AdminMe | null>(store.json<AdminMe | null>(this.meKey, null));
  readonly loggedIn = computed(() => this.me() !== null && !!this.token());

  token(): string | null {
    return store.get(this.tokenKey);
  }

  can(...perms: string[]): boolean {
    const me = this.me();
    return !!me && perms.some(p => me.permissions.includes(p));
  }

  private setMe(me: AdminMe) {
    store.set(this.meKey, JSON.stringify(me));
    this.me.set(me);
  }

  login(username: string, password: string): Observable<AdminSession> {
    return this.api.post<AdminSession>('/auth/admin/login', { username, password }).pipe(tap(s => {
      store.set(this.tokenKey, s.token);
      this.setMe(s.admin);
    }));
  }

  changePassword(currentPassword: string, newPassword: string): Observable<AdminMe> {
    return this.api.post<AdminMe>('/admin/me/password', { currentPassword, newPassword }).pipe(tap(me => this.setMe(me)));
  }

  refresh(): Observable<AdminMe> {
    return this.api.get<AdminMe>('/admin/me').pipe(tap(me => this.setMe(me)));
  }

  logout() {
    store.remove(this.tokenKey);
    store.remove(this.meKey);
    this.me.set(null);
    this.router.navigateByUrl('/admin/login');
  }
}
