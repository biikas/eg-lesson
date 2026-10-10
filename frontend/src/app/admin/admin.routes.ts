import { Routes } from '@angular/router';
import { adminGuard } from '../core/guards';
import { AdminLayoutComponent } from './layout/admin-layout.component';
import { AdminLoginComponent } from './pages/login.component';

const page = (perms: string[] | null, load: () => Promise<any>) => ({ canActivate: [adminGuard], data: perms ? { perms } : {}, loadComponent: load });
const WRITE = ['CONTENT_WRITE', 'CONTENT_PUBLISH'];

export const ADMIN_ROUTES: Routes = [
  { path: 'login', component: AdminLoginComponent, title: 'Admin sign in' },
  {
    path: '',
    component: AdminLayoutComponent,
    canActivate: [adminGuard],
    children: [
      { path: '', ...page(null, () => import('./pages/dashboard.component').then(m => m.DashboardComponent)), title: 'Dashboard' },
      { path: 'password', ...page(null, () => import('./pages/password.component').then(m => m.AdminPasswordComponent)), title: 'Change password' },
      { path: 'posts', ...page(WRITE, () => import('./pages/posts.component').then(m => m.PostsComponent)), title: 'Posts' },
      { path: 'posts/new', ...page(WRITE, () => import('./pages/post-editor.component').then(m => m.PostEditorComponent)), title: 'New post' },
      { path: 'posts/:id', ...page(WRITE, () => import('./pages/post-editor.component').then(m => m.PostEditorComponent)), title: 'Edit post' },
      { path: 'catalog', ...page(['CATALOG'], () => import('./pages/catalog.component').then(m => m.CatalogComponent)), title: 'Categories' },
      { path: 'types', ...page(['CATALOG'], () => import('./pages/types.component').then(m => m.TypesComponent)), title: 'Types & levels' },
      { path: 'quizzes', ...page(['QUIZZES'], () => import('./pages/quizzes.component').then(m => m.AdminQuizzesComponent)), title: 'Quizzes' },
      { path: 'quizzes/new', ...page(['QUIZZES'], () => import('./pages/quiz-editor.component').then(m => m.QuizEditorComponent)), title: 'New quiz' },
      { path: 'quizzes/:id', ...page(['QUIZZES'], () => import('./pages/quiz-editor.component').then(m => m.QuizEditorComponent)), title: 'Edit quiz' },
      { path: 'media', ...page(WRITE, () => import('./pages/media.component').then(m => m.MediaComponent)), title: 'Media' },
      { path: 'comments', ...page(['COMMENTS'], () => import('./pages/comments.component').then(m => m.AdminCommentsComponent)), title: 'Comments' },
      { path: 'requests', ...page(['REQUESTS'], () => import('./pages/requests.component').then(m => m.RequestsComponent)), title: 'Note requests' },
      { path: 'students', ...page(['STUDENTS'], () => import('./pages/students.component').then(m => m.StudentsComponent)), title: 'Students' },
      { path: 'notices', ...page(['NOTICES'], () => import('./pages/notices.component').then(m => m.AdminNoticesComponent)), title: 'Notices' },
      { path: 'promos', ...page(['PROMOS'], () => import('./pages/promos.component').then(m => m.PromosComponent)), title: 'Banners & ads' },
      { path: 'users', ...page(['ADMINS'], () => import('./pages/users.component').then(m => m.UsersComponent)), title: 'Admin users' },
      { path: 'roles', ...page(['ADMINS'], () => import('./pages/roles.component').then(m => m.RolesComponent)), title: 'Roles' },
      { path: 'settings', ...page(['SETTINGS'], () => import('./pages/settings.component').then(m => m.SettingsComponent)), title: 'Settings' },
      { path: 'audit', ...page(['AUDIT'], () => import('./pages/audit.component').then(m => m.AuditComponent)), title: 'Audit log' },
    ],
  },
];
