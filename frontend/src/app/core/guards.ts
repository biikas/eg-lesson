import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AdminAuthService } from './admin-auth.service';
import { StudentAuthService } from './student-auth.service';

export const studentGuard: CanActivateFn = (_route, state) => {
  const auth = inject(StudentAuthService);
  return auth.loggedIn() ? true : inject(Router).createUrlTree(['/login'], { queryParams: { next: state.url } });
};

export const adminGuard: CanActivateFn = (route, state) => {
  const auth = inject(AdminAuthService);
  const router = inject(Router);
  const me = auth.me();
  if (!me || !auth.token()) return router.createUrlTree(['/admin/login'], { queryParams: { next: state.url } });
  if (me.mustChangePassword && !state.url.startsWith('/admin/password')) return router.createUrlTree(['/admin/password']);
  const perms = route.data?.['perms'] as string[] | undefined;
  if (perms && !auth.can(...perms)) return router.createUrlTree(['/admin']);
  return true;
};
