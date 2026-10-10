import { Component, HostListener, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { QuillEditorComponent } from 'ngx-quill';
import type Quill from 'quill';
import { ToastrService } from 'ngx-toastr';
import { AdminAuthService } from '../../core/admin-auth.service';
import { ApiService } from '../../core/api.service';
import { Attachment, Media, PostEdit, PostStatus, Point } from '../../core/models';
import { store } from '../../core/storage';
import { TimeAgoPipe } from '../../shared/pipes';
import { AdminTreeService } from '../shared/admin-tree.service';
import { MediaPickerComponent } from '../shared/media-picker.component';
import { NodeSelectComponent } from '../shared/node-select.component';
import { setupQuill } from '../shared/quill-setup';

interface Form {
  title: string; slug: string; excerpt: string; body: string; coverImage: string; nodeId: number | null; contentTypeId: number | null;
  language: string; difficulty: string; videoUrl: string; status: PostStatus; featured: boolean; allowComments: boolean;
  publishAt: string; metaTitle: string; metaDescription: string; tags: string[]; attachments: Attachment[];
}

const blank = (): Form => ({
  title: '', slug: '', excerpt: '', body: '', coverImage: '', nodeId: null, contentTypeId: null, language: 'EN', difficulty: '',
  videoUrl: '', status: 'DRAFT', featured: false, allowComments: true, publishAt: '', metaTitle: '', metaDescription: '', tags: [], attachments: [],
});

/** Blogger-style editor: big title, rich text body with formulas/tables/code/images, and a publishing sidebar. */
@Component({
  selector: 'app-post-editor',
  standalone: true,
  imports: [FormsModule, RouterLink, QuillEditorComponent, NodeSelectComponent, MediaPickerComponent, TimeAgoPipe, DatePipe],
  templateUrl: './post-editor.component.html',
  styleUrl: './post-editor.component.scss',
})
export class PostEditorComponent implements OnInit, OnDestroy {
  private api = inject(ApiService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private toast = inject(ToastrService);
  auth = inject(AdminAuthService);
  tree = inject(AdminTreeService);

  id: number | null = null;
  f: Form = blank();
  meta = signal<PostEdit | null>(null);
  views = signal<Point[]>([]);
  saving = signal(false);
  dirty = signal(false);
  restored = signal(false);
  tagInput = '';
  wordCount = signal(0);
  private quill?: Quill;
  private autosaveTimer?: ReturnType<typeof setInterval>;

  Math = Math;
  canPublish = computed(() => this.auth.can('CONTENT_PUBLISH'));

  modules = {
    formula: true,
    table: true,
    toolbar: {
      container: [
        [{ header: [2, 3, 4, false] }],
        ['bold', 'italic', 'underline', 'strike', { background: [] }, { color: [] }],
        [{ list: 'ordered' }, { list: 'bullet' }, { indent: '-1' }, { indent: '+1' }, { align: [] }],
        ['blockquote', 'code-block', 'formula', 'link', 'image', 'video', 'table'],
        [{ script: 'sub' }, { script: 'super' }],
        ['clean'],
      ],
      handlers: {
        image: () => this.pickImage(),
        table: () => (this.quill?.getModule('table') as any)?.insertTable(3, 3),
      },
    },
  };

  constructor() {
    setupQuill();
  }

  ngOnInit() {
    this.tree.ensure();
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.id = Number(idParam);
      this.api.get<PostEdit>(`/admin/posts/${this.id}`).subscribe(p => {
        this.meta.set(p);
        this.f = {
          title: p.title, slug: p.slug, excerpt: p.excerpt || '', body: p.body || '', coverImage: p.coverImage || '', nodeId: p.nodeId,
          contentTypeId: p.contentTypeId, language: p.language, difficulty: p.difficulty || '', videoUrl: p.videoUrl || '', status: p.status,
          featured: p.featured, allowComments: p.allowComments, publishAt: p.publishedAt ? this.toLocal(p.publishedAt) : '',
          metaTitle: p.metaTitle || '', metaDescription: p.metaDescription || '', tags: p.tags, attachments: p.attachments,
        };
        this.countWords();
      });
      this.api.get<{ views: Point[] }>(`/admin/stats/posts/${this.id}`).subscribe({ next: s => this.views.set(s.views), error: () => {} });
    } else {
      const node = this.route.snapshot.queryParamMap.get('node');
      const draft = store.json<Form | null>('eg.draft.new', null);
      if (draft && (draft.title || draft.body)) {
        this.f = draft;
        this.restored.set(true);
      }
      if (node) this.f.nodeId = Number(node);
      if (!this.f.contentTypeId) {
        const t = setInterval(() => {
          const notes = this.tree.contentTypes()[0];
          if (notes) { this.f.contentTypeId = this.f.contentTypeId ?? notes.id; clearInterval(t); }
        }, 200);
        setTimeout(() => clearInterval(t), 5000);
      }
    }
    // Local autosave: a closed tab or dropped connection never loses the writer's work.
    this.autosaveTimer = setInterval(() => { if (this.dirty()) store.set(this.draftKey(), JSON.stringify(this.f)); }, 5000);
  }

  ngOnDestroy() {
    clearInterval(this.autosaveTimer);
  }

  @HostListener('window:beforeunload', ['$event']) beforeUnload(e: BeforeUnloadEvent) {
    if (this.dirty()) e.preventDefault();
  }

  @HostListener('document:keydown', ['$event']) keys(e: KeyboardEvent) {
    if ((e.metaKey || e.ctrlKey) && e.key === 's') { e.preventDefault(); this.save(this.f.status); }
  }

  private draftKey() {
    return this.id ? `eg.draft.${this.id}` : 'eg.draft.new';
  }

  discardDraft() {
    store.remove('eg.draft.new');
    this.f = blank();
    this.restored.set(false);
    this.dirty.set(false);
  }

  created(q: Quill) {
    this.quill = q;
  }

  touch() {
    this.dirty.set(true);
  }

  countWords() {
    const text = (this.f.body || '').replace(/<[^>]+>/g, ' ');
    this.wordCount.set(text.trim() ? text.trim().split(/\s+/).length : 0);
  }

  onBody() {
    this.touch();
    this.countWords();
  }

  autoSlug() {
    if (!this.id && !this.slugEdited) this.f.slug = this.slugify(this.f.title);
  }
  slugEdited = false;

  private slugify(s: string) {
    return s.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').slice(0, 150);
  }

  private pickImage() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = () => {
      const file = input.files?.[0];
      if (!file || !this.quill) return;
      const range = this.quill.getSelection(true);
      this.toast.info('Uploading image…');
      this.api.upload<Media>('/admin/media', file).subscribe(m => {
        this.quill!.insertEmbed(range.index, 'image', m.url, 'user');
        this.quill!.setSelection(range.index + 1, 0);
      });
    };
    input.click();
  }

  addTag() {
    const parts = this.tagInput.split(',').map(t => t.trim().toLowerCase()).filter(Boolean);
    for (const t of parts) if (!this.f.tags.includes(t) && this.f.tags.length < 15) this.f.tags.push(t);
    this.tagInput = '';
    this.touch();
  }

  removeTag(t: string) {
    this.f.tags = this.f.tags.filter(x => x !== t);
    this.touch();
  }

  addAttachment(m: Media) {
    this.f.attachments.push({ title: m.originalName.replace(/\.[a-z0-9]+$/i, ''), url: m.url });
    this.touch();
  }

  removeAttachment(i: number) {
    this.f.attachments.splice(i, 1);
    this.touch();
  }

  private toLocal(iso: string) {
    const d = new Date(iso);
    const off = d.getTimezoneOffset();
    return new Date(d.getTime() - off * 60000).toISOString().slice(0, 16);
  }

  scheduled(): boolean {
    return !!this.f.publishAt && new Date(this.f.publishAt) > new Date();
  }

  save(status: PostStatus) {
    if (!this.f.title.trim()) { this.toast.warning('Give the post a title.'); return; }
    if (!this.f.nodeId) { this.toast.warning('Choose the subject/category.'); return; }
    if (!this.f.contentTypeId) { this.toast.warning('Choose a content type.'); return; }
    const body = {
      ...this.f,
      status,
      slug: this.f.slug || null,
      publishedAt: this.f.publishAt ? new Date(this.f.publishAt).toISOString() : null,
      difficulty: this.f.difficulty || null,
    };
    this.saving.set(true);
    const req = this.id ? this.api.put<PostEdit>(`/admin/posts/${this.id}`, body) : this.api.post<PostEdit>('/admin/posts', body);
    req.subscribe({
      next: p => {
        this.saving.set(false);
        this.dirty.set(false);
        store.remove(this.draftKey());
        this.meta.set(p);
        this.f.status = p.status;
        this.f.slug = p.slug;
        const msg = p.status === 'PUBLISHED' ? (this.scheduled() ? 'Scheduled ⏰' : 'Published 🎉') : p.status === 'REVIEW' ? 'Sent for review' : 'Draft saved';
        this.toast.success(msg);
        if (!this.id) {
          this.id = p.id;
          this.router.navigate(['/admin/posts', p.id], { replaceUrl: true });
        }
      },
      error: () => this.saving.set(false),
    });
  }

  preview() {
    if (!this.meta()) { this.toast.info('Save the post first to preview it.'); return; }
    window.open('/read/' + this.meta()!.slug, '_blank');
  }

  maxViews() {
    return Math.max(1, ...this.views().map(v => v.value));
  }

  totalViews30() {
    return this.views().reduce((a, b) => a + b.value, 0);
  }
}
