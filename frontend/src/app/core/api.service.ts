import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ApiResponse } from './models';

type Params = Record<string, string | number | boolean | null | undefined>;

/** Thin wrapper over HttpClient that unwraps the {success, message, data} envelope. */
@Injectable({ providedIn: 'root' })
export class ApiService {
  private http = inject(HttpClient);

  private params(p?: Params): HttpParams {
    let hp = new HttpParams();
    if (p) for (const [k, v] of Object.entries(p)) if (v !== null && v !== undefined && v !== '') hp = hp.set(k, String(v));
    return hp;
  }

  get<T>(url: string, params?: Params): Observable<T> {
    return this.http.get<ApiResponse<T>>('/api' + url, { params: this.params(params) }).pipe(map(r => r.data));
  }

  post<T>(url: string, body: unknown = {}, params?: Params): Observable<T> {
    return this.http.post<ApiResponse<T>>('/api' + url, body, { params: this.params(params) }).pipe(map(r => r.data));
  }

  /** Like post() but keeps the server's message (shown in a toast). */
  postFull<T>(url: string, body: unknown = {}): Observable<ApiResponse<T>> {
    return this.http.post<ApiResponse<T>>('/api' + url, body);
  }

  put<T>(url: string, body: unknown): Observable<T> {
    return this.http.put<ApiResponse<T>>('/api' + url, body).pipe(map(r => r.data));
  }

  patch<T>(url: string, params?: Params): Observable<T> {
    return this.http.patch<ApiResponse<T>>('/api' + url, {}, { params: this.params(params) }).pipe(map(r => r.data));
  }

  delete<T>(url: string): Observable<T> {
    return this.http.delete<ApiResponse<T>>('/api' + url).pipe(map(r => r.data));
  }

  upload<T>(url: string, file: File): Observable<T> {
    const fd = new FormData();
    fd.append('file', file);
    return this.http.post<ApiResponse<T>>('/api' + url, fd).pipe(map(r => r.data));
  }
}
