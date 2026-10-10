import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { catchError, throwError } from 'rxjs';
import { AdminAuthService } from './admin-auth.service';
import { StudentAuthService } from './student-auth.service';

/**
 * Admin endpoints carry the admin token; everything else carries the student token, falling back to the admin
 * token so editors can preview drafts on the public reader. Errors become toasts.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const admin = inject(AdminAuthService);
  const student = inject(StudentAuthService);
  const toast = inject(ToastrService);
  const isAdminCall = req.url.startsWith('/api/admin');
  const token = isAdminCall ? admin.token() : (student.token() ?? (req.url.startsWith('/api/public') ? admin.token() : null));
  const authed = token ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : req;
  const silent = req.url.includes('/view') || req.url.includes('/progress') || req.url.includes('/promos/') || req.url.includes('/suggest');

  return next(authed).pipe(catchError((err: HttpErrorResponse) => {
    const message = err.error?.message || (err.status === 0 ? 'No connection. Check your internet and try again.' : 'Something went wrong.');
    if (err.status === 401) {
      if (isAdminCall) admin.logout();
      else if (req.url.startsWith('/api/student')) {
        student.logout(false);
        student.require('Your session ended. Please sign in again.');
      } else if (!silent) toast.info(message);
    } else if (!silent && err.status !== 404) {
      toast.error(message);
    }
    return throwError(() => err);
  }));
};
