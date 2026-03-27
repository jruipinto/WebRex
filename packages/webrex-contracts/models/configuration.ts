export class ProxyRoute {
  /** Optional name to help describe the target */
  name?: string;
  /**
   * URL.pathname to match which can be expressed as string or string regular expression.
   */
  context!: string;
  /**
   * If you don't want /api to be passed along, we need to rewrite the path.
   * @example example
   * ```ts
   * {
   *   context: '/api',
   *   pathRewrite: { '^/api': '' }
   *   target: 'https://whatever.com',
   * }
   * ```
   */
  pathRewrite?: Record<string, string>;
  /**
   * Redirect target. It must be a valid URL (http | https | file).
   *
   * @example For external api:
   * ```ts
   * {
   *   context: '/api/my-service',
   *   target: 'https://my-domain.com'
   * }
   * ```
   *
   * @example For local dev server:
   * ```ts
   * {
   *   context: '/my-running-app',
   *   target: 'http://localhost:4203'
   * }
   * ```
   *
   * @example For file targets in Windows:
   * ```ts
   * {
   *   context: '/my-built-app',
   *   target: 'file://C:/Users/jack/myapp/dist'
   * }
   * ```
   *
   * @example For file targets in Posix (linux, mac...):
   * ```ts
   * {
   *   context: '/my-built-app',
   *   target: 'file://my/full/path/myapp/dist'
   * }
   * ```
   */
  target!: `${'https://' | 'http://' | 'file://'}${string}`;
  /** Optional way to disabled a redirect, in case you want to keep a proxy but not use it */
  disabled?: boolean;

  /**
   * @ignore This is an internal property which is updated in runtime and is used to improve fallback performance
   * @private
   */
  isHealthy?: boolean;
}

/**
 * The Proxy configuration.
 */
export class WebRexConfiguration {
  /**
   * The hostname the proxy will listen to.
   * @default 'localhost'
   */
  hostname?: string = 'localhost';

  /**
   * The port the proxy will listen to.
   * @default 3001
   */
  port?: number = 3001;

  /**
   * Optional way to force mocking responses even when the targets are not responding.
   * @default false
   */
  forceMock?: boolean = false;

  /**
   * @deprecated
   * Absolute path where the mocking factories are stored
   */
  mockpath?: string;

  /**
   * The ngrok token. Needed to start ngrok tunneling, to allow other machines to connect to your local.
   */
  tunnelingToken?: string;
  /**
   * Optional ngrok dev domain. If not defined an new ngrok link will be generated on each start.
   * It's useful to avoid always having to copy paste the new link.
   * Dev domain is free even for ngrok free accounts. Go to ngrok dashboard and search for it.
   */
  tunnelingDomain?: string;
  tunnelingEnabled?: boolean;

  /**
   * The collection of pathnames that should be proxied.
   */
  proxy = [] as ProxyRoute[];

  /**
   * Enables mocking responses from a HAR file to enable you to replay a session.
   *
   * @example example
   * ```ts
   * {
   *   // regular expression that matches all except those which include "token"
   *   // useful to avoid auth problems because token have expire time
   *   context: '^((?!token).)*$',
   *   // the absolute path for the har file
   *   target: 'file:///C:/Users/spongebob/Downloads/my-session-record.har',
   * }
   * ```
   */
  mockFromHAR?: ProxyRoute;

  constructor(options: WebRexConfiguration) {
    Object.assign(this, options);
  }
}

type WebRexConfigurationAlias = WebRexConfiguration;

declare global {
  type WebRexConfiguration = WebRexConfigurationAlias;
}
