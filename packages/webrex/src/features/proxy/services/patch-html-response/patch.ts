// deno-lint-ignore-file no-window-prefix no-window no-window-prefix no-window-prefix

import type { Subject } from 'rxjs';
import type { RealtimeEvent } from '@core/bootstrap/realtime.stream.ts';
import type { ReplOutputDocument } from '@models/repl-output-document.ts';

declare global {
  interface XMLHttpRequest {
    /** trueOrigin is a reference of the url.origin of the original url target, when the request was created */
    __trueOrigin?: string;
  }
  interface URL {
    /** trueOrigin is a reference of the url.origin of the original url target, when the request was created */
    __trueOrigin?: string;
  }
  interface NamedNodeMap {
    'ng-version': any;
  }
  interface Element {
    /** trueOrigin is a reference of the url.origin of the original url target, when the request was created */
    trueOrigin?: string | null;
  }
  var rxjs: {
    Observable: any;
    filter: any;
    map: any;
    debounceTime: any;
    tap: any;
    fromEvent: any;
    merge: any;
    throttleTime: any;
    finalize: any;
    delay: any;
    distinctUntilChanged: any;
    webSocket: {
      webSocket: (
        wsUrl: string
      ) => Subject<RealtimeEvent | RealtimeEvent['data']>;
    };
  };
  /** Specific property added to window object by angular apps */
  var ng: any;
  /** Specific property added to window object by angular apps */
  var ngDevMode: any;
  /** Specific property added to window object by angular apps */
  var appRef: any;
  /** WebSocket of WebRex */
  var webRexWs: Subject<RealtimeEvent | RealtimeEvent['data']>;
}

function getUnsafeRandomUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0,
      v = c == 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

const script = document.createElement('script');
script.src = '/webrex-ui/assets/rxjs.umd.min.js';
script.onload = () => {
  const rxjs = window.rxjs;
  window.webRexWs = window.rxjs.webSocket.webSocket(
    `${location.origin.replace('http', 'ws')}/webrex-api/ws`
  );

  (['log', 'error', 'warn', 'info'] as const).forEach((method) => {
    const original = console[method];
    console[method] = function (...args) {
      const msg = args
        .map((i) => {
          if (typeof i === 'string') {
            return i;
          }
          if (i instanceof Error) {
            return tryToStringify({
              name: i.name,
              message: i.message,
              stack: i.stack?.split('\n'),
            });
          }
          return tryToStringify(i);
        })
        .join(' ')
        .trim();

      // send log to WebRex backend via websocket connection
      window.webRexWs.next({
        type: 'POST',
        correlationId: crypto.randomUUID?.() ?? getUnsafeRandomUUID(),
        data: {
          entity: 'weblogs',
          payload: msg,
        },
      } satisfies RealtimeEvent['data']);

      original.apply(console, args);
    };
  });

  // mandatory subscribe to start websocket connection
  window.webRexWs.subscribe((message) => {
    const payload = message?.data?.data?.payload as ReplOutputDocument;
    if (
      !(
        message?.type === 'realtimechanges' &&
        message?.data?.data?.entity === 'reploutput' &&
        message?.data?.data?.id &&
        !Object.hasOwn(payload, 'result')
      )
    ) {
      return;
    }
    const result = () => {
      try {
        return tryToStringify(window.eval(payload?.codeJS));
      } catch (error) {
        console.error(error);
      }
    };

    // send evaluation result back to WebRex backend via websocket connection
    window.webRexWs.next({
      type: 'PUT',
      correlationId: crypto.randomUUID?.() ?? getUnsafeRandomUUID(),
      data: {
        id: message?.data?.data?.id,
        entity: 'reploutput',
        payload: {
          codeJS: payload?.codeJS,
          codeTS: payload?.codeTS,
          result: result() ?? ' ',
        } as ReplOutputDocument,
      },
    } satisfies RealtimeEvent['data']);
  });

  function tryInit() {
    if (
      document
        .querySelector('[ng-version]')
        ?.attributes?.['ng-version'].value.split('.')[0] >= 12
    ) {
      return;
    }
    // Wait until Angular is bootstrapped and ApplicationRef is available
    const appRef = Array.from(
      document.querySelectorAll('body > *:not(script):not(link)')
    )
      .map((el) =>
        window.ng
          ?.probe?.(el)
          ?.injector.get(window.ng?.coreTokens.ApplicationRef)
      )
      .find(Boolean);

    if (!appRef) {
      setTimeout(tryInit, 1000); // Retry after 1000ms
      return;
    }

    if (!window.ngDevMode) return;

    const { fromEvent, merge, tap, throttleTime, finalize, delay } = rxjs;

    window.appRef = appRef;

    // forces change detection in older angular apps, running in dev mode
    merge(
      fromEvent(document, 'click'),
      fromEvent(document, 'keyup'),
      fromEvent(document, 'pointermove'),
      fromEvent(document, 'scroll')
    )
      .pipe(
        finalize(() => {
          // avoids stop when changing route
          setTimeout(tryInit, 1000);
        }),
        throttleTime(200),
        delay(100),
        tap(() => {
          window.appRef.tick();
        })
      )
      .subscribe();
  }

  tryInit();
};
document.head.appendChild(script);

// #######################################################################################
// #######################################################################################

// stores original location.origin of the iframe, to be used by proxied requests, if needed
if (frameElement) {
  frameElement.trueOrigin = (frameElement as HTMLIFrameElement)?.src
    ? new URL((frameElement as HTMLIFrameElement).src).searchParams.get(
        'trueOrigin'
      )
    : null;
}

