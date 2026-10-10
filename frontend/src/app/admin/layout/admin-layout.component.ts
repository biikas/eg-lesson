import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { AdminAuthService } from '../../core/admin-auth.service';
import { SiteService } from '../../core/site.service';
import { store } from '../../core/storage';

interface MenuItem { label: string; icon: string; link: string; perms?: string[]; exact?: boolean; }
interface MenuGroup { title: string; items: MenuItem[]; }

/** Side-nav admin shell; menu entries are filtered by the signed-in admin's role permissions. */
@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="shell" [class.collapsed]="collapsed()" [class.mobile-open]="mobileOpen()">
      <aside class="side">
        <a routerLink="/admin" class="brand"><img src="assets/logo.svg" alt="" width="34" height="34"><span>{{ site.s('site.name') || 'eglesson' }} <small>admin</small></span></a>
        <nav>
          @for (g of menu(); track g.title) {
            <div class="grp">{{ g.title }}</div>
            @for (m of g.items; track m.link) {
              <a [routerLink]="m.link" routerLinkActive="on" [routerLinkActiveOptions]="{ exact: !!m.exact }" [title]="m.label"><i class="bi {{ m.icon }}"></i><span>{{ m.label }}</span></a>
            }
          }
        </nav>
        <button class="collapse-btn d-none d-lg-flex" (click)="toggleCollapse()"><i class="bi" [class.bi-chevron-double-left]="!collapsed()" [class.bi-chevron-double-right]="collapsed()"></i><span>Collapse</span></button>
      </aside>
      <div class="scrim d-lg-none" (click)="mobileOpen.set(false)"></div>
      <div class="main">
        <header class="top">
          <button class="btn btn-ghost btn-icon d-lg-none" (click)="mobileOpen.set(true)" aria-label="Menu"><i class="bi bi-list"></i></button>
          <a routerLink="/admin/posts/new" class="btn btn-grad btn-sm d-none d-sm-inline-block"><i class="bi bi-plus-lg"></i> New post</a>
          <span class="flex-grow-1"></span>
          <a href="/" target="_blank" class="btn btn-ghost btn-sm"><i class="bi bi-box-arrow-up-right"></i> <span class="d-none d-sm-inline">View site</span></a>
          <button class="btn btn-ghost btn-icon btn-sm" (click)="site.toggleTheme()" aria-label="Theme"><i class="bi" [class.bi-moon-stars]="!site.isDark()" [class.bi-sun]="site.isDark()"></i></button>
          <div class="who" (click)="userOpen.set(!userOpen())">
            <span class="av">{{ initials() }}</span>
            <span class="d-none d-md-block"><b>{{ auth.me()?.fullName }}</b><small>{{ auth.me()?.role }}</small></span>
            @if (userOpen()) {
              <div class="dropdown-menu show">
                <a class="dropdown-item" routerLink="/admin/password"><i class="bi bi-key me-2"></i>Change password</a>
                <button class="dropdown-item text-danger" (click)="auth.logout()"><i class="bi bi-box-arrow-right me-2"></i>Sign out</button>
              </div>
            }
          </div>
        </header>
        <main class="content"><router-outlet /></main>
      </div>
    </div>
  `,
  styles: [`
    .shell { display: grid; grid-template-columns: 250px 1fr; min-height: 100vh; transition: grid-template-columns .2s; }
    .shell.collapsed { grid-template-columns: 76px 1fr; }
    .side { position: sticky; top: 0; height: 100vh; overflow-y: auto; background: #120f26; color: #c9c4e8; display: flex; flex-direction: column; padding: 16px 12px; z-index: 1040; }
    .brand { display: flex; align-items: center; gap: 10px; color: #fff; font-weight: 800; font-size: 1.15rem; padding: 4px 8px 18px; img { border-radius: 10px; flex: none; } small { font-size: .65rem; text-transform: uppercase; letter-spacing: .1em; color: #ff8fb6; margin-left: 4px; } }
    .grp { font-size: .65rem; font-weight: 800; text-transform: uppercase; letter-spacing: .12em; color: #6f68a0; padding: 14px 12px 6px; white-space: nowrap; }
    nav a { display: flex; align-items: center; gap: 12px; padding: 9px 12px; border-radius: 12px; color: #c9c4e8; font-weight: 600; font-size: .9rem; white-space: nowrap; margin-bottom: 2px; }
    nav a i { font-size: 1.05rem; width: 20px; text-align: center; }
    nav a:hover { background: rgba(255,255,255,.06); color: #fff; }
    nav a.on { background: linear-gradient(120deg, rgba(108,59,255,.9), rgba(255,61,127,.75)); color: #fff; box-shadow: 0 8px 20px -10px rgba(255,61,127,.8); }
    .collapsed .brand span, .collapsed nav a span, .collapsed .grp, .collapsed .collapse-btn span { display: none; }
    .collapsed nav a { justify-content: center; }
    .collapse-btn { margin-top: auto; border: 0; background: rgba(255,255,255,.05); color: #9e98c8; border-radius: 12px; padding: 9px 12px; gap: 10px; align-items: center; font-weight: 600; font-size: .85rem; }
    .main { min-width: 0; display: flex; flex-direction: column; }
    .top { position: sticky; top: 0; z-index: 1020; display: flex; align-items: center; gap: 10px; padding: 12px 24px; background: color-mix(in srgb, var(--eg-bg) 85%, transparent); backdrop-filter: blur(12px); border-bottom: 1px solid var(--eg-border); }
    .who { position: relative; display: flex; align-items: center; gap: 10px; cursor: pointer; padding: 4px 8px; border-radius: 12px; &:hover { background: var(--eg-surface); }
      b { display: block; font-size: .85rem; line-height: 1.1; } small { color: var(--eg-muted); font-size: .72rem; }
      .dropdown-menu { right: 0; left: auto; top: calc(100% + 6px); } }
    .av { width: 36px; height: 36px; border-radius: 12px; background: var(--eg-grad); color: #fff; display: grid; place-items: center; font-weight: 800; font-size: .8rem; }
    .content { padding: 24px; max-width: 1400px; width: 100%; }
    @media (max-width: 991px) {
      .shell, .shell.collapsed { grid-template-columns: 1fr; }
      .side { position: fixed; left: 0; top: 0; width: 260px; transform: translateX(-100%); transition: transform .2s; }
      .mobile-open .side { transform: none; }
      .scrim { display: none; }
      .mobile-open .scrim { display: block; position: fixed; inset: 0; background: rgba(0,0,0,.4); z-index: 1030; }
      .content { padding: 16px; } .top { padding: 10px 16px; }
    }
  `],
})
export class AdminLayoutComponent implements OnInit {
  auth = inject(AdminAuthService);
  site = inject(SiteService);
  private router = inject(Router);
  collapsed = signal(store.get('eg.admin.collapsed') === '1');
  mobileOpen = signal(false);
  userOpen = signal(false);

  private groups: MenuGroup[] = [
    { title: 'Overview', items: [{ label: 'Dashboard', icon: 'bi-speedometer2', link: '/admin', exact: true, perms: ['DASHBOARD'] }] },
    { title: 'Content', items: [
      { label: 'Posts', icon: 'bi-journal-richtext', link: '/admin/posts', perms: ['CONTENT_WRITE', 'CONTENT_PUBLISH'] },
      { label: 'Categories', icon: 'bi-diagram-3', link: '/admin/catalog', perms: ['CATALOG'] },
      { label: 'Types & levels', icon: 'bi-tags', link: '/admin/types', perms: ['CATALOG'] },
      { label: 'Quizzes', icon: 'bi-lightning-charge', link: '/admin/quizzes', perms: ['QUIZZES'] },
      { label: 'Media library', icon: 'bi-images', link: '/admin/media', perms: ['CONTENT_WRITE', 'CONTENT_PUBLISH'] },
    ] },
    { title: 'Community', items: [
      { label: 'Comments', icon: 'bi-chat-dots', link: '/admin/comments', perms: ['COMMENTS'] },
      { label: 'Note requests', icon: 'bi-send', link: '/admin/requests', perms: ['REQUESTS'] },
      { label: 'Students', icon: 'bi-people', link: '/admin/students', perms: ['STUDENTS'] },
    ] },
    { title: 'Promote', items: [
      { label: 'Notices', icon: 'bi-megaphone', link: '/admin/notices', perms: ['NOTICES'] },
      { label: 'Banners & ads', icon: 'bi-badge-ad', link: '/admin/promos', perms: ['PROMOS'] },
    ] },
    { title: 'System', items: [
      { label: 'Admin users', icon: 'bi-person-badge', link: '/admin/users', perms: ['ADMINS'] },
      { label: 'Roles', icon: 'bi-shield-lock', link: '/admin/roles', perms: ['ADMINS'] },
      { label: 'Settings', icon: 'bi-gear', link: '/admin/settings', perms: ['SETTINGS'] },
      { label: 'Audit log', icon: 'bi-clock-history', link: '/admin/audit', perms: ['AUDIT'] },
    ] },
  ];

  menu = computed(() => {
    this.auth.me();
    return this.groups.map(g => ({ ...g, items: g.items.filter(i => !i.perms || this.auth.can(...i.perms)) })).filter(g => g.items.length);
  });

  ngOnInit() {
    this.site.load();
    this.auth.refresh().subscribe({ error: () => {} });
    this.router.events.pipe(filter(e => e instanceof NavigationEnd)).subscribe(() => { this.mobileOpen.set(false); this.userOpen.set(false); });
  }

  toggleCollapse() {
    this.collapsed.set(!this.collapsed());
    store.set('eg.admin.collapsed', this.collapsed() ? '1' : '0');
  }

  initials() {
    return (this.auth.me()?.fullName || 'A').split(/\s+/).map(w => w[0]).slice(0, 2).join('').toUpperCase();
  }
}
