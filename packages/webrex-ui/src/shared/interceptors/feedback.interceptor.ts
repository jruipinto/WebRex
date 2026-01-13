import {
  HttpRequest,
  HttpHandlerFn,
  HttpEvent,
  HttpEventType,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { ToastService } from '../components';

export function feedbackInterceptor(
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
): Observable<HttpEvent<unknown>> {
  const toast = inject(ToastService);

  return next(req).pipe(
    tap((event) => {
      if (event.type !== HttpEventType.Response) {
        return;
      }
      if (req.method === 'GET' && /4|5\d\d/.test(String(event.status))) {
        toast.informFailure(`Load failed`);

        return;
      }

      if (req.method !== 'GET' && /2\d\d/.test(String(event.status))) {
        toast.informSuccess(`Done`);

        return;
      }

      if (req.method !== 'GET' && /4|5\d\d/.test(String(event.status))) {
        toast.informFailure(`Failed`);

        return;
      }
    })
  );
}