function normalizeUrl(thisArg: XMLHttpRequest, rawUrl: string | URL): URL {
  const trueOrigin = new URL(rawUrl.toString(), document.baseURI).origin;
  const newUrl =
    trueOrigin !== document.location.origin
      ? rawUrl.toString().replace(trueOrigin, document.location.origin)
      : rawUrl.toString();
  const relativePath = new URL(newUrl, document.baseURI);
  if (frameElement) {
    const baseHref = new URL('', document.baseURI).pathname;
    relativePath.pathname =
      baseHref + relativePath.pathname.replace(baseHref, '').replace(/^\//, '');
  }
  thisArg.__trueOrigin = trueOrigin;
  relativePath.__trueOrigin = trueOrigin;
  return relativePath;
}

// patch xhr requests to avoid cross-origin requests, which couldn't be proxied otherwise
const originalOpen = XMLHttpRequest.prototype.open;
XMLHttpRequest.prototype.open = function (method, url, ...args) {
  const normalizedUrl = normalizeUrl(this, url);
  return originalOpen.call(this, method, normalizedUrl, ...args);
};
const originalSend = XMLHttpRequest.prototype.send;
XMLHttpRequest.prototype.send = function (...args) {
  try {
    this.setRequestHeader('X-Origin', this.__trueOrigin ?? '');
    this.setRequestHeader('ngrok-skip-browser-warning', 'true');
  } catch (_e) {
    // ignore if not allowed for some calls
  }
  return originalSend.apply(this, args);
};

// patch fetch requests to avoid cross-origin requests, which couldn't be proxied otherwise
const originalFetch = window.fetch;
window.fetch = function (input, init) {
  const url =
    typeof input === 'string'
      ? input
      : input instanceof URL
      ? input.href
      : input.url;
  const normalizedUrl = normalizeUrl({} as XMLHttpRequest, url);
  const newInit = { ...(init ?? {}) } as RequestInit;
  newInit.headers = new Headers(newInit.headers ?? input.headers ?? {});
  newInit.headers.append('X-Origin', normalizedUrl.__trueOrigin ?? '');
  newInit.headers.append('ngrok-skip-browser-warning', 'true');
  if (typeof input === 'string') {
    return originalFetch.call(this, normalizedUrl, newInit);
  } else {
    const newRequest = new Request(normalizedUrl, newInit);
    return originalFetch.call(this, newRequest, newInit);
  }
};

function tryToStringify(i: unknown) {
  try {
    const result = JSON.stringify(i, undefined, 2);
    return result;
  } catch (_) {
    return String(i);
  }
}

window.onerror = (msg, source, lineNo, columnNo, error) => {
  const errorData = {
    message: msg,
    script: source,
    line: lineNo,
    column: columnNo,
    stack: error ? error.stack : null,
  };

  console.error(JSON.stringify(errorData));
};

window.onunhandledrejection = (event) => {
  const errorData = {
    Error: event.reason ? event.reason.stack || event.reason : 'unknown',
  };

  console.error(JSON.stringify(errorData));
};

// #######################################################################################
// #######################################################################################
/** WebComponent Bubble rendered in frontend which allows to open WebRex in another tab, when clicked */
class FloatingBubble extends HTMLElement {
  static TAG = 'floating-bubble';
  connectedCallback() {
    this.attachShadow({ mode: 'open' }).innerHTML = /*html*/ `
      <style>
        :host {
          position: fixed;
          bottom: 150px;
          right: 10px;
          z-index: 9999;
        }
        button {
          padding: 10px;
          background: #24292f;
          color: #fff;
          box-shadow: 1px 4px 20px 4px rgb(0 0 0 / 74%);
          font-size: 10px;
          cursor: pointer;
        }
        button:hover {
          filter: brightness(1.3);
        }
      </style>
      <button type="button" part="button">⚡</button>
    `;
    this.shadowRoot!.querySelector('button')!.onclick = () =>
      window.open('/webrex-ui', '_blank');
  }
}
customElements.define(FloatingBubble.TAG, FloatingBubble);
document.addEventListener(
  'DOMContentLoaded',
  () => {
    document.body.appendChild(document.createElement('floating-bubble'));
  },
  { once: true }
);

// #######################################################################################
// #######################################################################################

// Watch Iframes opening and chnages their `src` atribute to allow them to be proxied as well

function watchBodyMutations$() {
  const { Observable } = window.rxjs;
  return new Observable((subscriber: any) => {
    const observer = new MutationObserver((mutations) => {
      subscriber.next(mutations);
    });
    observer.observe(document.body, { childList: true, subtree: true });
    // Cleanup function when subscriber unsubscribes
    return () => observer.disconnect();
  });
}

setTimeout(() => {
  const { tap, debounceTime, map, filter, distinctUntilChanged } = rxjs;
  const iframe$ = watchBodyMutations$().pipe(
    debounceTime(300),
    map(() =>
      Array.from(document.getElementsByTagName('iframe')).filter(Boolean).at(-1)
    ),
    filter(Boolean),
    distinctUntilChanged(),
    tap((iframe: HTMLIFrameElement) => {
      console.log('New iframe added:', iframe);
      const iframeLocation = new URL(iframe.src);
      const url = new URL(
        iframe.src.replace(iframeLocation.origin, location.origin)
      );
      url.searchParams.set('trueOrigin', iframeLocation.origin);
      url.pathname = '/mf' + url.pathname;
      iframe.src = url.href;
    })
  );
  iframe$.subscribe();
}, 3000);
