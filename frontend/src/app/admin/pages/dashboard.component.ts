import { AfterViewInit, Component, ElementRef, OnDestroy, OnInit, ViewChild, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { Chart, registerables } from 'chart.js';
import { AdminAuthService } from '../../core/admin-auth.service';
import { ApiService } from '../../core/api.service';
import { Dashboard } from '../../core/models';
import { CompactNumberPipe, TimeAgoPipe } from '../../shared/pipes';
import { PageHeaderComponent } from '../shared/page-header.component';

Chart.register(...registerables);

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterLink, PageHeaderComponent, CompactNumberPipe, TimeAgoPipe],
  template: `
    <app-page-header title="Dashboard" [subtitle]="'Hello ' + (auth.me()?.fullName || '') + ' — here is how the library is doing.'">
      <select class="form-select form-select-sm w-auto" [value]="days" (change)="days = +$any($event.target).value; load()">
        <option value="7">Last 7 days</option><option value="30">Last 30 days</option><option value="90">Last 90 days</option>
      </select>
    </app-page-header>

    @if (d(); as d) {
      <div class="kpis">
        <div class="kpi k1"><i class="bi bi-eye"></i><b>{{ d.totals['viewsToday'] | compact }}</b><span>reads today</span><small [class.up]="d.totals['viewsToday'] >= d.totals['viewsYesterday']">{{ delta(d.totals['viewsToday'], d.totals['viewsYesterday']) }} vs yesterday</small></div>
        <div class="kpi k2"><i class="bi bi-people"></i><b>{{ d.totals['students'] | compact }}</b><span>students</span><small>+{{ d.totals['newStudentsToday'] }} today · {{ d.totals['activeToday'] }} active</small></div>
        <div class="kpi k3"><i class="bi bi-journal-check"></i><b>{{ d.totals['published'] | compact }}</b><span>published notes</span><small>+{{ d.totals['postsToday'] }} today · {{ d.totals['drafts'] }} drafts</small></div>
        <div class="kpi k4"><i class="bi bi-graph-up"></i><b>{{ d.totals['viewsTotal'] | compact }}</b><span>all-time reads</span><small>{{ d.totals['searchesToday'] }} searches today</small></div>
      </div>

      <div class="todo">
        <a routerLink="/admin/posts" [queryParams]="{ status: 'REVIEW' }" class="t" [class.hot]="d.totals['inReview']"><b>{{ d.totals['inReview'] }}</b> posts waiting for review</a>
        <a routerLink="/admin/comments" [queryParams]="{ status: 'PENDING' }" class="t" [class.hot]="d.totals['pendingComments']"><b>{{ d.totals['pendingComments'] }}</b> comments to moderate</a>
        <a routerLink="/admin/requests" class="t" [class.hot]="d.totals['openRequests']"><b>{{ d.totals['openRequests'] }}</b> open note requests</a>
        <span class="t"><b>{{ d.totals['commentsToday'] }}</b> new comments today</span>
      </div>
    }

    <div class="row g-3 mb-3">
      <div class="col-xl-8"><div class="eg-card eg-card-pad h-100"><h6 class="h">Reads per day</h6><div class="chart"><canvas #views></canvas></div></div></div>
      <div class="col-xl-4"><div class="eg-card eg-card-pad h-100"><h6 class="h">Sign-ups &amp; active students</h6><div class="chart"><canvas #people></canvas></div></div></div>
    </div>

    @if (d(); as d) {
      <div class="row g-3">
        <div class="col-lg-6">
          <div class="eg-card eg-card-pad h-100">
            <h6 class="h">🔥 Top notes this week</h6>
            @for (p of d.topPosts; track p.id; let i = $index) {
              <div class="li"><span class="rank">{{ i + 1 }}</span><a [href]="'/read/' + p.slug" target="_blank" class="flex-grow-1 text-truncate">{{ p.name }}</a><b>{{ p.value | compact }}</b></div>
            } @empty { <p class="text-muted small">No reads yet this week.</p> }
          </div>
        </div>
        <div class="col-lg-6">
          <div class="eg-card eg-card-pad h-100">
            <h6 class="h">✍️ Content team output</h6>
            <div class="row">
              <div class="col-6"><small class="text-muted fw-bold">TODAY</small>
                @for (u of d.uploadsToday; track u.id) { <div class="li"><span class="flex-grow-1">{{ u.name }}</span><b>{{ u.value }}</b></div> } @empty { <p class="text-muted small mt-2">Nothing uploaded yet today.</p> }
              </div>
              <div class="col-6"><small class="text-muted fw-bold">LAST 7 DAYS</small>
                @for (u of d.uploadsWeek; track u.id) { <div class="li"><span class="flex-grow-1">{{ u.name }}</span><b>{{ u.value }}</b></div> } @empty { <p class="text-muted small mt-2">—</p> }
              </div>
            </div>
            <a routerLink="/admin/audit" class="small fw-bold">See full activity log →</a>
          </div>
        </div>
        <div class="col-lg-4">
          <div class="eg-card eg-card-pad h-100">
            <h6 class="h">🔎 What students search</h6>
            @for (s of d.topSearches; track s.name) { <div class="li"><span class="flex-grow-1 text-truncate">{{ s.name }}</span><b>{{ s.value }}</b></div> } @empty { <p class="text-muted small">No searches yet.</p> }
          </div>
        </div>
        <div class="col-lg-4">
          <div class="eg-card eg-card-pad h-100 gap-card">
            <h6 class="h">🚨 Searched but not found <small class="text-muted">(30 days)</small></h6>
            <p class="small text-muted">Write these next — students are looking for them right now.</p>
            @for (s of d.zeroResultSearches; track s.name) { <div class="li"><span class="flex-grow-1 text-truncate">“{{ s.name }}”</span><b>{{ s.value }}×</b></div> } @empty { <p class="text-muted small">Every search found something 🎉</p> }
          </div>
        </div>
        <div class="col-lg-4">
          <div class="eg-card eg-card-pad h-100">
            <h6 class="h">📭 Empty subjects <span class="badge text-bg-warning">{{ d.emptySubjectCount }}</span></h6>
            <p class="small text-muted">Categories with no published material yet.</p>
            <div class="empties">
              @for (g of d.emptySubjects; track g.id) { <a [routerLink]="['/admin/posts/new']" [queryParams]="{ node: g.id }" class="empty-chip" title="Write the first post">{{ g.path }}</a> }
            </div>
          </div>
        </div>
        <div class="col-12">
          <div class="eg-card eg-card-pad">
            <h6 class="h">Recent activity</h6>
            @for (a of d.recentActivity; track a.id) {
              <div class="li"><span class="act">{{ a.action }}</span><span class="text-muted small">{{ a.entity }}</span><span class="flex-grow-1 text-truncate">{{ a.summary }}</span><small class="text-muted">{{ a.adminName }} · {{ a.createdAt | timeAgo }}</small></div>
            }
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .kpis { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 14px; margin-bottom: 14px; }
    .kpi { position: relative; overflow: hidden; border-radius: 20px; padding: 18px 20px; color: #fff; display: flex; flex-direction: column; box-shadow: var(--eg-shadow-lg);
      i { position: absolute; right: 14px; top: 10px; font-size: 46px; opacity: .25; } b { font-size: 2rem; line-height: 1.1; } span { font-weight: 700; opacity: .92; } small { margin-top: 6px; font-weight: 600; opacity: .85; } }
    .k1 { background: linear-gradient(135deg, #6c3bff, #9b51e0); } .k2 { background: linear-gradient(135deg, #ff3d7f, #ff8a00); }
    .k3 { background: linear-gradient(135deg, #00b8a9, #2f80ed); } .k4 { background: linear-gradient(135deg, #17142b, #4b4570); }
    .todo { display: flex; gap: 10px; flex-wrap: wrap; margin-bottom: 18px; }
    .t { padding: 9px 14px; border-radius: 12px; background: var(--eg-surface); border: 1px solid var(--eg-border); font-weight: 600; font-size: .88rem; color: var(--eg-text-2); }
    .t.hot { border-color: #f08c00; color: var(--eg-text); background: rgba(240,140,0,.08); }
    .h { font-weight: 800; margin-bottom: 12px; }
    .chart { position: relative; height: 260px; }
    .li { display: flex; gap: 10px; align-items: center; padding: 7px 0; border-bottom: 1px dashed var(--eg-border); font-size: .9rem; &:last-child { border-bottom: 0; } a { color: var(--eg-text); font-weight: 600; } }
    .rank { width: 24px; height: 24px; border-radius: 8px; background: var(--eg-surface-2); display: grid; place-items: center; font-weight: 800; font-size: .75rem; flex: none; }
    .act { font-size: .65rem; font-weight: 800; padding: 3px 7px; border-radius: 6px; background: rgba(108,59,255,.12); color: #6c3bff; flex: none; }
    .gap-card { border-color: rgba(229,57,90,.4); }
    .empties { display: flex; flex-wrap: wrap; gap: 6px; max-height: 240px; overflow: auto; }
    .empty-chip { font-size: .75rem; font-weight: 600; padding: 4px 9px; border-radius: 99px; border: 1px dashed var(--eg-border); color: var(--eg-text-2); &:hover { border-color: #6c3bff; color: #6c3bff; } }
  `],
})
export class DashboardComponent implements OnInit, AfterViewInit, OnDestroy {
  private api = inject(ApiService);
  private router = inject(Router);
  auth = inject(AdminAuthService);
  @ViewChild('views') viewsCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('people') peopleCanvas!: ElementRef<HTMLCanvasElement>;
  d = signal<Dashboard | null>(null);
  days = 30;
  private charts: Chart[] = [];
  private ready = false;

