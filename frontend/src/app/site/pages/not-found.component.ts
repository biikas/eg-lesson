import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { EmptyStateComponent } from '../../shared/empty-state.component';

@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [RouterLink, EmptyStateComponent],
  template: `<div class="container-xl pt-5"><app-empty emoji="🛸" title="Page not found" text="This page flew away. Let's get you back to studying."><a routerLink="/" class="btn btn-grad">Go home</a></app-empty></div>`,
})
export class NotFoundComponent {}
