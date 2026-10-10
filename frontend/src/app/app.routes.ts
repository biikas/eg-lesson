import { Routes } from '@angular/router';
import { studentGuard } from './core/guards';
import { SiteLayoutComponent } from './site/layout/site-layout.component';
import { HomeComponent } from './site/pages/home.component';

export const routes: Routes = [
  { path: 'admin', loadChildren: () => import('./admin/admin.routes').then(m => m.ADMIN_ROUTES) },
  {
    path: '',
    component: SiteLayoutComponent,
    children: [
      { path: '', component: HomeComponent },
      { path: 'explore', loadComponent: () => import('./site/pages/explore.component').then(m => m.ExploreComponent), title: 'Explore' },
      { path: 'explore/:slug', loadComponent: () => import('./site/pages/node-page.component').then(m => m.NodePageComponent) },
      { path: 'read/:slug', loadComponent: () => import('./site/pages/reader.component').then(m => m.ReaderComponent) },
      { path: 'search', loadComponent: () => import('./site/pages/search.component').then(m => m.SearchComponent), title: 'Search' },
      { path: 'notices', loadComponent: () => import('./site/pages/notices.component').then(m => m.NoticesComponent), title: 'Notices' },
      { path: 'notices/:slug', loadComponent: () => import('./site/pages/notices.component').then(m => m.NoticeDetailComponent) },
      { path: 'quizzes', loadComponent: () => import('./site/pages/quizzes.component').then(m => m.QuizzesComponent), title: 'Quizzes' },
      { path: 'quiz/:slug', loadComponent: () => import('./site/pages/quizzes.component').then(m => m.QuizPlayComponent) },
      { path: 'login', loadComponent: () => import('./site/pages/auth.component').then(m => m.AuthComponent), title: 'Sign in' },
      { path: 'register', loadComponent: () => import('./site/pages/auth.component').then(m => m.AuthComponent), title: 'Create account' },
      { path: 'me', canActivate: [studentGuard], loadComponent: () => import('./site/pages/me.component').then(m => m.MeComponent), title: 'My learning' },
      { path: '**', loadComponent: () => import('./site/pages/not-found.component').then(m => m.NotFoundComponent) },
    ],
  },
];
