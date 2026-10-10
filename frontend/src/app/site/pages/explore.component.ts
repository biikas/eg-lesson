import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { SiteService } from '../../core/site.service';
import { IconComponent } from '../../shared/icon.component';

/** Every stream with its programs/classes, filterable as you type. */
@Component({
  selector: 'app-explore',
  standalone: true,
  imports: [RouterLink, FormsModule, IconComponent],
  template: `
    <div class="container-xl pt-4">
      <div class="head">
        <div>
          <div class="kicker">The library</div>
          <h1>Explore everything</h1>
          <p class="text-2 m-0">Pick a stream, then your class, semester or year. Every subject has its own page.</p>
        </div>
        <div class="filter">
          <i class="bi bi-funnel"></i>
          <input class="form-control" [ngModel]="filter()" (ngModelChange)="filter.set($event)" placeholder="Filter: e.g. physics, sem 3, class 9">
        </div>
      </div>

      @if (!site.tree()) { <div class="row g-3">@for (i of [1,2,3,4]; track i) { <div class="col-md-6"><div class="skeleton" style="height:220px"></div></div> }</div> }

      <div class="streams">
        @for (s of filtered(); track s.node.id) {
          <section class="stream eg-card" [style.--c]="s.node.color || '#6C3BFF'">
            <a class="s-head" [routerLink]="['/explore', s.node.slug]">
              <span class="ico"><app-icon [name]="s.node.icon" /></span>
              <div class="flex-grow-1"><h2>{{ s.node.name }}</h2><small>{{ s.node.postCount }} notes · {{ s.node.children.length }} {{ (s.node.children[0]?.typeLabel || 'section').toLowerCase() }}s</small></div>
              <i class="bi bi-arrow-right-circle-fill go"></i>
            </a>
            <div class="kids">
              @for (c of s.kids; track c.id) {
                <div class="kid">
                  <a class="kid-name" [routerLink]="['/explore', c.slug]"><app-icon [name]="c.icon" fallback="📂" /> {{ c.name }} <span class="cnt">{{ c.postCount }}</span></a>
                  @if (c.children.length) {
                    <div class="grand">
                      @for (g of c.children; track g.id) {
                        <a [routerLink]="['/explore', g.slug]" [class.has]="g.postCount > 0">{{ g.shortName || g.name }}</a>
                      }
                    </div>
                  }
                </div>
              }
            </div>
          </section>
        } @empty {
          @if (site.tree()) { <p class="text-muted">Nothing matches “{{ filter() }}”.</p> }
        }
      </div>
    </div>
  `,
  styles: [`
    .head { display: flex; justify-content: space-between; align-items: end; gap: 20px; flex-wrap: wrap; margin-bottom: 26px; }
    .kicker { font-size: .75rem; font-weight: 800; text-transform: uppercase; letter-spacing: .12em; color: var(--eg-pink); }
    h1 { font-size: clamp(1.8rem, 4vw, 2.6rem); margin: 4px 0 6px; }
    .filter { position: relative; width: min(360px, 100%); i { position: absolute; left: 14px; top: 50%; transform: translateY(-50%); color: var(--eg-muted); } input { padding-left: 38px; } }
    .streams { columns: 2 420px; column-gap: 18px; }
    .stream { break-inside: avoid; margin-bottom: 18px; overflow: hidden; }
        .s-head { display: flex; gap: 14px; align-items: center; padding: 18px 20px; color: var(--eg-text);
      background: linear-gradient(120deg, color-mix(in srgb, var(--c) 18%, transparent), transparent 70%); border-bottom: 1px solid var(--eg-border); }
    .s-head h2 { font-size: 1.25rem; margin: 0; } .s-head small { color: var(--eg-muted); font-weight: 600; }
    .ico { width: 50px; height: 50px; border-radius: 16px; display: grid; place-items: center; font-size: 26px; background: var(--eg-surface); box-shadow: var(--eg-shadow); }
    .go { font-size: 26px; color: var(--c); transition: transform .2s; } .s-head:hover .go { transform: translateX(4px); }
    .kids { padding: 8px 20px 18px; }
    .kid { padding: 10px 0; border-bottom: 1px dashed var(--eg-border); &:last-child { border-bottom: 0; } }
    .kid-name { font-weight: 800; color: var(--eg-text); display: inline-flex; gap: 8px; align-items: center; &:hover { color: var(--c); } }
    .cnt { font-size: .7rem; padding: 2px 7px; border-radius: 99px; background: var(--eg-surface-2); color: var(--eg-muted); }
    .grand { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 8px; }
    .grand a { font-size: .8rem; font-weight: 600; padding: 4px 10px; border-radius: 99px; border: 1px solid var(--eg-border); color: var(--eg-text-2); }
    .grand a.has { border-color: color-mix(in srgb, var(--c) 45%, transparent); color: var(--eg-text); }
    .grand a:hover { background: color-mix(in srgb, var(--c) 14%, transparent); color: var(--eg-text); }
  `],
})
export class ExploreComponent implements OnInit {
  site = inject(SiteService);
  filter = signal('');

  ngOnInit() {
    this.site.loadTree();
  }

  filtered = computed(() => {
    const f = this.filter().trim().toLowerCase();
    const tree = this.site.tree() || [];
    return tree.map(node => {
      if (!f) return { node, kids: node.children };
      const flat = SiteService.flatten([node]);
      const hit = new Set(flat.filter(x => x.label.toLowerCase().includes(f)).flatMap(x => x.trail));
      const kids = node.children.filter(c => hit.has(c.shortName || c.name) || node.name.toLowerCase().includes(f));
      return { node, kids };
    }).filter(x => !f || x.kids.length || x.node.name.toLowerCase().includes(f));
  });
}
