import { Component, HostListener, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { DomSanitizer, SafeResourceUrl, Title, Meta } from '@angular/platform-browser';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { ApiService } from '../../core/api.service';
import { PostDetail, Toggle } from '../../core/models';
import { SiteService } from '../../core/site.service';
import { store } from '../../core/storage';
import { StudentAuthService } from '../../core/student-auth.service';
import { EmptyStateComponent } from '../../shared/empty-state.component';
import { IconComponent } from '../../shared/icon.component';
import { CompactNumberPipe, TimeAgoPipe } from '../../shared/pipes';
import { PostCardComponent } from '../../shared/post-card.component';
import { PromoSlotComponent } from '../../shared/promo-slot.component';
import { RichContentComponent, TocItem } from '../../shared/rich-content.component';
import { CommentsComponent } from './comments.component';

@Component({
  selector: 'app-reader',
  standalone: true,
  imports: [RouterLink, IconComponent, RichContentComponent, PostCardComponent, PromoSlotComponent, CommentsComponent, EmptyStateComponent, TimeAgoPipe, CompactNumberPipe],
  templateUrl: './reader.component.html',
  styleUrl: './reader.component.scss',
})
export class ReaderComponent implements OnInit, OnDestroy {
  private api = inject(ApiService);
  private route = inject(ActivatedRoute);
  private toast = inject(ToastrService);
  private sanitizer = inject(DomSanitizer);
  private title = inject(Title);
  private meta = inject(Meta);
  site = inject(SiteService);
  auth = inject(StudentAuthService);

  post = signal<PostDetail | null>(null);
  notFound = signal(false);
  toc = signal<TocItem[]>([]);
  activeId = signal('');
  progress = signal(0);
  fontSize = signal(Number(store.get('eg.fontSize')) || 17);
  focus = signal(false);
  shareOpen = signal(false);
  video: SafeResourceUrl | null = null;
  private maxSent = 0;
  private sendTimer?: ReturnType<typeof setTimeout>;

  ngOnInit() {
    this.route.paramMap.subscribe(pm => this.load(pm.get('slug')!));
  }

  ngOnDestroy() {
    this.flushProgress();
    this.title.setTitle(this.site.s('site.name') || 'eglesson');
  }

  load(slug: string) {
    this.flushProgress();
    this.post.set(null);
    this.notFound.set(false);
    this.toc.set([]);
    this.maxSent = 0;
    this.progress.set(0);
    this.api.get<PostDetail>(`/public/posts/${slug}`).subscribe({
      next: p => {
        this.post.set(p);
        this.video = p.videoUrl ? this.sanitizer.bypassSecurityTrustResourceUrl(p.videoUrl) : null;
        this.title.setTitle(`${p.metaTitle || p.card.title} · ${this.site.s('site.name') || 'eglesson'}`);
        this.meta.updateTag({ name: 'description', content: p.metaDescription || p.card.excerpt || '' });
        window.scrollTo({ top: 0 });
        // Count one view per reading session.
        const key = 'eg.viewed.' + p.card.id;
        try {
          if (!sessionStorage.getItem(key)) {
            sessionStorage.setItem(key, '1');
            this.api.post(`/public/posts/${p.card.id}/view`).subscribe({ error: () => {} });
          }
        } catch {
          this.api.post(`/public/posts/${p.card.id}/view`).subscribe({ error: () => {} });
        }
      },
      error: () => this.notFound.set(true),
    });
  }

  @HostListener('window:scroll') onScroll() {
    const el = document.getElementById('note-body');
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const total = el.offsetHeight - window.innerHeight * 0.6;
    const pct = Math.max(0, Math.min(100, Math.round(((-rect.top + window.innerHeight * 0.25) / Math.max(total, 1)) * 100)));
    this.progress.set(pct);
    const headings = this.toc();
    let current = '';
    for (const h of headings) {
      const node = document.getElementById(h.id);
      if (node && node.getBoundingClientRect().top < 140) current = h.id;
    }
    this.activeId.set(current);
    if (this.auth.loggedIn() && pct >= this.maxSent + 10) {
      clearTimeout(this.sendTimer);
      this.sendTimer = setTimeout(() => this.flushProgress(), 1500);
    }
  }

  private flushProgress() {
    const p = this.post();
    const pct = this.progress();
    if (!p || !this.auth.loggedIn() || pct <= this.maxSent) return;
    this.maxSent = pct;
    this.api.post(`/student/posts/${p.card.id}/progress`, { percent: pct }).subscribe({ error: () => {} });
  }

  like() {
    const p = this.post();
    if (!p || !this.auth.require('Sign in to like notes and help others find the best ones.')) return;
    this.api.post<Toggle>(`/student/posts/${p.card.id}/like`).subscribe(t => this.post.set({ ...p, liked: t.active, card: { ...p.card, likeCount: t.count } }));
  }

  bookmark() {
    const p = this.post();
    if (!p || !this.auth.require('Sign in to save notes for exam time.')) return;
    this.api.post<Toggle>(`/student/posts/${p.card.id}/bookmark`).subscribe(t => {
      this.post.set({ ...p, bookmarked: t.active, bookmarkCount: t.count });
      this.toast.success(t.active ? 'Saved to your notes 📌' : 'Removed from saved');
    });
  }

  setFont(delta: number) {
    const v = Math.max(14, Math.min(24, this.fontSize() + delta));
    this.fontSize.set(v);
    store.set('eg.fontSize', String(v));
  }

  url() {
    return location.href;
  }

  share(kind: 'copy' | 'whatsapp' | 'facebook' | 'viber' | 'native') {
    const p = this.post()!;
    const text = `${p.card.title} — ${this.site.s('site.name') || 'eglesson'}`;
    const u = encodeURIComponent(this.url());
    if (kind === 'copy') {
      navigator.clipboard?.writeText(this.url()).then(() => this.toast.success('Link copied'));
    } else if (kind === 'native' && (navigator as any).share) {
      (navigator as any).share({ title: text, url: this.url() }).catch(() => {});
    } else if (kind === 'whatsapp') window.open(`https://wa.me/?text=${encodeURIComponent(text + ' ')}${u}`, '_blank');
    else if (kind === 'facebook') window.open(`https://www.facebook.com/sharer/sharer.php?u=${u}`, '_blank');
    else if (kind === 'viber') window.open(`viber://forward?text=${encodeURIComponent(text + ' ' + this.url())}`, '_blank');
    this.shareOpen.set(false);
  }

  print() {
    window.print();
  }

  jump(id: string) {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  difficultyLabel(d?: string) {
    return d === 'BASIC' ? '🌱 Basic' : d === 'INTERMEDIATE' ? '🌿 Intermediate' : d === 'ADVANCED' ? '🌳 Advanced' : '';
  }
}