  ngOnInit() {
    // Writers without dashboard access land on their posts instead.
    if (!this.auth.can('DASHBOARD')) {
      const first = this.auth.can('CONTENT_WRITE', 'CONTENT_PUBLISH') ? '/admin/posts' : this.auth.can('COMMENTS') ? '/admin/comments' : '/admin/password';
      this.router.navigateByUrl(first);
      return;
    }
    this.load();
  }

  ngAfterViewInit() {
    this.ready = true;
    this.draw();
  }

  ngOnDestroy() {
    this.charts.forEach(c => c.destroy());
  }

  load() {
    this.api.get<Dashboard>('/admin/stats/dashboard', { days: this.days }).subscribe(d => { this.d.set(d); this.draw(); });
  }

  delta(a: number, b: number) {
    if (!b) return a ? '+100%' : '0%';
    const p = Math.round(((a - b) / b) * 100);
    return (p >= 0 ? '+' : '') + p + '%';
  }

  private draw() {
    const d = this.d();
    if (!d || !this.ready) return;
    this.charts.forEach(c => c.destroy());
    const dark = document.documentElement.getAttribute('data-theme') === 'dark' || (!document.documentElement.getAttribute('data-theme') && matchMedia('(prefers-color-scheme: dark)').matches);
    const grid = dark ? 'rgba(255,255,255,.07)' : 'rgba(23,20,43,.06)';
    const tick = dark ? '#8b85ad' : '#8a85a3';
    const labels = d.views.map(p => new Date(p.date).toLocaleDateString('en', { day: 'numeric', month: 'short' }));
    const ctx = this.viewsCanvas.nativeElement.getContext('2d')!;
    const grad = ctx.createLinearGradient(0, 0, 0, 260);
    grad.addColorStop(0, 'rgba(108,59,255,.35)');
    grad.addColorStop(1, 'rgba(108,59,255,0)');
    const base = { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { grid: { display: false }, ticks: { color: tick, maxTicksLimit: 8 } }, y: { beginAtZero: true, grid: { color: grid }, ticks: { color: tick, precision: 0 } } } } as const;
    this.charts.push(new Chart(ctx, {
      type: 'line',
      data: { labels, datasets: [{ data: d.views.map(p => p.value), borderColor: '#6c3bff', backgroundColor: grad, fill: true, tension: .35, pointRadius: 0, pointHoverRadius: 5, borderWidth: 3 }] },
      options: base,
    }));
    this.charts.push(new Chart(this.peopleCanvas.nativeElement, {
      type: 'bar',
      data: { labels, datasets: [
        { label: 'Sign-ups', data: d.signups.map(p => p.value), backgroundColor: '#ff3d7f', borderRadius: 6 },
        { label: 'Active', data: d.activeStudents.map(p => p.value), backgroundColor: 'rgba(0,184,169,.7)', borderRadius: 6 },
      ] },
      options: { ...base, plugins: { legend: { display: true, labels: { color: tick, boxWidth: 10 } } } },
    }));
  }
}
