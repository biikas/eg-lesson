import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ConfirmHostComponent } from './shared/confirm-host.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, ConfirmHostComponent],
  template: `<router-outlet /><app-confirm-host />`,
})
export class AppComponent {}
