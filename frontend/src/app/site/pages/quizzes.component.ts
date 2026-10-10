import { Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ApiService } from '../../core/api.service';
import { Page, PlayQuiz, QuizCard, QuizResult } from '../../core/models';
import { StudentAuthService } from '../../core/student-auth.service';
import { EmptyStateComponent } from '../../shared/empty-state.component';
import { IconComponent } from '../../shared/icon.component';
import { PagerComponent } from '../../shared/pager.component';
import { TimeAgoPipe } from '../../shared/pipes';

@Component({
  selector: 'app-quizzes',
  standalone: true,
  imports: [RouterLink, IconComponent, PagerComponent, EmptyStateComponent],
  template: `
    <div class="container-xl pt-4">
      <div class="qhero">
        <div>
          <div class="kicker">Practice makes perfect</div>
          <h1>⚡ Quick quizzes</h1>
          <p class="m-0 opacity-75">MCQ practice for SEE, +2, entrance exams and university subjects. Instant answers with explanations.</p>
        </div>
      </div>
      @if (node) { <p class="mt-3"><span class="chip active">Filtered: {{ node }} <a class="text-white ms-1" routerLink="/quizzes"><i class="bi bi-x"></i></a></span></p> }
      <div class="row g-3 mt-1">
        @for (q of page()?.items || []; track q.id) {
          <div class="col-sm-6 col-lg-4">
            <a class="qc eg-card eg-hover" [routerLink]="['/quiz', q.slug]" [style.--c]="q.node?.color || '#6C3BFF'">
              <div class="d-flex justify-content-between align-items-start">
                <span class="ico"><app-icon [name]="q.node?.icon" fallback="⚡" /></span>
                <span class="tag badge-soft">{{ q.questionCount }} Qs{{ q.timeLimitMinutes ? ' · ' + q.timeLimitMinutes + 'm' : '' }}</span>
              </div>
              <h3>{{ q.title }}</h3>
              @if (q.description) { <p>{{ q.description }}</p> }
              <div class="foot"><small>{{ q.node?.pathLabel }}</small><span class="go">Start <i class="bi bi-play-fill"></i></span></div>
            </a>
          </div>
        } @empty {
          @if (page()) { <app-empty emoji="🧩" title="No quizzes here yet" text="New practice sets are added every week." /> }
          @else { @for (i of [1,2,3]; track i) { <div class="col-md-4"><div class="skeleton" style="height:200px"></div></div> } }
        }
      </div>
      @if (page(); as p) { <app-pager [page]="p.page" [totalPages]="p.totalPages" (pageChange)="load($event)" /> }
    </div>
  `,
  styles: [`
    .qhero { padding: 30px; border-radius: 28px; color: #fff; background: radial-gradient(120% 140% at 100% 0%, #ff3d7f, transparent 55%), linear-gradient(135deg, #6c3bff, #2f80ed); box-shadow: var(--eg-shadow-lg); h1 { color: #fff; } .kicker { font-size: .75rem; font-weight: 800; letter-spacing: .12em; text-transform: uppercase; opacity: .85; } }
    .qc { display: flex; flex-direction: column; gap: 8px; padding: 18px; height: 100%; color: var(--eg-text); }
    .ico { width: 48px; height: 48px; border-radius: 15px; display: grid; place-items: center; font-size: 24px; background: color-mix(in srgb, var(--c) 15%, transparent); }
    h3 { font-size: 1.1rem; margin: 6px 0 0; } p { color: var(--eg-text-2); font-size: .9rem; margin: 0; }
    .foot { margin-top: auto; display: flex; justify-content: space-between; align-items: center; padding-top: 8px; small { color: var(--eg-muted); font-weight: 600; } }
    .go { font-weight: 800; color: var(--c); }
  `],
})
export class QuizzesComponent implements OnInit {
  private api = inject(ApiService);
  private route = inject(ActivatedRoute);
  page = signal<Page<QuizCard> | null>(null);
  node = '';
  ngOnInit() {
    this.route.queryParamMap.subscribe(qp => { this.node = qp.get('node') || ''; this.load(0); });
  }
  load(p: number) {
    this.page.set(null);
    this.api.get<Page<QuizCard>>('/public/quizzes', { node: this.node, page: p, size: 12 }).subscribe({ next: r => this.page.set(r), error: () => this.page.set({ items: [], page: 0, size: 12, total: 0, totalPages: 0 }) });
  }
}

