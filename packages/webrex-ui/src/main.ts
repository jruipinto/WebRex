import { Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { routes } from './routes';
import { HomeComponent } from './pages';
import { feedbackInterceptor } from './shared';

@Component({
  selector: 'app-root',
  template: ` <app-home> </app-home> `,
  imports: [HomeComponent],
})
export class App {}

bootstrapApplication(App, {
  providers: [
    provideHttpClient(withInterceptors([feedbackInterceptor])),
    provideRouter(routes, withComponentInputBinding()),
  ],
});
