import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { ApiService } from '../../core/api.service';
import { AttemptView, HistoryItem, LearningStats, Page, PostCard, RequestView, StudentMe, TreeNode } from '../../core/models';
import { SiteService } from '../../core/site.service';
import { StudentAuthService } from '../../core/student-auth.service';
import { CoursePickerComponent } from '../../shared/course-picker.component';
import { EmptyStateComponent } from '../../shared/empty-state.component';
import { IconComponent } from '../../shared/icon.component';
import { PagerComponent } from '../../shared/pager.component';
import { TimeAgoPipe } from '../../shared/pipes';
import { PostCardComponent } from '../../shared/post-card.component';

type Tab = 'overview' | 'saved' | 'quizzes' | 'requests' | 'profile';

@Component({
  selector: 'app-me',
  standalone: true,
  imports: [FormsModule, RouterLink, PostCardComponent, PagerComponent, EmptyStateComponent, TimeAgoPipe, CoursePickerComponent, IconComponent],
  templateUrl: './me.component.html',
  styleUrl: './me.component.scss',
})
export class MeComponent implements OnInit {
  private api = inject(ApiService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private toast = inject(ToastrService);
  site = inject(SiteService);
  auth = inject(StudentAuthService);

  tab = signal<Tab>('overview');
  stats = signal<LearningStats | null>(null);
  history = signal<Page<HistoryItem> | null>(null);
  saved = signal<Page<PostCard> | null>(null);
  attempts = signal<AttemptView[] | null>(null);
  requests = signal<RequestView[] | null>(null);
  heat: { date: string; on: boolean; future: boolean }[][] = [];
  tabs: { id: Tab; label: string; icon: string }[] = [
    { id: 'overview', label: 'Overview', icon: 'bi-speedometer2' },
    { id: 'saved', label: 'Saved', icon: 'bi-bookmark-heart' },
    { id: 'quizzes', label: 'Quiz scores', icon: 'bi-lightning-charge' },
    { id: 'requests', label: 'Requests', icon: 'bi-send' },
    { id: 'profile', label: 'Profile', icon: 'bi-person-gear' },
  ];

  // request form
  reqTopic = '';
  reqDetails = '';
  reqNode: number | null = null;
  subjects: { id: number; label: string }[] = [];
  // profile form
  profile = { fullName: '', school: '', district: '', courseNodeId: null as number | null };
  pw = { currentPassword: '', newPassword: '' };

  ngOnInit() {
    this.route.queryParamMap.subscribe(qp => {
      const t = (qp.get('tab') as Tab) || 'overview';
      this.tab.set(this.tabs.some(x => x.id === t) ? t : 'overview');
      if (qp.get('topic')) this.reqTopic = qp.get('topic')!;
      if (qp.get('node')) this.reqNode = Number(qp.get('node'));
      this.loadTab();
    });
    this.api.get<LearningStats>('/student/stats').subscribe(s => { this.stats.set(s); this.buildHeat(s.activeDays); });
    const me = this.auth.me();
    if (me) this.profile = { fullName: me.fullName, school: me.school || '', district: me.district || '', courseNodeId: me.courseNodeId ?? null };
    this.site.loadTree();
  }

  go(t: Tab) {
    this.router.navigate([], { queryParams: { tab: t === 'overview' ? null : t } });
  }

  loadTab() {
    switch (this.tab()) {
      case 'overview': this.loadHistory(0); break;
      case 'saved': this.loadSaved(0); break;
      case 'quizzes': this.api.get<AttemptView[]>('/student/quiz-attempts').subscribe(a => this.attempts.set(a)); break;
      case 'requests': this.loadRequests(); this.buildSubjects(); break;
    }
  }

  loadHistory(p: number) { this.api.get<Page<HistoryItem>>('/student/history', { page: p, size: 10 }).subscribe(h => this.history.set(h)); }
  loadSaved(p: number) { this.api.get<Page<PostCard>>('/student/bookmarks', { page: p, size: 12 }).subscribe(h => this.saved.set(h)); }
  loadRequests() { this.api.get<RequestView[]>('/student/requests').subscribe(r => this.requests.set(r)); }

  private buildSubjects() {
    const tree = this.site.tree();
    if (!tree) { setTimeout(() => this.buildSubjects(), 400); return; }
    this.subjects = SiteService.flatten(tree).map(x => ({ id: x.node.id, label: x.label }));
  }

  /** GitHub-style 13-week activity grid, Nepal-agnostic (browser local dates). */
  private buildHeat(days: string[]) {
    const set = new Set(days);
    const today = new Date();
    const start = new Date(today);
    start.setDate(today.getDate() - 7 * 12 - today.getDay());
    const weeks: { date: string; on: boolean; future: boolean }[][] = [];
    for (let w = 0; w < 13; w++) {
      const col = [];
      for (let d = 0; d < 7; d++) {
        const dt = new Date(start);
        dt.setDate(start.getDate() + w * 7 + d);
        const iso = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
        col.push({ date: iso, on: set.has(iso), future: dt > today });
      }
      weeks.push(col);
    }
    this.heat = weeks;
  }

  sendRequest() {
    if (!this.reqTopic.trim()) return;
    this.api.postFull<RequestView>('/student/requests', { topic: this.reqTopic.trim(), details: this.reqDetails.trim() || null, nodeId: this.reqNode }).subscribe(r => {
      this.toast.success(r.message || 'Request sent');
      this.reqTopic = '';
      this.reqDetails = '';
      this.loadRequests();
    });
  }

  saveProfile() {
    this.api.put<StudentMe>('/student/me', this.profile).subscribe(me => { this.auth.setMe(me); this.toast.success('Profile saved'); });
  }

  changePassword() {
    if (this.pw.newPassword.length < 8) { this.toast.warning('New password must be at least 8 characters.'); return; }
    this.api.post('/student/me/password', this.pw).subscribe(() => { this.toast.success('Password changed'); this.pw = { currentPassword: '', newPassword: '' }; });
  }

  statusLabel(s: string) {
    return s === 'OPEN' ? '⏳ Waiting' : s === 'IN_PROGRESS' ? '✍️ Being written' : s === 'DONE' ? '✅ Ready' : '✖ Not possible';
  }

  initials(name?: string) {
    return (name || '?').split(/\s+/).map(w => w[0]).slice(0, 2).join('').toUpperCase();
  }
}