/** One question at a time, big tap targets, timer, then a review with explanations. */
@Component({
  selector: 'app-quiz-play',
  standalone: true,
  imports: [RouterLink, TimeAgoPipe, EmptyStateComponent],
  template: `
    <div class="container-xl pt-4" style="max-width: 760px">
      @if (missing()) { <app-empty emoji="🧩" title="Quiz not found"><a routerLink="/quizzes" class="btn btn-primary">All quizzes</a></app-empty> }
      @if (quiz(); as q) {
        @if (stage() === 'intro') {
          <div class="eg-card p-4 text-center intro">
            <div class="big">⚡</div>
            <h1>{{ q.quiz.title }}</h1>
            @if (q.quiz.description) { <p class="text-2">{{ q.quiz.description }}</p> }
            <div class="facts">
              <span><b>{{ q.questions.length }}</b> questions</span>
              <span><b>{{ q.quiz.timeLimitMinutes || '∞' }}</b> {{ q.quiz.timeLimitMinutes ? 'minutes' : 'no timer' }}</span>
              <span><b>{{ q.quiz.attemptCount }}</b> attempts</span>
            </div>
            <button class="btn btn-grad btn-lg px-5" (click)="start()">Start quiz</button>
            @if (!auth.loggedIn()) { <p class="small text-muted mt-3">Sign in to save your scores and track progress.</p> }
            @if (q.myAttempts.length) {
              <div class="mt-4 text-start">
                <h6 class="fw-800">Your last attempts</h6>
                @for (a of q.myAttempts; track a.id) { <div class="d-flex justify-content-between small py-1 border-bottom"><span>{{ a.createdAt | timeAgo }}</span><b>{{ a.score }}/{{ a.total }}</b></div> }
              </div>
            }
          </div>
        }
        @if (stage() === 'play') {
          <div class="top">
            <span class="fw-800">Question {{ idx() + 1 }} / {{ q.questions.length }}</span>
            @if (q.quiz.timeLimitMinutes) { <span class="timer" [class.low]="remaining() < 30"><i class="bi bi-stopwatch"></i> {{ fmt(remaining()) }}</span> }
          </div>
          <div class="bar"><span [style.width.%]="(answeredCount() / q.questions.length) * 100"></span></div>
          @if (current(); as cq) {
            <div class="eg-card p-4 qbox pop-in">
              <h2>{{ cq.text }}</h2>
              <div class="opts">
                @for (o of cq.options; track o.id; let i = $index) {
                  <button class="opt" [class.sel]="answers[cq.id] === o.id" (click)="choose(cq.id, o.id)">
                    <span class="letter">{{ 'ABCDEFGH'[i] }}</span><span>{{ o.text }}</span>
                  </button>
                }
              </div>
            </div>
          }
          <div class="d-flex justify-content-between mt-3">
            <button class="btn btn-ghost" [disabled]="idx() === 0" (click)="idx.set(idx() - 1)"><i class="bi bi-arrow-left"></i> Back</button>
            @if (idx() < q.questions.length - 1) {
              <button class="btn btn-primary" (click)="idx.set(idx() + 1)">Next <i class="bi bi-arrow-right"></i></button>
            } @else {
              <button class="btn btn-grad" (click)="submit()" [disabled]="busy()">Submit ({{ answeredCount() }}/{{ q.questions.length }})</button>
            }
          </div>
          <div class="dots">@for (qq of q.questions; track qq.id; let i = $index) { <button [class.done]="answers[qq.id]" [class.cur]="i === idx()" (click)="idx.set(i)">{{ i + 1 }}</button> }</div>
        }
        @if (stage() === 'result' && result(); as r) {
          <div class="eg-card p-4 text-center result pop-in">
            <div class="ring" [style.--p]="r.percent"><span>{{ r.percent }}%</span></div>
            <h2 class="mt-3">{{ r.percent >= 80 ? 'Outstanding! 🏆' : r.percent >= 50 ? 'Nice work! 💪' : 'Keep practising! 📚' }}</h2>
            <p class="text-2">You got <b>{{ r.score }}</b> out of <b>{{ r.total }}</b> right{{ r.saved ? ' — saved to your progress.' : '.' }}</p>
            <div class="d-flex gap-2 justify-content-center">
              <button class="btn btn-grad" (click)="start()">Try again</button>
              <a class="btn btn-ghost" routerLink="/quizzes">More quizzes</a>
            </div>
          </div>
          <h4 class="fw-800 mt-4 mb-3">Review answers</h4>
          @for (qq of q.questions; track qq.id; let i = $index) {
            <div class="eg-card p-3 mb-3 review" [class.ok]="res(qq.id)?.correct">
              <div class="fw-800 mb-2">{{ i + 1 }}. {{ qq.text }}</div>
              @for (o of qq.options; track o.id) {
                <div class="ropt" [class.right]="o.id === res(qq.id)?.correctOptionId" [class.wrong]="o.id === res(qq.id)?.chosenOptionId && !res(qq.id)?.correct">
                  <i class="bi" [class.bi-check-circle-fill]="o.id === res(qq.id)?.correctOptionId" [class.bi-x-circle-fill]="o.id === res(qq.id)?.chosenOptionId && !res(qq.id)?.correct" [class.bi-circle]="o.id !== res(qq.id)?.correctOptionId && o.id !== res(qq.id)?.chosenOptionId"></i> {{ o.text }}
                </div>
              }
              @if (res(qq.id)?.explanation) { <div class="expl"><i class="bi bi-lightbulb-fill"></i> {{ res(qq.id)?.explanation }}</div> }
            </div>
          }
        }
      }
    </div>
  `,
  styles: [`
    .intro .big { font-size: 56px; } .intro h1 { font-size: clamp(1.6rem, 4vw, 2.2rem); }
    .facts { display: flex; justify-content: center; gap: 24px; margin: 18px 0 24px; flex-wrap: wrap; span { display: flex; flex-direction: column; color: var(--eg-muted); font-weight: 600; font-size: .85rem; } b { font-size: 1.5rem; color: var(--eg-text); } }
    .top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
    .timer { font-weight: 800; padding: 5px 12px; border-radius: 10px; background: var(--eg-surface); border: 1px solid var(--eg-border); } .timer.low { color: #e5395a; border-color: #e5395a; }
    .bar { height: 8px; border-radius: 99px; background: var(--eg-surface-2); overflow: hidden; margin-bottom: 18px; span { display: block; height: 100%; background: var(--eg-grad); transition: width .3s; } }
    .qbox h2 { font-size: 1.3rem; line-height: 1.4; margin-bottom: 18px; }
    .opts { display: grid; gap: 10px; }
    .opt { display: flex; align-items: center; gap: 14px; text-align: left; padding: 14px 16px; border-radius: 16px; border: 2px solid var(--eg-border); background: var(--eg-surface); color: var(--eg-text); font-weight: 600; transition: all .15s; }
    .opt:hover { border-color: #a58bff; } .opt.sel { border-color: #6c3bff; background: rgba(108,59,255,.08); }
    .letter { width: 34px; height: 34px; border-radius: 11px; display: grid; place-items: center; background: var(--eg-surface-2); font-weight: 800; flex: none; }
    .opt.sel .letter { background: #6c3bff; color: #fff; }
    .dots { display: flex; flex-wrap: wrap; gap: 6px; justify-content: center; margin-top: 22px; button { width: 34px; height: 34px; border-radius: 10px; border: 1px solid var(--eg-border); background: var(--eg-surface); font-weight: 700; font-size: .8rem; color: var(--eg-text-2); } .done { background: rgba(108,59,255,.12); color: #6c3bff; border-color: transparent; } .cur { outline: 2px solid #6c3bff; } }
    .ring { --p: 0; width: 140px; height: 140px; margin: 0 auto; border-radius: 50%; display: grid; place-items: center; background: conic-gradient(#ff3d7f calc(var(--p) * 1%), var(--eg-surface-2) 0); span { width: 112px; height: 112px; border-radius: 50%; background: var(--eg-surface); display: grid; place-items: center; font-size: 2rem; font-weight: 800; } }
    .review { border-left: 4px solid #e5395a; } .review.ok { border-left-color: #12a37a; }
    .ropt { padding: 6px 8px; border-radius: 10px; color: var(--eg-text-2); } .ropt.right { color: #0e8a66; font-weight: 700; background: rgba(18,163,122,.08); } .ropt.wrong { color: #e5395a; font-weight: 700; background: rgba(229,57,90,.08); }
    .expl { margin-top: 10px; padding: 10px 12px; border-radius: 12px; background: var(--eg-grad-soft); font-weight: 500; i { color: #f0a500; } }
  `],
})
export class QuizPlayComponent implements OnInit, OnDestroy {
  private api = inject(ApiService);
  private route = inject(ActivatedRoute);
  auth = inject(StudentAuthService);
  quiz = signal<PlayQuiz | null>(null);
  missing = signal(false);
  stage = signal<'intro' | 'play' | 'result'>('intro');
  idx = signal(0);
  remaining = signal(0);
  result = signal<QuizResult | null>(null);
  busy = signal(false);
  answers: Record<number, number> = {};
  answeredTick = signal(0);
  private started = 0;
  private timer?: ReturnType<typeof setInterval>;
  slug = '';

