import { bootstrapApplication } from '@angular/platform-browser';
import katex from 'katex';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';

// Quill's formula module and the note reader both look for KaTeX on window.
(window as any).katex = katex;

bootstrapApplication(AppComponent, appConfig).catch((err) => console.error(err));
