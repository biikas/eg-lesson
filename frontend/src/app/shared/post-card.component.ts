import { Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PostCard } from '../core/models';
import { IconComponent } from './icon.component';
import { CompactNumberPipe, TimeAgoPipe } from './pipes';

@Component({
  selector: 'app-post-card',
  standalone: true,
  imports: [RouterLink, IconComponent, TimeAgoPipe, CompactNumberPipe],
  template: `
    <a class="pc eg-card eg-hover" [class.row-mode]="variant === 'row'" [routerLink]="['/read', post.slug]" [style.--c]="post.contentType.color || '#6C3BFF'">
      @if (post.coverImage && variant !== 'row') {
        <div class="cover" [style.background-image]="'url(' + post.coverImage + ')'"></div>
      } @else if (variant !== 'row') {
        <div class="cover gen">
          <app-icon class="big" [name]="post.node?.icon" />
          <span class="type-ghost">{{ post.contentType.name }}</span>
        </div>
      }
      <div class="body">
        <div class="meta-top">
          <span class="tag" [style.background]="(post.contentType.color || '#6C3BFF') + '1f'" [style.color]="post.contentType.color">
            <app-icon [name]="post.contentType.icon" /> {{ post.contentType.name }}
          </span>
          @if (post.hasVideo) { <span class="tag badge-soft"><i class="bi bi-play-fill"></i> Video</span> }
          @if (post.language === 'NE') { <span class="tag badge-soft np">नेपाली</span> }
        </div>
        <h3 [class.np]="post.language === 'NE'">{{ post.title }}</h3>
        @if (variant !== 'compact' && post.excerpt) { <p class="excerpt">{{ post.excerpt }}</p> }
        <div class="meta">
          @if (post.node) { <span class="where"><app-icon [name]="post.node.icon" /> {{ post.node.pathLabel }}</span> }
          <span class="dot"></span>
          <span><i class="bi bi-clock"></i> {{ post.readMinutes }} min</span>
          @if (post.viewCount > 0) { <span><i class="bi bi-eye"></i> {{ post.viewCount | compact }}</span> }
          @if (variant === 'row') { <span class="ms-auto">{{ post.publishedAt | timeAgo }}</span> }
        </div>
      </div>
    </a>
  `,
  styles: [`
    :host { display: block; height: 100%; }
    .pc { display: flex; flex-direction: column; height: 100%; overflow: hidden; color: var(--eg-text); }
    .cover { height: 132px; background-size: cover; background-position: center; position: relative; }
    .cover.gen {
      background: radial-gradient(120% 140% at 0% 0%, color-mix(in srgb, var(--c) 35%, transparent), transparent 60%),
                  radial-gradient(100% 120% at 100% 100%, color-mix(in srgb, var(--c) 22%, transparent), transparent 60%), var(--eg-surface-2);
      display: flex; align-items: center; justify-content: space-between; padding: 0 20px; overflow: hidden;
    }
    .big { font-size: 46px; filter: drop-shadow(0 6px 10px rgba(0,0,0,.12)); }
    .type-ghost { font-weight: 800; font-size: 1.6rem; letter-spacing: -.03em; color: color-mix(in srgb, var(--c) 50%, transparent); text-align: right; line-height: 1; max-width: 60%; }
    .body { padding: 16px 18px 16px; display: flex; flex-direction: column; gap: 8px; flex: 1; }
    .meta-top { display: flex; gap: 6px; flex-wrap: wrap; }
    h3 { font-size: 1.05rem; line-height: 1.35; margin: 2px 0 0; font-weight: 800; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
    .excerpt { color: var(--eg-text-2); font-size: .9rem; margin: 0; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
    .meta { margin-top: auto; display: flex; align-items: center; flex-wrap: wrap; gap: 10px; color: var(--eg-muted); font-size: .8rem; font-weight: 600; padding-top: 4px; }
    .where { display: inline-flex; gap: 5px; align-items: center; color: var(--eg-text-2); max-width: 100%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .dot { width: 3px; height: 3px; border-radius: 50%; background: var(--eg-muted); }
    .row-mode { flex-direction: row; }
    .row-mode .body { padding: 14px 16px; }
    .row-mode h3 { font-size: 1rem; }
  `],
})
export class PostCardComponent {
  @Input({ required: true }) post!: PostCard;
  @Input() variant: 'card' | 'row' | 'compact' = 'card';
}
