import { Component, HostListener, OnInit, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { ApiService } from '../../core/api.service';
import { LearningStats, NoticeView, PromoView } from '../../core/models';
import { SiteService } from '../../core/site.service';
import { store } from '../../core/storage';
import { StudentAuthService } from '../../core/student-auth.service';
import { IconComponent } from '../../shared/icon.component';
import { AuthPromptComponent } from './auth-prompt.component';
import { SearchPaletteComponent } from './search-palette.component';

@Component({
  selector: 'app-site-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, SearchPaletteComponent, AuthPromptComponent, IconComponent],
  templateUrl: './site-layout.component.html',
  styleUrl: './site-layout.component.scss',
})
export class SiteLayoutComponent implements OnInit {
  site = inject(SiteService);
  auth = inject(StudentAuthService);
  private api = inject(ApiService);
  private router = inject(Router);

  paletteOpen = signal(false);
  megaOpen = signal(false);
  menuOpen = signal(false);
  scrolled = signal(false);
  ticker = signal<NoticeView[]>([]);
  streak = signal<number | null>(null);
  popup = signal<PromoView | null>(null);
  year = new Date().getFullYear();

  ngOnInit() {
    this.site.load();
    this.site.loadTree();
    this.api.get<NoticeView[]>('/public/notices/ticker').subscribe({ next: t => this.ticker.set(t), error: () => {} });
    this.loadStreak();
    this.auth.refresh();
    this.router.events.pipe(filter(e => e instanceof NavigationEnd)).subscribe(() => {
      this.megaOpen.set(false);
      this.menuOpen.set(false);
    });
    this.maybePopup();
  }

  loadStreak() {
    if (!this.auth.loggedIn()) return;
    this.api.get<LearningStats>('/student/stats').subscribe({ next: s => this.streak.set(s.streak), error: () => {} });
  }

  /** POPUP placement: at most once per visitor per day. */
  private maybePopup() {
    const today = new Date().toISOString().slice(0, 10);
    if (store.get('eg.popupSeen') === today) return;
    this.api.get<PromoView[]>('/public/promos', { placement: 'POPUP' }).subscribe({
      next: list => {
        if (!list.length) return;
        setTimeout(() => this.popup.set(list[0]), 2500);
        store.set('eg.popupSeen', today);
        this.api.post('/public/promos/impressions', { ids: [list[0].id] }).subscribe({ error: () => {} });
      },
      error: () => {},
    });
  }

  openPopup(p: PromoView) {
    this.api.post(`/public/promos/${p.id}/click`).subscribe({ error: () => {} });
    this.popup.set(null);
    if (p.linkUrl?.startsWith('/')) this.router.navigateByUrl(p.linkUrl);
    else if (p.linkUrl) window.open(p.linkUrl, '_blank', 'noopener');
  }

  initials(name?: string) {
    return (name || '?').split(/\s+/).map(w => w[0]).slice(0, 2).join('').toUpperCase();
  }

  @HostListener('window:scroll') onScroll() {
    this.scrolled.set(window.scrollY > 8);
  }

  @HostListener('document:keydown', ['$event']) onKey(e: KeyboardEvent) {
    const target = e.target as HTMLElement;
    const typing = ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName) || target.isContentEditable;
    if ((e.key === 'k' && (e.metaKey || e.ctrlKey)) || (e.key === '/' && !typing)) {
      e.preventDefault();
      this.paletteOpen.set(true);
    }
  }
}
