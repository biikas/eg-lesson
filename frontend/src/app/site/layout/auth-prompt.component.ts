import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { StudentAuthService } from '../../core/student-auth.service';

/** Friendly bottom sheet asking guests to sign in when they try to like, save or comment. */
@Component({
  selector: 'app-auth-prompt',
  standalone: true,
  template: `
    @if (auth.promptOpen()) {
      <div class="eg-backdrop" (click)="auth.promptOpen.set(false)">
        <div class="eg-modal p-4 text-center" (click)="$event.stopPropagation()">
          <div class="emo">🎒</div>
          <h4 class="fw-800">Free account, more superpowers</h4>
          <p class="text-2">{{ auth.promptReason || 'Sign in to save notes, track your progress and ask doubts.' }}</p>
          <ul class="perks">
            <li><i class="bi bi-bookmark-heart-fill"></i> Save notes for exam time</li>
            <li><i class="bi bi-fire"></i> Keep a daily study streak</li>
            <li><i class="bi bi-chat-dots-fill"></i> Ask doubts under any note</li>
          </ul>
          <div class="d-grid gap-2 mt-3">
            <button class="btn btn-grad btn-lg" (click)="go('/register')">Create free account</button>
            <button class="btn btn-ghost" (click)="go('/login')">I already have an account</button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`.emo { font-size: 52px; } .perks { list-style: none; padding: 0; margin: 16px auto 0; text-align: left; max-width: 300px; } .perks li { padding: 6px 0; font-weight: 600; } .perks i { color: var(--eg-pink); margin-right: 8px; }`],
})
export class AuthPromptComponent {
  auth = inject(StudentAuthService);
  private router = inject(Router);

  go(url: string) {
    this.auth.promptOpen.set(false);
    this.router.navigate([url], { queryParams: { next: this.router.url } });
  }
}