  current = computed(() => this.quiz()?.questions[this.idx()]);
  answeredCount = computed(() => { this.answeredTick(); return Object.keys(this.answers).length; });

  ngOnInit() {
    this.slug = this.route.snapshot.paramMap.get('slug')!;
    this.api.get<PlayQuiz>(`/public/quizzes/${this.slug}`).subscribe({ next: q => this.quiz.set(q), error: () => this.missing.set(true) });
  }

  ngOnDestroy() { clearInterval(this.timer); }

  start() {
    const q = this.quiz()!;
    this.answers = {};
    this.answeredTick.set(0);
    this.idx.set(0);
    this.result.set(null);
    this.stage.set('play');
    this.started = Date.now();
    clearInterval(this.timer);
    if (q.quiz.timeLimitMinutes) {
      this.remaining.set(q.quiz.timeLimitMinutes * 60);
      this.timer = setInterval(() => {
        this.remaining.set(this.remaining() - 1);
        if (this.remaining() <= 0) this.submit();
      }, 1000);
    }
  }

  choose(qid: number, oid: number) {
    this.answers[qid] = oid;
    this.answeredTick.set(this.answeredTick() + 1);
    const q = this.quiz()!;
    if (this.idx() < q.questions.length - 1) setTimeout(() => this.idx.set(this.idx() + 1), 280);
  }

  submit() {
    if (this.busy()) return;
    clearInterval(this.timer);
    this.busy.set(true);
    this.api.post<QuizResult>(`/public/quizzes/${this.slug}/submit`, { answers: this.answers, durationSeconds: Math.round((Date.now() - this.started) / 1000) })
      .subscribe({ next: r => { this.result.set(r); this.stage.set('result'); this.busy.set(false); window.scrollTo({ top: 0 }); }, error: () => this.busy.set(false) });
  }

  res(qid: number) { return this.result()?.questions.find(x => x.questionId === qid); }
  fmt(s: number) { return `${Math.floor(Math.max(s, 0) / 60)}:${String(Math.max(s, 0) % 60).padStart(2, '0')}`; }
}
