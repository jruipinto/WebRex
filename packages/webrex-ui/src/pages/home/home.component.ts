import { Component } from '@angular/core';

import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrl: './home.component.css',
  imports: [RouterModule],
})
export class HomeComponent {
  readonly routes = [
    {
      path: '/repl',
      label: 'Repl',
      help: 'A in-browser IDE that allows you to create and execute snippets in the proxied webpage. In short allows you to run TS in console of your app.',
    },
    {
      path: '/interceptors',
      label: 'Interceptors',
      help: 'Interceptors are callbacks executed on the matching requests allowing you to mutate the response in runtime. Think of Angular Http Interceptors... These are inspired by them.',
    },
    {
      path: '/storage',
      label: 'Storage(beta)',
      help: 'Storage Editor. Here you can conveniently edit the values of sessionstorage and localstorage of the app being proxied.',
    },
    {
      path: '/console',
      label: 'Console',
      help: 'Displays and allows you to filter all the logs from the console of the app being proxied.',
    },
    {
      path: '/network',
      label: 'Network',
      help: 'Displays and allows you to filter all the logs from the proxy backend itself. You can see to where each request was proxied/redirected and other usefull data.',
    },
    {
      path: '/settings',
      label: 'Settings',
      help: 'Configure WebRex main settings. You can setup proxy routes and many other nice features well documented with type annotations and JSDoc.',
    },
  ];
}
