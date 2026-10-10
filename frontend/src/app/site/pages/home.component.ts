import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { ApiService } from '../../core/api.service';
import { HistoryItem, Home, Page, PostCard } from '../../core/models';
import { SiteService } from '../../core/site.service';
import { StudentAuthService } from '../../core/student-auth.service';
import { IconComponent } from '../../shared/icon.component';
import { CompactNumberPipe, TimeAgoPipe } from '../../shared/pipes';
import { PostCardComponent } from '../../shared/post-card.component';
import { PromoSlotComponent } from '../../shared/promo-slot.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink, IconComponent, PostCardComponent, PromoSlotComponent, TimeAgoPipe, CompactNumberPipe],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
})
export class HomeComponent implements OnInit, OnDestroy {
  private api = inject(ApiService);
  private router = inject(Router);
  site = inject(SiteService);
  auth = inject(StudentAuthService);

  home = signal<Home | null>(null);
  forYou = signal<PostCard[]>([]);
  continueReading = signal<HistoryItem[]>([]);
  tab = signal<'latest' | 'popular'>('latest');
  q = '';
  placeholders = ["Newton's second law", 'SEE 2080 English solved', 'BE Computer Sem 3 notes', 'Venn diagram exercise', 'Pointers in C', 'Class 8 नेपाली व्याकरण'];
  ph = signal(0);
  stickers = ['📐', '🧪', '📖', '⚙️', '🩺', '💻', 'अ', '🧬'];
  private timer?: ReturnType<typeof setInterval>;

  ngOnInit() {
    this.api.get<Home>('/public/home').subscribe(h => this.home.set(h));
    this.timer = setInterval(() => this.ph.set((this.ph() + 1) % this.placeholders.length), 2600);
    const me = this.auth.me();
    if (me?.courseSlug) {
      this.api.get<Page<PostCard>>('/public/posts', { node: me.courseSlug, size: 6 }).subscribe({ next: p => this.forYou.set(p.items), error: () => {} });
    }
    if (this.auth.loggedIn()) {
      this.api.get<Page<HistoryItem>>('/student/history', { size: 4 }).subscribe({ next: p => this.continueReading.set(p.items.filter(i => i.progress < 90)), error: () => {} });
    }
  }

  ngOnDestroy() {
    clearInterval(this.timer);
  }

  search() {
    if (this.q.trim()) this.router.navigate(['/search'], { queryParams: { q: this.q.trim() } });
  }

  greeting(): string {
    const h = new Date().getHours();
    return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
  }

  firstName() {
    return (this.auth.me()?.fullName || '').split(' ')[0];
  }
}
