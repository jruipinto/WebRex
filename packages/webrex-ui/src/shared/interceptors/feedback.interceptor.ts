import {
  HttpRequest,
  HttpHandlerFn,
  HttpEvent,
  HttpEventType,
  HttpResponse,
  HttpErrorResponse,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, Observable, of, tap, throwError } from 'rxjs';
import { ToastService } from '../components';

export function feedbackInterceptor(
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
): Observable<HttpEvent<unknown>> {
  const toast = inject(ToastService);

  return next(req).pipe(
    tap({
      next: (event) => {
        if (event.type === HttpEventType.Response && req.method !== 'GET')
          toast.informSuccess('Done');
      },
      error: () =>
        toast.informFailure(req.method === 'GET' ? 'Load failed' : 'Failed'),
    }),
    catchError((error) => {
      // Wrap the error in a "Failure" value
      if (error instanceof HttpErrorResponse) {
        return of(
          new HttpResponse({
            body: error.error,
          })
        );
      }
      return throwError(() => error);
    })
  );
}
