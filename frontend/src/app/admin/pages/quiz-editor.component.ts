import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { ApiService } from '../../core/api.service';
import { QuestionForm, QuizEdit } from '../../core/models';
import { NodeSelectComponent } from '../shared/node-select.component';
import { PageHeaderComponent } from '../shared/page-header.component';

@Component({
  selector: 'app-quiz-editor',
  standalone: true,
  imports: [FormsModule, RouterLink, PageHeaderComponent, NodeSelectComponent],
  template: `
    <app-page-header [title]="id ? 'Edit quiz' : 'New quiz'" subtitle="Each question needs one correct option. Add an explanation so students learn from mistakes.">
      <a routerLink="/admin/quizzes" class="btn btn-ghost">Back</a>
      <button class="btn btn-ghost" (click)="save('DRAFT')" [disabled]="busy()">Save draft</button>
      <button class="btn btn-grad" (click)="save('PUBLISHED')" [disabled]="busy()"><i class="bi bi-send-fill"></i> Publish</button>
    </app-page-header>
    <div class="row g-4">
      <div class="col-xl-4">
        <div class="eg-card eg-card-pad sticky-xl">
          <label class="form-label">Title *</label><input class="form-control mb-3" [(ngModel)]="title" maxlength="255">
          <label class="form-label">Subject *</label><app-node-select [value]="nodeId" (valueChange)="nodeId = $event" placeholder="Attach to subject" />
          <label class="form-label mt-3">Description</label><textarea class="form-control" rows="3" [(ngModel)]="description" maxlength="1000"></textarea>
          <label class="form-label mt-3">Time limit (minutes, 0 = untimed)</label><input class="form-control" type="number" min="0" [(ngModel)]="timeLimit">
          <hr>
          <label class="form-label">Bulk add questions</label>
          <textarea class="form-control mono small" rows="7" [(ngModel)]="bulk" placeholder="Q: SI unit of force?&#10;*Newton&#10;Joule&#10;Watt&#10;E: Newton = kg·m/s²&#10;&#10;Q: Next question…"></textarea>
          <div class="form-text">Start questions with <b>Q:</b>, mark the right option with <b>*</b>, optional <b>E:</b> explanation, blank line between questions.</div>
          <button class="btn btn-soft btn-sm mt-2" (click)="importBulk()">Import</button>
        </div>
      </div>
      <div class="col-xl-8">
        @for (q of questions; track q; let qi = $index) {
          <div class="eg-card eg-card-pad mb-3 qcard">
            <div class="d-flex justify-content-between align-items-center mb-2">
              <span class="qn">Q{{ qi + 1 }}</span>
              <div>
                <button class="btn btn-ghost btn-sm" (click)="moveQ(qi, -1)" [disabled]="qi === 0"><i class="bi bi-arrow-up"></i></button>
                <button class="btn btn-ghost btn-sm" (click)="moveQ(qi, 1)" [disabled]="qi === questions.length - 1"><i class="bi bi-arrow-down"></i></button>
                <button class="btn btn-ghost btn-sm text-danger" (click)="questions.splice(qi, 1)"><i class="bi bi-trash"></i></button>
              </div>
            </div>
            <textarea class="form-control mb-2 fw-bold" rows="2" [(ngModel)]="q.text" placeholder="Question"></textarea>
            @for (o of q.options; track o; let oi = $index) {
              <div class="d-flex gap-2 align-items-center mb-2">
                <input class="form-check-input mt-0" type="radio" [name]="'c' + qi" [checked]="o.correct" (change)="setCorrect(q, oi)" title="Correct answer">
                <input class="form-control form-control-sm" [class.right]="o.correct" [(ngModel)]="o.text" [placeholder]="'Option ' + 'ABCDEFGH'[oi]">
                <button class="btn btn-ghost btn-sm" (click)="q.options.splice(oi, 1)" [disabled]="q.options.length <= 2"><i class="bi bi-x"></i></button>
              </div>
            }
            @if (q.options.length < 8) { <button class="btn btn-ghost btn-sm" (click)="q.options.push({ text: '', correct: false })"><i class="bi bi-plus"></i> Option</button> }
            <input class="form-control form-control-sm mt-2" [(ngModel)]="q.explanation" placeholder="Explanation shown after submitting (recommended)">
          </div>
        }
        <button class="btn btn-soft w-100 py-3" (click)="addQ()"><i class="bi bi-plus-circle"></i> Add question</button>
      </div>
    </div>
  `,
  styles: [`.qn { font-weight: 800; background: var(--eg-grad); color: #fff; padding: 3px 10px; border-radius: 8px; font-size: .8rem; } .right { border-color: #12a37a; background: rgba(18,163,122,.06); } @media (min-width: 1200px) { .sticky-xl { position: sticky; top: 76px; } }`],
})
export class QuizEditorComponent implements OnInit {
  private api = inject(ApiService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private toast = inject(ToastrService);
  id: number | null = null;
  title = '';
  description = '';
  nodeId: number | null = null;
  timeLimit = 0;
  questions: QuestionForm[] = [];
  bulk = '';
  busy = signal(false);

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.id = Number(id);
      this.api.get<QuizEdit>(`/admin/quizzes/${id}`).subscribe(q => {
        this.title = q.title; this.description = q.description || ''; this.nodeId = q.nodeId; this.timeLimit = q.timeLimitMinutes; this.questions = q.questions;
      });
    } else this.addQ();
  }

  addQ() { this.questions.push({ text: '', explanation: '', options: [{ text: '', correct: true }, { text: '', correct: false }, { text: '', correct: false }, { text: '', correct: false }] }); }
  setCorrect(q: QuestionForm, i: number) { q.options.forEach((o, idx) => (o.correct = idx === i)); }
  moveQ(i: number, d: number) { const [x] = this.questions.splice(i, 1); this.questions.splice(i + d, 0, x); }

  importBulk() {
    const blocks = this.bulk.split(/\n\s*\n/).map(b => b.trim()).filter(Boolean);
    let added = 0;
    for (const b of blocks) {
      const lines = b.split('\n').map(l => l.trim()).filter(Boolean);
      const qLine = lines.find(l => /^q[:.)]/i.test(l));
      if (!qLine) continue;
      const q: QuestionForm = { text: qLine.replace(/^q[:.)]\s*/i, ''), explanation: '', options: [] };
      for (const l of lines) {
        if (l === qLine) continue;
        if (/^e[:.)]/i.test(l)) q.explanation = l.replace(/^e[:.)]\s*/i, '');
        else q.options.push({ text: l.replace(/^\*\s*/, '').replace(/^[a-h][.)]\s*/i, ''), correct: l.startsWith('*') });
      }
      if (q.options.length >= 2 && q.options.filter(o => o.correct).length === 1) { this.questions.push(q); added++; }
    }
    this.questions = this.questions.filter(q => q.text.trim() || q.options.some(o => o.text.trim()));
    this.toast.info(`${added} question(s) imported`);
    if (added) this.bulk = '';
  }

  save(status: string) {
    if (!this.title.trim() || !this.nodeId) { this.toast.warning('Title and subject are required.'); return; }
    const questions = this.questions.filter(q => q.text.trim()).map(q => ({ ...q, options: q.options.filter(o => o.text.trim()) }));
    this.busy.set(true);
    const body = { title: this.title, description: this.description, nodeId: this.nodeId, timeLimitMinutes: this.timeLimit, status, questions };
    const req = this.id ? this.api.put<QuizEdit>(`/admin/quizzes/${this.id}`, body) : this.api.post<QuizEdit>('/admin/quizzes', body);
    req.subscribe({
      next: q => { this.busy.set(false); this.toast.success(status === 'PUBLISHED' ? 'Quiz published' : 'Draft saved'); if (!this.id) this.router.navigate(['/admin/quizzes', q.id], { replaceUrl: true }); this.id = q.id; },
      error: () => this.busy.set(false),
    });
  }
}
